import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, User, Phone, Mail, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Database } from "@/integrations/supabase/types";

type Player = Database["public"]["Tables"]["players"]["Row"];
type Payment = Database["public"]["Tables"]["payments"]["Row"];
type PlayerInsert = Database["public"]["Tables"]["players"]["Insert"];

type PaymentFilter = "all" | "paid" | "pending" | "overdue";

interface PlayersListProps {
  players: Player[];
  payments?: Payment[];
  loading: boolean;
  onAdd: (player: PlayerInsert) => Promise<{ error: unknown }>;
  onUpdate: (id: string, updates: Partial<Player>) => Promise<{ error: unknown }>;
  onDelete: (id: string) => Promise<{ error: unknown }>;
  onSelect: (player: Player) => void;
  selectedId?: string;
}

function PlayerForm({ initial, onSubmit, onCancel }: {
  initial?: Partial<Player>;
  onSubmit: (data: PlayerInsert) => void;
  onCancel: () => void;
}) {
  const [firstName, setFirstName] = useState(initial?.first_name || "");
  const [lastName, setLastName] = useState(initial?.last_name || "");
  const [tNumber, setTNumber] = useState(initial?.t_number?.toString() || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [email, setEmail] = useState(initial?.email || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !tNumber.trim()) return;
    onSubmit({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      t_number: parseInt(tNumber),
      phone: phone.trim() || null,
      email: email.trim() || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">First Name *</label>
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" required />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Last Name *</label>
          <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" required />
        </div>
      </div>
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">T-Shirt Number *</label>
        <Input type="number" value={tNumber} onChange={(e) => setTNumber(e.target.value)} placeholder="23" required min={0} max={99} />
      </div>
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">Phone</label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 234 567 890" />
      </div>
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">Email</label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" />
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">{initial?.id ? "Save Changes" : "Add Player"}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

export function PlayersList({ players, payments = [], loading, onAdd, onUpdate, onDelete, onSelect, selectedId }: PlayersListProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [editPlayer, setEditPlayer] = useState<Player | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const filteredPlayers = useMemo(() => {
    let result = players;

    // Text search
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

    // Payment status filter
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl tracking-wider text-foreground">Players</h2>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button variant="accent" size="sm">
              <Plus className="w-4 h-4" /> Add Player
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-2xl tracking-wider">New Player</DialogTitle>
            </DialogHeader>
            <PlayerForm
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
            placeholder="Search name or number..."
            className="pl-9 h-8 text-sm"
          />
        </div>
        <Select value={paymentFilter} onValueChange={(v) => setPaymentFilter(v as PaymentFilter)}>
          <SelectTrigger className="w-[130px] h-8 text-sm">
            <Filter className="w-3.5 h-3.5 mr-1.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : players.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 text-muted-foreground"
        >
          <User className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No players yet. Add your first player!</p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {players.map((player, i) => (
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
                          <DialogTitle className="text-2xl tracking-wider">Edit Player</DialogTitle>
                        </DialogHeader>
                        {editPlayer && (
                          <PlayerForm
                            initial={editPlayer}
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
                          Delete
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(null)}>
                          No
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
