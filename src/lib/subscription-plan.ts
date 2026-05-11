// Single source of truth for the paid plan.
export const SUBSCRIPTION_PLAN = {
  id: "pro_monthly",
  name: "Sports Management Pro",
  description: "Full access to all features + AI tools",
  amount: 50, // USD/month — what the user pays
  currency: "USD",
  trialDays: 7,
  intervalUnit: "MONTH" as const,
  intervalCount: 1,
};
