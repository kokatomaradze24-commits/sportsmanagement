import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, User, Phone, Mail, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { Database } from "@/integrations/supabase/types";
import type { SportConfig } from "@/lib/sports";
import { useI18n } from "@/hooks/use-i18n";

type Player = Database["public"]["Tables"]["players"]["Row"];
type Payment = Database["public"]["Tables"]["payments"]["Row"];
type PlayerInsert = Database["public"]["Tables"]["players"]["Insert"] & { firstMonthPaid?: boolean };

type PaymentFilter = "all" | "paid" | "pending" | "overdue";

interface PlayersListProps {
  players: Player[];
  payments?: Payment[];
  loading: boolean;
  sport: SportConfig;
  onAdd: (player: PlayerInsert) => Promise<{ error: unknown }>;
  onUpdate: (id: string, updates: Partial<Player>) => Promise<{ error: unknown }>;
  onDelete: (id: string) => Promise<{ error: unknown }>;
  onSelect: (player: Player) => void;
  selectedId?: string;
}

function PlayerForm({ initial, sport, onSubmit, onCancel }: {
  initial?: Partial<Player>;
  sport: SportConfig;
  onSubmit: (data: PlayerInsert) => void;
  onCancel: () => void;
}) {
  const { t, monthShort } = useI18n();
  const isEdit = !!initial?.id;
  const now = new Date();
  const [firstName, setFirstName] = useState(initial?.first_name || "");
  const [lastName, setLastName] = useState(initial?.last_name || "");
  const [tNumber, setTNumber] = useState(initial?.t_number?.toString() || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [email, setEmail] = useState(initial?.email || "");

  // Subscription fields (only used when creating)
  const [monthlyFee, setMonthlyFee] = useState(initial?.monthly_fee?.toString() || "50");
  const [months, setMonths] = useState((initial?.subscription_months || 12).toString());
  const [startMonth, setStartMonth] = useState((initial?.start_month || now.getMonth() + 1).toString());
  const [firstMonthPaid, setFirstMonthPaid] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !tNumber.trim()) return;
    const base: PlayerInsert = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      t_number: parseInt(tNumber),
      phone: phone.trim() || null,
      email: email.trim() || null,
    };
    if (!isEdit) {
      base.monthly_fee = parseFloat(monthlyFee) || 0;
      base.subscription_months = parseInt(months);
      base.start_month = parseInt(startMonth);
      base.start_year = now.getFullYear();
      base.start_day = now.getDate();
      base.firstMonthPaid = firstMonthPaid;
    }
    onSubmit(base);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">{t("firstName")} *</label>
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" required />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">{t("lastName")} *</label>
          <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" required />
        </div>
      </div>
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">{sport.numberLabel} *</label>
        <Input type="number" value={tNumber} onChange={(e) => setTNumber(e.target.value)} placeholder="23" required min={0} max={999} />
      </div>
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">{t("phone")}</label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 234 567 890" />
      </div>
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">{t("email")}</label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" />
      </div>

      {!isEdit && (
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
          <div className="text-sm font-semibold text-foreground">{t("subscription")}</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t("monthlyFee")} *</label>
              <Input type="number" step="0.01" min={0} value={monthlyFee} onChange={(e) => setMonthlyFee(e.target.value)} placeholder="50.00" required />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t("durationMonths")} *</label>
              <Select value={months} onValueChange={setMonths}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => {
                    const n = i + 1;
                    return (
                      <SelectItem key={n} value={n.toString()}>
                        {t(n === 1 ? "monthLabel" : "monthsLabel", { count: n })}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">{t("startMonth")}</label>
            <Select value={startMonth} onValueChange={setStartMonth}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i} value={(i + 1).toString()}>{monthShort(i + 1)} {now.getFullYear()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
            <Checkbox checked={firstMonthPaid} onCheckedChange={(v) => setFirstMonthPaid(!!v)} />
            <span className="text-sm text-foreground">{t("firstMonthPaid")}</span>
          </label>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">{isEdit ? t("saveChanges") : t("addMember", { member: sport.member })}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>{t("cancel")}</Button>
      </div>
    </form>
  );
}

