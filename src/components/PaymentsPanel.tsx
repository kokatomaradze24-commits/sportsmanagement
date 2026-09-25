import { motion, AnimatePresence } from "framer-motion";
import { DollarSign, Check, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Database } from "@/integrations/supabase/types";
import { useI18n } from "@/hooks/use-i18n";
import { useSounds } from "@/hooks/use-sounds";
import { useAppSettings } from "@/hooks/use-app-settings";
import { useAuth } from "@/hooks/use-auth";
import { useSport } from "@/hooks/use-sport";
import { sendEventSms } from "@/lib/notifications";

type Payment = Database["public"]["Tables"]["payments"]["Row"];
type Player = Database["public"]["Tables"]["players"]["Row"];

interface PaymentsPanelProps {
  player: Player;
  players?: Player[];
  payments: Payment[];
  loading: boolean;
  onAdd: (payment: Database["public"]["Tables"]["payments"]["Insert"]) => Promise<{ error: unknown }>;
  onUpdate: (id: string, updates: Partial<Payment>) => Promise<{ error: unknown }>;
  onDelete: (id: string) => Promise<{ error: unknown }>;
}

function StatusBadge({ status, t }: { status: string; t: ReturnType<typeof useI18n>["t"] }) {
  const styles: Record<string, string> = {
    paid: "bg-success/15 text-success",
    pending: "bg-warning/15 text-warning",
    overdue: "bg-destructive/15 text-destructive",
  };
  const label = status === "paid" ? t("paid") : status === "pending" ? t("pending") : status === "overdue" ? t("overdue") : status;
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[status] || styles.pending}`}>
      {label}
    </span>
  );
}

export function PaymentsPanel({ player, players = [], payments, loading, onUpdate }: PaymentsPanelProps) {
  const { t, monthShort, formatMoney, language } = useI18n();
  const { play } = useSounds();
  const { schoolName } = useAppSettings();
  const { user } = useAuth();
  const { sport } = useSport();

  // Sort by year then month so the schedule reads top-to-bottom
  const playerPayments = payments
    .filter((p) => p.player_id === player.id)
    .sort((a, b) => a.year - b.year || a.month - b.month);

  const overdueCount = playerPayments.filter((p) => p.status === "overdue").length;

  // Siblings (family) summary: amounts due up to the current month
  const familyId = (player as Player & { family_id?: string | null }).family_id;
  const family = familyId
    ? players.filter((p) => (p as Player & { family_id?: string | null }).family_id === familyId)
    : [];
  const nowD = new Date();
  const curKey = nowD.getFullYear() * 12 + nowD.getMonth() + 1;
  const familyRows = family.map((m) => {
    const due = payments.filter((p) => p.player_id === m.id && p.year * 12 + p.month <= curKey);
    const total = due.reduce((s, p) => s + Number(p.amount), 0);
    const paid = due.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);
    return { m, total, paid, remaining: total - paid };
  });
  const famTotal = familyRows.reduce((s, r) => s + r.total, 0);
  const famPaid = familyRows.reduce((s, r) => s + r.paid, 0);

  const dueDateFor = (payment: Payment) => {
    const day = Math.min(player.start_day || 1, 28);
    const d = new Date(payment.year, payment.month - 1, day);
    return d.toLocaleDateString();
  };

  const togglePaid = async (payment: Payment) => {
    if (payment.status === "paid") {
      play("click");
      await onUpdate(payment.id, { status: "pending", payment_date: null });
    } else {
      // Cash register sound when marking as paid 💰
      play("cash");
      await onUpdate(payment.id, {
        status: "paid",
        payment_date: new Date().toISOString().slice(0, 10),
      });
      // Fire-and-forget payment confirmation SMS
      if (user) {
        void sendEventSms({
          userId: user.id,
          playerId: player.id,
          paymentId: payment.id,
          kind: "payment_paid",
          clubName: schoolName,
          sportName: sport.name,
          lang: language,
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl tracking-wider text-foreground">{t("paymentSchedule")}</h2>
          <p className="text-sm text-muted-foreground">
            {player.first_name} {player.last_name} #{player.t_number}
            {player.monthly_fee > 0 && <> · {formatMoney(player.monthly_fee)} / {t("month").toLowerCase()}</>}
          </p>
        </div>
        {overdueCount > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            {t("monthsOverdue", { count: overdueCount })}
          </div>
        )}
      </div>

      {family.length > 1 && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2">
          <div className="text-sm font-semibold text-foreground">👨‍👦 {family.length} × {player.last_name}</div>
          {familyRows.map((r) => (
            <div key={r.m.id} className="flex justify-between text-xs">
              <span className="text-muted-foreground">{r.m.first_name} #{r.m.t_number}</span>
              <span className={r.remaining > 0 ? "text-destructive font-semibold" : "text-success font-semibold"}>
                {formatMoney(r.paid)} / {formatMoney(r.total)}
              </span>
            </div>
          ))}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border text-center text-xs">
            <div><div className="text-muted-foreground">Σ</div><div className="font-bold text-foreground">{formatMoney(famTotal)}</div></div>
            <div><div className="text-muted-foreground">{t("paid")}</div><div className="font-bold text-success">{formatMoney(famPaid)}</div></div>
            <div><div className="text-muted-foreground">{t("overdue")}</div><div className="font-bold text-destructive">{formatMoney(famTotal - famPaid)}</div></div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : playerPayments.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 text-muted-foreground"
        >
          <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>{t("noPayments")}</p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {playerPayments.map((payment, i) => {
              const isPaid = payment.status === "paid";
              const isOverdue = payment.status === "overdue";
              return (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  whileHover={{ scale: 1.015 }}
                  className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-colors ${
                    isPaid
                      ? "border-success/30 bg-success/5 hover:bg-success/10"
                      : isOverdue
                      ? "border-destructive/30 bg-destructive/5 hover:bg-destructive/10"
                      : "border-border bg-card hover:border-primary/30 hover:bg-primary/5"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isPaid
                          ? "bg-success/15 text-success"
                          : isOverdue
                          ? "bg-destructive/15 text-destructive"
                          : "bg-warning/15 text-warning"
                      }`}
                    >
                      {isPaid ? <Check className="w-4 h-4" /> : isOverdue ? <AlertTriangle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-card-foreground">
                          {monthShort(payment.month)} {payment.year}
                        </span>
                        <StatusBadge status={payment.status} t={t} />
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {formatMoney(payment.amount)} ·{" "}
                        {isPaid && payment.payment_date
                          ? t("paidOn", { date: payment.payment_date })
                          : t("dueOn", { date: dueDateFor(payment) })}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={isPaid ? "outline" : "default"}
                    onClick={() => togglePaid(payment)}
                    className="shrink-0"
                  >
                    {isPaid ? t("markPending") : t("markPaid")}
                  </Button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
