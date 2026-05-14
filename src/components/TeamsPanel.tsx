import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Users, Pencil, Trash2, ChevronDown, ChevronUp, Search, UserPlus, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useI18n } from "@/hooks/use-i18n";
import { useSounds } from "@/hooks/use-sounds";
import type { Database } from "@/integrations/supabase/types";

type Team = Database["public"]["Tables"]["teams"]["Row"];
type TeamMember = Database["public"]["Tables"]["team_members"]["Row"];
type Player = Database["public"]["Tables"]["players"]["Row"];

interface TeamsPanelProps {
  teams: Team[];
  members: TeamMember[];
  players: Player[];
  loading: boolean;
  onAddTeam: (team: { name: string; age_group: string | null; notes: string | null }) => Promise<{ error: unknown; data: Team | null }>;
  onUpdateTeam: (id: string, updates: Partial<Team>) => Promise<{ error: unknown }>;
  onDeleteTeam: (id: string) => Promise<{ error: unknown }>;
  onSetRoster: (teamId: string, playerIds: string[]) => Promise<{ error: unknown }>;
}

function TeamForm({
  initial, onSubmit, onCancel,
}: {
  initial?: Partial<Team>;
  onSubmit: (data: { name: string; age_group: string | null; notes: string | null }) => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const [name, setName] = useState(initial?.name || "");
  const [ageGroup, setAgeGroup] = useState(initial?.age_group || "");
  const [notes, setNotes] = useState(initial?.notes || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      age_group: ageGroup.trim() || null,
      notes: notes.trim() || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1.5 block">{t("teamName")} *</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("teamNamePlaceholder")}
          autoFocus
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">
          {t("teamAgeGroup")} <span className="text-muted-foreground text-xs">({t("optional")})</span>
        </label>
        <Input
          value={ageGroup}
          onChange={(e) => setAgeGroup(e.target.value)}
          placeholder={t("teamAgeGroupPlaceholder")}
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">
          {t("notes")} <span className="text-muted-foreground text-xs">({t("optional")})</span>
        </label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder={t("teamNotesPlaceholder")}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>{t("cancel")}</Button>
        <Button type="submit">{t("save")}</Button>
      </DialogFooter>
    </form>
  );
}

function ManageRosterDialog({
  team, members, players, onClose, onSetRoster,
}: {
  team: Team;
  members: TeamMember[];
  players: Player[];
  onClose: () => void;
  onSetRoster: (teamId: string, playerIds: string[]) => Promise<{ error: unknown }>;
}) {
  const { t } = useI18n();
  const { play } = useSounds();
  const initialIds = useMemo(
    () => members.filter((m) => m.team_id === team.id).map((m) => m.player_id),
    [members, team.id]
  );
  const [selected, setSelected] = useState<Set<string>>(new Set(initialIds));
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return players;
    return players.filter((p) =>
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
      String(p.t_number).includes(q)
    );
  }, [players, search]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await onSetRoster(team.id, Array.from(selected));
    setSaving(false);
    if (!error) {
      play("success");
      onClose();
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl tracking-wider">
            {t("manageRoster")} — {team.name}
          </DialogTitle>
          <DialogDescription>
            {t("manageRosterDesc", { count: String(selected.size) })}
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlayers")}
            className="pl-9"
          />
        </div>

        <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-1.5">
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              {players.length === 0 ? t("noPlayersYet") : t("noResults")}
            </p>
          ) : (
            filtered.map((p) => {
              const checked = selected.has(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggle(p.id)}
                  className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                    checked
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:bg-muted/40"
                  }`}
                >
                  <Checkbox checked={checked} className="pointer-events-none" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {p.first_name} {p.last_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      #{p.t_number}
                      {p.birth_date ? ` · ${new Date(p.birth_date).getFullYear()}` : ""}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <DialogFooter className="border-t border-border pt-3">
          <Button variant="outline" onClick={onClose} disabled={saving}>{t("cancel")}</Button>
          <Button onClick={handleSave} disabled={saving}>
            {t("save")} ({selected.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TeamsPanel({
  teams, members, players, loading, onAddTeam, onUpdateTeam, onDeleteTeam, onSetRoster,
}: TeamsPanelProps) {
  const { t } = useI18n();
  const { play } = useSounds();
  const [addOpen, setAddOpen] = useState(false);
  const [editTeam, setEditTeam] = useState<Team | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [rosterTeam, setRosterTeam] = useState<Team | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const playersById = useMemo(() => {
    const map = new Map<string, Player>();
    for (const p of players) map.set(p.id, p);
    return map;
  }, [players]);

  const membersByTeam = useMemo(() => {
    const map = new Map<string, TeamMember[]>();
    for (const m of members) {
      if (!map.has(m.team_id)) map.set(m.team_id, []);
      map.get(m.team_id)!.push(m);
    }
    return map;
  }, [members]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdd = async (data: { name: string; age_group: string | null; notes: string | null }) => {
    const { error } = await onAddTeam(data);
    if (!error) {
      play("success");
      setAddOpen(false);
    }
  };

  const handleEdit = async (data: { name: string; age_group: string | null; notes: string | null }) => {
    if (!editTeam) return;
    const { error } = await onUpdateTeam(editTeam.id, data);
    if (!error) {
      play("success");
      setEditTeam(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await onDeleteTeam(deleteId);
    setDeleteId(null);
  };

  return (
    <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-display tracking-wider">{t("teams")}</h2>
          <Badge variant="secondary" className="ml-1">{teams.length}</Badge>
        </div>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              {t("addTeam")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("addTeam")}</DialogTitle>
              <DialogDescription>{t("addTeamDesc")}</DialogDescription>
            </DialogHeader>
            <TeamForm onSubmit={handleAdd} onCancel={() => setAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">{t("loading")}</p>
      ) : teams.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">{t("noTeamsYet")}</p>
          <p className="text-xs mt-1 opacity-70">{t("noTeamsHint")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {teams.map((team) => {
              const teamMembers = membersByTeam.get(team.id) ?? [];
              const isOpen = expanded.has(team.id);
              return (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="rounded-xl border border-border bg-card overflow-hidden"
                >
                  <div className="flex items-center gap-2 p-3">
                    <button
                      type="button"
                      onClick={() => toggleExpand(team.id)}
                      className="flex-1 flex items-center gap-2 text-left min-w-0"
                    >
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{team.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          {team.age_group && <span>{team.age_group}</span>}
                          <span>· {teamMembers.length} {t("members")}</span>
                        </div>
                      </div>
                    </button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => setRosterTeam(team)}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{t("manageRoster")}</span>
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditTeam(team)} title={t("edit")}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setDeleteId(team.id)}
                      title={t("delete")}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 pt-1 border-t border-border">
                          {team.notes && (
                            <p className="text-xs text-muted-foreground mb-2 italic">{team.notes}</p>
                          )}
                          {teamMembers.length === 0 ? (
                            <p className="text-xs text-muted-foreground py-3 text-center">
                              {t("noMembersInTeam")}
                            </p>
                          ) : (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {teamMembers.map((m) => {
                                const player = playersById.get(m.player_id);
                                if (!player) return null;
                                return (
                                  <Badge
                                    key={m.id}
                                    variant="secondary"
                                    className="gap-1.5 pr-1 py-1"
                                  >
                                    <span>#{player.t_number} {player.first_name} {player.last_name}</span>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        const remaining = teamMembers
                                          .filter((tm) => tm.player_id !== m.player_id)
                                          .map((tm) => tm.player_id);
                                        await onSetRoster(team.id, remaining);
                                      }}
                                      className="hover:bg-destructive/20 rounded-full p-0.5"
                                      title={t("removeFromTeam")}
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </Badge>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editTeam} onOpenChange={(o) => !o && setEditTeam(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editTeam")}</DialogTitle>
          </DialogHeader>
          {editTeam && (
            <TeamForm initial={editTeam} onSubmit={handleEdit} onCancel={() => setEditTeam(null)} />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteTeamTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteTeamDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Roster manage dialog */}
      {rosterTeam && (
        <ManageRosterDialog
          team={rosterTeam}
          members={members}
          players={players}
          onClose={() => setRosterTeam(null)}
          onSetRoster={onSetRoster}
        />
      )}
    </div>
  );
}
