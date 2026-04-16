import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { PlayersList } from "@/components/PlayersList";
import { PaymentsPanel } from "@/components/PaymentsPanel";
import { NotificationsBanner } from "@/components/NotificationsBanner";
import { StatsCards } from "@/components/StatsCards";
import { useTheme } from "@/hooks/use-theme";
import { useAppSettings } from "@/hooks/use-app-settings";
import { usePlayers } from "@/hooks/use-players";
import { usePayments } from "@/hooks/use-payments";
import type { Database } from "@/integrations/supabase/types";

type Player = Database["public"]["Tables"]["players"]["Row"];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Basketball Club Manager" },
      { name: "description", content: "Manage your basketball club players, payments, and registrations" },
    ],
  }),
  component: Index,
});

function Index() {
  const { isDark, toggle } = useTheme();
  const { schoolName, logoUrl, updateSchoolName, updateLogo } = useAppSettings();
  const { players, loading: playersLoading, addPlayer, updatePlayer, deletePlayer } = usePlayers();
  const { payments, loading: paymentsLoading, addPayment, updatePayment, deletePayment } = usePayments();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        schoolName={schoolName}
        logoUrl={logoUrl}
        isDark={isDark}
        onToggleTheme={toggle}
        onUpdateName={updateSchoolName}
        onUploadLogo={updateLogo}
      />

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <StatsCards players={players} payments={payments} />
        <NotificationsBanner players={players} payments={payments} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            <PlayersList
              players={players}
              payments={payments}
              loading={playersLoading}
              onAdd={addPlayer}
              onUpdate={updatePlayer}
              onDelete={deletePlayer}
              onSelect={setSelectedPlayer}
              selectedId={selectedPlayer?.id}
            />
          </div>

          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            {selectedPlayer ? (
              <PaymentsPanel
                player={selectedPlayer}
                payments={payments}
                loading={paymentsLoading}
                onAdd={addPayment}
                onUpdate={updatePayment}
                onDelete={deletePayment}
              />
            ) : (
              <div className="flex items-center justify-center h-full min-h-[300px] text-muted-foreground">
                <div className="text-center">
                  <span className="text-5xl block mb-4">🏀</span>
                  <p className="text-lg font-display tracking-wider">Select a Player</p>
                  <p className="text-sm mt-1">Click on a player to view and manage their payments</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
