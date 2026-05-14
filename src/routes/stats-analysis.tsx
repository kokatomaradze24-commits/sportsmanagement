import { useState, useRef } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, Upload, Sparkles, Trash2, Loader2, FileText, Image as ImageIcon, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useAppSettings } from "@/hooks/use-app-settings";
import { useSport } from "@/hooks/use-sport";
import { useI18n } from "@/hooks/use-i18n";
import { useAICredits } from "@/hooks/use-ai-credits";

export const Route = createFileRoute("/stats-analysis")({
  head: () => ({
    meta: [
      { title: "Stats Analysis — My Club" },
      { name: "description", content: "Upload match statistics and let AI generate a deep analysis and training recommendations for your team." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StatsAnalysisPage,
});

interface UploadedFile {
  id: string;
  name: string;
  type: "image" | "pdf";
  size: number;
  dataUrl?: string; // for images
  extractedText?: string; // for PDFs
  pageCount?: number;
}

interface AnalysisResult {
  team_identified: boolean;
  identified_team_name?: string;
  summary: string;
  key_metrics?: { label: string; value: string; note?: string }[];
  strengths?: string[];
  weaknesses?: string[];
  top_players?: { name: string; highlight: string }[];
  recommendations: { area: string; priority: "high" | "medium" | "low"; action: string }[];
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function extractPdfText(file: File): Promise<{ text: string; pageCount: number }> {
  const pdfjs: any = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  const pageCount = doc.numPages;
  let text = "";
  for (let i = 1; i <= pageCount; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((it: any) => ("str" in it ? it.str : "")).join(" ");
    text += `\n--- Page ${i} ---\n${pageText}\n`;
    if (text.length > 80_000) break;
  }
  return { text, pageCount };
}

function StatsAnalysisPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { schoolName } = useAppSettings();
  const { sportId } = useSport();
  const { language } = useI18n();
  const { credits, refresh: refreshCredits } = useAICredits();

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [context, setContext] = useState("");
  const [busy, setBusy] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAuthenticated) {
    navigate({ to: "/login" });
    return null;
  }

  const handleFiles = async (selected: FileList | null) => {
    if (!selected || selected.length === 0) return;
    setParsing(true);
    const next: UploadedFile[] = [];
    for (const file of Array.from(selected)) {
      const id = `${file.name}-${file.size}-${Date.now()}-${Math.random()}`;
      try {
        if (file.type.startsWith("image/")) {
          if (file.size > 5 * 1024 * 1024) {
            toast.error(`${file.name}: ფაილი ძალიან დიდია (მაქს 5MB)`);
            continue;
          }
          const dataUrl = await readFileAsDataUrl(file);
          next.push({ id, name: file.name, type: "image", size: file.size, dataUrl });
        } else if (file.type === "application/pdf") {
          if (file.size > 15 * 1024 * 1024) {
            toast.error(`${file.name}: PDF ძალიან დიდია (მაქს 15MB)`);
            continue;
          }
          const { text, pageCount } = await extractPdfText(file);
          next.push({ id, name: file.name, type: "pdf", size: file.size, extractedText: text, pageCount });
        } else {
          toast.error(`${file.name}: მხოლოდ სურათი ან PDF`);
        }
      } catch (err) {
        console.error(err);
        toast.error(`${file.name}: ვერ ვამუშავებ ფაილს`);
      }
    }
    setFiles((prev) => [...prev, ...next].slice(0, 8));
    setParsing(false);
  };

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const runAnalysis = async () => {
    if (files.length === 0) {
      toast.error("ატვირთე მინიმუმ ერთი ფაილი");
      return;
    }
    if (!schoolName) {
      toast.error("კლუბის სახელი არ არის მითითებული");
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        toast.error("გაიარე ავტორიზაცია");
        return;
      }
      const text = files
        .filter((f) => f.type === "pdf" && f.extractedText)
        .map((f) => `[${f.name}]\n${f.extractedText}`)
        .join("\n\n");
      const images = files.filter((f) => f.type === "image" && f.dataUrl).map((f) => f.dataUrl!);

      const res = await fetch("/api/ai/analyze-stats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          clubName: schoolName,
          sport: sportId,
          language,
          context,
          text,
          images,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "ანალიზი ვერ მოხერხდა");
        return;
      }
      const data = (await res.json()) as AnalysisResult;
      setResult(data);
      refreshCredits();
      if (!data.team_identified) {
        toast.warning("გუნდი ვერ მოიძებნა სტატისტიკაში");
      } else {
        toast.success("ანალიზი მზადაა");
      }
    } catch (err) {
      console.error(err);
      toast.error("ქსელის შეცდომა");
    } finally {
      setBusy(false);
    }
  };

  const priorityColor = (p: string) =>
    p === "high"
      ? "bg-destructive/15 text-destructive border-destructive/30"
      : p === "medium"
      ? "bg-warning/15 text-warning border-warning/30"
      : "bg-muted text-muted-foreground border-border";

  return (
    <div className="min-h-screen bg-background theme-ambient-bg">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              უკან
            </Link>
          </Button>
          <Badge variant="outline" className="text-xs">
            AI კრედიტი: {credits ?? "—"} · ღირებულება: 5
          </Badge>
        </div>

        <motion.div
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="theme-panel rounded-2xl border border-border p-6 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-display tracking-wider">სტატისტიკის ანალიზი</h1>
              <p className="text-sm text-muted-foreground mt-1">
                ატვირთე მატჩის/ტურნირის სტატისტიკა (სურათი ან PDF). AI იპოვის{" "}
                <span className="font-semibold text-foreground">{schoolName || "შენს კლუბს"}</span>{" "}
                სტატისტიკაში და მოამზადებს დეტალურ ანალიზს და რჩევებს რაზე გაქვს სამუშაო.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">დამატებითი კონტექსტი (არასავალდებულო)</label>
              <Textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="მაგ: U16 ლიგის ფინალი, მოწინააღმდეგე გუნდი X, წინა მატჩი წავაგეთ..."
                rows={2}
                maxLength={2000}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">ფაილები ({files.length}/8)</label>
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">დააჭირე ან ჩააგდე სურათი / PDF</p>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP ან PDF · მაქს 8 ფაილი</p>
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    handleFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </div>

              {parsing && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" /> ფაილის დამუშავება...
                </p>
              )}

              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((f) => (
                    <div key={f.id} className="flex items-center gap-3 p-2 rounded-lg border border-border bg-muted/30">
                      {f.type === "image" ? (
                        <img src={f.dataUrl} alt={f.name} className="w-10 h-10 rounded object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{f.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {f.type === "pdf"
                            ? `PDF · ${f.pageCount} გვ. · ${f.extractedText?.length ?? 0} სიმბოლო`
                            : `სურათი · ${(f.size / 1024).toFixed(0)} KB`}
                        </p>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => removeFile(f.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              onClick={runAnalysis}
              disabled={busy || parsing || files.length === 0}
              size="lg"
              className="w-full"
            >
              {busy ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> ანალიზი მიმდინარეობს...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" /> გენერირება (5 კრედიტი)
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {result && (
          <motion.div
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="space-y-4"
          >
            <div className="theme-panel rounded-2xl border border-border p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                {result.team_identified ? (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-warning" />
                )}
                <h2 className="text-xl font-display tracking-wider">
                  {result.team_identified
                    ? `გუნდი: ${result.identified_team_name || schoolName}`
                    : "გუნდი ვერ ცალსახად მოიძებნა"}
                </h2>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{result.summary}</p>
            </div>

            {result.key_metrics && result.key_metrics.length > 0 && (
              <div className="theme-panel rounded-2xl border border-border p-6 shadow-sm">
                <h3 className="text-lg font-display tracking-wider mb-3">📊 ძირითადი მაჩვენებლები</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {result.key_metrics.map((m, i) => (
                    <div key={i} className="rounded-lg border border-border p-3 bg-muted/30">
                      <p className="text-xs text-muted-foreground">{m.label}</p>
                      <p className="text-xl font-bold mt-1">{m.value}</p>
                      {m.note && <p className="text-xs text-muted-foreground mt-1">{m.note}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              {result.strengths && result.strengths.length > 0 && (
                <div className="theme-panel rounded-2xl border border-success/30 bg-success/5 p-5">
                  <h3 className="text-base font-display tracking-wider mb-2 text-success">✅ ძლიერი მხარეები</h3>
                  <ul className="space-y-2 text-sm">
                    {result.strengths.map((s, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-success">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.weaknesses && result.weaknesses.length > 0 && (
                <div className="theme-panel rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
                  <h3 className="text-base font-display tracking-wider mb-2 text-destructive">⚠️ სუსტი მხარეები</h3>
                  <ul className="space-y-2 text-sm">
                    {result.weaknesses.map((w, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-destructive">•</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {result.top_players && result.top_players.length > 0 && (
              <div className="theme-panel rounded-2xl border border-border p-6 shadow-sm">
                <h3 className="text-lg font-display tracking-wider mb-3">⭐ ლიდერი მოთამაშეები</h3>
                <div className="space-y-2">
                  {result.top_players.map((p, i) => (
                    <div key={i} className="flex gap-3 items-start p-2 rounded-lg hover:bg-muted/30">
                      <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.highlight}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="theme-panel rounded-2xl border border-primary/40 bg-primary/5 p-6 shadow-sm">
              <h3 className="text-lg font-display tracking-wider mb-3 text-primary">🎯 რჩევები — რაზე გვაქვს სამუშაო</h3>
              <div className="space-y-3">
                {result.recommendations.map((r, i) => (
                  <div key={i} className="rounded-lg border border-border bg-background p-3">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${priorityColor(r.priority)}`}>
                        {r.priority === "high" ? "მაღალი" : r.priority === "medium" ? "საშუალო" : "დაბალი"}
                      </span>
                      <p className="font-semibold text-sm">{r.area}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{r.action}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
