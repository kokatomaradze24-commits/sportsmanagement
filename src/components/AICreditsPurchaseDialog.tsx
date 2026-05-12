import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { AI_CREDIT_PACKAGES, type AICreditPackage } from "@/lib/ai-credit-packages";
import { loadPaypalSdk } from "@/lib/paypal-sdk";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (newBalance: number) => void;
}

export function AICreditsPurchaseDialog({ open, onOpenChange, onSuccess }: Props) {
  
  const { session } = useAuth();
  const [selected, setSelected] = useState<AICreditPackage>(AI_CREDIT_PACKAGES[1]);
  const [sdkReady, setSdkReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const paypalButtonRef = useRef<{ close?: () => void } | null>(null);
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
    return () => { cancelled = true; };
  }, [open, selected.currency]);

  // Render PayPal buttons whenever selection or readiness changes
  useEffect(() => {
    if (!open || !sdkReady || !containerRef.current || !window.paypal || !session) return;

    const container = containerRef.current;
    const renderId = ++renderIdRef.current;
    paypalButtonRef.current?.close?.();
    paypalButtonRef.current = null;
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
        toast.success(`დაემატა ${selected.credits} AI კრედიტი`);
        onSuccess?.(json.credits);
        onOpenChange(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Payment failed");
      } finally {
        setProcessing(false);
      }
    };

    const onError = (err: unknown) => {
      console.error("PayPal error", err);
      toast.error("გადახდა ვერ მოხერხდა");
    };

    const buttonOptions = {
      style: { layout: "vertical", shape: "rect", height: 44 },
      createOrder,
      onApprove,
      onError,
    };

    const fundingPriority = [
      window.paypal.FUNDING.APPLEPAY,
      window.paypal.FUNDING.GOOGLEPAY,
      window.paypal.FUNDING.PAYPAL,
      window.paypal.FUNDING.CARD,
    ].filter(Boolean);

    let button: any = null;
    for (const fundingSource of fundingPriority) {
      const candidate = window.paypal.Buttons({ ...buttonOptions, fundingSource });
      if (candidate.isEligible()) {
        button = candidate;
        break;
      }
      candidate.close?.();
    }

    if (!button) {
      toast.error("გადახდის მეთოდი ხელმისაწვდომი არ არის");
      return;
    }

    paypalButtonRef.current = button;
    const wrap = document.createElement("div");
    container.appendChild(wrap);
    button.render(wrap).catch((err: unknown) => {
      if (!cancelled && renderId === renderIdRef.current) onError(err);
    });

    return () => {
      cancelled = true;
      renderIdRef.current++;
      paypalButtonRef.current?.close?.();
      paypalButtonRef.current = null;
      container.replaceChildren();
    };
  }, [sdkReady, selected, session, open, onOpenChange, onSuccess]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI კრედიტების შეძენა
          </DialogTitle>
          <DialogDescription>აირჩიე პაკეტი და გადაიხადე ერთი უსაფრთხო გადახდის ღილაკით</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 my-4">
          {AI_CREDIT_PACKAGES.map((pkg) => {
            const active = selected.id === pkg.id;
            return (
              <button
                key={pkg.id}
                type="button"
                onClick={() => setSelected(pkg)}
                className={`relative text-left rounded-xl border p-3 transition-all ${
                  active
                    ? "border-primary bg-primary/5 ring-2 ring-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {active && (
                  <Check className="absolute top-2 right-2 h-4 w-4 text-primary" />
                )}
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {pkg.id === "week" ? "1 კვირა" : pkg.id === "month" ? "1 თვე" : "1 წელი"}
                </div>
                <div className="mt-1 text-2xl font-bold">
                  ${pkg.amount}
                </div>
                <div className="text-xs text-muted-foreground">
                  {pkg.credits} კრედიტი
                </div>
              </button>
            );
          })}
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
          🔒 უსაფრთხო გადახდა PayPal-ით. ეკრანზე გამოჩნდება მხოლოდ ერთი გადახდის ღილაკი.
        </p>

        <Button variant="ghost" onClick={() => onOpenChange(false)} className="mt-1">
          გაუქმება
        </Button>
      </DialogContent>
    </Dialog>
  );
}
