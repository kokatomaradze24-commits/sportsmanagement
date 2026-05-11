import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getPaypalSubscription } from "@/lib/paypal-subscription.server";

async function authenticate(request: Request) {
  const authHeader = request.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return null;
  const { data, error } = await (supabaseAdmin as any).auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

export const Route = createFileRoute("/api/paypal/activate-subscription")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await authenticate(request);
        if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const body = (await request.json().catch(() => ({}))) as { subscriptionId?: string };
        const subscriptionId = String(body.subscriptionId || "");
        if (!subscriptionId) return Response.json({ error: "Missing subscriptionId" }, { status: 400 });

        try {
          const sub = await getPaypalSubscription(subscriptionId);
          // Accept ACTIVE or APPROVAL_PENDING/APPROVED — for trial, status is ACTIVE immediately.
          const okStatuses = ["ACTIVE", "APPROVED"];
          if (!okStatuses.includes(sub.status)) {
            return Response.json({ error: `Subscription status: ${sub.status}` }, { status: 402 });
          }

          const nextBilling = sub.billing_info?.next_billing_time
            ? new Date(sub.billing_info.next_billing_time)
            : new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

          const admin = supabaseAdmin as any;
          await admin
            .from("user_subscriptions")
            .upsert(
              {
                user_id: user.id,
                expires_at: nextBilling.toISOString(),
                is_trial: false,
                activated_by: user.id,
                activated_at: new Date().toISOString(),
                paypal_subscription_id: subscriptionId,
                paypal_status: sub.status,
                plan: "pro_monthly",
                last_synced_at: new Date().toISOString(),
              },
              { onConflict: "user_id" },
            );

          return Response.json({ ok: true, expiresAt: nextBilling.toISOString() });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return Response.json({ error: msg }, { status: 500 });
        }
      },
    },
  },
});
