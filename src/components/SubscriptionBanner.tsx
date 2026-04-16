import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/use-subscription";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { PaymentInfoDialog } from "./PaymentInfoDialog";

export function SubscriptionBanner() {
  const { daysLeft, isActive, loading, expiresAt } = useSubscription();
  const { isAdmin } = useIsAdmin();
  const [payOpen, setPayOpen] = useState(false);

  if (loading || isAdmin || !expiresAt || !isActive) return null;

  const isUrgent = daysLeft <= 5;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-xl border px-4 py-3 flex items-center justify-between gap-3 ${
          isUrgent
            ? "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
            : "bg-primary/10 border-primary/30 text-foreground"
        }`}
      >
        <div className="flex items-center gap-3">
          <Clock className={`h-5 w-5 ${isUrgent ? "text-red-500" : "text-primary"}`} />
          <div className="text-sm">
            <span className="font-semibold">
              {daysLeft === 0 ? "ბოლო დღე" : `დარჩენილია ${daysLeft} დღე`}
            </span>
            <span className="text-muted-foreground ml-2 hidden sm:inline">
              · ვადა: {expiresAt.toLocaleDateString()}
            </span>
          </div>
        </div>
        <Button
          size="sm"
          variant={isUrgent ? "destructive" : "default"}
          onClick={() => setPayOpen(true)}
        >
          <CreditCard className="h-4 w-4 mr-1.5" />
          Pay
        </Button>
      </motion.div>
      <PaymentInfoDialog open={payOpen} onOpenChange={setPayOpen} />
    </>
  );
}
