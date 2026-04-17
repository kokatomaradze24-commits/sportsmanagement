import { useEffect, useState, useCallback } from "react";
import { Bell, Loader2, CheckCircle2, XCircle, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/hooks/use-i18n";
import { useAuth } from "@/hooks/use-auth";

interface SmsLog {
  id: string;
  created_at: string;
  phone: string;
  message: string;
  kind: string;
  provider: string;
  status: string;
  error: string | null;
}

export function SmsLogDialog() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("sms_logs")
      .select("id, created_at, phone, message, kind, provider, status, error")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    setLogs((data ?? []) as SmsLog[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (open) fetchLogs();
  }, [open, fetchLogs]);

  const kindLabel = (kind: string): string => {
    if (kind === "registration") return t("notifKindRegistration");
    if (kind === "schedule") return t("notifKindSchedule");
    if (kind === "payment_paid") return t("notifKindPaymentPaid");
    if (kind === "reminder") return t("notifKindReminder");
    if (kind === "overdue") return t("notifKindOverdue");
    return kind;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full w-10 h-10" title={t("notifLogTitle")}>
          <Bell className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl tracking-wider">{t("notifLogTitle")}</DialogTitle>
          <DialogDescription>{t("notifLogDesc")}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Inbox className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>{t("notifLogEmpty")}</p>
          </div>
        ) : (
          <div className="space-y-2 py-2">
            {logs.map((log) => {
              const ok = log.status === "sent";
              return (
                <div
                  key={log.id}
                  className={`rounded-xl border p-3 ${
                    ok ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      {ok ? (
                        <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive shrink-0" />
                      )}
                      <span className="text-xs font-semibold text-foreground truncate">
                        {kindLabel(log.kind)}
                      </span>
                      <span className="text-xs text-muted-foreground">· {log.provider}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{log.phone}</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap break-words">{log.message}</p>
                  {log.error && (
                    <p className="text-xs text-destructive mt-1.5">⚠ {log.error}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
