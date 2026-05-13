export interface AICreditPackage {
  id: string;
  nameKey: string;
  credits: number;
  amount: number; // in currency
  currency: string; // ISO code
  durationLabelKey: string;
}

// Pricing rule: price = my worst-case cost ($10 of credits) + ~$5 margin.
// 1 month: 1250 credits → max 250 images × $0.04 = $10 cost → +$5 = $14.99
export const AI_CREDIT_PACKAGES: AICreditPackage[] = [
  { id: "month", nameKey: "pkgMonth", credits: 1250, amount: 14.99, currency: "USD", durationLabelKey: "pkgMonthLabel" },
];

// Cost per AI action (in credits). Keep in sync with server endpoints.
export const CREDIT_COSTS = {
  image: 5,
  expertPlan: 1,
  selfPlan: 3,
} as const;

export function getPackage(id: string) {
  return AI_CREDIT_PACKAGES.find((p) => p.id === id);
}
