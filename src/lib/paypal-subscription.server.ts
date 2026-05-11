// Server-only helper that lazily creates (or reuses) a PayPal product+plan
// for the recurring "Pro" subscription, and persists IDs in `paypal_plans`.
import { paypalFetch } from "./paypal.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { SUBSCRIPTION_PLAN } from "./subscription-plan";

function envKey() {
  return process.env.PAYPAL_ENV === "live" ? "live" : "sandbox";
}

interface PlanRow {
  env: string;
  product_id: string;
  plan_id: string;
  amount: number;
  currency: string;
  trial_days: number;
}

let cached: PlanRow | null = null;

export async function getOrCreateSubscriptionPlan(): Promise<PlanRow> {
  if (cached) return cached;
  const admin = supabaseAdmin as any;
  const env = envKey();

  const { data: existing } = await admin
    .from("paypal_plans")
    .select("*")
    .eq("env", env)
    .maybeSingle();

  if (
    existing &&
    Number(existing.amount) === SUBSCRIPTION_PLAN.amount &&
    existing.currency === SUBSCRIPTION_PLAN.currency &&
    existing.trial_days === SUBSCRIPTION_PLAN.trialDays
  ) {
    cached = existing;
    return existing;
  }

  // Create product
  const product = (await paypalFetch("/v1/catalogs/products", {
    method: "POST",
    body: JSON.stringify({
      name: SUBSCRIPTION_PLAN.name,
      description: SUBSCRIPTION_PLAN.description,
      type: "SERVICE",
      category: "SOFTWARE",
    }),
  })) as { id: string };

  // Create plan: 7-day free trial then $50/month forever
  const billing_cycles: any[] = [];
  if (SUBSCRIPTION_PLAN.trialDays > 0) {
    billing_cycles.push({
      frequency: { interval_unit: "DAY", interval_count: SUBSCRIPTION_PLAN.trialDays },
      tenure_type: "TRIAL",
      sequence: 1,
      total_cycles: 1,
      pricing_scheme: {
        fixed_price: { value: "0", currency_code: SUBSCRIPTION_PLAN.currency },
      },
    });
  }
  billing_cycles.push({
    frequency: {
      interval_unit: SUBSCRIPTION_PLAN.intervalUnit,
      interval_count: SUBSCRIPTION_PLAN.intervalCount,
    },
    tenure_type: "REGULAR",
    sequence: SUBSCRIPTION_PLAN.trialDays > 0 ? 2 : 1,
    total_cycles: 0,
    pricing_scheme: {
      fixed_price: {
        value: SUBSCRIPTION_PLAN.amount.toFixed(2),
        currency_code: SUBSCRIPTION_PLAN.currency,
      },
    },
  });

  const plan = (await paypalFetch("/v1/billing/plans", {
    method: "POST",
    body: JSON.stringify({
      product_id: product.id,
      name: `${SUBSCRIPTION_PLAN.name} — Monthly`,
      description: `${SUBSCRIPTION_PLAN.trialDays}-day free trial then $${SUBSCRIPTION_PLAN.amount}/month`,
      status: "ACTIVE",
      billing_cycles,
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee: { value: "0", currency_code: SUBSCRIPTION_PLAN.currency },
        setup_fee_failure_action: "CONTINUE",
        payment_failure_threshold: 2,
      },
    }),
  })) as { id: string };

  const row: PlanRow = {
    env,
    product_id: product.id,
    plan_id: plan.id,
    amount: SUBSCRIPTION_PLAN.amount,
    currency: SUBSCRIPTION_PLAN.currency,
    trial_days: SUBSCRIPTION_PLAN.trialDays,
  };

  await admin
    .from("paypal_plans")
    .upsert({ ...row, updated_at: new Date().toISOString() }, { onConflict: "env" });

  cached = row;
  return row;
}

export async function getPaypalSubscription(subscriptionId: string) {
  return (await paypalFetch(`/v1/billing/subscriptions/${subscriptionId}`)) as {
    id: string;
    status: string;
    billing_info?: { next_billing_time?: string };
    subscriber?: { email_address?: string };
  };
}
