import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Payment = Database["public"]["Tables"]["payments"]["Row"];
type Player = Database["public"]["Tables"]["players"]["Row"];

interface NotificationsBannerProps {
  players: Player[];
  payments: Payment[];
}

export function NotificationsBanner({ players, payments }: NotificationsBannerProps) {
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
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-foreground text-sm">
            Payment Due This Month ({new Date(currentYear, currentMonth - 1).toLocaleString("default", { month: "long" })})
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {playersNeedingPayment.map((player) => (
              <span
                key={player.id}
                className="px-2.5 py-1 rounded-lg bg-warning/15 text-warning text-xs font-medium"
              >
                {player.first_name} {player.last_name} #{player.t_number}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
