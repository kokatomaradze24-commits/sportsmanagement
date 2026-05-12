import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Users, CalendarDays, Wallet, Bell, BarChart3, Globe2, CheckCircle2, Sparkles, UserCog, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/hooks/use-i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import type { LanguageCode } from "@/lib/i18n/translations";

type MarketingCopy = {
  tagline: string;
  headline: string;
  subline: string;
  ctaTitle: string;
  ctaSubtitle: string;
  features: { title: string; desc: string }[];
  benefits: string[];
  socialProof: string;
  coachLink: string;
};

const MARKETING: Record<LanguageCode, MarketingCopy> = {
  ka: {
    tagline: "სპორტული კლუბის მართვის #1 პლატფორმა",
    headline: "მართე მთელი კლუბი ერთ ჭკვიან სისტემაში",
    subline:
      "მოთამაშეები, გადახდები, ვარჯიშები, თამაშები, გუნდები, მწვრთნელები, ექსკურსიები და AI ასისტენტი — ყველაფერი ერთ თანამედროვე პლატფორმაზე. 8 სპორტი, 6 ენა.",
    ctaTitle: "დაიწყე 7-დღიანი უფასო ცდა",
    ctaSubtitle: "რეგისტრაცია 30 წამში — საკრედიტო ბარათის გარეშე",
    features: [
      { title: "მოთამაშეთა და გუნდების ბაზა", desc: "სრული პროფილი, მშობლის კონტაქტი, ასაკობრივი ჯგუფები" },
      { title: "გადახდები და ფინანსები", desc: "ავტომატური განრიგი, ვადაგასული, PDF ქვითრები" },
      { title: "ვარჯიშები, თამაშები, ექსკურსიები", desc: "კალენდარი, კვირეული შაბლონები, მონაწილეები" },
      { title: "AI ვარჯიშის გეგმა და სურათები", desc: "ასაკის მიხედვით პერსონალური გეგმები ერთი კლიკით" },
      { title: "მწვრთნელის ცალკე წვდომა", desc: "თითოეულ მწვრთნელს თავისი განრიგი და მოთამაშეები" },
      { title: "ონლაინ რეგისტრაციის ლინკი", desc: "მშობლები პირდაპირ ავსებენ ანკეტას" },
      { title: "ავტომატური SMS / Email", desc: "გადახდის შეხსენება, დადასტურება, ვადის გასვლა" },
      { title: "მრავალენოვანი და მრავალვალუტიანი", desc: "6 ენა • GEL / USD / EUR • 8 სპორტი" },
    ],
    benefits: ["უსაფრთხო ღრუბლოვანი მონაცემები", "მუშაობს ტელეფონზე და კომპიუტერზე", "PayPal გადახდები"],
    socialProof: "ენდობათ კლუბები საქართველოსა და მსოფლიოში",
    coachLink: "მწვრთნელად შესვლა",
  },
  en: {
    tagline: "The #1 platform for sports club management",
    headline: "Run your entire club from one smart system",
    subline:
      "Players, payments, practices, games, teams, coaches, trips and an AI assistant — all in one modern platform. 8 sports, 6 languages.",
    ctaTitle: "Start your 7-day free trial",
    ctaSubtitle: "Sign up in 30 seconds — no credit card required",
    features: [
      { title: "Players & teams database", desc: "Full profiles, parent contacts, age groups" },
      { title: "Payments & finances", desc: "Auto schedule, overdue tracking, PDF receipts" },
      { title: "Practices, games, trips", desc: "Calendar, weekly templates, participants" },
      { title: "AI training plans & images", desc: "Age-based personalized plans in one click" },
      { title: "Dedicated coach access", desc: "Each coach manages their own schedule & players" },
      { title: "Online registration link", desc: "Parents fill the form directly from a shared link" },
      { title: "Automatic SMS / Email", desc: "Payment reminders, confirmations, overdue alerts" },
      { title: "Multi-language & currency", desc: "6 languages • GEL / USD / EUR • 8 sports" },
    ],
    benefits: ["Secure cloud-hosted data", "Works on phone and desktop", "PayPal subscriptions"],
    socialProof: "Trusted by clubs in Georgia and worldwide",
    coachLink: "Sign in as a coach",
  },
  ru: {
    tagline: "Платформа №1 для управления спортклубом",
    headline: "Управляйте всем клубом в одной умной системе",
    subline:
      "Игроки, платежи, тренировки, игры, команды, тренеры, поездки и AI-ассистент — всё на одной современной платформе. 8 видов спорта, 6 языков.",
    ctaTitle: "Начните 7-дневный бесплатный пробный период",
    ctaSubtitle: "Регистрация за 30 секунд — без банковской карты",
    features: [
      { title: "База игроков и команд", desc: "Полные профили, контакты родителей, возрастные группы" },
      { title: "Платежи и финансы", desc: "Авто-график, контроль задолженностей, PDF-квитанции" },
      { title: "Тренировки, игры, поездки", desc: "Календарь, шаблоны недели, участники" },
      { title: "AI-планы и изображения", desc: "Персональные планы по возрасту в один клик" },
      { title: "Отдельный доступ для тренеров", desc: "У каждого тренера свой график и игроки" },
      { title: "Ссылка для онлайн-регистрации", desc: "Родители сами заполняют анкету" },
      { title: "Авто SMS / Email", desc: "Напоминания, подтверждения, уведомления о просрочке" },
      { title: "Много языков и валют", desc: "6 языков • GEL / USD / EUR • 8 видов спорта" },
    ],
    benefits: ["Безопасное облако", "Работает на телефоне и ПК", "Оплата через PayPal"],
    socialProof: "Нам доверяют клубы по всему миру",
    coachLink: "Войти как тренер",
  },
  de: {
    tagline: "Die #1 Plattform für Sportvereinsverwaltung",
    headline: "Führe deinen ganzen Verein in einem smarten System",
    subline:
      "Spieler, Zahlungen, Trainings, Spiele, Teams, Trainer, Reisen und ein KI-Assistent — alles in einer modernen Plattform. 8 Sportarten, 6 Sprachen.",
    ctaTitle: "Starte deine 7-tägige kostenlose Testphase",
    ctaSubtitle: "In 30 Sekunden registriert — ohne Kreditkarte",
    features: [
      { title: "Spieler- & Team-Datenbank", desc: "Profile, Elternkontakte, Altersgruppen" },
      { title: "Zahlungen & Finanzen", desc: "Auto-Plan, Mahnungen, PDF-Quittungen" },
      { title: "Trainings, Spiele, Reisen", desc: "Kalender, Wochenvorlagen, Teilnehmer" },
      { title: "KI-Trainingspläne & Bilder", desc: "Altersgerechte Pläne mit einem Klick" },
      { title: "Eigener Trainer-Zugang", desc: "Jeder Trainer verwaltet seinen Plan & Spieler" },
      { title: "Online-Anmeldelink", desc: "Eltern füllen das Formular selbst aus" },
      { title: "Automatische SMS / E-Mail", desc: "Erinnerungen, Bestätigungen, Mahnungen" },
      { title: "Mehrsprachig & Multiwährung", desc: "6 Sprachen • GEL / USD / EUR • 8 Sportarten" },
    ],
    benefits: ["Sichere Cloud-Daten", "Mobil & Desktop", "PayPal-Abonnements"],
    socialProof: "Vertraut von Vereinen weltweit",
    coachLink: "Als Trainer anmelden",
  },
  es: {
    tagline: "La plataforma #1 para gestión de clubes deportivos",
    headline: "Gestiona todo tu club desde un sistema inteligente",
    subline:
      "Jugadores, pagos, entrenamientos, partidos, equipos, entrenadores, viajes y asistente IA — todo en una plataforma moderna. 8 deportes, 6 idiomas.",
    ctaTitle: "Comienza tu prueba gratuita de 7 días",
    ctaSubtitle: "Regístrate en 30 segundos — sin tarjeta de crédito",
    features: [
      { title: "Base de jugadores y equipos", desc: "Perfiles, contactos de padres, grupos por edad" },
      { title: "Pagos y finanzas", desc: "Calendario automático, vencidos, recibos PDF" },
      { title: "Entrenamientos, partidos, viajes", desc: "Calendario, plantillas semanales, participantes" },
      { title: "Planes IA e imágenes", desc: "Planes personalizados por edad con un clic" },
      { title: "Acceso para entrenadores", desc: "Cada entrenador con su propio plan y jugadores" },
      { title: "Enlace de inscripción online", desc: "Los padres rellenan el formulario directamente" },
      { title: "SMS / Email automáticos", desc: "Recordatorios, confirmaciones, alertas de mora" },
      { title: "Multiidioma y multimoneda", desc: "6 idiomas • GEL / USD / EUR • 8 deportes" },
    ],
    benefits: ["Datos seguros en la nube", "Móvil y escritorio", "Suscripciones PayPal"],
    socialProof: "Clubes de todo el mundo confían en nosotros",
    coachLink: "Entrar como entrenador",
  },
  fr: {
    tagline: "La plateforme #1 de gestion de club sportif",
    headline: "Gérez tout votre club depuis un système intelligent",
    subline:
      "Joueurs, paiements, entraînements, matchs, équipes, coachs, voyages et assistant IA — tout dans une plateforme moderne. 8 sports, 6 langues.",
    ctaTitle: "Commencez votre essai gratuit de 7 jours",
    ctaSubtitle: "Inscription en 30 secondes — sans carte bancaire",
    features: [
      { title: "Base joueurs & équipes", desc: "Profils, contacts parents, groupes d'âge" },
      { title: "Paiements & finances", desc: "Planning auto, retards, reçus PDF" },
      { title: "Entraînements, matchs, voyages", desc: "Calendrier, modèles hebdo, participants" },
      { title: "Plans IA & images", desc: "Plans personnalisés par âge en un clic" },
      { title: "Accès dédié aux coachs", desc: "Chaque coach gère son planning & ses joueurs" },
      { title: "Lien d'inscription en ligne", desc: "Les parents remplissent le formulaire directement" },
      { title: "SMS / Email automatiques", desc: "Rappels, confirmations, alertes de retard" },
      { title: "Multilingue & multidevise", desc: "6 langues • GEL / USD / EUR • 8 sports" },
    ],
    benefits: ["Données sécurisées dans le cloud", "Mobile & bureau", "Abonnements PayPal"],
    socialProof: "Adopté par des clubs dans le monde entier",
    coachLink: "Se connecter en tant que coach",
  },
};

