import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BarChart3, Users, Wallet, Calendar as CalendarIcon, UserCog, MapPin, Shield, Sparkles, ArrowRight } from "lucide-react";
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
import { Landing } from "@/components/marketing/Landing";
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
  // navigate removed: unauthenticated users now see the marketing landing
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
    return <Landing />;
  }

  // Block access if subscription expired
  if (!subLoading && !subActive) {
    return <SubscriptionExpired />;
  }

  // Tutorial: shows once for new users
  const showTutorial = !settingsLoading && !onboardingLoading && !tutorialDone;

  const isMyClub = theme === "myclub";
  const sportBg = !isMyClub && (sportId === "basketball" ? basketballBg : sportId === "football" ? footballBg : null);

  return (
    <div
      className={`min-h-screen bg-background relative overflow-hidden ${
        isMyClub ? "myclub-bg" : sportBg ? "no-ambient-lines" : "theme-ambient-bg"
      }`}
      style={!isMyClub && sportBg ? {
        backgroundImage: `linear-gradient(180deg, rgba(2,6,23,0.72), rgba(2,6,23,0.85)), url(${sportBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      } : undefined}
    >
      {isMyClub && (
        <>
          <div className="myclub-orb" style={{ width: 520, height: 520, top: -120, left: -120, background: "#00FF85" }} />
          <div className="myclub-orb" style={{ width: 420, height: 420, bottom: -100, right: -80, background: "#38bdf8" }} />
        </>
      )}


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

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-16" style={{ fontFamily: "Sora, Inter, system-ui, sans-serif" }}>
          <SubscriptionBanner />

          {/* Hero welcome */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium mb-5"
              style={{ borderColor: "rgba(0,255,133,0.3)", background: "rgba(0,255,133,0.08)", color: "#7CFFB8" }}>
              <Sparkles className="w-3.5 h-3.5" /> {sport.label} · {schoolName}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.05]"
              style={{ fontFamily: "Sora, Inter, sans-serif" }}>
              Welcome back to your{" "}
              <span className="bg-gradient-to-r from-[#00FF85] via-[#7CFFB8] to-sky-300 bg-clip-text text-transparent">
                club command center
              </span>
            </h1>
            <p className="mt-5 text-lg text-white/65 max-w-2xl">
              Players, teams, attendance, payments and AI insights — all in one place.
            </p>
          </motion.section>

          {/* Stats */}
          <section>
            <StatsCards players={players} payments={payments} />
          </section>

          <NotificationsBanner players={players} payments={payments} />

          {/* AI Stats analysis CTA — landing style */}
          <Link
            to="/stats-analysis"
            className="group block relative rounded-3xl border overflow-hidden p-6 sm:p-8 transition-all hover:scale-[1.005]"
            style={{
              background: "radial-gradient(circle at 20% 30%, rgba(0,255,133,0.15), transparent 55%), linear-gradient(180deg, #0E1216 0%, #06080A 100%)",
              borderColor: "rgba(0,255,133,0.25)",
              boxShadow: "0 20px 60px -20px rgba(0,255,133,0.2)",
            }}
          >
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(0,255,133,0.15)", border: "1px solid rgba(0,255,133,0.3)" }}>
                <BarChart3 className="w-7 h-7" style={{ color: "#00FF85" }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="inline-flex items-center gap-2 text-xs font-medium mb-1" style={{ color: "#00FF85" }}>
                  AI Match Analysis
                </div>
                <p className="text-xl sm:text-2xl font-bold text-white tracking-tight">{t("statsTitle")}</p>
                <p className="text-sm text-white/60 mt-1">{`${t("statsDescPrefix")} ${t("statsYourClub")} ${t("statsDescSuffix")}`}</p>
              </div>
              <ArrowRight className="w-6 h-6 text-white/40 group-hover:text-[#00FF85] group-hover:translate-x-1 transition" />
            </div>
          </Link>

          {/* Players & Payments */}
          <DashSection
            tag="Player & Team Management"
            title={<>Every athlete, <span style={{ color: "#00FF85" }}>organised</span></>}
            sub="Centralised profiles, contacts and payments. Click any player to manage their fees."
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-3xl border p-6"
                style={{
                  background: "linear-gradient(180deg, rgba(14,18,22,0.85), rgba(8,11,15,0.6))",
                  borderColor: "rgba(255,255,255,0.08)",
                  backdropFilter: "blur(14px)",
                }}>
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

              <div className="rounded-3xl border p-6"
                style={{
                  background: "linear-gradient(180deg, rgba(14,18,22,0.85), rgba(8,11,15,0.6))",
                  borderColor: "rgba(255,255,255,0.08)",
                  backdropFilter: "blur(14px)",
                }}>
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
                  <div className="flex items-center justify-center h-full min-h-[300px]">
                    <div className="text-center">
                      <div className="relative inline-block mb-5">
                        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto"
                          style={{ background: "rgba(0,255,133,0.1)", border: "1px solid rgba(0,255,133,0.25)" }}>
                          <Wallet className="w-10 h-10" style={{ color: "#00FF85" }} />
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-white tracking-tight">
                        {t("selectMember", { member: sport.member })}
                      </p>
                      <p className="text-sm mt-2 text-white/55">
                        {t("selectMemberHint", { member: sport.member.toLowerCase() })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DashSection>

          {/* Teams */}
          <DashSection
            tag="Team Builder"
            title={<>Build your <span style={{ color: "#00FF85" }}>squads</span></>}
            sub="Organise rosters, age groups and depth charts across your academy."
            icon={Shield}
          >
            <div className="rounded-3xl border p-6"
              style={{
                background: "linear-gradient(180deg, rgba(14,18,22,0.85), rgba(8,11,15,0.6))",
                borderColor: "rgba(255,255,255,0.08)",
                backdropFilter: "blur(14px)",
              }}>
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
            </div>
          </DashSection>

          {/* Schedule */}
          <DashSection
            tag="Attendance & Scheduling"
            title={<>Never miss a <span style={{ color: "#00FF85" }}>session</span></>}
            sub="Weekly templates, recurring practices and one-tap attendance tracking."
            icon={CalendarIcon}
          >
            <div className="rounded-3xl border p-6"
              style={{
                background: "linear-gradient(180deg, rgba(14,18,22,0.85), rgba(8,11,15,0.6))",
                borderColor: "rgba(255,255,255,0.08)",
                backdropFilter: "blur(14px)",
              }}>
              <SchedulePanel sportId={sportId} />
            </div>
          </DashSection>

          {/* Coaches */}
          <DashSection
            tag="Coaching Staff"
            title={<>Empower your <span style={{ color: "#00FF85" }}>coaches</span></>}
            sub="Give each coach their own login, schedule and player roster."
            icon={UserCog}
          >
            <div className="rounded-3xl border p-6"
              style={{
                background: "linear-gradient(180deg, rgba(14,18,22,0.85), rgba(8,11,15,0.6))",
                borderColor: "rgba(255,255,255,0.08)",
                backdropFilter: "blur(14px)",
              }}>
              <CoachesPanel sportId={sportId} clubName={schoolName} />
            </div>
          </DashSection>

          {/* Trips */}
          <DashSection
            tag="Trips & Tournaments"
            title={<>Travel, <span style={{ color: "#00FF85" }}>organised</span></>}
            sub="Plan trips, track participants and collect contributions in one flow."
            icon={MapPin}
          >
            <div className="rounded-3xl border p-6"
              style={{
                background: "linear-gradient(180deg, rgba(14,18,22,0.85), rgba(8,11,15,0.6))",
                borderColor: "rgba(255,255,255,0.08)",
                backdropFilter: "blur(14px)",
              }}>
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
            </div>
          </DashSection>
        </main>
      </div>
    </div>
  );
}

function DashSection({
  tag,
  title,
  sub,
  icon: Icon,
  children,
}: {
  tag: string;
  title: React.ReactNode;
  sub?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
      className="relative"
    >
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium mb-4"
          style={{ borderColor: "rgba(0,255,133,0.25)", background: "rgba(0,255,133,0.05)", color: "#00FF85" }}>
          {Icon && <Icon className="w-3.5 h-3.5" />} {tag}
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white"
          style={{ fontFamily: "Sora, Inter, sans-serif" }}>
          {title}
        </h2>
        {sub && <p className="mt-3 text-white/60 text-base max-w-2xl">{sub}</p>}
      </div>
      {children}
    </motion.section>
  );
}

