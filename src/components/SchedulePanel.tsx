import { useEffect, useMemo, useState } from "react";
import { Calendar, Dumbbell, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useSchedule, type Practice, type Game } from "@/hooks/use-schedule";
import { useAgeDevelopmentPlan } from "@/hooks/use-age-development-plan";
import { AITrainingPlanDialog } from "./AITrainingPlanDialog";
import { WeeklyTemplateDialog } from "./WeeklyTemplateDialog";
import {
  usePracticeTemplates,
  nextDateForSlot,
  templatesForAge,
} from "@/hooks/use-practice-templates";

interface Props {
  sportId: string;
}

type ListView = "practices" | "games" | null;

export const AGE_GROUPS = ["U12", "U14", "U16", "U18", "U22", "PRO"] as const;
export type AgeGroup = (typeof AGE_GROUPS)[number];

export function SchedulePanel({ sportId }: Props) {
  const sched = useSchedule(sportId);
  const tpl = usePracticeTemplates(sportId);
  const [view, setView] = useState<ListView>(null);
  const [activeAge, setActiveAge] = useState<AgeGroup>("U12");
  const [editing, setEditing] = useState<
    | { kind: "practice"; row?: Practice }
    | { kind: "game"; row?: Game }
    | null
  >(null);

  const handleAddPractice = () => {
    const slots = templatesForAge(tpl.templates, activeAge);
    let row: Partial<Practice> = { age_group: activeAge };
    if (slots.length > 0) {
      // Pick the slot whose next occurrence is soonest from today.
      const today = new Date();
      const withDates = slots.map((s) => ({
        slot: s,
        date: nextDateForSlot(s, today),
      }));
      withDates.sort((a, b) => a.date.localeCompare(b.date));
      const pick = withDates[0];
      row = {
        age_group: activeAge,
        practice_date: pick.date,
        start_time: pick.slot.start_time,
        end_time: pick.slot.end_time,
        location: pick.slot.location,
      };
    }
    setEditing({ kind: "practice", row: row as Practice });
  };

  const practicesByAge = useMemo(() => {
    const map: Record<string, Practice[]> = {};
    for (const ag of AGE_GROUPS) map[ag] = [];
    map["__none__"] = [];
    for (const p of sched.practices) {
      const key = (p.age_group ?? "").toUpperCase();
      if ((AGE_GROUPS as readonly string[]).includes(key)) map[key].push(p);
      else map["__none__"].push(p);
    }
    return map;
  }, [sched.practices]);

  const filteredPractices = practicesByAge[activeAge] ?? [];

  return (
    <section className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-primary" />
        <h2 className="font-display text-xl tracking-wider">Schedule</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => setView("practices")}
          className="rounded-xl border border-border bg-background/50 p-4 text-left hover:bg-background transition-colors"
        >
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-primary" />
            <span className="font-semibold">Practices</span>
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {sched.loading ? "..." : `${sched.practices.length} scheduled`}
          </div>
        </button>
        <button
          onClick={() => setView("games")}
          className="rounded-xl border border-border bg-background/50 p-4 text-left hover:bg-background transition-colors"
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <span className="font-semibold">Games</span>
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {sched.loading ? "..." : `${sched.games.length} scheduled`}
          </div>
        </button>
      </div>

      <Dialog open={view === "practices"} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent className="max-w-4xl w-[95vw] h-[95vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-6 pb-3 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-primary" />
              Practices · {activeAge} ({filteredPractices.length})
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 pt-3 shrink-0 space-y-3">
            <div className="flex flex-wrap gap-2">
              {AGE_GROUPS.map((ag) => {
                const count = practicesByAge[ag]?.length ?? 0;
                const active = activeAge === ag;
                return (
                  <button
                    key={ag}
                    onClick={() => setActiveAge(ag)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-muted border-border"
                    }`}
                  >
                    {ag} <span className="opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <WeeklyTemplateDialog sportId={sportId} defaultAgeGroup={activeAge} />
              <AITrainingPlanDialog
                sportId={sportId}
                defaultAgeGroup={activeAge}
                onAdded={() => sched.refetch()}
              />
              <Button size="sm" onClick={handleAddPractice}>
                <Plus className="w-4 h-4 mr-1" /> Add practice
              </Button>
            </div>
          </div>

          <div className="overflow-y-auto p-6 pt-3 flex-1 min-h-0 space-y-4">
            <DevelopmentPlanCard sportId={sportId} ageGroup={activeAge} />
            {sched.loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : filteredPractices.length === 0 ? (
              <Empty label={`No practices for ${activeAge} yet`} />
            ) : (
              <div className="space-y-3">
                {filteredPractices.map((p) => (
                  <Row
                    key={p.id}
                    title={p.title}
                    date={p.practice_date}
                    start={p.start_time}
                    end={p.end_time}
                    location={p.location}
                    notes={p.notes}
                    extra={p.age_group ?? undefined}
                    onEdit={() => setEditing({ kind: "practice", row: p })}
                    onDelete={async () => { await sched.deletePractice(p.id); toast.success("Deleted"); }}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={view === "games"} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent className="max-w-3xl w-[95vw] h-[95vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-6 pb-3 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Games ({sched.games.length})
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-end px-6 pt-3 shrink-0">
            <Button size="sm" onClick={() => setEditing({ kind: "game" })}>
              <Plus className="w-4 h-4 mr-1" /> Add game
            </Button>
          </div>
          <div className="overflow-y-auto p-6 pt-3 flex-1 min-h-0">
            {sched.loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : sched.games.length === 0 ? (
              <Empty label="No games yet" />
            ) : (
              <div className="space-y-3">
                {sched.games.map((g) => (
                  <Row
                    key={g.id}
                    title={g.title}
                    date={g.game_date}
                    start={g.start_time}
                    end={g.end_time}
                    location={g.location}
                    notes={g.notes}
                    extra={g.opponent ? `vs ${g.opponent}` : undefined}
                    onEdit={() => setEditing({ kind: "game", row: g })}
                    onDelete={async () => { await sched.deleteGame(g.id); toast.success("Deleted"); }}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Editor
        editing={editing}
        onClose={() => setEditing(null)}
        onSavePractice={async (id, payload) => {
          if (id) await sched.updatePractice(id, payload as any);
          else await sched.addPractice(payload as any);
          toast.success("Saved");
          setEditing(null);
        }}
        onSaveGame={async (id, payload) => {
          if (id) await sched.updateGame(id, payload as any);
          else await sched.addGame(payload as any);
          toast.success("Saved");
          setEditing(null);
        }}
      />
    </section>
  );
}

function DevelopmentPlanCard({ sportId, ageGroup }: { sportId: string; ageGroup: AgeGroup }) {
  const { plan, loading, saving, save } = useAgeDevelopmentPlan(sportId, ageGroup);
  const [draft, setDraft] = useState("");
  const [editing, setEditingMode] = useState(false);

  // Sync when plan loads or age changes
  useEffect(() => { setDraft(plan); setEditingMode(false); }, [plan, ageGroup]);

  return (
    <div className="rounded-xl border border-border bg-primary/5 p-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div>
          <h3 className="font-semibold text-sm">Development plan · {ageGroup}</h3>
          <p className="text-xs text-muted-foreground">What to focus on for this age group</p>
        </div>
        {!editing ? (
          <Button size="sm" variant="outline" onClick={() => { setDraft(plan); setEditingMode(true); }}>
            <Pencil className="w-4 h-4 mr-1" /> Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => { setDraft(plan); setEditingMode(false); }}>
              Cancel
            </Button>
            <Button size="sm" disabled={saving} onClick={async () => {
              try { await save(draft); toast.success("Saved"); setEditingMode(false); }
              catch (e: any) { toast.error(e?.message ?? "Save failed"); }
            }}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </div>
      {editing ? (
        <Textarea
          rows={6}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Focus areas, goals, and priorities for ${ageGroup}...`}
        />
      ) : loading ? (
        <p className="text-xs text-muted-foreground">Loading...</p>
      ) : plan ? (
        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{plan}</p>
      ) : (
        <p className="text-sm text-muted-foreground italic">No development plan yet for {ageGroup}.</p>
      )}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground text-sm">
      {label}
    </div>
  );
}

