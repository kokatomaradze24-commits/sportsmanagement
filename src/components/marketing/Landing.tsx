import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, type Variants } from "framer-motion";
import {
  ArrowRight, Play, Users, BarChart3, Calendar, Wallet, Smartphone,
  Brain, Shield, Zap, Check, ChevronDown, Trophy, Target, Activity,
  TrendingUp, Bell, MessageSquare, Sparkles,
} from "lucide-react";
import heroImg from "@/assets/marketing/hero-sports.jpg";
import aiImg from "@/assets/marketing/ai-analysis.jpg";
import mobileImg from "@/assets/marketing/mobile-app.jpg";
import footballImg from "@/assets/marketing/football-training.jpg";
import basketballImg from "@/assets/marketing/basketball-training.jpg";

const fade: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

const stagger: Variants = {
  show: { transition: { staggerChildren: 0.08 } },
};

function GlowOrb({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute rounded-full blur-3xl opacity-40 ${className}`}
    />
  );
}

function Nav() {
  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 mt-4">
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0E1216]/70 backdrop-blur-xl px-4 sm:px-6 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#00FF85] to-[#00B85F] flex items-center justify-center shadow-[0_0_30px_-5px_#00FF85]">
              <Trophy className="w-5 h-5 text-[#06080A]" strokeWidth={2.5} />
            </div>
            <span className="text-white font-bold tracking-tight text-lg">MY CLUB</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-white/70">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#ai" className="hover:text-white transition">AI Analysis</a>
            <a href="#mobile" className="hover:text-white transition">Mobile</a>
            <a href="#pricing" className="hover:text-white transition">Pricing</a>
            <a href="#faq" className="hover:text-white transition">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="hidden sm:inline-flex text-sm text-white/80 hover:text-white px-3 py-2"
            >
              Sign In
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#06080A] bg-[#00FF85] hover:bg-[#1aff96] transition rounded-lg px-4 py-2 shadow-[0_0_20px_-5px_#00FF85]"
            >
              Start Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-28 pb-16 overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={heroImg}
          alt="Elite basketball and football training with AI analytics overlays"
          className="absolute inset-0 w-full h-full object-cover"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#06080A]/70 via-[#06080A]/85 to-[#06080A]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,255,133,0.12),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(56,189,248,0.10),transparent_50%)]" />
      </div>
      <GlowOrb className="w-[500px] h-[500px] bg-[#00FF85] -top-32 -left-32" />
      <GlowOrb className="w-[400px] h-[400px] bg-sky-500 bottom-0 right-0" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 w-full">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="max-w-4xl"
        >
          <motion.div variants={fade} className="inline-flex items-center gap-2 rounded-full border border-[#00FF85]/30 bg-[#00FF85]/10 px-3 py-1.5 text-xs font-medium text-[#00FF85] mb-6">
            <Sparkles className="w-3.5 h-3.5" /> AI-Powered Sports Operating System
          </motion.div>
          <motion.h1
            variants={fade}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.05]"
            style={{ fontFamily: "Sora, Inter, sans-serif" }}
          >
            The Operating System for{" "}
            <span className="bg-gradient-to-r from-[#00FF85] via-[#7CFFB8] to-sky-300 bg-clip-text text-transparent">
              Modern Sports Clubs
            </span>
          </motion.h1>
          <motion.p
            variants={fade}
            className="mt-6 text-lg sm:text-xl text-white/70 max-w-2xl leading-relaxed"
          >
            Manage players, teams, attendance, payments, communication, and AI-powered
            match analysis from one powerful platform.
          </motion.p>
          <motion.div variants={fade} className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/login"
              className="group inline-flex items-center gap-2 rounded-xl bg-[#00FF85] px-6 py-3.5 text-base font-semibold text-[#06080A] shadow-[0_0_40px_-5px_#00FF85] hover:shadow-[0_0_60px_-5px_#00FF85] hover:scale-[1.02] transition-all"
            >
              Start Managing Your Club
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition" />
            </Link>
            <a
              href="#mobile"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 backdrop-blur px-6 py-3.5 text-base font-medium text-white hover:bg-white/10 transition"
            >
              <Play className="w-4 h-4" /> Watch Demo
            </a>
          </motion.div>

          <motion.div variants={fade} className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl">
            {[
              { v: "500+", l: "Clubs onboarded" },
              { v: "25K+", l: "Active players" },
              { v: "99.9%", l: "Uptime SLA" },
              { v: "6", l: "Languages" },
            ].map((s) => (
              <div key={s.l}>
                <div className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: "Sora" }}>{s.v}</div>
                <div className="text-xs uppercase tracking-wider text-white/50 mt-1">{s.l}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-b from-transparent to-[#06080A]" />
    </section>
  );
}

function TrustedBy() {
  const logos = ["Falcons FC", "Eagles Academy", "Phoenix BBall", "Nordic United", "Atlas Hoops", "Vortex SC"];
  return (
    <section className="relative py-16 border-y border-white/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="text-center text-xs uppercase tracking-[0.3em] text-white/40 mb-8">
          Trusted by elite sports academies worldwide
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {logos.map((name) => (
            <div key={name} className="text-white/40 hover:text-white/70 transition text-lg font-semibold tracking-wide" style={{ fontFamily: "Sora" }}>
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionHeader({ tag, title, sub }: { tag: string; title: React.ReactNode; sub?: string }) {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      className="max-w-3xl mx-auto text-center mb-14"
    >
      <motion.div variants={fade} className="inline-flex items-center gap-2 rounded-full border border-[#00FF85]/25 bg-[#00FF85]/5 px-3 py-1 text-xs font-medium text-[#00FF85] mb-5">
        {tag}
      </motion.div>
      <motion.h2 variants={fade} className="text-4xl sm:text-5xl font-bold tracking-tight text-white" style={{ fontFamily: "Sora" }}>
        {title}
      </motion.h2>
      {sub && <motion.p variants={fade} className="mt-4 text-white/60 text-lg">{sub}</motion.p>}
    </motion.div>
  );
}

function PlayerTeamSection() {
  const items = [
    { icon: Users, title: "Player Roster", desc: "Centralised profiles, jersey numbers, contacts, parents and medical notes." },
    { icon: Shield, title: "Team Builder", desc: "Drag-and-drop rosters, age groups, squad management and depth charts." },
    { icon: Target, title: "Performance", desc: "Track individual KPIs, training load and match minutes per athlete." },
    { icon: Bell, title: "Notifications", desc: "Automated alerts for parents, coaches and players via SMS & in-app." },
  ];
  return (
    <section id="features" className="relative py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader
          tag="Player & Team Management"
          title={<>Every athlete, <span className="text-[#00FF85]">organised</span></>}
          sub="Run your club like a professional organisation with full visibility over players, coaches, and teams."
        />
        <div className="grid lg:grid-cols-5 gap-6">
          <motion.div
            variants={fade}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="lg:col-span-3 relative rounded-3xl border border-white/10 bg-gradient-to-br from-[#0E1216] to-[#06080A] p-1 overflow-hidden"
          >
            <div className="rounded-[22px] overflow-hidden relative">
              <img src={basketballImg} alt="Basketball training" loading="lazy" width={1280} height={896} className="w-full h-full object-cover aspect-[16/11]" />
              <div className="absolute inset-0 bg-gradient-to-tr from-[#06080A] via-transparent to-transparent" />
              <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-end">
                <div className="rounded-2xl border border-white/10 bg-[#0E1216]/80 backdrop-blur-xl p-5 max-w-md">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#00FF85]/15 border border-[#00FF85]/30 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-[#00FF85]" />
                    </div>
                    <div>
                      <div className="text-white text-sm font-semibold">U18 Squad — Live</div>
                      <div className="text-white/50 text-xs">22 players · 87% attendance</div>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { n: "M. Carter", r: "PG", v: 92 },
                      { n: "J. Okafor", r: "SF", v: 88 },
                      { n: "L. Rossi", r: "C", v: 76 },
                    ].map((p) => (
                      <div key={p.n} className="flex items-center gap-3 text-xs">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/70 font-medium">{p.n[0]}</div>
                        <div className="flex-1">
                          <div className="text-white font-medium">{p.n} <span className="text-white/40 ml-1 font-normal">{p.r}</span></div>
                          <div className="h-1 mt-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#00FF85] to-sky-400" style={{ width: `${p.v}%` }} />
                          </div>
                        </div>
                        <div className="text-[#00FF85] font-semibold">{p.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          <div className="lg:col-span-2 grid sm:grid-cols-2 lg:grid-cols-1 gap-4">
            {items.map((it, i) => (
              <motion.div
                key={it.title}
                variants={fade}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group rounded-2xl border border-white/10 bg-[#0E1216]/60 backdrop-blur p-5 hover:border-[#00FF85]/40 hover:bg-[#0E1216] transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-[#00FF85]/10 border border-[#00FF85]/20 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                  <it.icon className="w-5 h-5 text-[#00FF85]" />
                </div>
                <div className="text-white font-semibold">{it.title}</div>
                <div className="text-white/55 text-sm mt-1">{it.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function AIAnalysisSection() {
  return (
    <section id="ai" className="relative py-28 overflow-hidden">
      <GlowOrb className="w-[600px] h-[600px] bg-[#00FF85]/30 -right-40 top-20" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 relative">
        <SectionHeader
          tag="AI Match Analysis"
          title={<>Tactical intelligence, <span className="text-[#00FF85]">on demand</span></>}
          sub="Upload footage or stats, get instant AI breakdowns: formations, weaknesses, opponent tendencies and training recommendations."
        />
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <motion.div
            variants={fade}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="relative rounded-3xl border border-white/10 overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,255,133,0.25)]"
          >
            <img src={aiImg} alt="AI tactical analysis interface" loading="lazy" width={1280} height={896} className="w-full h-auto" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#06080A] via-transparent to-transparent" />
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="space-y-5">
            {[
              { icon: Brain, t: "Auto-generated training plans", d: "Personalised drills tailored to each player's data and age group." },
              { icon: BarChart3, t: "Match statistical analysis", d: "Heatmaps, pass networks, xG, possession quality — explained in plain language." },
              { icon: TrendingUp, t: "Performance forecasting", d: "Predict player development curves and identify breakout talent early." },
              { icon: Zap, t: "Instant tactical reports", d: "PDF reports for your staff after every session, ready in seconds." },
            ].map((f) => (
              <motion.div key={f.t} variants={fade} className="flex gap-4 rounded-2xl border border-white/10 bg-[#0E1216]/60 backdrop-blur p-5 hover:border-[#00FF85]/30 transition">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#00FF85]/20 to-sky-500/10 border border-[#00FF85]/20 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-5 h-5 text-[#00FF85]" />
                </div>
                <div>
                  <div className="text-white font-semibold">{f.t}</div>
                  <div className="text-white/60 text-sm mt-1">{f.d}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function AttendanceSection() {
  return (
    <section className="relative py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader
          tag="Attendance & Scheduling"
          title={<>Never miss a <span className="text-[#00FF85]">session</span></>}
          sub="Weekly templates, recurring practices, and one-tap attendance tracking — synced across every coach and parent."
        />
        <div className="grid lg:grid-cols-3 gap-6">
          <motion.div variants={fade} initial="hidden" whileInView="show" viewport={{ once: true }} className="lg:col-span-2 rounded-3xl border border-white/10 bg-gradient-to-br from-[#0E1216] to-[#06080A] p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-white font-semibold text-lg">This Week</div>
                <div className="text-white/50 text-sm">Nov 18 — Nov 24</div>
              </div>
              <div className="text-xs px-3 py-1.5 rounded-full bg-[#00FF85]/10 text-[#00FF85] border border-[#00FF85]/20">94% attendance</div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d, i) => (
                <div key={d} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 min-h-[110px]">
                  <div className="text-xs text-white/40 mb-2">{d}</div>
                  {i % 2 === 0 && (
                    <div className="rounded-lg bg-[#00FF85]/15 border border-[#00FF85]/30 p-2 text-[10px] text-[#00FF85] font-medium">
                      Practice<br/>17:00
                    </div>
                  )}
                  {i === 5 && (
                    <div className="rounded-lg bg-sky-500/15 border border-sky-500/30 p-2 text-[10px] text-sky-300 font-medium mt-1">
                      Match<br/>14:00
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div variants={fade} initial="hidden" whileInView="show" viewport={{ once: true }} className="rounded-3xl border border-white/10 bg-[#0E1216]/60 p-6 space-y-4">
            <Calendar className="w-8 h-8 text-[#00FF85]" />
            <div className="text-white font-semibold text-lg">Smart scheduling</div>
            <p className="text-white/60 text-sm">Build a season once with weekly templates. Reschedule with a click, notify everyone automatically.</p>
            <div className="pt-3 border-t border-white/5 space-y-2.5">
              {[
                "Auto SMS reminders 2h before",
                "Parent confirmation tracking",
                "Coach session notes",
                "Calendar export (.ics)",
              ].map((t) => (
                <div key={t} className="flex items-center gap-2 text-sm text-white/70">
                  <Check className="w-4 h-4 text-[#00FF85]" />{t}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function FinanceSection() {
  return (
    <section className="relative py-28 overflow-hidden">
      <GlowOrb className="w-[500px] h-[500px] bg-sky-500/20 -left-40 top-20" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 relative">
        <SectionHeader
          tag="Financial Management"
          title={<>Payments that <span className="text-[#00FF85]">run themselves</span></>}
          sub="Membership fees, trip payments, subscriptions — collected on time without chasing parents."
        />
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <motion.div variants={fade} initial="hidden" whileInView="show" viewport={{ once: true }} className="order-2 lg:order-1 space-y-4">
            {[
              { icon: Wallet, t: "Multi-currency invoicing", d: "USD, EUR, GEL and more. Auto-generated PDF receipts." },
              { icon: Bell, t: "Automated reminders", d: "Smart SMS sequences. Parents pay before practice — every time." },
              { icon: BarChart3, t: "Revenue dashboard", d: "Monthly revenue, outstanding balances, season forecast." },
              { icon: Shield, t: "Secure card payments", d: "PCI-compliant processing with full audit trail." },
            ].map((f) => (
              <div key={f.t} className="flex gap-4 rounded-2xl border border-white/10 bg-[#0E1216]/60 p-5">
                <div className="w-11 h-11 rounded-xl bg-[#00FF85]/10 border border-[#00FF85]/20 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-5 h-5 text-[#00FF85]" />
                </div>
                <div>
                  <div className="text-white font-semibold">{f.t}</div>
                  <div className="text-white/60 text-sm mt-1">{f.d}</div>
                </div>
              </div>
            ))}
          </motion.div>
          <motion.div variants={fade} initial="hidden" whileInView="show" viewport={{ once: true }} className="order-1 lg:order-2 rounded-3xl border border-white/10 bg-gradient-to-br from-[#0E1216] to-[#06080A] p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="text-xs uppercase tracking-wider text-white/40">November Revenue</div>
              <div className="text-xs px-2.5 py-1 rounded-full bg-[#00FF85]/10 text-[#00FF85]">+18.2%</div>
            </div>
            <div className="text-5xl font-bold text-white mb-2" style={{ fontFamily: "Sora" }}>$48,920</div>
            <div className="text-white/50 text-sm mb-6">vs $41,400 last month</div>
            <div className="h-32 flex items-end gap-2">
              {[40, 55, 48, 62, 70, 58, 75, 85, 78, 90, 88, 95].map((h, i) => (
                <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-[#00FF85]/30 to-[#00FF85]" style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/5">
              <div>
                <div className="text-white/50 text-xs">Paid</div>
                <div className="text-white font-semibold mt-1">218</div>
              </div>
              <div>
                <div className="text-white/50 text-xs">Pending</div>
                <div className="text-white font-semibold mt-1">12</div>
              </div>
              <div>
                <div className="text-white/50 text-xs">Overdue</div>
                <div className="text-white font-semibold mt-1">3</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function MobileSection() {
  return (
    <section id="mobile" className="relative py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader
          tag="Mobile Experience"
          title={<>Your club, in your <span className="text-[#00FF85]">pocket</span></>}
          sub="A native-quality experience for coaches, players and parents. Works offline, syncs instantly."
        />
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div variants={fade} initial="hidden" whileInView="show" viewport={{ once: true }} className="relative">
            <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-[0_40px_100px_-20px_rgba(0,255,133,0.3)]">
              <img src={mobileImg} alt="Mobile app preview" loading="lazy" width={1024} height={1280} className="w-full h-auto" />
            </div>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="space-y-4">
            {[
              { icon: Smartphone, t: "iOS & Android", d: "Native performance with web technology." },
              { icon: MessageSquare, t: "Push notifications", d: "Match reminders, payment alerts, team announcements." },
              { icon: Activity, t: "Live attendance", d: "Coaches mark attendance courtside with one tap." },
              { icon: TrendingUp, t: "Player progress", d: "Parents follow training stats and AI insights in real time." },
            ].map((f) => (
              <motion.div key={f.t} variants={fade} className="flex items-start gap-4 p-5 rounded-2xl border border-white/10 bg-[#0E1216]/60 hover:border-[#00FF85]/30 transition">
                <div className="w-11 h-11 rounded-xl bg-[#00FF85]/10 border border-[#00FF85]/20 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-5 h-5 text-[#00FF85]" />
                </div>
                <div>
                  <div className="text-white font-semibold">{f.t}</div>
                  <div className="text-white/60 text-sm mt-1">{f.d}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const items = [
    { q: "MY CLUB replaced four tools. Our coaches finally have one screen for everything.", a: "Marcus Lindqvist", r: "Director, Nordic United Academy", img: footballImg },
    { q: "The AI training plans are unreal. Our U16 squad improved 23% on conditioning in a season.", a: "Elena Romano", r: "Head Coach, Atlas Hoops", img: basketballImg },
    { q: "Parents pay on time. That alone paid for the platform 10x over.", a: "Tomáš Novák", r: "President, Phoenix BBall", img: aiImg },
  ];
  return (
    <section className="relative py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader tag="Testimonials" title={<>Trusted by <span className="text-[#00FF85]">elite</span> coaches</>} />
        <div className="grid md:grid-cols-3 gap-6">
          {items.map((t, i) => (
            <motion.div
              key={t.a}
              variants={fade}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0E1216] to-[#06080A] p-7 hover:border-[#00FF85]/30 transition"
            >
              <div className="flex gap-1 text-[#00FF85] mb-4 text-sm">★★★★★</div>
              <p className="text-white/85 leading-relaxed">"{t.q}"</p>
              <div className="mt-6 flex items-center gap-3 pt-5 border-t border-white/5">
                <img src={t.img} alt={t.a} loading="lazy" className="w-10 h-10 rounded-full object-cover border border-white/10" />
                <div>
                  <div className="text-white text-sm font-semibold">{t.a}</div>
                  <div className="text-white/50 text-xs">{t.r}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    {
      name: "Starter", price: "$29", desc: "For small academies just getting started.",
      features: ["Up to 50 players", "Basic attendance", "Payments", "Email support"],
      cta: "Start free trial", highlight: false,
    },
    {
      name: "Pro", price: "$89", desc: "Everything a serious club needs.",
      features: ["Unlimited players", "AI match analysis", "Mobile app", "SMS notifications", "Multi-team support", "Priority support"],
      cta: "Start free trial", highlight: true,
    },
    {
      name: "Elite", price: "Custom", desc: "For professional organisations.",
      features: ["Everything in Pro", "Custom integrations", "Dedicated CSM", "White-label option", "SLA & onboarding"],
      cta: "Contact sales", highlight: false,
    },
  ];
  return (
    <section id="pricing" className="relative py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader tag="Pricing" title={<>Simple, <span className="text-[#00FF85]">transparent</span> pricing</>} sub="Start free for 14 days. No credit card required." />
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((p) => (
            <motion.div
              key={p.name}
              variants={fade}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className={`relative rounded-3xl border p-7 ${p.highlight ? "border-[#00FF85]/50 bg-gradient-to-br from-[#00FF85]/10 to-[#0E1216] shadow-[0_30px_80px_-20px_rgba(0,255,133,0.3)]" : "border-white/10 bg-[#0E1216]/60"}`}
            >
              {p.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#00FF85] text-[#06080A] text-xs font-bold">MOST POPULAR</div>
              )}
              <div className="text-white font-semibold text-lg">{p.name}</div>
              <div className="text-white/55 text-sm mt-1">{p.desc}</div>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-5xl font-bold text-white" style={{ fontFamily: "Sora" }}>{p.price}</span>
                {p.price !== "Custom" && <span className="text-white/50">/mo</span>}
              </div>
              <Link
                to="/login"
                className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition ${p.highlight ? "bg-[#00FF85] text-[#06080A] hover:bg-[#1aff96]" : "border border-white/15 text-white hover:bg-white/5"}`}
              >
                {p.cta} <ArrowRight className="w-4 h-4" />
              </Link>
              <ul className="mt-7 space-y-3 pt-6 border-t border-white/5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-white/75">
                    <Check className="w-4 h-4 text-[#00FF85] flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const items = [
    { q: "Is there a free trial?", a: "Yes — 14 days, full access, no credit card required." },
    { q: "Which sports do you support?", a: "Football and basketball are first-class, with more team sports rolling out." },
    { q: "Can my coaches use the mobile app?", a: "Absolutely. Coaches, players and parents all have role-specific mobile access." },
    { q: "How does AI match analysis work?", a: "Upload stats or footage and our AI returns tactical insights, weaknesses and training drills tailored to your squad." },
    { q: "Do you support multiple languages?", a: "Yes — 6 languages including English, Spanish, French, German, Russian and Georgian." },
    { q: "Is my data secure?", a: "All data is encrypted at rest and in transit. We are GDPR compliant with daily backups." },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="relative py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionHeader tag="FAQ" title="Questions, answered" />
        <div className="space-y-3">
          {items.map((it, i) => (
            <div key={it.q} className="rounded-2xl border border-white/10 bg-[#0E1216]/60 overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition"
              >
                <span className="text-white font-medium">{it.q}</span>
                <ChevronDown className={`w-5 h-5 text-white/50 transition-transform ${open === i ? "rotate-180" : ""}`} />
              </button>
              {open === i && (
                <div className="px-5 pb-5 text-white/65 text-sm leading-relaxed">{it.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="relative py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          variants={fade}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="relative rounded-[2rem] overflow-hidden border border-[#00FF85]/30 p-10 sm:p-16 text-center"
          style={{
            background: "radial-gradient(circle at 50% 0%, rgba(0,255,133,0.18), transparent 60%), linear-gradient(180deg, #0E1216 0%, #06080A 100%)",
          }}
        >
          <GlowOrb className="w-[400px] h-[400px] bg-[#00FF85] top-0 left-1/2 -translate-x-1/2" />
          <div className="relative">
            <h2 className="text-4xl sm:text-6xl font-bold text-white tracking-tight" style={{ fontFamily: "Sora" }}>
              Run your club like the <span className="text-[#00FF85]">pros</span>
            </h2>
            <p className="mt-5 text-white/65 text-lg max-w-2xl mx-auto">
              Join 500+ academies running their entire operation on MY CLUB. 14 days free, no card required.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-[#00FF85] px-7 py-4 text-base font-semibold text-[#06080A] shadow-[0_0_50px_-5px_#00FF85] hover:scale-[1.02] transition"
              >
                Start Managing Your Club <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="#mobile" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 backdrop-blur px-7 py-4 text-base font-medium text-white hover:bg-white/10 transition">
                <Play className="w-4 h-4" /> Watch Demo
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00FF85] to-[#00B85F] flex items-center justify-center">
            <Trophy className="w-4 h-4 text-[#06080A]" strokeWidth={2.5} />
          </div>
          <span className="text-white font-semibold">MY CLUB</span>
          <span className="ml-2">© {new Date().getFullYear()}</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#features" className="hover:text-white transition">Features</a>
          <a href="#pricing" className="hover:text-white transition">Pricing</a>
          <Link to="/login" className="hover:text-white transition">Sign in</Link>
        </div>
      </div>
    </footer>
  );
}

export function Landing() {
  return (
    <div className="min-h-screen bg-[#06080A] text-white antialiased selection:bg-[#00FF85]/30">
      <Nav />
      <Hero />
      <TrustedBy />
      <PlayerTeamSection />
      <AIAnalysisSection />
      <AttendanceSection />
      <FinanceSection />
      <MobileSection />
      <Testimonials />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}
