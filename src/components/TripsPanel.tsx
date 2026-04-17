import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, MapPin, Calendar, Clock, DollarSign, Pencil, Trash2,
  Search, UserPlus, Users, X, Check, Wallet, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Database } from "@/integrations/supabase/types";
import { useI18n, CURRENCY_SYMBOLS, type CurrencyCode } from "@/hooks/use-i18n";
import { useSounds } from "@/hooks/use-sounds";

const CURRENCY_OPTIONS: Array<{ value: CurrencyCode | "auto"; label: string }> = [
  { value: "auto", label: "Auto" },
  { value: "GEL", label: "₾ GEL" },
  { value: "USD", label: "$ USD" },
  { value: "EUR", label: "€ EUR" },
];

type Trip = Database["public"]["Tables"]["trips"]["Row"];
type TripParticipant = Database["public"]["Tables"]["trip_participants"]["Row"];
type Player = Database["public"]["Tables"]["players"]["Row"];

interface TripsPanelProps {
  trips: Trip[];
  participants: TripParticipant[];
  players: Player[];
  loading: boolean;
  onAddTrip: (trip: {
    name: string; location: string | null; trip_date: string;
    trip_time: string | null; price: number; notes: string | null; currency: string;
  }) => Promise<{ error: unknown; data: Trip | null }>;
  onUpdateTrip: (id: string, updates: Partial<Trip>) => Promise<{ error: unknown }>;
  onDeleteTrip: (id: string) => Promise<{ error: unknown }>;
  onAddParticipant: (tripId: string, playerId: string) => Promise<{ error: unknown }>;
  onUpdateParticipant: (id: string, updates: Partial<TripParticipant>) => Promise<{ error: unknown }>;
  onRemoveParticipant: (id: string) => Promise<{ error: unknown }>;
}

function TripForm({
  initial, onSubmit, onCancel,
}: {
  initial?: Partial<Trip>;
  onSubmit: (data: {
    name: string; location: string | null; trip_date: string;
    trip_time: string | null; price: number; notes: string | null; currency: string;
  }) => void;
  onCancel: () => void;
}) {
  const { t, language } = useI18n();
  const today = new Date().toISOString().slice(0, 10);
  const [name, setName] = useState(initial?.name || "");
  const [location, setLocation] = useState(initial?.location || "");
  const [date, setDate] = useState(initial?.trip_date || today);
  const [time, setTime] = useState(initial?.trip_time || "");
  const [price, setPrice] = useState(initial?.price?.toString() || "0");
  const [currency, setCurrency] = useState<string>(
    (initial as { currency?: string } | undefined)?.currency || "auto"
  );
  const [notes, setNotes] = useState(initial?.notes || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !date) return;
    onSubmit({
      name: name.trim(),
      location: location.trim() || null,
      trip_date: date,
      trip_time: time || null,
      price: Number(price) || 0,
      notes: notes.trim() || null,
      currency,
    });
  };

  const previewSymbol =
    currency === "auto"
      ? CURRENCY_SYMBOLS[
          language === "ka" ? "GEL" : language === "en" ? "USD" : "EUR"
        ]
      : CURRENCY_SYMBOLS[currency as CurrencyCode];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium block mb-1.5">{t("tripName")}</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("tripNamePlaceholder")}
          required
          autoFocus
        />
      </div>
      <div>
        <label className="text-sm font-medium block mb-1.5">{t("tripLocation")}</label>
        <Input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={t("tripLocationPlaceholder")}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium block mb-1.5">{t("tripDate")}</label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5">{t("tripTime")}</label>
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium block mb-1.5">{t("tripPrice")}</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground pointer-events-none">
              {previewSymbol}
            </span>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="pl-7"
            />
          </div>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label="Currency"
          >
            {CURRENCY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium block mb-1.5">{t("tripNotes")}</label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>{t("cancel")}</Button>
        <Button type="submit" variant="success">
          {initial?.id ? t("save") : t("create")}
        </Button>
      </DialogFooter>
    </form>
  );
}

