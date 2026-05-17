// Plans available for purchase.
export interface SubscriptionPlanDef {
  id: string;
  name: string;
  description: string;
  amount: number;
  originalAmount: number;
  currency: string;
  days: number;
  label: string; // user-facing duration label
  discountPct: number;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlanDef[] = [
  {
    id: "pro_monthly",
    name: "Sports Management Pro — Monthly",
    description: "Full access for 30 days",
    amount: 9.99,
    originalAmount: 40,
    currency: "USD",
    days: 30,
    label: "30 დღე",
    discountPct: 75,
  },
  {
    id: "pro_yearly",
    name: "Sports Management Pro — Yearly",
    description: "Full access for 1 year",
    amount: 100,
    originalAmount: 480,
    currency: "USD",
    days: 365,
    label: "1 წელი",
    discountPct: 79,
  },
];

export function getPlan(id: string): SubscriptionPlanDef {
  return SUBSCRIPTION_PLANS.find((p) => p.id === id) ?? SUBSCRIPTION_PLANS[0];
}

// Back-compat: default plan used by legacy code paths.
export const SUBSCRIPTION_PLAN = {
  ...SUBSCRIPTION_PLANS[0],
  trialDays: 7,
  intervalUnit: "MONTH" as const,
  intervalCount: 1,
};
