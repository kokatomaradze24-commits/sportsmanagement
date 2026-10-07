import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, CalendarDays, Wallet, Bell, BarChart3, Globe2, CheckCircle2, Sparkles, UserCog, Link2, LoaderCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicReveal, SignInScene } from "@/components/PublicPresentation";
import { lovable } from "@/integrations/lovable/index";
import myClubLogo from "@/assets/my-club-logo.png";
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
    ctaTitle: "7-დღიანი უფასო ვერსია",
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
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Sign In — My Club" },
      { name: "description", content: "Sign in to My Club to manage your sports club: players, payments, practices, teams and coaches." },
      { property: "og:title", content: "Sign In — My Club" },
      { property: "og:description", content: "Sign in to My Club to manage your sports club: players, payments, practices, teams and coaches." },
      { property: "og:url", content: "https://my-club.live/login" },
    ],
    links: [{ rel: "canonical", href: "https://my-club.live/login" }],
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
        extraParams: { prompt: "select_account" },
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

  const cleanCopy = (text: string) => text.replaceAll("—", "-");
  return (
    <SignInScene>
      <PublicReveal className="signin-topbar" delay={0}>
        <img src={myClubLogo} alt="My Club" width={160} height={64} />
        <LanguageSwitcher variant="header" />
      </PublicReveal>
      <section className="signin-hero">
        <div className="signin-intro">
          <PublicReveal delay={.06}><h1>{cleanCopy(copy.headline)}</h1></PublicReveal>
          <PublicReveal delay={.12}><p>{cleanCopy(copy.socialProof)}</p></PublicReveal>
        </div>
        <PublicReveal className="signin-card-entrance" delay={.18}>
          <motion.div className="signin-card" transformTemplate={(_, transform) => `${transform} rotateX(calc(var(--card-rotate-x, 0) * 1deg)) rotateY(calc(var(--card-rotate-y, 0) * 1deg))`} initial={{ scale: .97 }} animate={{ scale: 1 }} transition={{ duration: .5, ease: [.23, 1, .32, 1] }}>
            <h2>{cleanCopy(copy.ctaTitle)}</h2>
            <p className="signin-card-subtitle">{cleanCopy(copy.ctaSubtitle)}</p>
            {error && <div className="public-error" role="alert">{error}</div>}
            <Button onClick={handleGoogleSignIn} disabled={loading} className="signin-primary public-press">
              {loading ? <LoaderCircle className="size-5 animate-spin" /> : <ArrowRight className="size-5" />}
              <span key={String(loading)} className="public-label-swap">{loading ? t("signingIn") : t("continueWithGoogle")}</span>
            </Button>
            <div className="signin-divider" />
            <Button asChild variant="outline" className="signin-secondary public-press"><Link to="/coach-login"><UserCog className="size-5" />{copy.coachLink}</Link></Button>
            <p className="signin-legal">{cleanCopy(t("bySigningIn"))}</p>
          </motion.div>
        </PublicReveal>
      </section>
      <section className="signin-features">
        <div className="signin-section-heading"><p>{copy.tagline}</p><p>{cleanCopy(copy.subline)}</p></div>
        <div className="signin-feature-grid">
          {copy.features.map((feature, i) => { const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length]; return <PublicReveal key={feature.title} className={`signin-feature ${i < 2 ? "signin-feature-wide" : ""}`} scroll delay={i * .06}><div className="signin-feature-icon"><Icon className="size-5" /></div><h3>{feature.title}</h3><p>{feature.desc}</p></PublicReveal>; })}
        </div>
      </section>
      <section className="signin-trust">{copy.benefits.map(b => <div key={b}><CheckCircle2 className="size-4" /><span>{cleanCopy(b)}</span></div>)}<p><BarChart3 className="size-4" />{copy.socialProof}</p></section>
    </SignInScene>
  );
}
