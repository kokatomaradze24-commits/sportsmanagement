import { useState } from "react";
import { motion } from "framer-motion";
import { Users, DollarSign, AlertTriangle, TrendingUp } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Payment = Database["public"]["Tables"]["payments"]["Row"];
type Player = Database["public"]["Tables"]["players"]["Row"];

interface StatsCardsProps {
  players: Player[];
  payments: Payment[];
}

export function StatsCards({ players, payments }: StatsCardsProps) {
  const activePlayers = players.filter((p) => p.is_active).length;
  const totalPaid = payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);
  const pendingCount = payments.filter((p) => p.status === "pending" || p.status === "overdue").length;
  const overdueCount = payments.filter((p) => p.status === "overdue").length;

  const stats = [
    { label: "Active Players", value: activePlayers, icon: Users, color: "text-primary bg-primary/10" },
    { label: "Total Collected", value: `$${totalPaid.toFixed(0)}`, icon: TrendingUp, color: "text-success bg-success/10" },
    { label: "Pending", value: pendingCount, icon: DollarSign, color: "text-warning bg-warning/10" },
    { label: "Overdue", value: overdueCount, icon: AlertTriangle, color: "text-destructive bg-destructive/10" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-card rounded-xl border border-border p-4 card-hover"
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-display tracking-wider text-card-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
