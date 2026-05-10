import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { paypalFetch } from "@/lib/paypal.server";

async function authenticate(request: Request) {
  const authHeader = request.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return null;
  const { data, error } = await (supabaseAdmin as any).auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

export const Route = createFileRoute("/api/paypal/capture-order")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await authenticate(request);
        if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const body = (await request.json().catch(() => ({}))) as { orderId?: string };
        const orderId = String(body.orderId || "");
        if (!orderId) return Response.json({ error: "Missing orderId" }, { status: 400 });

        const admin = supabaseAdmin as any;

        // Verify the order belongs to this user
        const { data: purchase } = await admin
          .from("ai_credit_purchases")
          .select("*")
          .eq("provider_order_id", orderId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (!purchase) {
          return Response.json({ error: "Order not found" }, { status: 404 });
        }

        if (purchase.status === "completed") {
          return Response.json({ ok: true, alreadyCaptured: true });
        }

        try {
          const result = (await paypalFetch(`/v2/checkout/orders/${orderId}/capture`, {
            method: "POST",
            body: "{}",
          })) as { status?: string; purchase_units?: Array<{ payments?: { captures?: Array<{ id: string; status: string }> } }> };

          const capture = result.purchase_units?.[0]?.payments?.captures?.[0];
          const completed = result.status === "COMPLETED" && capture?.status === "COMPLETED";

          if (!completed) {
            await admin
              .from("ai_credit_purchases")
              .update({ status: "failed" })
              .eq("id", purchase.id);
            return Response.json({ error: "Payment not completed" }, { status: 402 });
          }

          // Mark purchase completed
          await admin
            .from("ai_credit_purchases")
            .update({
              status: "completed",
              provider_capture_id: capture?.id ?? null,
            })
            .eq("id", purchase.id);

          // Add credits (upsert)
          const { data: existing } = await admin
            .from("user_ai_credits")
            .select("credits")
            .eq("user_id", user.id)
            .maybeSingle();

          const newBalance = (existing?.credits ?? 0) + purchase.credits;
          await admin
            .from("user_ai_credits")
            .upsert({ user_id: user.id, credits: newBalance }, { onConflict: "user_id" });

          return Response.json({ ok: true, credits: newBalance });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return Response.json({ error: msg }, { status: 500 });
        }
      },
    },
  },
});
