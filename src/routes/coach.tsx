import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Calendar, Dumbbell, LogOut, Pencil, Plus, Trophy, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { getCoachSession, clearCoachSession, type CoachSession } from "@/lib/coach-session";

export const Route = createFileRoute("/coach")({
  head: () => ({
    meta: [
      { title: "Coach Dashboard — Schedule" },
      { name: "description", content: "Coach schedule of practices and games" },
    ],
  }),
  component: CoachDashboard,
});

interface PracticeRow {
  id: string;
  title: string;
  practice_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  notes: string | null;
}
interface GameRow {
  id: string;
  title: string;
  game_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  opponent: string | null;
  notes: string | null;
}

function CoachDashboard() {
  const navigate = useNavigate();
  const [session, setSession] = useState<CoachSession | null>(null);
  const [practices, setPractices] = useState<PracticeRow[]>([]);
  const [games, setGames] = useState<GameRow[]>([]);
  const [clubName, setClubName] = useState("");
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<
    | { kind: "practice"; row?: PracticeRow }
    | { kind: "game"; row?: GameRow }
    | null
  >(null);

  useEffect(() => {
    const s = getCoachSession();
    if (!s) {
      navigate({ to: "/coach-login" });
      return;
    }
    setSession(s);
  }, [navigate]);

  const refetch = useCallback(async () => {
    const s = getCoachSession();
    if (!s) return;
    setLoading(true);
    const res = await fetch("/api/coach/schedule", {
      headers: { "x-coach-token": s.token },
    });
    if (res.status === 401) {
      clearCoachSession();
      navigate({ to: "/coach-login" });
      return;
    }
    const data = await res.json();
    setPractices(data.practices ?? []);
    setGames(data.games ?? []);
    setClubName(data.clubName ?? "");
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    if (session) refetch();
  }, [session, refetch]);

  const logout = () => {
    clearCoachSession();
    navigate({ to: "/coach-login" });
  };

  const save = async (
    kind: "practice" | "game",
    payload: Record<string, unknown>,
    id?: string,
  ) => {
    const s = getCoachSession();
    if (!s) return;
    const res = await fetch("/api/coach/schedule", {
      method: id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json", "x-coach-token": s.token },
      body: JSON.stringify(id ? { kind, id, payload } : { kind, payload }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      toast.error(j.error ?? "Save failed");
      return;
    }
    toast.success(id ? "Updated" : "Created");
    setEditing(null);
    refetch();
  };

  if (!session) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display text-lg tracking-wide">{clubName || "Club"}</h1>
              <p className="text-xs text-muted-foreground">
                Coach: <span className="font-medium">{session.displayName}</span>
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <Tabs defaultValue="practices">
          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <TabsList>
              <TabsTrigger value="practices">
                <Dumbbell className="w-4 h-4 mr-2" /> Practices ({practices.length})
              </TabsTrigger>
              <TabsTrigger value="games">
                <Calendar className="w-4 h-4 mr-2" /> Games ({games.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="practices">
            <SectionHeader
              title="Practice schedule"
              onAdd={() => setEditing({ kind: "practice" })}
            />
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : practices.length === 0 ? (
              <EmptyState label="No practices scheduled yet" />
            ) : (
              <div className="space-y-2">
                {practices.map((p) => (
                  <ScheduleCard
                    key={p.id}
                    title={p.title}
                    date={p.practice_date}
                    start={p.start_time}
                    end={p.end_time}
                    location={p.location}
                    notes={p.notes}
                    onEdit={() => setEditing({ kind: "practice", row: p })}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="games">
            <SectionHeader
              title="Games calendar"
              onAdd={() => setEditing({ kind: "game" })}
            />
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : games.length === 0 ? (
              <EmptyState label="No games scheduled yet" />
            ) : (
              <div className="space-y-2">
                {games.map((g) => (
                  <ScheduleCard
                    key={g.id}
                    title={g.title}
                    date={g.game_date}
                    start={g.start_time}
                    end={g.end_time}
                    location={g.location}
                    notes={g.notes}
                    extra={g.opponent ? `vs ${g.opponent}` : undefined}
                    onEdit={() => setEditing({ kind: "game", row: g })}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <ScheduleEditor
        editing={editing}
        onClose={() => setEditing(null)}
        onSave={save}
      />
    </div>
  );
}

function SectionHeader({ title, onAdd }: { title: string; onAdd: () => void }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-base font-semibold">{title}</h2>
      <Button size="sm" onClick={onAdd}>
        <Plus className="w-4 h-4 mr-1" /> Add
      </Button>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
      {label}
    </div>
  );
}

function ScheduleCard({
  title, date, start, end, location, notes, extra, onEdit,
}: {
  title: string;
  date: string;
  start: string | null;
  end: string | null;
  location: string | null;
  notes: string | null;
  extra?: string;
  onEdit: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold">{title}</span>
          {extra && <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{extra}</span>}
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          {new Date(date).toLocaleDateString()}
          {start && ` · ${start.slice(0, 5)}`}
          {end && `–${end.slice(0, 5)}`}
          {location && ` · ${location}`}
        </div>
        {notes && <p className="text-sm mt-1.5 text-muted-foreground line-clamp-2">{notes}</p>}
      </div>
      <Button size="sm" variant="ghost" onClick={onEdit}>
        <Pencil className="w-4 h-4" />
      </Button>
    </div>
  );
}

function ScheduleEditor({
  editing, onClose, onSave,
}: {
  editing: { kind: "practice"; row?: PracticeRow } | { kind: "game"; row?: GameRow } | null;
  onClose: () => void;
  onSave: (kind: "practice" | "game", payload: Record<string, unknown>, id?: string) => void;
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

  useEffect(() => {
    if (!isOpen) return;
    setTitle(row?.title ?? "");
    setDate(row?.practice_date ?? row?.game_date ?? new Date().toISOString().slice(0, 10));
    setStartTime((row?.start_time ?? "").slice(0, 5));
    setEndTime((row?.end_time ?? "").slice(0, 5));
    setLocation(row?.location ?? "");
    setOpponent(row?.opponent ?? "");
    setNotes(row?.notes ?? "");
  }, [isOpen, row]);

  const submit = (e: React.FormEvent) => {
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
    if (editing.kind === "game") payload.opponent = opponent || null;
    onSave(editing.kind, payload, row?.id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {row ? "Edit" : "Add"} {isGame ? "game" : "practice"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-3">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="col-span-1">
              <Label>Start</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="col-span-1">
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
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
