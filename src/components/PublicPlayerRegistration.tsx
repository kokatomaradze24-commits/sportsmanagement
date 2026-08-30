import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Send, Trophy } from "lucide-react";
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
  const { setLanguage, language, t, monthLong } = useI18n();
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
  }, [linkId, t]);

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
  const selectClass = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm";

  return (
    <main className="relative min-h-screen overflow-hidden bg-registration-dark px-4 py-8 flex items-center justify-center text-foreground">
      <div className="registration-grid" />
      <div className="registration-beam registration-beam-one" />
      <div className="registration-beam registration-beam-two" />
      <div className="relative z-10 w-full max-w-2xl animate-fade-in">
        <div className="text-center mb-7">
          <div className="mx-auto mb-4 w-20 h-20 rounded-3xl bg-card/90 border border-primary/30 shadow-2xl shadow-primary/20 flex items-center justify-center overflow-hidden transition-transform duration-300 hover:scale-105">
            {info?.logoUrl ? <img src={info.logoUrl} alt={info.clubName} className="w-full h-full object-cover" /> : <Trophy className="w-10 h-10 text-primary" />}
          </div>
          <h1 className="text-4xl font-display tracking-wide text-primary-foreground drop-shadow-lg">{info?.clubName ?? "Club"}</h1>
          <p className="text-sm text-primary-foreground/70 mt-2">{t("regSubtitle")} · {sport.name}</p>
        </div>

        <section className="rounded-3xl border border-primary/25 bg-card/90 p-6 shadow-2xl shadow-primary/20 backdrop-blur-xl transition-all duration-300 hover:border-primary/40 hover:shadow-primary/30">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t("loading")}</p>
          ) : done ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-14 h-14 mx-auto text-primary mb-3" />
              <h2 className="text-xl font-semibold text-card-foreground">{t("regSuccessTitle")}</h2>
              <p className="text-sm text-muted-foreground mt-2">{t("regSuccessBody")}</p>
            </div>
          ) : error && !info ? (
            <div className="text-center py-8 space-y-4">
              <p className="text-sm text-destructive">{error}</p>
              <Button asChild variant="outline"><Link to="/login">{t("regBackHome")}</Link></Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <p className="rounded-2xl border border-primary/25 bg-primary/10 p-4 text-sm leading-6 text-card-foreground shadow-sm">
                {t("regIntro")}
              </p>
              {error && <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="grid grid-cols-3 gap-2">
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
              <div className="rounded-2xl border border-border bg-secondary/30 p-4 space-y-3">
                <label className="text-sm text-muted-foreground block">{t("regContactPhone")} *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <label className="flex items-center gap-2"><input type="radio" name="primaryContact" checked={primaryContact === "player"} onChange={() => setPrimaryContact("player")} /> {t("regPlayerPhone")}</label>
                  <label className="flex items-center gap-2"><input type="radio" name="primaryContact" checked={primaryContact === "parent"} onChange={() => setPrimaryContact("parent")} /> {t("regParentPhone")}</label>
                </div>
                {primaryContact === "player" ? <PhoneInput value={phone} onChange={setPhone} placeholder={dial.sample} /> : <PhoneInput value={parentPhone} onChange={setParentPhone} placeholder={dial.sample} />}
              </div>
              <div className="rounded-2xl border border-border bg-secondary/30 p-4 space-y-3">
                <label className="text-sm text-muted-foreground block">{t("regExperience")} *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <label className="flex items-center gap-2"><input type="radio" name="experience" checked={experienceLevel === "experienced"} onChange={() => setExperienceLevel("experienced")} /> {t("regExperienced")}</label>
                  <label className="flex items-center gap-2"><input type="radio" name="experience" checked={experienceLevel === "inexperienced"} onChange={() => setExperienceLevel("inexperienced")} /> {t("regInexperienced")}</label>
                </div>
                {experienceLevel === "experienced" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="text-sm text-muted-foreground mb-1 block">{t("regPreviousClub")} *</label><Input value={previousClub} onChange={(e) => setPreviousClub(e.target.value)} required /></div>
                    <div><label className="text-sm text-muted-foreground mb-1 block">{t("regLeague")} *</label><select value={league} onChange={(e) => setLeague(e.target.value as "A" | "B" | "C" | "")} required className={selectClass}><option value="">{t("regSelect")}</option><option value="A">A</option><option value="B">B</option><option value="C">C</option></select></div>
                    <div className="sm:col-span-2"><label className="text-sm text-muted-foreground mb-1 block">{t("regLastCoach")} *</label><Input value={lastCoach} onChange={(e) => setLastCoach(e.target.value)} required /></div>
                  </div>
                )}
              </div>
              <div><label className="text-sm text-muted-foreground mb-1 block">{t("regNotes")}</label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} /></div>
              <Button type="submit" disabled={submitting} size="lg" onMouseEnter={() => play("hover")} className="w-full btn-animated shadow-xl shadow-primary/30 hover:shadow-primary/40">
                <Send className="w-4 h-4 mr-2" /> {submitting ? t("regSubmitting") : t("regSubmit")}
              </Button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
