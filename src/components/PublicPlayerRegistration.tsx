import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Send, Trophy, LoaderCircle, Link2 } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AtmosphereBackground } from "@/components/AtmosphereBackground";
import { PublicReveal, RegistrationHeader, usePublicPresentation } from "@/components/PublicPresentation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInput } from "@/components/PhoneInput";
import { useI18n } from "@/hooks/use-i18n";
import { useSounds } from "@/hooks/use-sounds";
import { getDialCodeForLanguage, prefillPhone } from "@/lib/phone-codes";
import { getSport } from "@/lib/sports";
import { LANGUAGES, type LanguageCode } from "@/lib/i18n/translations";

interface LinkInfo {
  sport: string;
  clubName: string;
  logoUrl: string;
  language: LanguageCode;
}

export function PublicPlayerRegistration({ linkId }: { linkId: string }) {
  usePublicPresentation("registration");
  const reduceMotion = useReducedMotion();
  const { setLanguage, language, t: translate, monthLong } = useI18n();
  const t = (...args: Parameters<typeof translate>) => translate(...args).replaceAll("—", "-");
  const { play } = useSounds();
  const [info, setInfo] = useState<LinkInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pageLang: LanguageCode = info?.language ?? language;
  // Registration links always default the phone prefix to Georgia.
  const dial = getDialCodeForLanguage("ka");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [phone, setPhone] = useState(() => prefillPhone("", "ka"));
  const [parentPhone, setParentPhone] = useState(() => prefillPhone("", "ka"));
  const [primaryContact, setPrimaryContact] = useState<"player" | "parent">("player");
  const [experienceLevel, setExperienceLevel] = useState<"experienced" | "inexperienced">("experienced");
  const [previousClub, setPreviousClub] = useState("");
  const [league, setLeague] = useState<"A" | "B" | "C" | "">("");
  const [lastCoach, setLastCoach] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (info?.language && LANGUAGES.some((l) => l.code === info.language) && info.language !== language) {
      setLanguage(info.language);
    }
  }, [info?.language, language, setLanguage]);

  useEffect(() => {
    setPhone((v) => (v.trim() && v.trim() !== `${getDialCodeForLanguage(language).code}` ? v : prefillPhone("", "ka")));
    setParentPhone((v) => (v.trim() && v.trim() !== `${getDialCodeForLanguage(language).code}` ? v : prefillPhone("", "ka")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageLang]);

  useEffect(() => {
    let active = true;
    fetch(`/api/public/player-registration?linkId=${encodeURIComponent(linkId)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? t("regLinkNotFound"));
        if (active) setInfo(data);
      })
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [linkId, translate]);

  const cleanPhone = (value: string) => {
    const v = value.trim();
    return v === dial.code || v.replace(/[\s-]/g, "") === dial.code ? "" : v;
  };

  // Names must be typed with Latin letters only.
  const hasNonLatin = (value: string) => /[^a-zA-Z\s'\-.]/.test(value.trim());
  const firstNameNonLatin = hasNonLatin(firstName);
  const lastNameNonLatin = hasNonLatin(lastName);

  const years = useMemo(() => {
    const now = new Date().getFullYear();
    const arr: number[] = [];
    for (let y = now; y >= now - 80; y--) arr.push(y);
    return arr;
  }, []);

  const daysInMonth = useMemo(() => {
    const m = Number(birthMonth);
    const y = Number(birthYear);
    if (!m) return 31;
    if (!y) return m === 2 ? 29 : [4, 6, 9, 11].includes(m) ? 30 : 31;
    return new Date(y, m, 0).getDate();
  }, [birthMonth, birthYear]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (firstNameNonLatin || lastNameNonLatin) {
      setError(t("regLatinOnly"));
      return;
    }
    if (!birthDay || !birthMonth || !birthYear) {
      setError(t("regBirthDate"));
      return;
    }
    const birthDate = `${birthYear}-${String(birthMonth).padStart(2, "0")}-${String(birthDay).padStart(2, "0")}`;
    const cleanedPhone = cleanPhone(phone);
    const cleanedParentPhone = cleanPhone(parentPhone);
    if ((primaryContact === "player" && !cleanedPhone) || (primaryContact === "parent" && !cleanedParentPhone)) {
      setError(t("regContactRequired"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      play("click");
      const res = await fetch("/api/public/player-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          linkId,
          firstName,
          lastName,
          birthDate,
          phone: cleanedPhone,
          parentPhone: cleanedParentPhone,
          primaryContact,
          experienceLevel,
          previousClub,
          league,
          lastCoach,
          notes,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("regFailed"));
      play("success");
      setDone(true);
    } catch (e: any) {
      setError(e?.message ?? t("regFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const sport = getSport(info?.sport);
  const dayOptions = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  const selectClass = "registration-select";

  return (
    <main className="public-page registration-page">
      <AtmosphereBackground variant="registration" />
      <div className="registration-column">
        <RegistrationHeader club={info?.clubName ?? "Club"} title={t("regSubtitle")} subtitle={sport.name} logo={info?.logoUrl ? <img src={info.logoUrl} alt={info.clubName} width={72} height={72} /> : <Trophy className="size-8 text-primary" />} />
        <section className="registration-body">
          {loading ? (
            <div className="registration-state"><LoaderCircle className="size-8 animate-spin" /><p>{t("loading")}</p></div>
          ) : done ? (
            <div className="registration-state">
              <motion.div className="registration-success-icon" initial={{ opacity: 0, scale: reduceMotion ? 1 : .9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", bounce: .15 }}><CheckCircle2 className="size-9" /></motion.div>
              <h2 className="text-xl font-semibold text-card-foreground">{t("regSuccessTitle")}</h2>
              <p className="text-sm text-muted-foreground mt-2">{t("regSuccessBody")}</p><p>{info?.clubName}</p>
            </div>
          ) : error && !info ? (
            <div className="registration-state space-y-4"><Link2 className="size-8 text-muted-foreground" />
              <p className="text-sm text-destructive">{error}</p>
              <Button asChild variant="outline"><Link to="/login">{t("regBackHome")}</Link></Button>
            </div>
          ) : (
            <form onSubmit={submit} className="registration-form" onInvalidCapture={(event) => { const field = event.target; if (field instanceof HTMLElement) { field.scrollIntoView({ block: "center", behavior: "instant" }); if (!reduceMotion && event.nativeEvent.isTrusted) { field.animate([{ transform: "translateX(0)" }, { transform: "translateX(-3px)" }, { transform: "translateX(3px)" }, { transform: "translateX(0)" }], { duration: 220 }); } } }}>
              <p className="registration-intro">
                {t("regIntro")}
              </p>
              {error && <div className="public-error">{error}</div>}
              <PublicReveal scroll className="registration-group" ><h2>{t("sectionPlayers")}</h2>
              <div className="registration-name-fields">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">{t("regFirstName")} *</label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required className={firstNameNonLatin ? "border-destructive" : undefined} />
                  {firstNameNonLatin && <p className="text-xs text-destructive mt-1">{t("regLatinOnly")}</p>}
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">{t("regLastName")} *</label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required className={lastNameNonLatin ? "border-destructive" : undefined} />
                  {lastNameNonLatin && <p className="text-xs text-destructive mt-1">{t("regLatinOnly")}</p>}
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t("regBirthDate")} *</label>
                <div className="registration-birth-row">
                  <select value={birthDay} onChange={(e) => setBirthDay(e.target.value)} required className={selectClass} aria-label={t("regDay")}>
                    <option value="">{t("regDay")}</option>
                    {dayOptions.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)} required className={selectClass} aria-label={t("regMonth")}>
                    <option value="">{t("regMonth")}</option>
                    {monthOptions.map((m) => <option key={m} value={m}>{monthLong(m)}</option>)}
                  </select>
                  <select value={birthYear} onChange={(e) => setBirthYear(e.target.value)} required className={selectClass} aria-label={t("regYear")}>
                    <option value="">{t("regYear")}</option>
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              </PublicReveal>
              <PublicReveal scroll className="registration-group">
                <label className="text-sm text-muted-foreground block">{t("regContactPhone")} *</label>
                <div className="registration-segmented">
                  <label className="registration-segment"><input type="radio" name="primaryContact" checked={primaryContact === "player"} onChange={() => setPrimaryContact("player")} />{primaryContact === "player" && <motion.span className="registration-segment-thumb" layoutId="primary-contact-thumb" transition={{ type: "spring", bounce: reduceMotion ? 0 : .15, duration: .25 }} />}<span>{t("regPlayerPhone")}</span></label>
                  <label className="registration-segment"><input type="radio" name="primaryContact" checked={primaryContact === "parent"} onChange={() => setPrimaryContact("parent")} />{primaryContact === "parent" && <motion.span className="registration-segment-thumb" layoutId="primary-contact-thumb" transition={{ type: "spring", bounce: reduceMotion ? 0 : .15, duration: .25 }} />}<span>{t("regParentPhone")}</span></label>
                </div>
                {primaryContact === "player" ? <PhoneInput value={phone} onChange={setPhone} placeholder={dial.sample} /> : <PhoneInput value={parentPhone} onChange={setParentPhone} placeholder={dial.sample} />}
              </PublicReveal>
              <PublicReveal scroll className="registration-group">
                <label className="text-sm text-muted-foreground block">{t("regExperience")} *</label>
                <div className="registration-segmented">
                  <label className="registration-segment"><input type="radio" name="experience" checked={experienceLevel === "experienced"} onChange={() => setExperienceLevel("experienced")} />{experienceLevel === "experienced" && <motion.span className="registration-segment-thumb" layoutId="experience-thumb" transition={{ type: "spring", bounce: reduceMotion ? 0 : .15, duration: .25 }} />}<span>{t("regExperienced")}</span></label>
                  <label className="registration-segment"><input type="radio" name="experience" checked={experienceLevel === "inexperienced"} onChange={() => setExperienceLevel("inexperienced")} />{experienceLevel === "inexperienced" && <motion.span className="registration-segment-thumb" layoutId="experience-thumb" transition={{ type: "spring", bounce: reduceMotion ? 0 : .15, duration: .25 }} />}<span>{t("regInexperienced")}</span></label>
                </div>
                <AnimatePresence initial={false}>
                {experienceLevel === "experienced" && (
                  <motion.div key="experience-fields" initial={{ opacity: 0, height: reduceMotion ? "auto" : 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: reduceMotion ? "auto" : 0 }} transition={{ duration: .24, ease: [.23,1,.32,1] }} className="registration-experience-fields">
                    <div><label className="text-sm text-muted-foreground mb-1 block">{t("regPreviousClub")} *</label><Input value={previousClub} onChange={(e) => setPreviousClub(e.target.value)} required /></div>
                    <div><label className="text-sm text-muted-foreground mb-1 block">{t("regLeague")} *</label><select value={league} onChange={(e) => setLeague(e.target.value as "A" | "B" | "C" | "")} required className={selectClass}><option value="">{t("regSelect")}</option><option value="A">A</option><option value="B">B</option><option value="C">C</option></select></div>
                    <div className="sm:col-span-2"><label className="text-sm text-muted-foreground mb-1 block">{t("regLastCoach")} *</label><Input value={lastCoach} onChange={(e) => setLastCoach(e.target.value)} required /></div>
                  </motion.div>
                )}
                </AnimatePresence>
              </PublicReveal>
              <PublicReveal scroll className="registration-group"><label className="text-sm text-muted-foreground mb-1 block">{t("regNotes")}</label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} /></PublicReveal>
              <div className="registration-submit-bar"><Button type="submit" disabled={submitting} size="lg" className="registration-submit public-press">
                {submitting ? <LoaderCircle className="size-5 animate-spin" /> : <Send className="size-5" />}<span className="public-label-swap" key={String(submitting)}>{submitting ? t("regSubmitting") : t("regSubmit")}</span>
              </Button></div>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
