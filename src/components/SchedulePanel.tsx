import { useState } from "react";
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
import { AITrainingPlanDialog } from "./AITrainingPlanDialog";

interface Props {
  sportId: string;
}

type ListView = "practices" | "games" | null;

export function SchedulePanel({ sportId }: Props) {
  const sched = useSchedule(sportId);
  const [view, setView] = useState<ListView>(null);
  const [editing, setEditing] = useState<
    | { kind: "practice"; row?: Practice }
    | { kind: "game"; row?: Game }
    | null
  >(null);

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
        <DialogContent className="max-w-2xl h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-6 pb-3 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-primary" />
              Practices ({sched.practices.length})
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-end gap-2 px-6 pt-3 shrink-0">
            <AITrainingPlanDialog sportId={sportId} onAdded={() => sched.refetch()} />
            <Button size="sm" onClick={() => setEditing({ kind: "practice" })}>
              <Plus className="w-4 h-4 mr-1" /> Add practice
            </Button>
          </div>
          <div className="overflow-y-auto p-6 pt-3 flex-1 min-h-0">
            {sched.loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : sched.practices.length === 0 ? (
              <Empty label="No practices yet" />
            ) : (
              <div className="space-y-2">
                {sched.practices.map((p) => (
                  <Row
                    key={p.id}
                    title={p.title}
                    date={p.practice_date}
                    start={p.start_time}
                    end={p.end_time}
                    location={p.location}
                    notes={p.notes}
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
        <DialogContent className="max-w-2xl h-[90vh] flex flex-col p-0 gap-0">
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
              <div className="space-y-2">
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
    <div className="rounded-xl border border-border bg-background/50 p-3 flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold">{title}</span>
          {extra && <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{extra}</span>}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {new Date(date).toLocaleDateString()}
          {start && ` · ${start.slice(0, 5)}`}
          {end && `–${end.slice(0, 5)}`}
          {location && ` · ${location}`}
        </div>
        {notes && <p className="text-sm mt-1 text-muted-foreground line-clamp-2">{notes}</p>}
      </div>
      <div className="flex items-center gap-1">
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
        await onSavePractice(row?.id, payload);
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Save failed");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{row ? "Edit" : "Add"} {isGame ? "game" : "practice"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
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
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
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
