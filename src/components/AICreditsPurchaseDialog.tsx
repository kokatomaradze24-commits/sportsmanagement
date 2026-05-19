import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { AI_CREDIT_PACKAGES, CREDIT_COSTS, type AICreditPackage } from "@/lib/ai-credit-packages";
import { loadPaypalSdk } from "@/lib/paypal-sdk";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (newBalance: number) => void;
}

type PaypalButton = {
  isEligible: () => boolean;
  render: (element: HTMLElement) => Promise<void>;
  close?: () => void;
};

type PaypalApi = {
  FUNDING: Record<string, string | undefined>;
  Buttons: (options: Record<string, unknown>) => PaypalButton;
};

export function AICreditsPurchaseDialog({ open, onOpenChange, onSuccess }: Props) {
  const { session } = useAuth();
  const { t } = useI18n();
  const [selected, setSelected] = useState<AICreditPackage>(AI_CREDIT_PACKAGES[0]);
  const [calcAmount, setCalcAmount] = useState<number>(14.99);
  const [sdkReady, setSdkReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const paypalButtonsRef = useRef<Array<{ close?: () => void }>>([]);
  const renderIdRef = useRef(0);

  // Load PayPal SDK when dialog opens
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setSdkReady(false);
    (async () => {
      try {
        const cfg = await fetch("/api/paypal/config").then((r) => r.json());
        if (!cfg.clientId) throw new Error("PayPal not configured");
        await loadPaypalSdk(cfg.clientId, selected.currency);
        if (!cancelled) setSdkReady(true);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "PayPal load error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, selected.currency]);

  // Render PayPal buttons whenever selection or readiness changes
  useEffect(() => {
    if (!open || !sdkReady || !containerRef.current || !window.paypal || !session) return;

    const paypal = window.paypal as PaypalApi;
    const container = containerRef.current;
    const renderId = ++renderIdRef.current;
    for (const b of paypalButtonsRef.current) { try { b.close?.(); } catch { /* ignore */ } }
    paypalButtonsRef.current = [];
    container.replaceChildren();
    let cancelled = false;

    const createOrder = async () => {
      const res = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ packageId: selected.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create order");
      return data.orderId as string;
    };

    const onApprove = async (data: { orderID: string }) => {
      setProcessing(true);
      try {
        const res = await fetch("/api/paypal/capture-order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ orderId: data.orderID }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Capture failed");
        toast.success(t("aiDlgCreditsAdded", { credits: selected.credits }));
        onSuccess?.(json.credits);
        onOpenChange(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t("aiDlgPaymentFailed"));
      } finally {
        setProcessing(false);
      }
    };

    const onError = (err: unknown) => {
      console.error("PayPal error", err);
      toast.error(t("aiDlgPaymentFailed"));
    };

    const buttonOptions = {
      style: { layout: "vertical", shape: "rect", height: 44 },
      createOrder,
      onApprove,
      onError,
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
      paypalButtonsRef.current.push(candidate);
      const wrap = document.createElement("div");
      wrap.style.marginBottom = "8px";
      container.appendChild(wrap);
      candidate.render(wrap).catch((err: unknown) => {
        if (!cancelled && renderId === renderIdRef.current) onError(err);
      });
      rendered++;
    }

    if (rendered === 0) {
      toast.error(t("payDlgNoMethod"));
    }

    return () => {
      cancelled = true;
      renderIdRef.current = renderId + 1;
      for (const b of paypalButtonsRef.current) { try { b.close?.(); } catch { /* ignore */ } }
      paypalButtonsRef.current = [];
      container.replaceChildren();
    };
  }, [sdkReady, selected, session, open, onOpenChange, onSuccess, t]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI კრედიტების შეძენა
          </DialogTitle>
          <DialogDescription>
            აირჩიე პაკეტი და გადაიხადე ერთი უსაფრთხო გადახდის ღილაკით
          </DialogDescription>
        </DialogHeader>

        {/* AI features list */}
        <div className="mt-3 rounded-xl border border-border p-3 bg-gradient-to-br from-primary/5 to-transparent">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            ✨ რა შეგიძლია AI-ით
          </div>
          <ul className="space-y-1.5 text-sm">
            <li className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">🖼️ სურათების გენერაცია</span>
              <span className="text-xs text-muted-foreground tabular-nums">{CREDIT_COSTS.image} კრედიტი</span>
            </li>
            <li className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">🏋️ ვარჯიშის გეგმის გენერაცია (Expert)</span>
              <span className="text-xs text-muted-foreground tabular-nums">{CREDIT_COSTS.expertPlan} კრედიტი</span>
            </li>
            <li className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">📋 თვითდამოუკიდებელი გეგმა (Self)</span>
              <span className="text-xs text-muted-foreground tabular-nums">{CREDIT_COSTS.selfPlan} კრედიტი</span>
            </li>
            <li className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">📅 1-წლიანი სავარჯიშო გეგმა</span>
              <span className="text-xs text-muted-foreground tabular-nums">{CREDIT_COSTS.expertPlan} კრედიტი</span>
            </li>
          </ul>
        </div>

        {/* Single package card */}
        <div className="my-4 rounded-xl border-2 border-primary bg-primary/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-primary uppercase tracking-wider">
                1 თვიანი პაკეტი
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-bold">${selected.amount}</span>
                <span className="text-sm text-muted-foreground">/ {selected.credits} კრედიტი</span>
              </div>
            </div>
            <Sparkles className="h-8 w-8 text-primary opacity-60" />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-background/60 p-2">
              <div className="text-lg font-bold">{Math.floor(selected.credits / CREDIT_COSTS.image)}</div>
              <div className="text-[10px] text-muted-foreground uppercase">სურათი</div>
            </div>
            <div className="rounded-lg bg-background/60 p-2">
              <div className="text-lg font-bold">{Math.floor(selected.credits / CREDIT_COSTS.expertPlan)}</div>
              <div className="text-[10px] text-muted-foreground uppercase">Expert plan</div>
            </div>
            <div className="rounded-lg bg-background/60 p-2">
              <div className="text-lg font-bold">{Math.floor(selected.credits / CREDIT_COSTS.selfPlan)}</div>
              <div className="text-[10px] text-muted-foreground uppercase">Self plan</div>
            </div>
          </div>
        </div>

        {/* Calculator */}
        <div className="mb-4 rounded-xl border border-border p-3 bg-muted/20">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            🧮 კალკულატორი — რას მიიღებ თანხაში
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm">$</span>
            <input
              type="number"
              min={14.99}
              step={1}
              value={calcAmount}
              onChange={(e) => setCalcAmount(Math.max(14.99, Number(e.target.value) || 14.99))}
              className="w-24 rounded-md border border-border bg-background px-2 py-1 text-sm tabular-nums"
            />
            <span className="text-xs text-muted-foreground">
              ({((calcAmount / selected.amount) * selected.credits).toFixed(0)} კრედიტი)
            </span>
          </div>
          {(() => {
            const credits = (calcAmount / selected.amount) * selected.credits;
            return (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-background p-2 border border-border/50">
                  <div className="text-base font-bold">{Math.floor(credits / CREDIT_COSTS.image)}</div>
                  <div className="text-[10px] text-muted-foreground">სურათი</div>
                </div>
                <div className="rounded-lg bg-background p-2 border border-border/50">
                  <div className="text-base font-bold">{Math.floor(credits / CREDIT_COSTS.expertPlan)}</div>
                  <div className="text-[10px] text-muted-foreground">Expert plan</div>
                </div>
                <div className="rounded-lg bg-background p-2 border border-border/50">
                  <div className="text-base font-bold">{Math.floor(credits / CREDIT_COSTS.selfPlan)}</div>
                  <div className="text-[10px] text-muted-foreground">Self plan</div>
                </div>
              </div>
            );
          })()}
          <div className="mt-2 text-[10px] text-muted-foreground">
            1 სურათი = {CREDIT_COSTS.image} კრედიტი · 1 expert plan = {CREDIT_COSTS.expertPlan} · 1 self plan = {CREDIT_COSTS.selfPlan}
          </div>
        </div>

        <div className="rounded-xl border border-border p-3 bg-muted/30 min-h-[160px] relative">
          {!sdkReady && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {processing && (
            <div className="absolute inset-0 z-10 bg-background/70 backdrop-blur-sm flex items-center justify-center rounded-xl">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          <div ref={containerRef} />
        </div>

        <p className="text-[11px] text-muted-foreground text-center mt-2">
          🔒 უსაფრთხო გადახდა PayPal-ით — PayPal, ბარათი, Apple Pay და Google Pay (თუ ხელმისაწვდომია).
        </p>

        <Button variant="ghost" onClick={() => onOpenChange(false)} className="mt-1">
          გაუქმება
        </Button>
      </DialogContent>
    </Dialog>
  );
}
