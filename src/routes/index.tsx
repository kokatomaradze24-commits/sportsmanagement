import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { PlayersList } from "@/components/PlayersList";
import { PaymentsPanel } from "@/components/PaymentsPanel";
import { NotificationsBanner } from "@/components/NotificationsBanner";
import { StatsCards } from "@/components/StatsCards";
import { SportPicker } from "@/components/SportPicker";
import { SubscriptionBanner } from "@/components/SubscriptionBanner";
import { SubscriptionExpired } from "@/components/SubscriptionExpired";
import { OnboardingTutorial } from "@/components/OnboardingTutorial";
import { useTheme } from "@/hooks/use-theme";
import { useAppSettings } from "@/hooks/use-app-settings";
import { useSport } from "@/hooks/use-sport";
import { usePlayers } from "@/hooks/use-players";
import { usePayments } from "@/hooks/use-payments";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { useOnboarding } from "@/hooks/use-onboarding";
import type { Database } from "@/integrations/supabase/types";

type Player = Database["public"]["Tables"]["players"]["Row"];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Club Manager" },
      { name: "description", content: "Manage your sports club members, payments, and registrations" },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, signOut, user } = useAuth();
  const { isDark, toggle } = useTheme();
  const { schoolName, logoUrl, loading: settingsLoading, updateSchoolName, updateLogo, resetBranding } = useAppSettings();
  const { sport, sportId, setSport } = useSport();
  const { players, loading: playersLoading, addPlayer, updatePlayer, deletePlayer } = usePlayers(sportId);
  const { payments, loading: paymentsLoading, addPayment, updatePayment, deletePayment } = usePayments(sportId);
  const { isActive: subActive, loading: subLoading } = useSubscription();
  const { loading: onboardingLoading, onboarded, tutorialDone, markOnboarded, markTutorialDone } = useOnboarding();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Clear selected player when switching sports so we don't show data from a different sport
  useEffect(() => {
    setSelectedPlayer(null);
  }, [sportId]);

  // Existing users (account older than 2 minutes, or already have a sport) shouldn't
  // see the picker or tutorial. Silently mark them onboarded + tutorial-completed.
  useEffect(() => {
    if (settingsLoading || onboardingLoading || !user) return;
    if (onboarded) return;
    const accountAgeMs = Date.now() - new Date(user.created_at).getTime();
    const isBrandNew = accountAgeMs < 2 * 60 * 1000;
    if (sportId || !isBrandNew) {
      markOnboarded();
      if (!tutorialDone) markTutorialDone();
    }
  }, [settingsLoading, onboardingLoading, user, sportId, onboarded, tutorialDone, markOnboarded, markTutorialDone]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <span className="text-5xl block mb-4 animate-bounce">🏆</span>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate({ to: "/login" });
    return null;
  }

  // Block access if subscription expired
  if (!subLoading && !subActive) {
    return <SubscriptionExpired />;
  }

  // Sport picker only for brand-new users who haven't onboarded yet AND have no sport
  const showSportPicker = !settingsLoading && !onboardingLoading && !onboarded && !sportId;
  // Tutorial: only after the user has picked their sport, and only once
  const showTutorial = !settingsLoading && !onboardingLoading && !!sportId && !tutorialDone;

  return (
    <div className="min-h-screen bg-background">
      <SportPicker
        open={showSportPicker}
        onSelect={async (id) => {
          await setSport(id);
          await markOnboarded();
        }}
      />

      <OnboardingTutorial
        open={showTutorial && !showSportPicker}
        onComplete={markTutorialDone}
      />

      <AppHeader
        schoolName={schoolName}
        logoUrl={logoUrl}
        sport={sport}
        isDark={isDark}
        onToggleTheme={toggle}
        onUpdateName={updateSchoolName}
        onUploadLogo={updateLogo}
        onChangeSport={(id) => setSport(id)}
        onResetBranding={resetBranding}
        onSignOut={signOut}
      />

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <SubscriptionBanner />
        <StatsCards players={players} payments={payments} />
        <NotificationsBanner players={players} payments={payments} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            <PlayersList
              players={players}
              payments={payments}
              loading={playersLoading}
              sport={sport}
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
                  <span className="text-5xl block mb-4">{sport.emoji}</span>
                  <p className="text-lg font-display tracking-wider">Select a {sport.member}</p>
                  <p className="text-sm mt-1">Click on a {sport.member.toLowerCase()} to view and manage their payments</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
