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

  const scheduledDay = Math.min(Math.max(startDay || 1, 1), 28);

  if (previousPaid?.payment_date) {
    const paidOn = localDate(previousPaid.payment_date);
    // Payments are prepaid for the whole month on the scheduled (arrival) day.
    // When a month was only marked paid later than its scheduled day, the
    // recorded date is administrative, so the cycle stays on the scheduled day.
    const scheduled = new Date(previousPaid.year, previousPaid.month - 1, scheduledDay);
    const anchor = paidOn > scheduled ? scheduled : paidOn;
    return addMonthsClamped(anchor, paymentIndex - monthIndex(previousPaid));
  }

  return new Date(payment.year, payment.month - 1, scheduledDay);
}

export interface NextDuePayment extends PaymentDueInput, PaymentMoneyInput {
  player_id: string;
}

export interface NextDueMember {
  id: string;
  start_day: number;
}

export interface NextPaymentDue {
  month: number;
  year: number;
  dueDate: Date;
  days: number;
}

/** Whole days from local midnight today until the given date; negative once it has passed. */
export function daysUntilDate(target: Date, now = new Date()): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const due = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  return Math.round((due - today) / 86400000);
}

/**
 * The earliest month a member still owes something in, together with its due date
 * and how many days away that is. Siblings share one combined payment row, so the
 * whole family is passed as `members` and gets the same answer.
 * Database statuses stay the source of truth: only status / paid_amount decide
 * whether a month is still open, and the due date follows getPaymentDueDate.
 */
export function getNextPaymentDue(
  members: NextDueMember[],
  payments: NextDuePayment[],
  now = new Date(),
): NextPaymentDue | null {
  const owners = new Map(members.map((m) => [m.id, m]));
  const rows = payments.filter((p) => owners.has(p.player_id));
  if (rows.length === 0) return null;

  const byMonth = new Map<number, NextDuePayment[]>();
  for (const row of rows) {
    const key = monthIndex(row);
    byMonth.set(key, [...(byMonth.get(key) ?? []), row]);
  }

  for (const key of [...byMonth.keys()].sort((a, b) => a - b)) {
    const group = byMonth.get(key) ?? [];
    if (group.reduce((sum, p) => sum + remainingOf(p), 0) <= 0) continue;
    const first = group.find((p) => remainingOf(p) > 0) ?? group[0];
    const owner = owners.get(first.player_id);
    if (!owner) continue;
    const own = rows.filter((p) => p.player_id === first.player_id);
    const dueDate = getPaymentDueDate(first, own, owner.start_day);
    return { month: first.month, year: first.year, dueDate, days: daysUntilDate(dueDate, now) };
  }

  return null;
}
