import { createFileRoute } from "@tanstack/react-router";
import { getOrCreateSubscriptionPlan } from "@/lib/paypal-subscription.server";
import { SUBSCRIPTION_PLAN } from "@/lib/subscription-plan";

export const Route = createFileRoute("/api/paypal/subscription-config")({
  server: {
    handlers: {
      GET: async () => {
        const clientId = process.env.PAYPAL_CLIENT_ID || "";
        const env = process.env.PAYPAL_ENV === "live" ? "live" : "sandbox";
        if (!clientId) return Response.json({ error: "PayPal not configured" }, { status: 500 });
        try {
          const plan = await getOrCreateSubscriptionPlan();
          return Response.json({
            clientId,
            env,
            planId: plan.plan_id,
            amount: SUBSCRIPTION_PLAN.amount,
            currency: SUBSCRIPTION_PLAN.currency,
            trialDays: SUBSCRIPTION_PLAN.trialDays,
          });
        } catch (e) {
          return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
        }
      },
    },
  },
});
