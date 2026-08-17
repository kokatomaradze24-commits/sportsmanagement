import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Landmark, Check, Copy, Loader2, Sparkles, Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { BANK_ACCOUNTS } from "@/lib/bank-accounts";
import { SUBSCRIPTION_PLANS, getPlan } from "@/lib/subscription-plan";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SubscriptionPaymentDialog({ open, onOpenChange, onSuccess }: Props) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [selectedPlanId, setSelectedPlanId] = useState<string>("pro_yearly");
  const [copied, setCopied] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hasPending, setHasPending] = useState(false);
  const selectedPlan = getPlan(selectedPlanId);

  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;
    (async () => {
      const { data } = await (supabase as any)
        .from("subscription_transfer_requests")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .limit(1);
      if (!cancelled) setHasPending((data ?? []).length > 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, user]);

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(value);
    toast.success(t("accountCopied"));
    setTimeout(() => setCopied(null), 2000);
  };

  const submitTransfer = async () => {
    if (!user) return;
    setSubmitting(true);
    const { error } = await (supabase as any).from("subscription_transfer_requests").insert({
      user_id: user.id,
      email: user.email ?? null,
      plan_id: selectedPlan.id,
      amount: selectedPlan.amount,
      currency: selectedPlan.currency,
      days: selectedPlan.days,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setHasPending(true);
    toast.success(t("bankSubmitted"));
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" />
            {t("bankTitle")}
          </DialogTitle>
          <DialogDescription>{t("bankDesc")}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2 my-2">
          {SUBSCRIPTION_PLANS.map((p) => {
            const active = p.id === selectedPlanId;
            const isYear = p.days >= 365;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPlanId(p.id)}
                className={`relative text-left rounded-2xl border-2 p-4 transition ${
                  active ? "border-primary bg-primary/10" : "border-border bg-muted/30 hover:border-primary/40"
                }`}
              >
                {isYear && (
                  <span className="absolute -top-2 right-3 text-[10px] font-bold bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                    {t("payDlgBestValue")}
                  </span>
                )}
                <div className="text-sm font-semibold">{p.label}</div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-sm text-muted-foreground line-through decoration-destructive/70">
                    ${p.originalAmount}
                  </span>
                  <span className="text-2xl font-bold">${p.amount}</span>
                </div>
                <div className="mt-1 text-[10px] font-bold text-destructive">-{p.discountPct}%</div>
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border bg-gradient-to-br from-primary/10 to-primary/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t("bankAmount")}</span>
            <span className="text-2xl font-bold">${selectedPlan.amount}</span>
          </div>
          <div className="mt-3 text-xs text-muted-foreground space-y-1">
            <p>{t("bankStep1")}</p>
            <p>{t("bankStep2")}</p>
            <p>{t("bankStep3")}</p>
          </div>
        </div>

        <div className="space-y-2 mt-2">
          {BANK_ACCOUNTS.map((acc) => (
            <div key={acc.iban} className="border border-border rounded-xl p-3 bg-muted/30">
              <div className="text-xs text-muted-foreground font-medium mb-1">{acc.bank}</div>
              <div className="flex items-center justify-between gap-2">
                <code className="text-sm font-mono font-semibold tracking-wide break-all">{acc.iban}</code>
                <Button size="icon" variant="ghost" className="shrink-0" onClick={() => copy(acc.iban)}>
                  {copied === acc.iban ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {user?.email && (
          <div className="rounded-xl border border-border p-3 bg-muted/20">
            <div className="text-xs text-muted-foreground mb-1">{t("bankReference")}</div>
            <div className="flex items-center justify-between gap-2">
              <code className="text-sm font-mono break-all">{user.email}</code>
              <Button size="icon" variant="ghost" className="shrink-0" onClick={() => copy(user.email!)}>
                {copied === user.email ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}

        {hasPending ? (
          <div className="flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 p-3 text-xs text-muted-foreground mt-1">
            <Clock className="h-4 w-4 text-primary shrink-0" />
            {t("bankPendingNote")}
          </div>
        ) : (
          <Button
            size="lg"
            className="w-full mt-1 h-12 text-base font-semibold"
            onClick={submitTransfer}
            disabled={submitting}
          >
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            {t("bankSent")}
          </Button>
        )}

        <Button variant="ghost" onClick={() => onOpenChange(false)} className="mt-1">
          {t("payDlgLater")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
