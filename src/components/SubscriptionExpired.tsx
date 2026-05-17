import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Sparkles, Check, LogOut, ShieldCheck, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubscriptionPaymentDialog } from "./SubscriptionPaymentDialog";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { useSubscription } from "@/hooks/use-subscription";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription-plan";

export function SubscriptionExpired() {
  const [open, setOpen] = useState(false);
  const { signOut } = useAuth();
  const { t } = useI18n();
  const { refresh } = useSubscription();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher variant="floating" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative max-w-lg w-full bg-card/95 backdrop-blur border border-border rounded-3xl p-6 sm:p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-full bg-red-500/20 blur-xl" />
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-500/5 border border-red-500/30 flex items-center justify-center">
              <Lock className="h-6 w-6 text-red-500" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display tracking-wider mb-2">
            {t("subscriptionExpiredTitle")}
          </h1>
          <p className="text-muted-foreground text-sm max-w-sm">
            {t("subscriptionExpiredDesc")}
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
          {SUBSCRIPTION_PLANS.map((p) => {
            const isYear = p.days >= 365;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setOpen(true)}
                className={`group relative text-left rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                  isYear
                    ? "border-primary/60 bg-gradient-to-br from-primary/15 to-primary/5 hover:border-primary"
                    : "border-border bg-muted/30 hover:border-primary/40"
                }`}
              >
                {isYear && (
                  <span className="absolute -top-2.5 right-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground rounded-full px-2 py-0.5 shadow">
                    <Sparkles className="h-3 w-3" /> საუკეთესო
                  </span>
                )}
                <div className="text-sm font-semibold">{p.label}</div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-xs text-muted-foreground line-through decoration-destructive/70">
                    ${p.originalAmount}
                  </span>
                  <span className="text-2xl font-bold tracking-tight">${p.amount}</span>
                </div>
                <div className="mt-1 inline-flex items-center text-[10px] font-bold text-destructive bg-destructive/10 rounded-full px-2 py-0.5">
                  -{p.discountPct}% ფასდაკლება
                </div>
              </button>
            );
          })}
        </div>

        {/* Benefits */}
        <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
          <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary" /> ულიმიტო წვდომა</li>
          <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary" /> ერთჯერადი გადახდა</li>
          <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary" /> ავტო-განახლების გარეშე</li>
          <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary" /> უსაფრთხო PayPal გადახდა</li>
        </ul>

        {/* CTA */}
        <Button size="lg" className="w-full mt-6 h-12 text-base font-semibold shadow-lg shadow-primary/20" onClick={() => setOpen(true)}>
          <CreditCard className="h-4 w-4 mr-2" />
          აირჩიე პაკეტი და გადაიხადე
        </Button>

        <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          უსაფრთხო გადახდა — PayPal, ბარათი, Apple Pay, Google Pay
        </div>

        <div className="mt-4 pt-4 border-t border-border/60 flex justify-center">
          <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground">
            <LogOut className="h-4 w-4 mr-2" />
            {t("signOut")}
          </Button>
        </div>
      </motion.div>

      <SubscriptionPaymentDialog open={open} onOpenChange={setOpen} onSuccess={refresh} />
    </div>
  );
}
