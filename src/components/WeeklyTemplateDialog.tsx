import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  usePracticeTemplates,
  type PracticeTemplate,
  type NewPracticeTemplate,
} from "@/hooks/use-practice-templates";
import { AGE_GROUPS, type AgeGroup } from "./SchedulePanel";

const DAYS = [
  { v: 1, label: "Mon" },
  { v: 2, label: "Tue" },
  { v: 3, label: "Wed" },
  { v: 4, label: "Thu" },
  { v: 5, label: "Fri" },
  { v: 6, label: "Sat" },
  { v: 0, label: "Sun" },
];

interface Props {
  sportId: string;
  defaultAgeGroup: AgeGroup;
}

export function WeeklyTemplateDialog({ sportId, defaultAgeGroup }: Props) {
  const [open, setOpen] = useState(false);
  const [age, setAge] = useState<AgeGroup>(defaultAgeGroup);
  const { templates, add, update, remove } = usePracticeTemplates(sportId);

  useEffect(() => {
    if (open) setAge(defaultAgeGroup);
  }, [open, defaultAgeGroup]);

  const list = useMemo(
    () => templates.filter((t) => t.age_group === age),
    [templates, age],
  );

  // form state for new slot
  const [day, setDay] = useState<number>(1);
  const [start, setStart] = useState("18:00");
  const [end, setEnd] = useState("19:30");
  const [location, setLocation] = useState("");

  const handleAdd = async () => {
    if (!start) {
      toast.error("Start time required");
      return;
    }
    const payload: NewPracticeTemplate = {
      age_group: age,
      day_of_week: day,
      start_time: start,
      end_time: end || null,
      location: location || null,
    };
    try {
      await add(payload);
      setLocation("");
      toast.success("Slot added");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  const dayLabel = (n: number) => DAYS.find((d) => d.v === n)?.label ?? "";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <CalendarClock className="h-4 w-4" />
          Weekly schedule
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            Weekly practice schedule
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Age group</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {AGE_GROUPS.map((ag) => {
                const count = templates.filter((t) => t.age_group === ag).length;
                const active = age === ag;
                return (
                  <button
                    key={ag}
                    onClick={() => setAge(ag)}
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
          </div>

          <div className="rounded-xl border p-3 space-y-3 bg-secondary/30">
            <div className="text-sm font-medium">Add slot</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <Label className="text-xs">Day</Label>
                <Select value={String(day)} onValueChange={(v) => setDay(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d) => (
                      <SelectItem key={d.v} value={String(d.v)}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Start</Label>
                <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">End</Label>
                <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Location</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Gym A" />
              </div>
            </div>
            <Button size="sm" onClick={handleAdd} className="gap-1">
              <Plus className="w-4 h-4" /> Add
            </Button>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">
              {age} · {list.length} slot{list.length === 1 ? "" : "s"}/week
            </div>
            {list.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                No weekly slots set for {age}
              </div>
            ) : (
              <div className="space-y-2">
                {list.map((row) => (
                  <SlotRow
                    key={row.id}
                    row={row}
                    dayLabel={dayLabel}
                    onSave={(patch) => update(row.id, patch)}
                    onDelete={() => remove(row.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SlotRow({
  row,
  dayLabel,
  onSave,
  onDelete,
}: {
  row: PracticeTemplate;
  dayLabel: (n: number) => string;
  onSave: (patch: Partial<NewPracticeTemplate>) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [day, setDay] = useState(row.day_of_week);
  const [start, setStart] = useState(row.start_time.slice(0, 5));
  const [end, setEnd] = useState((row.end_time ?? "").slice(0, 5));
  const [location, setLocation] = useState(row.location ?? "");

  const save = async () => {
    try {
      await onSave({
        day_of_week: day,
        start_time: start,
        end_time: end || null,
        location: location || null,
      });
      setEditing(false);
      toast.success("Saved");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border p-3 bg-background/60">
        <div className="text-sm">
          <span className="font-semibold">{dayLabel(row.day_of_week)}</span>
          <span className="text-muted-foreground"> · {row.start_time.slice(0, 5)}{row.end_time ? `–${row.end_time.slice(0, 5)}` : ""}</span>
          {row.location && <span className="text-muted-foreground"> · {row.location}</span>}
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" onClick={() => setEditing(true)}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" className="text-destructive" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-3 bg-background/60 space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Select value={String(day)} onValueChange={(v) => setDay(Number(v))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {DAYS.map((d) => (
              <SelectItem key={d.v} value={String(d.v)}>{d.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
        <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
        <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" />
      </div>
      <div className="flex justify-end gap-1">
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="gap-1">
          <X className="w-4 h-4" /> Cancel
        </Button>
        <Button size="sm" onClick={save} className="gap-1">
          <Check className="w-4 h-4" /> Save
        </Button>
      </div>
    </div>
  );
}
