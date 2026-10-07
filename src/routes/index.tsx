import { useState, useEffect } from "react";
import { createFileRoute, useNavigate, Link, type SearchSchemaInput } from "@tanstack/react-router";
import { ArrowLeft, BarChart3, FileUp, LoaderCircle, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardNavigation, DASHBOARD_TABS, type DashboardTab } from "@/components/DashboardNavigation";
import { AppHeader } from "@/components/AppHeader";
import { PlayersList } from "@/components/PlayersList";
import { PaymentsPanel } from "@/components/PaymentsPanel";
import { NotificationsBanner } from "@/components/NotificationsBanner";
import { HomeWidgets } from "@/components/HomeWidgets";
import { BankImportDialog } from "@/components/BankImportDialog";
import { useSchedule } from "@/hooks/use-schedule";
import { PLAYER_PAYMENT_FILTERS, type PlayerPaymentFilter } from "@/lib/dashboard-summary";
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
  validateSearch: (search: SearchSchemaInput & { tab?: unknown; filter?: unknown }): { tab: DashboardTab; filter?: PlayerPaymentFilter } => ({
    tab: DASHBOARD_TABS.find((tab) => tab === search.tab) ?? "home",
    filter: PLAYER_PAYMENT_FILTERS.find((filter) => filter === search.filter),
  }),
  head: () => ({
    meta: [
      { title: "Club Management Software for Sports Academies — My Club" },
      { name: "description", content: "Sports club management software to run players, teams, payments, schedules, coaches and AI training plans — all in one place. 8 sports, 6 languages." },
      { property: "og:title", content: "Club Management Software for Sports Academies — My Club" },
      { property: "og:description", content: "Sports club management software to run players, teams, payments, schedules, coaches and AI training plans — all in one place." },
      { property: "og:type", content: "website" },
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
  const { tab, filter } = Route.useSearch();
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
  const schedule = useSchedule(sportId);
  const { isActive: subActive, loading: subLoading } = useSubscription();
  const { loading: onboardingLoading, onboarded, tutorialDone, markOnboarded, markTutorialDone } = useOnboarding();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [mobilePaymentOpen, setMobilePaymentOpen] = useState(false);
  const [bankImportOpen, setBankImportOpen] = useState(false);

  useEffect(() => {
    if (!mobilePaymentOpen || tab !== "players" || !window.matchMedia("(max-width: 1023px)").matches) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [mobilePaymentOpen, tab]);

  // Clear selected player when switching sports so we don't show data from a different sport
  useEffect(() => {
    setSelectedPlayer(null);
    setMobilePaymentOpen(false);
  }, [sportId]);

  // Mark users as onboarded once settings load (default sport = basketball).
  // Tutorial still shows once for new users.
  useEffect(() => {
    if (settingsLoading || onboardingLoading || !user) return;
    if (!onboarded) markOnboarded();
  }, [settingsLoading, onboardingLoading, user, onboarded, markOnboarded]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate({ to: "/login" });
  }, [authLoading, isAuthenticated, navigate]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <LoaderCircle className="mx-auto mb-4 size-8 animate-spin motion-reduce:animate-none text-primary" aria-hidden="true" />
          <p className="text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    );
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
      className={`min-h-screen bg-background relative ${sportBg ? "no-ambient-lines" : "theme-ambient-bg"}`}
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
          onGoToPlayers={() => { setMobilePaymentOpen(false); void navigate({ to: "/", search: { tab: "players" } }); }}
        />

        <div className="mx-auto max-w-[1600px] lg:flex lg:items-start">
        <DashboardNavigation activeTab={tab} />
        <main className="dashboard-main min-w-0 flex-1 px-4 py-6 sm:px-6">
          <section className={tab === "home" ? "space-y-6" : "hidden"} aria-label={t("sectionHome")}>
          <SubscriptionBanner />
          <StatsCards players={players} payments={payments} loading={playersLoading || paymentsLoading} onViewDebt={() => { setMobilePaymentOpen(false); void navigate({ to: "/", search: { tab: "players", filter: "overdue" } }); }} />
          <Button variant="outline" onClick={() => setBankImportOpen(true)} disabled={playersLoading || paymentsLoading}><FileUp className="size-4" />{t("bankImport")}</Button>
          <HomeWidgets players={players} payments={payments} loading={playersLoading || paymentsLoading} practices={schedule.practices} games={schedule.games} scheduleLoading={schedule.loading} onSelectPlayer={(player) => { setSelectedPlayer(player); setMobilePaymentOpen(true); void navigate({ to: "/", search: { tab: "players", filter: player.is_active ? "all" : "archived" } }); }} />
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

          </section>
          <section className={tab === "players" ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : "hidden"} aria-label={t("sectionPlayers")}>
            <div className="theme-panel backdrop-blur-sm rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
              <PlayersList
                players={players}
                payments={payments}
                loading={playersLoading}
                sport={sport}
                onAdd={addPlayer}
                onUpdate={updatePlayer}
                onDelete={deletePlayer}
                onSelect={(player) => { setSelectedPlayer(player); setMobilePaymentOpen(true); }}
                onApprovedRegistration={refetchPlayers}
                selectedId={selectedPlayer?.id}
                paymentFilter={filter ?? "all"}
                onPaymentFilterChange={(value) => { void navigate({ to: "/", search: (prev) => ({ ...prev, filter: value }) }); }}
                onImportBank={() => setBankImportOpen(true)}
              />
            </div>

            <div className={selectedPlayer && mobilePaymentOpen
              ? "dashboard-payment-view fixed inset-0 z-40 overflow-y-auto bg-background p-4 lg:static lg:z-auto lg:overflow-visible lg:rounded-2xl lg:border lg:border-border lg:bg-panel lg:p-5"
              : "theme-panel hidden rounded-2xl border border-border p-5 backdrop-blur-sm lg:block"}>
              {selectedPlayer && <div className="sticky top-0 z-10 -mx-4 -mt-4 mb-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-xl lg:hidden">
                <Button variant="ghost" size="sm" className="gap-2" onClick={() => setMobilePaymentOpen(false)}><ArrowLeft className="size-4" />{t("back")}</Button>
              </div>}
              {selectedPlayer ? (
                <PaymentsPanel
                  player={selectedPlayer}
                  players={players}
                  payments={payments}
                  loading={paymentsLoading}
                  onAdd={addPayment}
                  onUpdate={updatePayment}
                  onDelete={deletePayment}
                />
              ) : (
                <div className="flex items-center justify-center h-full min-h-[300px] text-muted-foreground">
                  <div className="text-center">
                    <UserRound className="mx-auto mb-4 size-12 opacity-50" />
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
          </section>

          <section className={tab === "teams" ? "min-w-0" : "hidden"} aria-label={t("sectionTeams")}>
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

          </section>
          <section className={tab === "schedule" ? "min-w-0" : "hidden"} aria-label={t("sectionSchedule")}>
          <SchedulePanel sportId={sportId} schedule={schedule} />
          </section>
          <section className={tab === "more" ? "space-y-6" : "hidden"} aria-label={t("sectionMore")}>

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
          </section>
        </main>
        </div>
        <BankImportDialog open={bankImportOpen} onOpenChange={setBankImportOpen} sport={sportId} sportName={sport.name} clubName={schoolName} players={players} payments={payments} onRefresh={async () => { await Promise.all([refetchPlayers(), refetchPayments()]); }} />
      </div>
    </div>
  );
}
