import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { DollarSign, Check, Clock, AlertTriangle, Pencil, Users, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Database } from "@/integrations/supabase/types";
import { useI18n } from "@/hooks/use-i18n";
import { useSounds } from "@/hooks/use-sounds";
import { useAppSettings } from "@/hooks/use-app-settings";
import { useAuth } from "@/hooks/use-auth";
import { useSport } from "@/hooks/use-sport";
import { sendEventSms } from "@/lib/notifications";
import { WhatsAppDialog, WhatsAppIcon, type WaContext } from "@/components/WhatsAppDialog";
import { getPaymentDueDate, paidOf, remainingOf } from "@/lib/payment-due";

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
    partial: "bg-warning/25 text-warning border border-warning/50 border-dashed",
    paid: "bg-success/15 text-success",
    pending: "bg-warning/15 text-warning",
    overdue: "bg-destructive/15 text-destructive",
  };
  const label = status === "partial" ? t("partiallyPaid") : status === "paid" ? t("paid") : status === "pending" ? t("pending") : status === "overdue" ? t("overdue") : status;
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
    const paid = due.reduce((s, p) => s + paidOf(p), 0);
    const overdue = due.filter((p) => p.status === "overdue").reduce((s, p) => s + remainingOf(p), 0);
    return { m, total, paid, overdue };
  });
  const famTotal = familyRows.reduce((s, r) => s + r.total, 0);
  const famPaid = familyRows.reduce((s, r) => s + r.paid, 0);
  const famOverdue = familyRows.reduce((s, r) => s + r.overdue, 0);

  // Combined schedule: one row per month (whole family when siblings exist)
  const members = family.length > 1
    ? [...family].sort((a, b) => a.created_at.localeCompare(b.created_at))
    : [player];
  const memberOrder = new Map(members.map((m, i) => [m.id, i]));
  const scheduleSource = payments.filter((p) => memberOrder.has(p.player_id));
  const monthMap = new Map<number, Payment[]>();
  scheduleSource.forEach((p) => {
    const k = p.year * 12 + p.month;
    monthMap.set(k, [...(monthMap.get(k) ?? []), p]);
  });
  type ScheduleRow = { key: string; year: number; month: number; amount: number; paid: number; remaining: number; status: string; partial: boolean; rows: Payment[]; payment_date: string | null };
  const schedule: ScheduleRow[] = [...monthMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, rows]) => {
      rows.sort((a, b) => (memberOrder.get(a.player_id) ?? 0) - (memberOrder.get(b.player_id) ?? 0));
      const amount = rows.reduce((s, p) => s + Number(p.amount), 0);
      const paid = rows.reduce((s, p) => s + paidOf(p), 0);
      const remaining = rows.reduce((s, p) => s + remainingOf(p), 0);
      const allPaid = rows.every((p) => p.status === "paid");
      const status = allPaid ? "paid" : rows.some((p) => p.status === "overdue" && remainingOf(p) > 0) ? "overdue" : "pending";
      const dates = rows.map((p) => p.payment_date).filter(Boolean) as string[];
      return { key: rows.map((r) => r.id).join("-"), year: rows[0].year, month: rows[0].month, amount, paid, remaining, status, partial: !allPaid && paid > 0, rows, payment_date: dates.sort().pop() ?? null };
    });
  const overdueMonths = schedule.filter((r) => r.status === "overdue").length;

  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const today = () => new Date().toISOString().slice(0, 10);
  const [waContext, setWaContext] = useState<WaContext | null>(null);
  const overdueRemaining = schedule.filter((r) => r.status === "overdue").reduce((s, r) => s + r.remaining, 0);
  const openWhatsApp = (row?: ScheduleRow) => {
    const target = row && row.status !== "paid" ? row : schedule.find((r) => r.status !== "paid");
    const lastPaid = row?.status === "paid" ? row : [...schedule].reverse().find((r) => r.paid > 0);
    setWaContext({
      kind: row?.status === "paid" ? "paid" : overdueRemaining > 0 ? "overdue" : "reminder",
      reminder: target ? { month: target.month, amount: target.remaining } : null,
      overdueAmount: overdueRemaining,
      paid: lastPaid ? { month: lastPaid.month, amount: lastPaid.paid } : null,
    });
  };

  const dueDateFor = (row: ScheduleRow) => {
    const first = row.rows.find((p) => p.status !== "paid") ?? row.rows[0];
    const owner = members.find((m) => m.id === first.player_id) ?? player;
    const own = payments.filter((p) => p.player_id === first.player_id);
    return getPaymentDueDate(first, own, owner.start_day).toLocaleDateString();
  };

  const notifyPaid = (payment: Payment) => {
    if (!user) return;
    void sendEventSms({
      userId: user.id,
      playerId: payment.player_id,
      paymentId: payment.id,
      kind: "payment_paid",
      clubName: schoolName,
      sportName: sport.name,
      lang: language,
    });
  };

  const togglePaid = async (row: ScheduleRow) => {
    if (row.status === "paid") {
      play("click");
      for (const p of row.rows) await onUpdate(p.id, { status: "pending", paid_amount: 0, payment_date: null });
    } else {
      play("cash");
      for (const p of row.rows) {
        if (p.status === "paid") continue;
        await onUpdate(p.id, { status: "paid", paid_amount: Number(p.amount), payment_date: p.payment_date ?? today() });
        notifyPaid(p);
      }
    }
  };

  const saveAmount = async (row: ScheduleRow) => {
    const total = Math.max(0, Number(editValue) || 0);
    let left = total;
    const plan = row.rows.map((p, i) => {
      const isLast = i === row.rows.length - 1;
      const give = isLast ? left : Math.min(left, Number(p.amount));
      left -= give;
      return { p, give };
    });
    setEditing(null);
    play(total >= row.amount ? "cash" : "click");
    for (const { p, give } of plan) {
      if (give === paidOf(p) && (give > 0 || p.status !== "paid")) continue;
      const updates: Partial<Payment> = { paid_amount: give };
      if (give > 0 && !p.payment_date) updates.payment_date = today();
      if (give <= 0 && p.status === "paid") { updates.status = "pending"; updates.payment_date = null; }
      await onUpdate(p.id, updates);
      if (p.status !== "paid" && give >= Number(p.amount)) notifyPaid(p);
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
          <Button type="button" size="sm" onClick={() => openWhatsApp()} className="mt-2 bg-success text-success-foreground hover:bg-success/90">
            <WhatsAppIcon className="w-4 h-4" /> {t("waButton")}
          </Button>
        </div>
        {overdueMonths > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            {t("monthsOverdue", { count: overdueMonths })}
          </div>
        )}
      </div>

      {family.length > 1 && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2">
          <div className="text-sm font-semibold text-foreground"><Users className="inline size-4 mr-2" />{family.length} × {player.last_name}</div>
          {familyRows.map((r) => (
            <div key={r.m.id} className="flex justify-between text-xs">
              <span className="text-muted-foreground">{r.m.first_name} #{r.m.t_number}</span>
              <span className={r.overdue > 0 ? "text-destructive font-semibold" : "text-success font-semibold"}>
                {formatMoney(r.paid)} / {formatMoney(r.total)}
              </span>
            </div>
          ))}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border text-center text-xs">
            <div><div className="text-muted-foreground">Σ</div><div className="font-bold text-foreground">{formatMoney(famTotal)}</div></div>
            <div><div className="text-muted-foreground">{t("paid")}</div><div className="font-bold text-success">{formatMoney(famPaid)}</div></div>
            <div><div className="text-muted-foreground">{t("overdue")}</div><div className="font-bold text-destructive">{formatMoney(famOverdue)}</div></div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : schedule.length === 0 ? (
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
            {schedule.map((payment) => {
              const isPaid = payment.status === "paid";
              const isOverdue = payment.status === "overdue";
              const isPartialRow = payment.partial;
              return (
                <motion.div
                  key={payment.key}
                  initial={false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.12 }}
                  whileHover={{ scale: 1.015 }}
                  className="grid grid-cols-1 items-center gap-3 py-4 border-b border-border sm:grid-cols-[minmax(0,1fr)_auto]"
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
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-card-foreground">
                          {monthShort(payment.month)} {payment.year}
                        </span>
                        <StatusBadge status={isPartialRow ? "partial" : payment.status} t={t} />
                        {isPartialRow && isOverdue && <StatusBadge status="overdue" t={t} />}
                      </div>
                      <p className="text-xs text-muted-foreground break-words">
                        {formatMoney(payment.amount)} · {t("paidAmountLabel")} {formatMoney(payment.paid)} · {t("remainingLabel")} {formatMoney(payment.remaining)} ·{" "}
                        {isPaid && payment.payment_date
                          ? t("paidOn", { date: payment.payment_date })
                          : t("dueOn", { date: dueDateFor(payment) })}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-1.5 shrink-0">
                    {editing === payment.key ? (
                      <form
                        className="flex items-center gap-1"
                        onSubmit={(e) => { e.preventDefault(); void saveAmount(payment); }}
                      >
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          autoFocus
                          aria-label={t("amountReceived")}
                          placeholder={t("amountReceived")}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="h-8 w-24"
                        />
                        <Button type="submit" size="icon" className="h-8 w-8" aria-label={t("saveAmount")}><Check className="w-4 h-4" /></Button>
                        <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(null)}><X className="w-4 h-4" /></Button>
                      </form>
                    ) : (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        aria-label={t("amountReceived")}
                        title={t("amountReceived")}
                        onClick={() => { setEditing(payment.key); setEditValue(String(payment.paid)); }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-success"
                      aria-label={t("waButton")}
                      title={t("waButton")}
                      onClick={() => openWhatsApp(payment)}
                    >
                      <WhatsAppIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={isPaid ? "outline" : "default"}
                      onClick={() => togglePaid(payment)}
                    >
                      {isPaid ? t("markPending") : t("markPaid")}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
      {waContext && (
        <WhatsAppDialog
          open={!!waContext}
          onOpenChange={(o) => { if (!o) setWaContext(null); }}
          player={player}
          context={waContext}
        />
      )}
    </div>
  );
}
