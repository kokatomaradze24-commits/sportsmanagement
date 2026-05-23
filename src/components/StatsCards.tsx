import { motion } from "framer-motion";
import { Users, DollarSign, AlertTriangle, TrendingUp } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { useI18n } from "@/hooks/use-i18n";

type Payment = Database["public"]["Tables"]["payments"]["Row"];
type Player = Database["public"]["Tables"]["players"]["Row"];

interface StatsCardsProps {
  players: Player[];
  payments: Payment[];
}

export function StatsCards({ players, payments }: StatsCardsProps) {
  const { t, formatMoney } = useI18n();
  const activePlayers = players.filter((p) => p.is_active).length;
  const totalPaid = payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);
  const pendingCount = payments.filter((p) => p.status === "pending" || p.status === "overdue").length;
  const overdueCount = payments.filter((p) => p.status === "overdue").length;

  const stats = [
    { label: t("activePlayers"), value: activePlayers, icon: Users, tone: "neon" },
    { label: t("totalCollected"), value: formatMoney(totalPaid, "auto", 0), icon: TrendingUp, tone: "neon" },
    { label: t("pending"), value: pendingCount, icon: DollarSign, tone: "sky" },
    { label: t("overdue"), value: overdueCount, icon: AlertTriangle, tone: "warn" },
  ] as const;

  const toneStyles = {
    neon: { bg: "rgba(0,255,133,0.1)", border: "rgba(0,255,133,0.25)", color: "#00FF85" },
    sky: { bg: "rgba(56,189,248,0.1)", border: "rgba(56,189,248,0.25)", color: "#7dd3fc" },
    warn: { bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.25)", color: "#fca5a5" },
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, i) => {
        const tone = toneStyles[stat.tone];
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ y: -4 }}
            className="group relative rounded-2xl border p-5 overflow-hidden"
            style={{
              background: "linear-gradient(180deg, rgba(14,18,22,0.85), rgba(8,11,15,0.6))",
              borderColor: "rgba(255,255,255,0.08)",
              backdropFilter: "blur(14px)",
            }}
          >
            <div
              className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-30 group-hover:opacity-60 transition-opacity"
              style={{ background: tone.color }}
            />
            <div className="relative flex items-start justify-between mb-4">
              <div
                className="w-11 h-11 rounded-xl border flex items-center justify-center"
                style={{ background: tone.bg, borderColor: tone.border }}
              >
                <stat.icon className="w-5 h-5" style={{ color: tone.color }} strokeWidth={2.2} />
              </div>
            </div>
            <div className="relative">
              <p
                className="text-3xl font-bold tracking-tight text-white"
                style={{ fontFamily: "Sora, Inter, sans-serif" }}
              >
                {stat.value}
              </p>
              <p className="text-xs uppercase tracking-wider mt-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                {stat.label}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
