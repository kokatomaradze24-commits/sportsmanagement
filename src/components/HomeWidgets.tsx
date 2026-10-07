import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { CalendarDays, ChevronRight, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { useI18n } from "@/hooks/use-i18n";
import type { Practice, Game } from "@/hooks/use-schedule";
import { summarizeDashboard, type DashboardPayment, type DashboardPlayer } from "@/lib/dashboard-summary";

interface Props {
  players: DashboardPlayer[];
  payments: DashboardPayment[];
  loading: boolean;
  practices: Practice[];
  games: Game[];
  scheduleLoading: boolean;
  onSelectPlayer: (player: DashboardPlayer) => void;
}

export function HomeWidgets({ players, payments, loading, practices, games, scheduleLoading, onSelectPlayer }: Props) {
  const { t, monthShort, formatMoney, language } = useI18n();
  const stats = summarizeDashboard(players, payments);
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const upcoming = [
    ...practices.map((p) => ({ id: `p-${p.id}`, date: p.practice_date, time: p.start_time, end: p.end_time, title: p.title, location: p.location, kind: t("dashPractice") })),
    ...games.map((g) => ({ id: `g-${g.id}`, date: g.game_date, time: g.start_time, end: g.end_time, title: g.title, location: g.location, kind: t("dashGame") })),
  ].filter((e) => e.date > today || (e.date === today && (!e.end || e.end.slice(0, 5) >= time)))
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? "").localeCompare(b.time ?? "")).slice(0, 4);
  const config = { collected: { label: t("dashCollected"), color: "var(--color-primary)" }, expected: { label: t("dashExpected"), color: "var(--color-muted-foreground)" } };
  return (
    <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
      <section className="min-w-0 border-t border-border pt-4" aria-label={t("dashMonthlyIncome")}>
        <h2 className="mb-4 text-xl">{t("dashMonthlyIncome")}</h2>
        {loading ? <Skeleton className="h-80 w-full rounded-lg" /> : <ChartContainer config={config} className="h-80 w-full aspect-auto">
          <BarChart accessibilityLayer data={stats.months.map((row) => ({ ...row, label: monthShort(row.month) }))}>
            <CartesianGrid vertical={false} stroke="var(--color-border)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} interval="preserveStartEnd" />
            <YAxis tickLine={false} axisLine={false} width={46} />
            <ChartTooltip content={<ChartTooltipContent formatter={(value, name) => <><span className="text-muted-foreground">{name === "collected" ? t("dashCollected") : t("dashExpected")}</span><span className="ml-2 font-semibold">{formatMoney(Number(value))}</span></>} />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="collected" fill="var(--color-collected)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="expected" fill="var(--color-expected)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ChartContainer>}
      </section>
      <div className="min-w-0 space-y-6">
        <section className="border-t border-border pt-4" aria-label={t("dashTopDebtors")}>
          <h2 className="mb-3 text-xl">{t("dashTopDebtors")}</h2>
          {loading ? <Skeleton className="h-44 rounded-lg" /> : stats.debtors.length ? <div className="divide-y divide-border">
            {stats.debtors.map(({ player, debt, overdueMonths }) => <Button key={player.id} variant="ghost" className="grid h-auto w-full grid-cols-[minmax(0,1fr)_auto_auto] gap-2 rounded-none px-0 py-3 text-left" onClick={() => onSelectPlayer(player)}>
              <span className="min-w-0"><span className="block truncate text-sm font-semibold">{player.first_name} {player.last_name}</span><span className="block text-xs text-muted-foreground">{t("dashOverdueMonths", { count: overdueMonths ?? 0 })}</span></span>
              <span className="text-sm text-destructive">{formatMoney(debt ?? 0)}</span><ChevronRight className="size-4 text-muted-foreground" />
            </Button>)}
          </div> : <div className="flex items-center gap-3 py-5 text-sm text-muted-foreground"><Wallet className="size-5 shrink-0" />{t("dashNoDebtors")}</div>}
        </section>
        <section className="border-t border-border pt-4" aria-label={t("dashUpcoming")}>
          <h2 className="mb-3 text-xl">{t("dashUpcoming")}</h2>
          {scheduleLoading ? <Skeleton className="h-44 rounded-lg" /> : upcoming.length ? <ul className="divide-y divide-border">
            {upcoming.map((e) => <li key={e.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-3">
              <div className="min-w-0"><p className="truncate text-sm font-semibold">{e.title || e.kind}</p><p className="truncate text-xs text-muted-foreground">{e.kind}{e.location ? ` · ${e.location}` : ""}</p></div>
              <div className="text-right text-xs"><p>{e.date === today ? t("dashToday") : new Date(`${e.date}T12:00:00`).toLocaleDateString(language, { month: "short", day: "numeric" })}</p><p className="mt-1 text-muted-foreground">{e.time?.slice(0, 5) ?? "—"}</p></div>
            </li>)}
          </ul> : <div className="flex items-center gap-3 py-5 text-sm text-muted-foreground"><CalendarDays className="size-5 shrink-0" />{t("dashNoUpcoming")}</div>}
        </section>
      </div>
    </div>
  );
}