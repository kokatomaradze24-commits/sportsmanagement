export interface PaymentDueInput {
  year: number;
  month: number;
  status: string;
  payment_date: string | null;
  paid_amount?: number | string | null;
}

export interface PaymentMoneyInput {
  amount: number | string;
  status: string;
  paid_amount?: number | string | null;
}

export function paidOf(p: PaymentMoneyInput): number {
  return Number(p.paid_amount ?? 0) || 0;
}

export function remainingOf(p: PaymentMoneyInput): number {
  return p.status === "paid" ? 0 : Math.max(0, Number(p.amount) - paidOf(p));
}

export function isPartial(p: PaymentMoneyInput): boolean {
  return p.status !== "paid" && paidOf(p) > 0;
}

function localDate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addMonthsClamped(date: Date, months: number): Date {
  const targetMonth = date.getMonth() + months;
  const targetYear = date.getFullYear() + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;
  const lastDay = new Date(targetYear, normalizedMonth + 1, 0).getDate();
  return new Date(targetYear, normalizedMonth, Math.min(date.getDate(), lastDay));
}

function monthIndex(payment: Pick<PaymentDueInput, "year" | "month">): number {
  return payment.year * 12 + payment.month;
}

export function getPaymentDueDate(
  payment: PaymentDueInput,
  playerPayments: PaymentDueInput[],
  startDay: number,
): Date {
  const paymentIndex = monthIndex(payment);
  const previousPaid = playerPayments
    .filter((candidate) =>
      (candidate.status === "paid" || paidOf({ amount: 0, status: candidate.status, paid_amount: candidate.paid_amount }) > 0) &&
      candidate.payment_date != null &&
      monthIndex(candidate) < paymentIndex
    )
    .sort((a, b) => monthIndex(b) - monthIndex(a))[0];

  if (previousPaid?.payment_date) {
    return addMonthsClamped(localDate(previousPaid.payment_date), paymentIndex - monthIndex(previousPaid));
  }

  const scheduledDay = Math.min(Math.max(startDay || 1, 1), 28);
  return new Date(payment.year, payment.month - 1, scheduledDay);
}