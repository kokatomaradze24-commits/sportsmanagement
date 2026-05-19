import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, Check, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { loadPaypalSdk } from "@/lib/paypal-sdk";
import { SUBSCRIPTION_PLAN, SUBSCRIPTION_PLANS, getPlan } from "@/lib/subscription-plan";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SubscriptionPaymentDialog({ open, onOpenChange, onSuccess }: Props) {
  const { session } = useAuth();
  const { t } = useI18n();
  const [clientId, setClientId] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("pro_yearly");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonsRef = useRef<Array<{ close?: () => void }>>([]);
  const renderIdRef = useRef(0);
  const selectedPlan = getPlan(selectedPlanId);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setSdkReady(false);
    setErrorMsg(null);
    (async () => {
      try {
        const cfg = await fetch("/api/paypal/config").then((r) => r.json());
        if (!cfg.clientId) throw new Error("PayPal not configured");
        if (cancelled) return;
        setClientId(cfg.clientId);
        await loadPaypalSdk(cfg.clientId, SUBSCRIPTION_PLAN.currency, "checkout");
        if (!cancelled) setSdkReady(true);
      } catch (e) {
        if (!cancelled) setErrorMsg(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => { cancelled = true; };
  }, [open]);

  useEffect(() => {
    if (!open || !sdkReady || !containerRef.current || !window.paypal || !session || !clientId) return;
    const paypal = window.paypal as any;
    const container = containerRef.current;
    const renderId = ++renderIdRef.current;
    for (const b of buttonsRef.current) { try { b.close?.(); } catch { /* ignore */ } }
    buttonsRef.current = [];
    container.replaceChildren();
    let cancelled = false;

    const buttonOptions = {
      style: { layout: "vertical", shape: "rect", height: 45 },
      createOrder: async () => {
        const res = await fetch("/api/paypal/create-access-order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ planId: selectedPlanId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create order");
        return data.orderId as string;
      },
      onApprove: async (data: { orderID: string }) => {
        setProcessing(true);
        try {
          const res = await fetch("/api/paypal/capture-access-order", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ orderId: data.orderID, planId: selectedPlanId }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || "Capture failed");
          toast.success(t("payDlgAccessActivated", { plan: selectedPlan.label }));
          onSuccess?.();
          onOpenChange(false);
          setTimeout(() => window.location.reload(), 800);
        } catch (e) {
          toast.error(e instanceof Error ? e.message : t("payDlgPaymentFailed"));
        } finally {
          setProcessing(false);
        }
      },
      onError: (err: unknown) => {
        console.error("PayPal error", err);
        toast.error(t("payDlgPaymentFailed"));
      },
    };

    const fundingSources = [
      paypal.FUNDING.CARD,
      paypal.FUNDING.PAYPAL,
      paypal.FUNDING.APPLEPAY,
      paypal.FUNDING.GOOGLEPAY,
    ].filter(Boolean);

    let rendered = 0;
    for (const fundingSource of fundingSources) {
      const candidate = paypal.Buttons({ ...buttonOptions, fundingSource });
      if (!candidate.isEligible()) {
        try { candidate.close?.(); } catch { /* ignore */ }
        continue;
      }
      if (renderIdRef.current !== renderId) {
        try { candidate.close?.(); } catch { /* ignore */ }
        break;
      }
      buttonsRef.current.push(candidate);
      const wrap = document.createElement("div");
      wrap.style.marginBottom = "8px";
      container.appendChild(wrap);
      candidate.render(wrap).catch((e: unknown) => {
        if (!cancelled && renderId === renderIdRef.current) console.error(e);
      });
      rendered++;
    }

    if (rendered === 0) setErrorMsg(t("payDlgNoMethod"));

    return () => {
      cancelled = true;
      renderIdRef.current = renderId + 1;
      for (const b of buttonsRef.current) { try { b.close?.(); } catch { /* ignore */ } }
      buttonsRef.current = [];
      container.replaceChildren();
    };
  }, [sdkReady, session, open, clientId, onOpenChange, onSuccess, selectedPlanId, selectedPlan.label, t]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t("payDlgUnlimitedTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("payDlgUnlimitedDesc")}
          </DialogDescription>
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
                  active
                    ? "border-primary bg-primary/10"
                    : "border-border bg-muted/30 hover:border-primary/40"
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
                <div className="mt-1 text-[10px] font-bold text-destructive">
                  -{p.discountPct}%
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border bg-gradient-to-br from-primary/10 to-primary/5 p-4 my-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/15 rounded-full px-2.5 py-1">
            <Check className="h-3 w-3" />
            {t("payDlgOneTimeBadge")}
          </div>
          <ul className="text-sm space-y-1.5 mt-3 text-muted-foreground">
            <li className="flex gap-2"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> {t("payDlgUnlimitedItem")}</li>
            <li className="flex gap-2"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> {t("payDlgManageItem")}</li>
          </ul>
        </div>

        <div className="rounded-xl border border-border p-3 bg-muted/30 min-h-[160px] relative">
          {!sdkReady && !errorMsg && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {errorMsg && <div className="text-sm text-destructive p-2">{errorMsg}</div>}
          {processing && (
            <div className="absolute inset-0 z-10 bg-background/70 backdrop-blur-sm flex items-center justify-center rounded-xl">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          <div ref={containerRef} />
        </div>

        <p className="text-[11px] text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
          <CreditCard className="h-3 w-3" /> უსაფრთხო გადახდა PayPal-ით — ბარათი, Apple Pay, Google Pay
        </p>

        <Button variant="ghost" onClick={() => onOpenChange(false)} className="mt-1">
          მოგვიანებით
        </Button>
      </DialogContent>
    </Dialog>
  );
}
