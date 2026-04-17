import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, DollarSign, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Database } from "@/integrations/supabase/types";
import { useI18n } from "@/hooks/use-i18n";

type Payment = Database["public"]["Tables"]["payments"]["Row"];
type PaymentInsert = Database["public"]["Tables"]["payments"]["Insert"];
type Player = Database["public"]["Tables"]["players"]["Row"];

interface PaymentsPanelProps {
  player: Player;
  payments: Payment[];
  loading: boolean;
  onAdd: (payment: PaymentInsert) => Promise<{ error: unknown }>;
  onUpdate: (id: string, updates: Partial<Payment>) => Promise<{ error: unknown }>;
  onDelete: (id: string) => Promise<{ error: unknown }>;
}

function PaymentForm({ playerId, initial, onSubmit, onCancel }: {
  playerId: string;
  initial?: Partial<Payment>;
  onSubmit: (data: PaymentInsert) => void;
  onCancel: () => void;
}) {
  const { t, monthShort } = useI18n();
  const now = new Date();
  const [amount, setAmount] = useState(initial?.amount?.toString() || "");
  const [month, setMonth] = useState((initial?.month || now.getMonth() + 1).toString());
  const [year, setYear] = useState((initial?.year || now.getFullYear()).toString());
  const [status, setStatus] = useState(initial?.status || "pending");
  const [paymentDate, setPaymentDate] = useState(initial?.payment_date || "");
  const [notes, setNotes] = useState(initial?.notes || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount.trim()) return;
    onSubmit({
      player_id: playerId,
      amount: parseFloat(amount),
      month: parseInt(month),
      year: parseInt(year),
      status,
      payment_date: paymentDate || null,
      notes: notes.trim() || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">{t("amount")} *</label>
        <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="50.00" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">{t("month")}</label>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i} value={(i + 1).toString()}>{monthShort(i + 1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">{t("year")}</label>
          <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} min={2020} max={2100} />
        </div>
      </div>
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">{t("status")}</label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="paid">{t("paid")}</SelectItem>
            <SelectItem value="pending">{t("pending")}</SelectItem>
            <SelectItem value="overdue">{t("overdue")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">{t("paymentDate")}</label>
        <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
      </div>
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">{t("notes")}</label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("optionalNotes")} />
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">{initial?.id ? t("saveChanges") : t("addPayment")}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>{t("cancel")}</Button>
      </div>
    </form>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n();
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

export function PaymentsPanel({ player, payments, loading, onAdd, onUpdate, onDelete }: PaymentsPanelProps) {
  const { t, monthShort } = useI18n();
  const [addOpen, setAddOpen] = useState(false);
  const [editPayment, setEditPayment] = useState<Payment | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const playerPayments = payments.filter((p) => p.player_id === player.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl tracking-wider text-foreground">{t("payments")}</h2>
          <p className="text-sm text-muted-foreground">
            {player.first_name} {player.last_name} #{player.t_number}
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button variant="accent" size="sm">
              <Plus className="w-4 h-4" /> {t("addPayment")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-2xl tracking-wider">{t("newPayment")}</DialogTitle>
            </DialogHeader>
            <PaymentForm
              playerId={player.id}
              onSubmit={async (data) => {
                await onAdd(data);
                setAddOpen(false);
              }}
              onCancel={() => setAddOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
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
            {playerPayments.map((payment, i) => (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-xl border border-border bg-card card-hover"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-card-foreground">
                          ${payment.amount.toFixed(2)}
                        </span>
                        <StatusBadge status={payment.status} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {monthShort(payment.month)} {payment.year}
                        {payment.payment_date && ` · ${t("paid")} ${payment.payment_date}`}
                        {payment.notes && ` · ${payment.notes}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Dialog open={editPayment?.id === payment.id} onOpenChange={(open) => !open && setEditPayment(null)}>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setEditPayment(payment)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="text-2xl tracking-wider">{t("editPayment")}</DialogTitle>
                        </DialogHeader>
                        {editPayment && (
                          <PaymentForm
                            playerId={player.id}
                            initial={editPayment}
                            onSubmit={async (data) => {
                              await onUpdate(editPayment.id, data);
                              setEditPayment(null);
                            }}
                            onCancel={() => setEditPayment(null)}
                          />
                        )}
                      </DialogContent>
                    </Dialog>
                    {deleteConfirm === payment.id ? (
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="destructive" onClick={() => { onDelete(payment.id); setDeleteConfirm(null); }}>
                          {t("delete")}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(null)}>
                          {t("no")}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteConfirm(payment.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
