import type { Database } from "@/integrations/supabase/types";
import { paidOf, remainingOf } from "@/lib/payment-due";
import { getSeasonStartYear, SEASON_DURATION_MONTHS, SEASON_START_MONTH } from "@/lib/season";

export type DashboardPlayer = Database["public"]["Tables"]["players"]["Row"];
export type DashboardPayment = Database["public"]["Tables"]["payments"]["Row"];
export type PlayerPaymentFilter = "all" | "paid" | "partial" | "pending" | "overdue" | "archived";
export const PLAYER_PAYMENT_FILTERS: PlayerPaymentFilter[] = ["all", "paid", "partial", "pending", "overdue", "archived"];

export function summarizePlayerPayments(players: DashboardPlayer[], payments: DashboardPayment[], now = new Date()) {
  const byPlayer = new Map(players.map((player) => [player.id, {
    current: [] as DashboardPayment[], debt: 0, overdueMonths: new Set<string>(),
  }]));
  for (const payment of payments) {
    const summary = byPlayer.get(payment.player_id);
    if (!summary) continue;
    if (payment.year === now.getFullYear() && payment.month === now.getMonth() + 1) summary.current.push(payment);
    if (payment.status === "overdue") {
      summary.debt += remainingOf(payment);
      summary.overdueMonths.add(`${payment.year}-${payment.month}`);
    }
  }
  return new Map(players.map((player) => {
    const summary = byPlayer.get(player.id);
    const current = summary?.current ?? [];
    const state = Number(player.monthly_fee) === 0 ? "exempt"
      : current.length > 0 && current.every((p) => p.status === "paid") ? "paid"
      : current.some((p) => p.status !== "paid" && paidOf(p) > 0) ? "partial" : "pending";
    return [player.id, { state, debt: summary?.debt ?? 0, overdueMonths: summary?.overdueMonths.size ?? 0, current }];
  }));
}

export function summarizeDashboard(players: DashboardPlayer[], payments: DashboardPayment[], now = new Date()) {
  const current = payments.filter((p) => p.year === now.getFullYear() && p.month === now.getMonth() + 1);
  const collected = current.reduce((sum, p) => sum + paidOf(p), 0);
  const expected = current.reduce((sum, p) => sum + Number(p.amount), 0);
  const overdue = payments.filter((p) => p.status === "overdue");
  const debt = overdue.reduce((sum, p) => sum + remainingOf(p), 0);
  const debtorCount = new Set(overdue.map((p) => p.player_id)).size;
  const feePlayers = new Set(players.filter((p) => Number(p.monthly_fee) !== 0).map((p) => p.id));
  const unpaidCount = new Set(current.filter((p) => p.status !== "paid" && feePlayers.has(p.player_id)).map((p) => p.player_id)).size;
  const startYear = getSeasonStartYear(now);
  const months = Array.from({ length: SEASON_DURATION_MONTHS }, (_, i) => {
    const date = new Date(startYear, SEASON_START_MONTH - 1 + i, 1);
    const month = date.getMonth() + 1, year = date.getFullYear();
    const rows = payments.filter((p) => p.month === month && p.year === year);
    return { month, year, collected: rows.reduce((sum, p) => sum + paidOf(p), 0), expected: rows.reduce((sum, p) => sum + Number(p.amount), 0) };
  });
  const summaries = summarizePlayerPayments(players, payments, now);
  const debtors = players.map((player) => ({ player, ...summaries.get(player.id) }))
    .filter((row) => (row.debt ?? 0) > 0)
    .sort((a, b) => (b.debt ?? 0) - (a.debt ?? 0) || a.player.created_at.localeCompare(b.player.created_at)).slice(0, 5);
  return { active: players.filter((p) => p.is_active).length, collected, expected, percentage: expected > 0 ? Math.round(collected / expected * 100) : 0, debt, debtorCount, unpaidCount, months, seasonCollected: months.reduce((sum, row) => sum + row.collected, 0), debtors };
}