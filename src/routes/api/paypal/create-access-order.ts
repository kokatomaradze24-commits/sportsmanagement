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

export const Route = createFileRoute("/api/paypal/create-access-order")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await authenticate(request);
        if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

        try {
          const order = (await paypalFetch("/v2/checkout/orders", {
            method: "POST",
            body: JSON.stringify({
              intent: "CAPTURE",
              purchase_units: [
                {
                  reference_id: SUBSCRIPTION_PLAN.id,
                  description: `${SUBSCRIPTION_PLAN.name} — 30 დღე`,
                  custom_id: user.id,
                  amount: {
                    currency_code: SUBSCRIPTION_PLAN.currency,
                    value: SUBSCRIPTION_PLAN.amount.toFixed(2),
                  },
                },
              ],
              payment_source: {
                paypal: {
                  experience_context: {
                    shipping_preference: "NO_SHIPPING",
                    user_action: "PAY_NOW",
                  },
                },
              },
            }),
          })) as { id: string };

          return Response.json({ orderId: order.id });
        } catch (e) {
          return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
        }
      },
    },
  },
});
