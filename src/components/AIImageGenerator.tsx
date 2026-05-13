import { useState, useRef } from "react";
import { Sparkles, Loader2, Upload, Download, RefreshCw, Image as ImageIcon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/hooks/use-i18n";
import { AICreditsPurchaseDialog } from "@/components/AICreditsPurchaseDialog";

interface AIImageGeneratorProps {
  trigger?: React.ReactNode;
  title?: string;
  defaultPrompt?: string;
  presetPrompts?: { label: string; prompt: string }[];
  /** When provided, a "Use this image" button appears that returns the generated File. */
  onUseImage?: (file: File) => void;
  useImageLabel?: string;
}

async function urlToFile(url: string, filename: string): Promise<File> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || "image/png" });
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function AIImageGenerator({
  trigger,
  title,
  defaultPrompt = "",
  presetPrompts,
  onUseImage,
  useImageLabel,
}: AIImageGeneratorProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [referenceImage, setReferenceImage] = useState<string>("");
  const [generatedImage, setGeneratedImage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const refInputRef = useRef<HTMLInputElement>(null);

  const dialogTitle = title ?? t("aiGenTitle");

  const handleReferenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      toast.error(t("aiGenImageTooLarge"));
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setReferenceImage(dataUrl);
    } catch {
      toast.error(t("aiGenError"));
    }
    e.target.value = "";
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error(t("aiGenPromptRequired"));
      return;
    }
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        toast.error(t("aiGenError"));
        setLoading(false);
        return;
      }

      const res = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          referenceImage: referenceImage || undefined,
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
      setGeneratedImage(data.imageUrl);
      toast.success(t("aiGenSuccess"));
    } catch {
      toast.error(t("aiGenError"));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;
    const a = document.createElement("a");
    a.href = generatedImage;
    a.download = `ai-image-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleUseGenerated = async () => {
    if (!generatedImage || !onUseImage) return;
    try {
      const file = await urlToFile(generatedImage, `ai-${Date.now()}.png`);
      onUseImage(file);
      setOpen(false);
      // reset for next time
      setGeneratedImage("");
      setReferenceImage("");
    } catch {
      toast.error(t("aiGenError"));
    }
  };

  const handleEditGenerated = () => {
    if (!generatedImage) return;
    setReferenceImage(generatedImage);
    setGeneratedImage("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-2">
            <Sparkles className="h-4 w-4" />
            {t("aiGenButton")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {dialogTitle}
          </DialogTitle>
          <DialogDescription>{t("aiGenDescription")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {presetPrompts && presetPrompts.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {presetPrompts.map((p) => (
                <Button
                  key={p.label}
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => setPrompt(p.prompt)}
                  className="text-xs"
                >
                  {p.label}
                </Button>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("aiGenPromptLabel")}</label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t("aiGenPromptPlaceholder")}
              rows={4}
              maxLength={2000}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("aiGenReferenceLabel")}</label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => refInputRef.current?.click()}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                {referenceImage ? t("aiGenChangeReference") : t("aiGenAddReference")}
              </Button>
              {referenceImage && (
                <>
                  <img
                    src={referenceImage}
                    alt="Reference"
                    className="h-12 w-12 rounded-md object-cover border"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setReferenceImage("")}
                  >
                    {t("aiGenRemoveReference")}
                  </Button>
                </>
              )}
              <input
                ref={refInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleReferenceUpload}
              />
            </div>
            <p className="text-xs text-muted-foreground">{t("aiGenReferenceHint")}</p>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full gap-2"
            size="lg"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? t("aiGenGenerating") : t("aiGenGenerate")}
          </Button>

          {generatedImage && (
            <div className="space-y-3 rounded-lg border bg-secondary/30 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ImageIcon className="h-4 w-4" />
                {t("aiGenResult")}
              </div>
              <img
                src={generatedImage}
                alt="Generated"
                className="w-full rounded-md border bg-background"
              />
              <div className="flex flex-wrap gap-2">
                {onUseImage && (
                  <Button onClick={handleUseGenerated} className="gap-2">
                    <Check className="h-4 w-4" />
                    {useImageLabel ?? t("aiGenUseImage")}
                  </Button>
                )}
                <Button variant="outline" onClick={handleDownload} className="gap-2">
                  <Download className="h-4 w-4" />
                  {t("aiGenDownload")}
                </Button>
                <Button variant="outline" onClick={handleEditGenerated} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  {t("aiGenEdit")}
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {t("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
