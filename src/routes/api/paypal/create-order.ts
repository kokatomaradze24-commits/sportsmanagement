import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getPackage } from "@/lib/ai-credit-packages";
import { paypalFetch } from "@/lib/paypal.server";

async function authenticate(request: Request) {
  const authHeader = request.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return null;
  const { data, error } = await (supabaseAdmin as any).auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

export const Route = createFileRoute("/api/paypal/create-order")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await authenticate(request);
        if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const body = (await request.json().catch(() => ({}))) as { packageId?: string };
        const pkg = getPackage(String(body.packageId || ""));
        if (!pkg) return Response.json({ error: "Invalid package" }, { status: 400 });

        try {
          const order = (await paypalFetch("/v2/checkout/orders", {
            method: "POST",
            body: JSON.stringify({
              intent: "CAPTURE",
              purchase_units: [
                {
                  reference_id: pkg.id,
                  description: `${pkg.credits} AI credits`,
                  amount: {
                    currency_code: pkg.currency,
                    value: pkg.amount.toFixed(2),
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

          await (supabaseAdmin as any)
            .from("ai_credit_purchases")
            .insert({
              user_id: user.id,
              package_id: pkg.id,
              credits: pkg.credits,
              amount: pkg.amount,
              currency: pkg.currency,
              provider: "paypal",
              provider_order_id: order.id,
              status: "pending",
            });

          return Response.json({ orderId: order.id });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return Response.json({ error: msg }, { status: 500 });
        }
      },
    },
  },
});
