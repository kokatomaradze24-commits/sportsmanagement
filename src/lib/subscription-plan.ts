// Single source of truth for the paid plan.
export const SUBSCRIPTION_PLAN = {
  id: "pro_monthly",
  name: "Sports Management Pro",
  description: "Full access to all features + AI tools",
  amount: 1, // USD/month — TEMP TEST PRICE (revert to 50)
  currency: "USD",
  trialDays: 7,
  intervalUnit: "MONTH" as const,
  intervalCount: 1,
};
