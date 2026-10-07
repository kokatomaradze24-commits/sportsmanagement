import { AlertTriangle, Clock, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/hooks/use-i18n";
import { summarizeDashboard, type DashboardPayment, type DashboardPlayer } from "@/lib/dashboard-summary";

interface StatsCardsProps {
  players: DashboardPlayer[];
  payments: DashboardPayment[];
  loading?: boolean;
  onViewDebt: () => void;
}

export function StatsCards({ players, payments, loading, onViewDebt }: StatsCardsProps) {
  const { t, formatMoney } = useI18n();
  const stats = summarizeDashboard(players, payments);
  if (loading) return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label={t("loading")}>{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-36 rounded-lg" />)}</div>;
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground"><Users className="size-4 text-primary" /><span className="text-sm">{t("activePlayers")}</span></div>
          <p className="mt-3 font-display text-3xl">{stats.active}</p>
        </div>
        <div className="min-w-0 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground"><TrendingUp className="size-4 shrink-0 text-success" /><span className="text-sm">{t("dashThisMonth")}</span></div>
          <p className="mt-3 break-words font-display text-xl">{formatMoney(stats.collected)} <span className="text-sm text-muted-foreground">/ {formatMoney(stats.expected)}</span></p>
          <div className="mt-2 flex items-center gap-2">
            <progress aria-label={t("dashCollected")} className="dashboard-progress h-1.5 min-w-0 flex-1" value={Math.min(stats.percentage, 100)} max={100} />
            <span className="shrink-0 text-xs text-success">{stats.percentage}%</span>
          </div>
        </div>
        <Button variant="ghost" onClick={onViewDebt} className="h-auto min-w-0 flex-col items-start justify-start gap-0 whitespace-normal rounded-xl border border-border bg-card p-4 text-left hover:bg-destructive/10">
          <span className="flex items-center gap-2 text-sm text-muted-foreground"><AlertTriangle className="size-4 shrink-0 text-destructive" />{t("dashTotalDebt")}</span>
          <span className="mt-3 break-words font-display text-3xl text-destructive">{formatMoney(stats.debt)}</span>
          <span className="mt-1 text-xs text-muted-foreground">{t("dashDebtorCount", { count: stats.debtorCount })}</span>
        </Button>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="size-4 shrink-0 text-warning" />{t("dashUnpaidMonth")}</div>
          <p className="mt-3 font-display text-3xl">{stats.unpaidCount}</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{t("dashSeasonCollected")}: <span className="text-foreground">{formatMoney(stats.seasonCollected)}</span></p>
    </div>
  );
}