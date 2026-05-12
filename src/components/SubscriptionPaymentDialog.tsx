import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, Check, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { loadPaypalSdk } from "@/lib/paypal-sdk";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface SubConfig {
  clientId: string;
  env: string;
  planId: string;
  amount: number;
  currency: string;
  trialDays: number;
}

export function SubscriptionPaymentDialog({ open, onOpenChange, onSuccess }: Props) {
  const { session } = useAuth();
  const [config, setConfig] = useState<SubConfig | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<any>(null);
  const renderIdRef = useRef(0);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setSdkReady(false);
    setErrorMsg(null);
    (async () => {
      try {
        const cfg = await fetch("/api/paypal/subscription-config").then((r) => r.json());
        if (!cfg.planId) throw new Error(cfg.error || "Subscription not configured");
        if (cancelled) return;
        setConfig(cfg);
        await loadPaypalSdk(cfg.clientId, cfg.currency, "subscription");
        if (!cancelled) setSdkReady(true);
      } catch (e) {
        if (!cancelled) setErrorMsg(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => { cancelled = true; };
  }, [open]);

  useEffect(() => {
    if (!open || !sdkReady || !containerRef.current || !window.paypal || !session || !config) return;
    const container = containerRef.current;
    container.innerHTML = "";

    const button = window.paypal.Buttons({
      style: { layout: "vertical", shape: "rect", color: "gold", label: "subscribe", height: 45 },
      createSubscription: (_data: unknown, actions: any) => {
        return actions.subscription.create({
          plan_id: config.planId,
          custom_id: session.user.id,
          subscriber: session.user.email ? { email_address: session.user.email } : undefined,
          application_context: {
            shipping_preference: "NO_SHIPPING",
            user_action: "SUBSCRIBE_NOW",
          },
        });
      },
      onApprove: async (data: { subscriptionID: string }) => {
        setProcessing(true);
        try {
          const res = await fetch("/api/paypal/activate-subscription", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ subscriptionId: data.subscriptionID }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || "Activation failed");
          toast.success("გამოწერა გააქტიურდა");
          onSuccess?.();
          onOpenChange(false);
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "შეცდომა გამოწერისას");
        } finally {
          setProcessing(false);
        }
      },
      onError: (err: unknown) => {
        console.error("PayPal subscription error", err);
        toast.error("გადახდა ვერ მოხერხდა");
      },
    });
    button.render(container).catch((e: unknown) => console.error(e));
  }, [sdkReady, session, open, config, onOpenChange, onSuccess]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Pro გამოწერა
          </DialogTitle>
          <DialogDescription>
            სრული წვდომა ყველა ფუნქციაზე — გუნდები, შეხვედრები, გადახდები, AI გენერაცია
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl border bg-gradient-to-br from-primary/10 to-primary/5 p-5 my-2">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold">${config?.amount ?? 50}</span>
            <span className="text-muted-foreground">/ თვე</span>
          </div>
          <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/15 rounded-full px-2.5 py-1">
            <Check className="h-3 w-3" />
            {config?.trialDays ?? 7} დღე უფასო — გადახდა მხოლოდ ტრიალის შემდეგ
          </div>
          <ul className="text-sm space-y-1.5 mt-4 text-muted-foreground">
            <li className="flex gap-2"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> შეუზღუდავი ფეხბურთელები და გუნდები</li>
            <li className="flex gap-2"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> გადახდების მართვა + SMS</li>
            <li className="flex gap-2"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> AI ვარჯიშის გეგმები (კრედიტი ცალკე)</li>
            <li className="flex gap-2"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> ნებისმიერ დროს გათიშვა</li>
          </ul>
        </div>

        <div className="rounded-xl border border-border p-3 bg-muted/30 min-h-[120px] relative">
          {!sdkReady && !errorMsg && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {errorMsg && (
            <div className="text-sm text-destructive p-2">{errorMsg}</div>
          )}
          {processing && (
            <div className="absolute inset-0 z-10 bg-background/70 backdrop-blur-sm flex items-center justify-center rounded-xl">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          <div ref={containerRef} />
        </div>

        <p className="text-[11px] text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
          <CreditCard className="h-3 w-3" /> უსაფრთხო გადახდა PayPal-ით · ნებისმიერ დროს გათიშვა
        </p>

        <Button variant="ghost" onClick={() => onOpenChange(false)} className="mt-1">
          მოგვიანებით
        </Button>
      </DialogContent>
    </Dialog>
  );
}
