import { useState, useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { PlayersList } from "@/components/PlayersList";
import { PaymentsPanel } from "@/components/PaymentsPanel";
import { NotificationsBanner } from "@/components/NotificationsBanner";
import { StatsCards } from "@/components/StatsCards";
import { SubscriptionBanner } from "@/components/SubscriptionBanner";
import { SubscriptionExpired } from "@/components/SubscriptionExpired";
import { OnboardingTutorial } from "@/components/OnboardingTutorial";
import { TripsPanel } from "@/components/TripsPanel";
import { TeamsPanel } from "@/components/TeamsPanel";
import { CoachesPanel } from "@/components/CoachesPanel";
import { SchedulePanel } from "@/components/SchedulePanel";
import { useTeams } from "@/hooks/use-teams";
import { useTheme } from "@/hooks/use-theme";
import { useAppSettings } from "@/hooks/use-app-settings";
import { useSport } from "@/hooks/use-sport";
import { useSportLabels } from "@/hooks/use-sport-labels";
import { usePlayers } from "@/hooks/use-players";
import { usePayments } from "@/hooks/use-payments";
import { useTrips } from "@/hooks/use-trips";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useI18n } from "@/hooks/use-i18n";
import type { Database } from "@/integrations/supabase/types";
import ogImage from "@/assets/og-home.jpg";
import basketballBg from "@/assets/basketball-court-bg.png";
import footballBg from "@/assets/football-stadium-bg.png";

type Player = Database["public"]["Tables"]["players"]["Row"];

const OG_IMAGE_URL = new URL(ogImage, "https://my-club.live").href;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Club Management Software for Sports Academies — My Club" },
      { name: "description", content: "Sports club management software to run players, teams, payments, schedules, coaches and AI training plans — all in one place. 8 sports, 6 languages." },
      { property: "og:title", content: "Club Management Software for Sports Academies — My Club" },
      { property: "og:description", content: "Sports club management software to run players, teams, payments, schedules, coaches and AI training plans — all in one place." },
      { property: "og:url", content: "https://my-club.live/" },
      { property: "og:image", content: OG_IMAGE_URL },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "640" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: OG_IMAGE_URL },
    ],
    links: [{ rel: "canonical", href: "https://my-club.live/" }],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, signOut, user } = useAuth();
  const { isDark, theme, themes, setTheme, toggle } = useTheme();
  const { schoolName, logoUrl, loading: settingsLoading, updateSchoolName, updateLogo, resetBranding } = useAppSettings();
  const { sport: rawSport, sportId, setSport } = useSport();
  const sport = useSportLabels(rawSport);
  const { t } = useI18n();
  const { payments, loading: paymentsLoading, addPayment, updatePayment, deletePayment, refetch: refetchPayments } = usePayments(sportId);
  const { players, loading: playersLoading, addPlayer, updatePlayer, deletePlayer, refetch: refetchPlayers } = usePlayers(sportId, refetchPayments);
  const trips = useTrips(sportId);
  const teamsHook = useTeams(sportId);
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

  const sportBg = sportId === "basketball" ? basketballBg : sportId === "football" ? footballBg : null;

  return (
    <div
      className={`min-h-screen bg-background relative overflow-hidden ${sportBg ? "no-ambient-lines" : "theme-ambient-bg"}`}
      style={sportBg ? {
        backgroundImage: `linear-gradient(180deg, rgba(2,6,23,0.72), rgba(2,6,23,0.85)), url(${sportBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      } : undefined}
    >

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
          currentTheme={theme}
          themes={themes}
          onSelectTheme={setTheme}
          userId={user?.id}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          <SubscriptionBanner />
          <StatsCards players={players} payments={payments} />
          <NotificationsBanner players={players} payments={payments} />

          <Link
            to="/stats-analysis"
            className="block rounded-2xl border border-primary/40 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 sm:p-5 hover:border-primary hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display tracking-wider text-base sm:text-lg">{t("statsTitle")} ✨</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{`${t("statsDescPrefix")} ${t("statsYourClub")} ${t("statsDescSuffix")}`}</p>
              </div>
              <span className="text-primary text-xl group-hover:translate-x-1 transition-transform hidden sm:inline">→</span>
            </div>
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="theme-panel backdrop-blur-sm rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
              <PlayersList
                players={players}
                payments={payments}
                loading={playersLoading}
                sport={sport}
                onAdd={addPlayer}
                onUpdate={updatePlayer}
                onDelete={deletePlayer}
                onSelect={setSelectedPlayer}
                onApprovedRegistration={refetchPlayers}
                selectedId={selectedPlayer?.id}
              />
            </div>

            <div className="theme-panel backdrop-blur-sm rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
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

          <TeamsPanel
            teams={teamsHook.teams}
            members={teamsHook.members}
            players={players}
            loading={teamsHook.loading}
            onAddTeam={teamsHook.addTeam}
            onUpdateTeam={teamsHook.updateTeam}
            onDeleteTeam={teamsHook.deleteTeam}
            onSetRoster={teamsHook.setTeamRoster}
          />

          <SchedulePanel sportId={sportId} />

          <CoachesPanel sportId={sportId} clubName={schoolName} />

          <TripsPanel
            trips={trips.trips}
            participants={trips.participants}
            players={players}
            loading={trips.loading}
            onAddTrip={trips.addTrip}
            onUpdateTrip={trips.updateTrip}
            onDeleteTrip={trips.deleteTrip}
            onAddParticipant={trips.addParticipant}
            onUpdateParticipant={trips.updateParticipant}
            onRemoveParticipant={trips.removeParticipant}
          />
        </main>
      </div>
    </div>
  );
}
