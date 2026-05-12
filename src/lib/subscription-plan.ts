// Single source of truth for the paid plan.
export const SUBSCRIPTION_PLAN = {
  id: "pro_monthly",
  name: "Sports Management Pro",
  description: "Full access to all features + AI tools",
  amount: 1, // USD/month — TEST PRICE
  currency: "USD",
  trialDays: 0,
  intervalUnit: "MONTH" as const,
  intervalCount: 1,
};
