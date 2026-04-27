import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { useI18n } from "@/hooks/use-i18n";

type Payment = Database["public"]["Tables"]["payments"]["Row"];
type Player = Database["public"]["Tables"]["players"]["Row"];

interface NotificationsBannerProps {
  players: Player[];
  payments: Payment[];
}

export function NotificationsBanner({ players, payments }: NotificationsBannerProps) {
  const { t, monthLong } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const playersNeedingPayment = players.filter((player) => {
    if (!player.is_active) return false;
    const hasCurrentMonthPayment = payments.some(
      (p) => p.player_id === player.id && p.month === currentMonth && p.year === currentYear && p.status === "paid"
    );
    return !hasCurrentMonthPayment;
  });

  if (playersNeedingPayment.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-warning/10 border border-warning/30 rounded-xl p-4"
    >
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        className="flex w-full items-center gap-3 text-left"
      >
        <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground text-sm">
            {t("paymentDueThisMonth")} ({monthLong(currentMonth)})
          </p>
        </div>
        <span className="rounded-lg bg-warning/15 px-3 py-1 text-lg font-bold leading-none text-warning">
          {playersNeedingPayment.length}
        </span>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 flex flex-wrap gap-2 pl-8">
            {playersNeedingPayment.map((player) => (
              <span
                key={player.id}
                className="px-2.5 py-1 rounded-lg bg-warning/15 text-warning text-xs font-medium"
              >
                {player.first_name} {player.last_name} #{player.t_number}
              </span>
            ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
