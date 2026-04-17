import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { PlayersList } from "@/components/PlayersList";
import { PaymentsPanel } from "@/components/PaymentsPanel";
import { NotificationsBanner } from "@/components/NotificationsBanner";
import { StatsCards } from "@/components/StatsCards";
import { SubscriptionBanner } from "@/components/SubscriptionBanner";
import { SubscriptionExpired } from "@/components/SubscriptionExpired";
import { OnboardingTutorial } from "@/components/OnboardingTutorial";
import { useTheme } from "@/hooks/use-theme";
import { useAppSettings } from "@/hooks/use-app-settings";
import { useSport } from "@/hooks/use-sport";
import { useSportLabels } from "@/hooks/use-sport-labels";
import { usePlayers } from "@/hooks/use-players";
import { usePayments } from "@/hooks/use-payments";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useI18n } from "@/hooks/use-i18n";
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
  const { sport: rawSport, sportId, setSport } = useSport();
  const sport = useSportLabels(rawSport);
  const { t } = useI18n();
  const { payments, loading: paymentsLoading, addPayment, updatePayment, deletePayment, refetch: refetchPayments } = usePayments(sportId);
  const { players, loading: playersLoading, addPlayer, updatePlayer, deletePlayer } = usePlayers(sportId, refetchPayments);
  const { isActive: subActive, loading: subLoading } = useSubscription();
  const { loading: onboardingLoading, onboarded, tutorialDone, markOnboarded, markTutorialDone } = useOnboarding();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Clear selected player when switching sports so we don't show data from a different sport
  useEffect(() => {
    setSelectedPlayer(null);
  }, [sportId]);

  // Mark users as onboarded once settings load (default sport = basketball).
  // Tutorial still shows once for new users.
  useEffect(() => {
    if (settingsLoading || onboardingLoading || !user) return;
    if (!onboarded) markOnboarded();
  }, [settingsLoading, onboardingLoading, user, onboarded, markOnboarded]);

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

  // Tutorial: shows once for new users
  const showTutorial = !settingsLoading && !onboardingLoading && !tutorialDone;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Decorative animated mesh background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, hsl(var(--foreground) / 0.5) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground) / 0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />
        {/* Animated gradient orbs */}
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/15 blur-3xl animate-pulse" style={{ animationDuration: "8s" }} />
        <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] rounded-full bg-accent/15 blur-3xl animate-pulse" style={{ animationDuration: "10s", animationDelay: "1s" }} />
        <div className="absolute bottom-0 right-1/4 w-[550px] h-[550px] rounded-full bg-success/10 blur-3xl animate-pulse" style={{ animationDuration: "12s", animationDelay: "2s" }} />
        <div className="absolute top-2/3 left-1/2 w-[400px] h-[400px] rounded-full bg-primary/8 blur-3xl animate-pulse" style={{ animationDuration: "9s", animationDelay: "3s" }} />
      </div>

      <div className="relative z-10">
        <OnboardingTutorial
          open={showTutorial}
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

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          <SubscriptionBanner />
          <StatsCards players={players} payments={payments} />
          <NotificationsBanner players={players} payments={payments} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
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

            <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
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
                    <div className="relative inline-block mb-4">
                      <span className="text-6xl block animate-bounce" style={{ animationDuration: "2s" }}>
                        {sport.emoji}
                      </span>
                      <div className="absolute inset-0 blur-2xl opacity-30 bg-primary rounded-full -z-10" />
                    </div>
                    <p className="text-xl font-display tracking-wider gradient-text">
                      {t("selectMember", { member: sport.member })}
                    </p>
                    <p className="text-sm mt-2 text-muted-foreground/80">
                      {t("selectMemberHint", { member: sport.member.toLowerCase() })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