export function PlayersList({ players, payments = [], loading, sport, onAdd, onUpdate, onDelete, onSelect, selectedId }: PlayersListProps) {
  const { t } = useI18n();
  const [addOpen, setAddOpen] = useState(false);
  const [editPlayer, setEditPlayer] = useState<Player | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const filteredPlayers = useMemo(() => {
    let result = players;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.first_name.toLowerCase().includes(q) ||
          p.last_name.toLowerCase().includes(q) ||
          `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
          p.t_number.toString().includes(q)
      );
    }

    if (paymentFilter !== "all") {
      result = result.filter((p) => {
        const playerPayment = payments.find(
          (pay) => pay.player_id === p.id && pay.month === currentMonth && pay.year === currentYear
        );
        if (paymentFilter === "paid") return playerPayment?.status === "paid";
        if (paymentFilter === "pending") return playerPayment?.status === "pending";
        if (paymentFilter === "overdue") return !playerPayment || playerPayment.status === "pending";
        return true;
      });
    }

    return result;
  }, [players, payments, search, paymentFilter, currentMonth, currentYear]);

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const visibleSelectedCount = filteredPlayers.filter((p) => selectedIds.has(p.id)).length;
  const allVisibleSelected = filteredPlayers.length > 0 && visibleSelectedCount === filteredPlayers.length;
  const someVisibleSelected = visibleSelectedCount > 0 && !allVisibleSelected;

  const toggleAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        filteredPlayers.forEach((p) => next.delete(p.id));
      } else {
        filteredPlayers.forEach((p) => next.add(p.id));
      }
      return next;
    });
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    const ids = Array.from(selectedIds);
    await Promise.all(ids.map((id) => onDelete(id)));
    setSelectedIds(new Set());
    setBulkDeleting(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl tracking-wider text-foreground">{sport.members}</h2>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-md">
              <Plus className="w-4 h-4" /> {t("addMember", { member: sport.member })}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-2xl tracking-wider">{t("newMember", { member: sport.member })}</DialogTitle>
            </DialogHeader>
            <PlayerForm
              sport={sport}
              onSubmit={async (data) => {
                await onAdd(data);
                setAddOpen(false);
              }}
              onCancel={() => setAddOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="pl-9 h-8 text-sm"
          />
        </div>
        <Select value={paymentFilter} onValueChange={(v) => setPaymentFilter(v as PaymentFilter)}>
          <SelectTrigger className="w-[130px] h-8 text-sm">
            <Filter className="w-3.5 h-3.5 mr-1.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all")}</SelectItem>
            <SelectItem value="paid">{t("paid")}</SelectItem>
            <SelectItem value="pending">{t("pending")}</SelectItem>
            <SelectItem value="overdue">{t("overdue")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredPlayers.length > 0 && (
        <div className="flex items-center justify-between gap-2 px-1">
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
            <Checkbox
              checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false}
              onCheckedChange={toggleAllVisible}
            />
            <span>
              {selectedIds.size > 0
                ? t("selected", { count: selectedIds.size })
                : t("selectAll", { count: filteredPlayers.length })}
            </span>
          </label>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelectedIds(new Set())}>
                {t("clear")}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive" className="h-7 text-xs" disabled={bulkDeleting}>
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    {t("deleteCount", { count: selectedIds.size })}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t("deleteMembersTitle", { count: selectedIds.size, label: selectedIds.size === 1 ? sport.member.toLowerCase() : sport.members.toLowerCase() })}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("deleteMembersDesc", { label: sport.members.toLowerCase() })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleBulkDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {t("delete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filteredPlayers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 text-muted-foreground"
        >
          <User className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>{players.length === 0
            ? t("noMembersYet", { members: sport.members.toLowerCase(), member: sport.member.toLowerCase() })
            : t("noMembersMatch", { members: sport.members.toLowerCase() })}</p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filteredPlayers.map((player, i) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => onSelect(player)}
                className={`p-4 rounded-xl border cursor-pointer card-hover ${
                  selectedId === player.id
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(player.id)}
                        onCheckedChange={() => toggleOne(player.id)}
                        aria-label={`Select ${player.first_name} ${player.last_name}`}
                      />
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center font-display text-lg text-primary">
                      #{player.t_number}
                    </div>
                    <div>
                      <p className="font-semibold text-card-foreground">
                        {player.first_name} {player.last_name}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        {player.phone && (
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{player.phone}</span>
                        )}
                        {player.email && (
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{player.email}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Dialog open={editPlayer?.id === player.id} onOpenChange={(open) => !open && setEditPlayer(null)}>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={(e) => { e.stopPropagation(); setEditPlayer(player); }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <DialogContent onClick={(e) => e.stopPropagation()}>
                        <DialogHeader>
                          <DialogTitle className="text-2xl tracking-wider">{t("editMember", { member: sport.member })}</DialogTitle>
                        </DialogHeader>
                        {editPlayer && (
                          <PlayerForm
                            initial={editPlayer}
                            sport={sport}
                            onSubmit={async (data) => {
                              await onUpdate(editPlayer.id, data);
                              setEditPlayer(null);
                            }}
                            onCancel={() => setEditPlayer(null)}
                          />
                        )}
                      </DialogContent>
                    </Dialog>

                    {deleteConfirm === player.id ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="destructive" onClick={() => { onDelete(player.id); setDeleteConfirm(null); }}>
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
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm(player.id); }}
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
