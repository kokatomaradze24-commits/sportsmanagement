import { useCallback, useEffect, useState } from "react";
import { Landmark, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/hooks/use-i18n";
import { getPlan } from "@/lib/subscription-plan";

interface TransferRequest {
  id: string;
  user_id: string;
  email: string | null;
  plan_id: string;
  amount: number;
  currency: string;
  days: number;
  created_at: string;
}

export function BankTransferRequestsPanel({ onChanged }: { onChanged?: () => void }) {
  const { t } = useI18n();
  const [rows, setRows] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("subscription_transfer_requests")
      .select("id, user_id, email, plan_id, amount, currency, days, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    setRows(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const review = async (row: TransferRequest, approve: boolean) => {
    setBusyId(row.id);
    if (approve) {
      const { error } = await supabase.rpc("admin_extend_subscription", {
        _user_id: row.user_id,
        _days: row.days,
      });
      if (error) {
        setBusyId(null);
        toast.error(error.message);
        return;
      }
    }
    const { error } = await (supabase as any)
      .from("subscription_transfer_requests")
      .update({ status: approve ? "approved" : "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", row.id);
    setBusyId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(approve ? t("adminTransferApproved") : t("adminTransferRejected"));
    await load();
    onChanged?.();
  };

  return (
    <div className="theme-panel rounded-2xl border border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <Landmark className="h-5 w-5 text-primary" />
        <h2 className="font-semibold">{t("adminTransfersTitle")}</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">{t("adminTransfersEmpty")}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-3 flex-wrap"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{r.email ?? r.user_id}</p>
                <p className="text-xs text-muted-foreground">
                  {getPlan(r.plan_id).label} · ${r.amount} {r.currency} ·{" "}
                  {new Date(r.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" disabled={busyId === r.id} onClick={() => review(r, true)}>
                  <Check className="h-4 w-4 mr-1" /> {t("adminApprove")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === r.id}
                  onClick={() => review(r, false)}
                >
                  <X className="h-4 w-4 mr-1" /> {t("adminReject")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
