export interface AICreditPackage {
  id: string;
  nameKey: string;
  credits: number;
  amount: number; // in currency
  currency: string; // ISO code
  durationLabelKey: string;
}

// Adjust amounts to match what you want to charge (PayPal does not support GEL).
export const AI_CREDIT_PACKAGES: AICreditPackage[] = [
  { id: "week",  nameKey: "pkgWeek",  credits: 50,   amount: 5.5,   currency: "USD", durationLabelKey: "pkgWeekLabel" },
  { id: "month", nameKey: "pkgMonth", credits: 250,  amount: 14.99, currency: "USD", durationLabelKey: "pkgMonthLabel" },
  { id: "year",  nameKey: "pkgYear",  credits: 3500, amount: 129,   currency: "USD", durationLabelKey: "pkgYearLabel" },
];

export function getPackage(id: string) {
  return AI_CREDIT_PACKAGES.find((p) => p.id === id);
}
