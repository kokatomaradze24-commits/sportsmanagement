export interface AICreditPackage {
  id: string;
  nameKey: string;
  credits: number;
  amount: number; // in currency
  currency: string; // ISO code
  durationLabelKey: string;
}

// Pricing rule: my worst-case cost (all credits used as images) + 20% margin.
// 1 month: 1000 credits → max 200 images × $0.04 = $8 cost → +20% = $9.60 → $9.99
export const AI_CREDIT_PACKAGES: AICreditPackage[] = [
  { id: "month", nameKey: "pkgMonth", credits: 1000, amount: 9.99, currency: "USD", durationLabelKey: "pkgMonthLabel" },
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
