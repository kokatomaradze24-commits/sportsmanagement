import { useEffect, useState } from "react";
import { MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useSmsSettings } from "@/hooks/use-sms-settings";
import { useI18n } from "@/hooks/use-i18n";

export function SmsSettingsDialog() {
  const { t } = useI18n();
  const { settings, loading, save } = useSmsSettings();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [enabled, setEnabled] = useState(false);
  const [provider, setProvider] = useState<"magti" | "twilio">("magti");
  const [magtiKey, setMagtiKey] = useState("");
  const [magtiSender, setMagtiSender] = useState("");
  const [twilioSid, setTwilioSid] = useState("");
  const [twilioToken, setTwilioToken] = useState("");
  const [twilioFrom, setTwilioFrom] = useState("");
  const [reminderDays, setReminderDays] = useState("3");
  const [sendReminder, setSendReminder] = useState(true);
  const [sendOverdue, setSendOverdue] = useState(true);

  useEffect(() => {
    if (!open) return;
    setEnabled(settings?.enabled ?? false);
    setProvider((settings?.provider as "magti" | "twilio") ?? "magti");
    setMagtiKey(settings?.magti_api_key ?? "");
    setMagtiSender(settings?.magti_sender ?? "");
    setTwilioSid(settings?.twilio_account_sid ?? "");
    setTwilioToken(settings?.twilio_auth_token ?? "");
    setTwilioFrom(settings?.twilio_from ?? "");
    setReminderDays(String(settings?.reminder_days_before ?? 3));
    setSendReminder(settings?.send_reminder ?? true);
    setSendOverdue(settings?.send_overdue ?? true);
  }, [open, settings]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await save({
      enabled,
      provider,
      magti_api_key: magtiKey.trim() || null,
      magti_sender: magtiSender.trim() || null,
      twilio_account_sid: twilioSid.trim() || null,
      twilio_auth_token: twilioToken.trim() || null,
      twilio_from: twilioFrom.trim() || null,
      reminder_days_before: Math.max(0, Math.min(14, parseInt(reminderDays) || 3)),
      send_reminder: sendReminder,
      send_overdue: sendOverdue,
    });
    setSaving(false);
    if (error) {
      toast.error(t("smsSettingsSaveFailed"));
    } else {
      toast.success(t("smsSettingsSaved"));
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full w-10 h-10"
          title={t("smsSettings")}
        >
          <MessageSquare className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl tracking-wider">{t("smsSettings")}</DialogTitle>
          <DialogDescription>{t("smsSettingsDesc")}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-4">
              <div>
                <p className="font-semibold text-foreground">{t("smsEnabled")}</p>
                <p className="text-xs text-muted-foreground">{t("smsEnabledDesc")}</p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>

            <div>
              <Label className="mb-1.5 block">{t("smsProvider")}</Label>
              <Select value={provider} onValueChange={(v) => setProvider(v as "magti" | "twilio")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="magti">🇬🇪 Magti (SMSOffice.ge)</SelectItem>
                  <SelectItem value="twilio">🌍 Twilio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {provider === "magti" ? (
              <div className="space-y-3 rounded-xl border border-border p-4 bg-card">
                <div>
                  <Label className="mb-1.5 block">{t("magtiApiKey")} *</Label>
                  <Input
                    type="password"
                    value={magtiKey}
                    onChange={(e) => setMagtiKey(e.target.value)}
                    placeholder="api_xxxxxxxxxxxx"
                    autoComplete="off"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{t("magtiApiKeyHelp")}</p>
                </div>
                <div>
                  <Label className="mb-1.5 block">{t("magtiSender")}</Label>
                  <Input
                    value={magtiSender}
                    onChange={(e) => setMagtiSender(e.target.value)}
                    placeholder="MyClub"
                    maxLength={11}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{t("magtiSenderHelp")}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 rounded-xl border border-border p-4 bg-card">
                <div>
                  <Label className="mb-1.5 block">Account SID *</Label>
                  <Input
                    type="password"
                    value={twilioSid}
                    onChange={(e) => setTwilioSid(e.target.value)}
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block">Auth Token *</Label>
                  <Input
                    type="password"
                    value={twilioToken}
                    onChange={(e) => setTwilioToken(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block">{t("twilioFrom")} *</Label>
                  <Input
                    value={twilioFrom}
                    onChange={(e) => setTwilioFrom(e.target.value)}
                    placeholder="+15551234567"
                  />
                </div>
              </div>
            )}

            <div className="space-y-3 rounded-xl border border-border p-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{t("smsReminder")}</p>
                  <p className="text-xs text-muted-foreground">{t("smsReminderDesc")}</p>
                </div>
                <Switch checked={sendReminder} onCheckedChange={setSendReminder} />
              </div>

              {sendReminder && (
                <div>
                  <Label className="mb-1.5 block">{t("smsReminderDays")}</Label>
                  <Input
                    type="number"
                    min={0}
                    max={14}
                    value={reminderDays}
                    onChange={(e) => setReminderDays(e.target.value)}
                    className="w-32"
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div>
                  <p className="font-semibold text-foreground">{t("smsOverdue")}</p>
                  <p className="text-xs text-muted-foreground">{t("smsOverdueDesc")}</p>
                </div>
                <Switch checked={sendOverdue} onCheckedChange={setSendOverdue} />
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