function Row({
  title, date, start, end, location, notes, extra, onEdit, onDelete,
}: {
  title: string; date: string; start: string | null; end: string | null;
  location: string | null; notes: string | null; extra?: string;
  onEdit: () => void; onDelete: () => Promise<void>;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/50 p-4 flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-base">{title}</span>
          {extra && <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{extra}</span>}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {new Date(date).toLocaleDateString()}
          {start && ` · ${start.slice(0, 5)}`}
          {end && `–${end.slice(0, 5)}`}
          {location && ` · ${location}`}
        </div>
        {notes && (
          <p className="text-sm mt-2 text-foreground/90 whitespace-pre-wrap break-words leading-relaxed">
            {notes}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button size="sm" variant="ghost" onClick={onEdit}>
          <Pencil className="w-4 h-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="ghost" className="text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

function Editor({
  editing, onClose, onSavePractice, onSaveGame,
}: {
  editing: { kind: "practice"; row?: Practice } | { kind: "game"; row?: Game } | null;
  onClose: () => void;
  onSavePractice: (id: string | undefined, payload: Record<string, unknown>) => Promise<void>;
  onSaveGame: (id: string | undefined, payload: Record<string, unknown>) => Promise<void>;
}) {
  const isOpen = !!editing;
  const isGame = editing?.kind === "game";
  const row: any = editing?.row;

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [opponent, setOpponent] = useState("");
  const [ageGroup, setAgeGroup] = useState<string>("U12");
  const [notes, setNotes] = useState("");

  const handleOpen = (o: boolean) => {
    if (!o) onClose();
    if (o && editing) {
      setTitle(row?.title ?? "");
      setDate(row?.practice_date ?? row?.game_date ?? new Date().toISOString().slice(0, 10));
      setStartTime((row?.start_time ?? "").slice(0, 5));
      setEndTime((row?.end_time ?? "").slice(0, 5));
      setLocation(row?.location ?? "");
      setOpponent(row?.opponent ?? "");
      setAgeGroup(row?.age_group ?? "U12");
      setNotes(row?.notes ?? "");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const dateField = editing.kind === "practice" ? "practice_date" : "game_date";
    const payload: Record<string, unknown> = {
      title,
      [dateField]: date,
      start_time: startTime || null,
      end_time: endTime || null,
      location: location || null,
      notes: notes || null,
    };
    try {
      if (editing.kind === "game") {
        payload.opponent = opponent || null;
        await onSaveGame(row?.id, payload);
      } else {
        payload.age_group = ageGroup || null;
        await onSavePractice(row?.id, payload);
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Save failed");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{row?.id ? "Edit" : "Add"} {isGame ? "game" : "practice"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          {!isGame && (
            <div>
              <Label>Age group</Label>
              <Select value={ageGroup} onValueChange={setAgeGroup}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AGE_GROUPS.map((ag) => (
                    <SelectItem key={ag} value={ag}>{ag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Start</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <Label>End</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          {isGame && (
            <div>
              <Label>Opponent</Label>
              <Input value={opponent} onChange={(e) => setOpponent(e.target.value)} />
            </div>
          )}
          <div>
            <Label>Notes</Label>
            <Textarea rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
