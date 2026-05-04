import { useState } from "react";
import { Sparkles, Loader2, Calendar, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/hooks/use-i18n";

interface Session {
  title: string;
  practice_date: string;
  start_time: string;
  end_time: string;
  notes: string;
}

interface Props {
  sportId: string;
  onAdded?: () => void;
  trigger?: React.ReactNode;
}

export function AITrainingPlanDialog({ sportId, onAdded, trigger }: Props) {
  const { t, language } = useI18n();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [summary, setSummary] = useState("");

  // Form state
  const [mode, setMode] = useState<"self" | "expert">("expert");
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [ageGroup, setAgeGroup] = useState("U14");
  const [level, setLevel] = useState("intermediate");
  const [sessionsPerWeek, setSessionsPerWeek] = useState(3);
  const [sessionMinutes, setSessionMinutes] = useState(90);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [focus, setFocus] = useState("");

  const reset = () => {
    setSessions([]);
    setSummary("");
  };

  const handleGenerate = async () => {
    setLoading(true);
    reset();
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        toast.error(t("aiGenError"));
        return;
      }
      const res = await fetch("/api/ai/generate-training-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sport: sportId,
          ageGroup,
          level,
          period,
          sessionsPerWeek,
          sessionMinutes,
          startDate,
          focus,
          language,
          mode,
        }),
      });

      if (res.status === 429) {
        toast.error(t("aiGenRateLimit"));
        return;
      }
      if (res.status === 402) {
        toast.error(t("aiGenNoCredits"));
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error ?? t("aiGenError"));
        return;
      }
      const data = await res.json();
      setSummary(data.summary ?? "");
      setSessions((data.sessions ?? []) as Session[]);
      toast.success(t("aiPlanReady"));
    } catch {
      toast.error(t("aiGenError"));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    if (sessions.length === 0) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error(t("aiGenError"));
        return;
      }
      const rows = sessions.map((s) => ({
        user_id: user.id,
        sport: sportId,
        title: s.title,
        practice_date: s.practice_date,
        start_time: s.start_time || null,
        end_time: s.end_time || null,
        notes: s.notes || null,
      }));
      const { error } = await supabase.from("practices").insert(rows);
      if (error) throw error;
      toast.success(t("aiPlanSaved", { count: rows.length }));
      onAdded?.();
      setOpen(false);
      reset();
    } catch (err: any) {
      toast.error(err?.message ?? t("aiGenError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline" className="gap-2">
            <Sparkles className="h-4 w-4" /> {t("aiPlanButton")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t("aiPlanTitle")}
          </DialogTitle>
          <DialogDescription>{t("aiPlanDescription")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>{t("aiPlanMode")}</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="self">{t("aiPlanModeSelf")}</SelectItem>
                  <SelectItem value="expert">{t("aiPlanModeExpert")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("aiPlanPeriod")}</Label>
              <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">{t("aiPlanWeek")}</SelectItem>
                  <SelectItem value="month">{t("aiPlanMonth")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("aiPlanAgeGroup")}</Label>
              <Input value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} placeholder="U10, U14, Adults..." />
            </div>
            <div>
              <Label>{t("aiPlanLevel")}</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">{t("aiPlanLevelBeginner")}</SelectItem>
                  <SelectItem value="intermediate">{t("aiPlanLevelIntermediate")}</SelectItem>
                  <SelectItem value="advanced">{t("aiPlanLevelAdvanced")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("aiPlanSessionsPerWeek")}</Label>
              <Input type="number" min={1} max={7} value={sessionsPerWeek}
                onChange={(e) => setSessionsPerWeek(Number(e.target.value))} />
            </div>
            <div>
              <Label>{t("aiPlanSessionMinutes")}</Label>
              <Input type="number" min={30} max={180} step={15} value={sessionMinutes}
                onChange={(e) => setSessionMinutes(Number(e.target.value))} />
            </div>
            <div>
              <Label>{t("aiPlanStartDate")}</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label>{t("aiPlanFocus")}</Label>
              <Input value={focus} onChange={(e) => setFocus(e.target.value)} placeholder={t("aiPlanFocusPlaceholder")} />
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={loading} className="w-full gap-2" size="lg">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? t("aiGenGenerating") : t("aiPlanGenerate")}
          </Button>

          {sessions.length > 0 && (
            <div className="space-y-3 rounded-lg border bg-secondary/30 p-4">
              {summary && <p className="text-sm text-muted-foreground italic">{summary}</p>}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4" />
                  {t("aiPlanSessionsCount", { count: sessions.length })}
                </div>
                <Button size="sm" onClick={handleSaveAll} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {t("aiPlanAddAll")}
                </Button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {sessions.map((s, i) => (
                  <div key={i} className="rounded-lg border bg-background/60 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold">{s.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {s.practice_date} · {s.start_time}–{s.end_time}
                        </div>
                      </div>
                      <Button size="icon" variant="ghost" className="text-destructive"
                        onClick={() => setSessions((prev) => prev.filter((_, idx) => idx !== i))}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <Textarea
                      value={s.notes}
                      onChange={(e) => {
                        const v = e.target.value;
                        setSessions((prev) => prev.map((p, idx) => idx === i ? { ...p, notes: v } : p));
                      }}
                      rows={4}
                      className="mt-2 text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>{t("close")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
