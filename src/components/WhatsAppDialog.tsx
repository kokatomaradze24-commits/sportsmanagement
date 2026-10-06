import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useI18n } from "@/hooks/use-i18n";
import { useAppSettings } from "@/hooks/use-app-settings";
import type { Database } from "@/integrations/supabase/types";

type Player = Database["public"]["Tables"]["players"]["Row"];
export type WaKind = "reminder" | "overdue" | "paid";

export interface WaContext {
  kind: WaKind;
  reminder: { month: number; amount: number } | null;
  overdueAmount: number;
  paid: { month: number; amount: number } | null;
}

const KA_GENITIVE = ["იანვრის", "თებერვლის", "მარტის", "აპრილის", "მაისის", "ივნისის", "ივლისის", "აგვისტოს", "სექტემბრის", "ოქტომბრის", "ნოემბრის", "დეკემბრის"];

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.43 9.43 0 0 1-1.45-5.03c0-5.2 4.24-9.44 9.45-9.44 2.52 0 4.89.99 6.67 2.77a9.37 9.37 0 0 1 2.76 6.68c0 5.2-4.24 9.44-9.44 9.44zm8.04-17.48A11.3 11.3 0 0 0 12.05.7C5.78.7.68 5.8.68 12.07c0 2 .52 3.96 1.52 5.68L.58 23.7l6.1-1.6a11.36 11.36 0 0 0 5.37 1.37h.01c6.26 0 11.37-5.1 11.37-11.37 0-3.04-1.18-5.89-3.33-8.04z" />
    </svg>
  );
}

function recipientDigits(player: Player): string | null {
  const preferParent = player.primary_contact === "parent";
  const raw = (preferParent ? player.parent_phone || player.phone : player.phone || player.parent_phone) || "";
  let d = raw.replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 9 && d.startsWith("5")) d = "995" + d;
  return d;
}

const plain = (n: number) => String(Math.round(n * 100) / 100);

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player: Player;
  context: WaContext;
}

export function WhatsAppDialog({ open, onOpenChange, player, context }: Props) {
  const { t, language, monthLong } = useI18n();
  const { schoolName, waTemplates, updateWaTemplate } = useAppSettings();
  const [kind, setKind] = useState<WaKind>(context.kind);
  const [text, setText] = useState("");
  const [drafts, setDrafts] = useState<Record<WaKind, string>>({ reminder: "", overdue: "", paid: "" });
  const [saving, setSaving] = useState(false);

  const defaults: Record<WaKind, string> = {
    reminder: t("waDefaultReminder"),
    overdue: t("waDefaultOverdue"),
    paid: t("waDefaultPaid"),
  };
  const templateFor = (k: WaKind) => waTemplates[`wa_template_${k}`] || defaults[k];
  const monthName = (m: number) => (language === "ka" ? KA_GENITIVE[m - 1] : monthLong(m));

  const render = (k: WaKind) => {
    const src = k === "paid" ? context.paid : k === "reminder" ? context.reminder : context.reminder;
    const amount = k === "overdue" ? context.overdueAmount : src?.amount ?? 0;
    const vars: Record<string, string> = {
      club: schoolName,
      player: `${player.first_name} ${player.last_name}`,
      month: src ? monthName(src.month) : "",
      amount: plain(amount),
    };
    return templateFor(k).replace(/\{(\w+)\}/g, (m, key) => (vars[key] !== undefined ? vars[key] : m));
  };

  useEffect(() => {
    if (!open) return;
    setKind(context.kind);
    setText(render(context.kind));
    setDrafts({ reminder: templateFor("reminder"), overdue: templateFor("overdue"), paid: templateFor("paid") });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, context]);

  const choose = (k: WaKind) => {
    setKind(k);
    setText(render(k));
  };

  const phone = recipientDigits(player);
  const encoded = encodeURIComponent(text);
  const appHref = phone ? `whatsapp://send?phone=${phone}&text=${encoded}` : undefined;
  const webHref = phone ? `https://wa.me/${phone}?text=${encoded}` : undefined;

  const saveTemplates = async () => {
    setSaving(true);
    try {
      for (const k of ["reminder", "overdue", "paid"] as WaKind[]) {
        await updateWaTemplate(`wa_template_${k}`, drafts[k]);
      }
    } finally {
      setSaving(false);
    }
  };

  // Re-render the message once saved templates change
  useEffect(() => {
    if (open) setText(render(kind));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waTemplates]);

  const tabs: { k: WaKind; label: string }[] = [
    { k: "reminder", label: t("waTplReminder") },
    { k: "overdue", label: t("waTplOverdue") },
    { k: "paid", label: t("waTplPaid") },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <WhatsAppIcon className="w-5 h-5 text-success" />
            {t("waMessage")} · {player.first_name} {player.last_name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
          {tabs.map(({ k, label }) => (
            <button
              key={k}
              type="button"
              onClick={() => choose(k)}
              className={`rounded-md px-2 py-1.5 text-xs font-semibold transition-colors ${kind === k ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} />

        {phone ? (
          <p className="text-xs text-muted-foreground">+{phone}</p>
        ) : (
          <p className="text-sm font-semibold text-destructive">{t("waNoPhone")}</p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button asChild={!!appHref} disabled={!appHref} className="bg-success text-success-foreground hover:bg-success/90">
            {appHref ? (
              <a href={appHref}><WhatsAppIcon className="w-4 h-4" /> {t("waOpen")}</a>
            ) : (
              <span><WhatsAppIcon className="w-4 h-4" /> {t("waOpen")}</span>
            )}
          </Button>
          <Button asChild={!!webHref} disabled={!webHref} variant="outline">
            {webHref ? (
              <a href={webHref} target="_blank" rel="noopener noreferrer">{t("waWeb")}</a>
            ) : (
              <span>{t("waWeb")}</span>
            )}
          </Button>
        </div>

        <Collapsible>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-sm font-semibold">
            {t("waEditTemplates")}
            <ChevronDown className="w-4 h-4" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-3">
            <p className="text-xs text-muted-foreground">{t("waPlaceholdersHint")}</p>
            {tabs.map(({ k, label }) => (
              <div key={k}>
                <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
                <Textarea rows={3} value={drafts[k]} onChange={(e) => setDrafts((d) => ({ ...d, [k]: e.target.value }))} />
              </div>
            ))}
            <Button type="button" size="sm" onClick={saveTemplates} disabled={saving}>
              {t("waSaveTemplates")}
            </Button>
          </CollapsibleContent>
        </Collapsible>
      </DialogContent>
    </Dialog>
  );
}
