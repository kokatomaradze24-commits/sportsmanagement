import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { paypalFetch } from "@/lib/paypal.server";
import { SUBSCRIPTION_PLAN } from "@/lib/subscription-plan";

async function authenticate(request: Request) {
  const authHeader = request.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return null;
  const { data, error } = await (supabaseAdmin as any).auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

export const Route = createFileRoute("/api/paypal/capture-access-order")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await authenticate(request);
        if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const body = (await request.json().catch(() => ({}))) as { orderId?: string };
        const orderId = String(body.orderId || "");
        if (!orderId) return Response.json({ error: "Missing orderId" }, { status: 400 });

        const admin = supabaseAdmin as any;

        // Reject if this order was already used
        const { data: prior } = await admin
          .from("user_subscriptions")
          .select("id, expires_at")
          .eq("paypal_order_id", orderId)
          .maybeSingle();
        if (prior) {
          return Response.json({ ok: true, alreadyCaptured: true, expiresAt: prior.expires_at });
        }

        try {
          const result = (await paypalFetch(`/v2/checkout/orders/${orderId}/capture`, {
            method: "POST",
            body: "{}",
          })) as {
            status?: string;
            purchase_units?: Array<{
              payments?: { captures?: Array<{ id: string; status: string; amount?: { value: string; currency_code: string } }> };
              custom_id?: string;
            }>;
          };

          const capture = result.purchase_units?.[0]?.payments?.captures?.[0];
          const completed = result.status === "COMPLETED" && capture?.status === "COMPLETED";
          if (!completed) return Response.json({ error: "Payment not completed" }, { status: 402 });

          // Verify amount + currency to prevent tampering
          const amt = Number(capture?.amount?.value ?? "0");
          const cur = capture?.amount?.currency_code;
          if (amt < SUBSCRIPTION_PLAN.amount || cur !== SUBSCRIPTION_PLAN.currency) {
            return Response.json({ error: "Amount mismatch" }, { status: 400 });
          }

          // Extend access by 30 days from max(now, current expires_at)
          const { data: existing } = await admin
            .from("user_subscriptions")
            .select("expires_at")
            .eq("user_id", user.id)
            .maybeSingle();

          const now = Date.now();
          const base = existing?.expires_at ? Math.max(now, new Date(existing.expires_at).getTime()) : now;
          const newExpires = new Date(base + 1000 * 60 * 60 * 24 * 30).toISOString();

          await admin
            .from("user_subscriptions")
            .upsert(
              {
                user_id: user.id,
                expires_at: newExpires,
                is_trial: false,
                activated_by: user.id,
                activated_at: new Date().toISOString(),
                paypal_order_id: orderId,
                paypal_status: "COMPLETED",
                plan: SUBSCRIPTION_PLAN.id,
                last_synced_at: new Date().toISOString(),
              },
              { onConflict: "user_id" },
            );

          return Response.json({ ok: true, expiresAt: newExpires });
        } catch (e) {
          return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
        }
      },
    },
  },
});