function AddParticipantDialog({
  trip, players, existingPlayerIds, onAdd, open, onOpenChange,
}: {
  trip: Trip;
  players: Player[];
  existingPlayerIds: Set<string>;
  onAdd: (playerId: string) => void;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { t } = useI18n();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return players
      .filter((p) => p.is_active)
      .filter((p) => {
        if (!q) return true;
        const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
        return fullName.includes(q) || String(p.t_number).includes(q);
      });
  }, [players, search]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("addParticipant")} — {trip.name}</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlayer")}
            className="pl-9"
            autoFocus
          />
        </div>
        <div className="max-h-72 overflow-y-auto space-y-1 -mx-1 px-1">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">{t("noPlayersFound")}</p>
          ) : (
            filtered.map((p) => {
              const already = existingPlayerIds.has(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={already}
                  onClick={() => {
                    onAdd(p.id);
                    onOpenChange(false);
                    setSearch("");
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg border border-border hover:bg-accent hover:border-primary/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">{p.t_number}</Badge>
                    <span className="font-medium">{p.first_name} {p.last_name}</span>
                  </span>
                  {already && (
                    <span className="text-xs text-muted-foreground">{t("alreadyAdded")}</span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ParticipantRow({
  participant, player, tripPrice, tripCurrency, onUpdate, onRemove,
}: {
  participant: TripParticipant;
  player: Player | undefined;
  tripPrice: number;
  tripCurrency: string;
  onUpdate: (updates: Partial<TripParticipant>) => void;
  onRemove: () => void;
}) {
  const { t, formatMoney } = useI18n();
  const { play } = useSounds();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!player) return null;

  const depositPaid = !!participant.deposit_paid_at;
  const finalPaid = !!participant.final_paid_at;
  const halfPrice = Math.round((tripPrice / 2) * 100) / 100;

  const status: "full" | "partial" | "none" =
    depositPaid && finalPaid ? "full" : depositPaid || finalPaid ? "partial" : "none";

  const toggleDeposit = () => {
    if (depositPaid) {
      play("click");
      onUpdate({ deposit_paid_at: null, deposit_amount: 0 });
    } else {
      play("cash");
      onUpdate({
        deposit_paid_at: new Date().toISOString(),
        deposit_amount: halfPrice,
      });
    }
  };

  const toggleFinal = () => {
    if (finalPaid) {
      play("click");
      onUpdate({ final_paid_at: null, final_amount: 0 });
    } else {
      play("cash");
      const remaining = Math.max(0, tripPrice - (participant.deposit_amount || 0));
      onUpdate({
        final_paid_at: new Date().toISOString(),
        final_amount: remaining || halfPrice,
      });
    }
  };

  const statusBadge =
    status === "full" ? (
      <Badge className="bg-success text-success-foreground">{t("fullyPaid")}</Badge>
    ) : status === "partial" ? (
      <Badge className="bg-warning text-warning-foreground">{t("partiallyPaid")}</Badge>
    ) : (
      <Badge variant="outline">{t("notPaid")}</Badge>
    );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="rounded-xl border border-border bg-background/50 p-3 space-y-2.5"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Badge variant="outline" className="font-mono shrink-0">{player.t_number}</Badge>
          <span className="font-medium truncate">{player.first_name} {player.last_name}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {statusBadge}
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => { play("click"); setConfirmOpen(true); }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          size="sm"
          variant={depositPaid ? "success" : "outline"}
          onClick={toggleDeposit}
          className="text-xs"
        >
          {depositPaid ? <Check className="h-3.5 w-3.5" /> : <Wallet className="h-3.5 w-3.5" />}
          {t("deposit")} {depositPaid && participant.deposit_amount ? `(${formatMoney(Number(participant.deposit_amount), tripCurrency as CurrencyCode | "auto")})` : ""}
        </Button>
        <Button
          size="sm"
          variant={finalPaid ? "success" : "outline"}
          onClick={toggleFinal}
          className="text-xs"
        >
          {finalPaid ? <Check className="h-3.5 w-3.5" /> : <DollarSign className="h-3.5 w-3.5" />}
          {t("finalPayment")} {finalPaid && participant.final_amount ? `(${formatMoney(Number(participant.final_amount), tripCurrency as CurrencyCode | "auto")})` : ""}
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("removeParticipant")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("removeParticipantConfirm", { name: `${player.first_name} ${player.last_name}` })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { play("success"); onRemove(); }}
              className="bg-destructive hover:bg-destructive/90"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}

function TripCard({
  trip, participants, players, onUpdate, onDelete, onAddParticipant,
  onUpdateParticipant, onRemoveParticipant,
}: {
  trip: Trip;
  participants: TripParticipant[];
  players: Player[];
  onUpdate: (id: string, updates: Partial<Trip>) => void;
  onDelete: (id: string) => void;
  onAddParticipant: (tripId: string, playerId: string) => void;
  onUpdateParticipant: (id: string, updates: Partial<TripParticipant>) => void;
  onRemoveParticipant: (id: string) => void;
}) {
  const { t, monthShort } = useI18n();
  const { play } = useSounds();
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addPartOpen, setAddPartOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const tripParts = useMemo(
    () => participants.filter((p) => p.trip_id === trip.id),
    [participants, trip.id]
  );
  const existingPlayerIds = useMemo(
    () => new Set(tripParts.map((p) => p.player_id)),
    [tripParts]
  );
  const playerById = useMemo(() => {
    const m = new Map<string, Player>();
    players.forEach((p) => m.set(p.id, p));
    return m;
  }, [players]);

  const totalPossible = tripParts.length * Number(trip.price);
  const collected = tripParts.reduce(
    (sum, p) => sum + Number(p.deposit_amount || 0) + Number(p.final_amount || 0),
    0
  );

  const dateObj = new Date(trip.trip_date + "T00:00:00");
  const day = dateObj.getDate();
  const monthLabel = monthShort(dateObj.getMonth() + 1);
  const year = dateObj.getFullYear();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-xl border border-border bg-card/60 backdrop-blur-sm overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg font-bold truncate">{trip.name}</h3>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
              {trip.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {trip.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {day} {monthLabel} {year}
              </span>
              {trip.trip_time && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {trip.trip_time.slice(0, 5)}
                </span>
              )}
              <span className="flex items-center gap-1 font-semibold text-foreground">
                <span className="font-mono text-sm">{tripCurrencySymbol}</span> {Number(trip.price).toFixed(2)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onMouseEnter={() => play("hover")}
              onClick={() => { play("click"); setEditOpen(true); }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onMouseEnter={() => play("hover")}
              onClick={() => { play("click"); setDeleteOpen(true); }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 mt-3">
          <button
            type="button"
            onClick={() => { play("click"); setExpanded((v) => !v); }}
            className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            <Users className="h-4 w-4" />
            <span>{t("participantsCount", { count: tripParts.length })}</span>
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          <span className="text-xs text-muted-foreground">
            {t("totalCollectedTrip", { amount: `${tripCurrencySymbol}${collected.toFixed(2)}`, total: `${tripCurrencySymbol}${totalPossible.toFixed(2)}` })}
          </span>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            layout
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border bg-muted/20"
          >
            <div className="p-3 space-y-2">
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => { play("click"); setAddPartOpen(true); }}
              >
                <UserPlus className="h-4 w-4" />
                {t("addParticipant")}
              </Button>
              <AnimatePresence mode="popLayout">
                {tripParts.map((part) => (
                  <ParticipantRow
                    key={part.id}
                    participant={part}
                    player={playerById.get(part.player_id)}
                    tripPrice={Number(trip.price)}
                    tripCurrency={(trip as { currency?: string }).currency || "auto"}
                    onUpdate={(u) => onUpdateParticipant(part.id, u)}
                    onRemove={() => onRemoveParticipant(part.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editTrip")}</DialogTitle>
          </DialogHeader>
          <TripForm
            initial={trip}
            onSubmit={(data) => {
              play("success");
              onUpdate(trip.id, data);
              setEditOpen(false);
            }}
            onCancel={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AddParticipantDialog
        trip={trip}
        players={players}
        existingPlayerIds={existingPlayerIds}
        onAdd={(playerId) => { play("success"); onAddParticipant(trip.id, playerId); }}
        open={addPartOpen}
        onOpenChange={setAddPartOpen}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteTrip")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteTripConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { play("success"); onDelete(trip.id); }}
              className="bg-destructive hover:bg-destructive/90"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}

export function TripsPanel({
  trips, participants, players, loading,
  onAddTrip, onUpdateTrip, onDeleteTrip,
  onAddParticipant, onUpdateParticipant, onRemoveParticipant,
}: TripsPanelProps) {
  const { t } = useI18n();
  const { play } = useSounds();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <section className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🚌</span>
          <h2 className="text-xl font-display font-bold gradient-text">{t("tripsTitle")}</h2>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button
              variant="success"
              size="sm"
              onMouseEnter={() => play("hover")}
              onClick={() => play("click")}
            >
              <Plus className="h-4 w-4" />
              {t("newTrip")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("addTrip")}</DialogTitle>
            </DialogHeader>
            <TripForm
              onSubmit={async (data) => {
                play("success");
                await onAddTrip(data);
                setCreateOpen(false);
              }}
              onCancel={() => setCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : trips.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <div className="text-5xl mb-3">🗺️</div>
          <p>{t("tripsEmpty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {trips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                participants={participants}
                players={players}
                onUpdate={onUpdateTrip}
                onDelete={onDeleteTrip}
                onAddParticipant={onAddParticipant}
                onUpdateParticipant={onUpdateParticipant}
                onRemoveParticipant={onRemoveParticipant}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