const FEATURE_ICONS = [Users, Wallet, CalendarDays, Sparkles, UserCog, Link2, Bell, Globe2];

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Sign In — My Club" }, { name: "description", content: "Sign in to manage your sports club" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const copy = MARKETING[language] ?? MARKETING.en;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate({ to: "/" });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate({ to: "/" });
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        setError("Sign in failed. Please try again.");
      }
      if (result.redirected) return;
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center px-4 py-10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-orange-500/20 blur-[120px]"
        />
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, -60, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full bg-blue-500/20 blur-[120px]"
        />
        <motion.div
          animate={{
            x: [0, 60, 0],
            y: [0, -80, 0],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] rounded-full bg-emerald-500/20 blur-[120px]"
        />
      </div>

      {/* Stadium-light grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Top-right language switcher */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher variant="topbar" />
      </div>

      {/* Two-column layout: marketing on the left, sign-in on the right */}
      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[1.1fr_minmax(0,420px)] gap-10 lg:gap-16 items-center">

        {/* Marketing / Features column */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-white order-2 lg:order-1"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-400/30 text-orange-300 text-xs font-medium mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
            {copy.tagline}
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4 bg-gradient-to-br from-white via-white to-slate-300 bg-clip-text text-transparent">
            {copy.headline}
          </h2>
          <p className="text-base sm:text-lg text-slate-300/90 mb-8 max-w-xl leading-relaxed">{copy.subline}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            {copy.features.map((feature, i) => {
              const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.06 }}
                  className="flex gap-3 items-start p-3.5 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition-all"
                >
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-400/20 flex items-center justify-center">
                    <Icon className="w-4.5 h-4.5 text-orange-300" strokeWidth={2.2} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-white leading-tight">{feature.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5 leading-snug">{feature.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 mb-6">
            {copy.benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-1.5 text-sm text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{b}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{copy.socialProof}</span>
          </div>
        </motion.div>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative w-full max-w-md mx-auto lg:mx-0 order-1 lg:order-2"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-500 shadow-2xl shadow-orange-500/40 mb-5 ring-1 ring-white/20"
            >
              <Trophy className="w-10 h-10 text-white drop-shadow-lg" strokeWidth={2.5} />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl font-display tracking-[0.15em] text-white drop-shadow-lg"
            >
              CLUB
            </motion.h1>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-3xl font-display tracking-[0.3em] bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent mt-1"
            >
              MANAGEMENT
            </motion.h2>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/[0.04] backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl space-y-4"
          >
            <div className="text-center pb-2">
              <h3 className="text-lg font-semibold text-white">{copy.ctaTitle}</h3>
              <p className="text-xs text-slate-400 mt-1">{copy.ctaSubtitle}</p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center"
              >
                {error}
              </motion.div>
            )}

            <Button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full h-12 text-base bg-white hover:bg-white/90 text-slate-900 font-medium shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {loading ? t("signingIn") : t("continueWithGoogle")}
            </Button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-transparent px-2 text-slate-500">or</span>
              </div>
            </div>

            <Link to="/coach-login" className="block">
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 bg-white/[0.03] border-white/15 text-white hover:bg-white/[0.08] hover:text-white"
              >
                <UserCog className="w-5 h-5 mr-2 text-emerald-300" />
                {copy.coachLink}
              </Button>
            </Link>

            <p className="text-xs text-center text-slate-500 pt-2">{t("bySigningIn")}</p>
          </motion.div>

          <div className="mt-4 flex justify-center">
            <LanguageSwitcher variant="floating" />
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex items-center justify-center gap-4 mt-6 text-xs text-slate-500"
          >
            <span>🏀</span>
            <span>⚽</span>
            <span>🥊</span>
            <span>💃</span>
            <span>🏊</span>
            <span>💪</span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
