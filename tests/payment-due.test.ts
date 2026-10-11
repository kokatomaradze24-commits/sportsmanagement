import { expect, test } from "bun:test";
import { daysUntilDate, getNextPaymentDue } from "../src/lib/payment-due";

const member = (id: string, start_day = 1) => ({ id, start_day });

const pay = (
  player_id: string,
  year: number,
  month: number,
  amount: number,
  overrides: Record<string, unknown> = {},
) => ({
  player_id,
  year,
  month,
  amount,
  status: "pending",
  payment_date: null,
  paid_amount: 0,
  ...overrides,
});

const now = new Date(2026, 9, 11); // 11 October 2026

test("counts whole days from today to the scheduled day", () => {
  expect(daysUntilDate(new Date(2026, 9, 11), now)).toBe(0);
  expect(daysUntilDate(new Date(2026, 9, 12), now)).toBe(1);
  expect(daysUntilDate(new Date(2026, 9, 5), now)).toBe(-6);
});

test("uses the scheduled day when nothing has been deposited before", () => {
  const due = getNextPaymentDue([member("a", 13)], [pay("a", 2026, 10, 170)], now);
  expect(due?.month).toBe(10);
  expect(due?.days).toBe(2);
});

test("follows the deposit anchor once an earlier month was paid", () => {
  const rows = [
    pay("a", 2026, 9, 170, { status: "paid", paid_amount: 170, payment_date: "2026-09-05" }),
    pay("a", 2026, 10, 170),
  ];
  const due = getNextPaymentDue([member("a", 13)], rows, now);
  expect(due?.month).toBe(10);
  expect(due?.days).toBe(-6); // anchored on 5 September + 1 month
});

test("a partially paid month is still the next payment", () => {
  const rows = [
    pay("a", 2026, 9, 170, { status: "paid", paid_amount: 170, payment_date: "2026-09-05" }),
    pay("a", 2026, 10, 170, { paid_amount: 70, payment_date: "2026-10-02" }),
    pay("a", 2026, 11, 170),
  ];
  const due = getNextPaymentDue([member("a", 13)], rows, now);
  expect(due?.month).toBe(10);
  expect(due?.year).toBe(2026);
});

test("returns nothing once every month is settled", () => {
  const rows = [
    pay("a", 2026, 9, 170, { status: "paid", paid_amount: 170, payment_date: "2026-09-05" }),
    pay("a", 2026, 10, 170, { status: "paid", paid_amount: 170, payment_date: "2026-10-03" }),
  ];
  expect(getNextPaymentDue([member("a", 13)], rows, now)).toBeNull();
});

test("a fee-exempt member with zero amounts never becomes due", () => {
  expect(getNextPaymentDue([member("a", 13)], [pay("a", 2026, 10, 0)], now)).toBeNull();
});

test("siblings sharing a combined month report the family's next due date", () => {
  const rows = [
    pay("a", 2026, 9, 170, { status: "paid", paid_amount: 170, payment_date: "2026-09-04" }),
    pay("b", 2026, 9, 170, { status: "paid", paid_amount: 170, payment_date: "2026-09-04" }),
    pay("a", 2026, 10, 170),
    pay("b", 2026, 10, 170, { status: "paid", paid_amount: 170, payment_date: "2026-10-01" }),
  ];
  const due = getNextPaymentDue([member("a", 13), member("b", 13)], rows, now);
  expect(due?.month).toBe(10);
  expect(due?.days).toBe(-7); // anchored on 4 September + 1 month
});

test("ignores payments of members outside the unit", () => {
  const rows = [pay("a", 2026, 10, 170), pay("other", 2026, 9, 170)];
  const due = getNextPaymentDue([member("a", 13)], rows, now);
  expect(due?.month).toBe(10);
});
