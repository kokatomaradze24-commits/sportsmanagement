import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Send, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInput } from "@/components/PhoneInput";
import { useI18n } from "@/hooks/use-i18n";
import { useSounds } from "@/hooks/use-sounds";
import { getDialCodeForLanguage, prefillPhone } from "@/lib/phone-codes";
import { getSport } from "@/lib/sports";

export const Route = createFileRoute("/register/$linkId")({
  head: () => ({
    meta: [
      { title: "Player Registration" },
      { name: "description", content: "Register as a player for a sports club" },
    ],
  }),
  component: PublicPlayerRegistration,
});

interface LinkInfo {
  sport: string;
  clubName: string;
  logoUrl: string;
}

function PublicPlayerRegistration() {
  const { linkId } = Route.useParams();
  const { language } = useI18n();
  const { play } = useSounds();
  const dial = getDialCodeForLanguage(language);
  const [info, setInfo] = useState<LinkInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState(() => prefillPhone("", language));
  const [parentPhone, setParentPhone] = useState(() => prefillPhone("", language));
  const [primaryContact, setPrimaryContact] = useState<"player" | "parent">("player");
  const [experienceLevel, setExperienceLevel] = useState<"experienced" | "inexperienced">("experienced");
  const [previousClub, setPreviousClub] = useState("");
  const [previousTeam, setPreviousTeam] = useState("");
  const [league, setLeague] = useState<"A" | "B" | "C" | "">("");
  const [lastCoach, setLastCoach] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setPhone((v) => (v.trim() ? v : prefillPhone("", language)));
    setParentPhone((v) => (v.trim() ? v : prefillPhone("", language)));
  }, [language]);

  useEffect(() => {
    let active = true;
    fetch(`/api/public/player-registration?linkId=${encodeURIComponent(linkId)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Registration link not found");
        if (active) setInfo(data);
      })
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [linkId]);

  const cleanPhone = (value: string) => {
    const v = value.trim();
    return v === dial.code || v.replace(/[\s-]/g, "") === dial.code ? "" : v;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedPhone = cleanPhone(phone);
    const cleanedParentPhone = cleanPhone(parentPhone);
    if ((primaryContact === "player" && !cleanedPhone) || (primaryContact === "parent" && !cleanedParentPhone)) {
      setError("გთხოვთ შეავსოთ არჩეული საკონტაქტო ტელეფონის ნომერი");
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
          previousTeam,
          league,
          lastCoach,
          notes,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Registration failed");
      play("success");
      setDone(true);
    } catch (e: any) {
      setError(e?.message ?? "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  const sport = getSport(info?.sport);

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
          <p className="text-sm text-primary-foreground/70 mt-2">მოთამაშის რეგისტრაცია · {sport.name}</p>
        </div>

        <section className="rounded-3xl border border-primary/25 bg-card/90 p-6 shadow-2xl shadow-primary/20 backdrop-blur-xl transition-all duration-300 hover:border-primary/40 hover:shadow-primary/30">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
          ) : done ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-14 h-14 mx-auto text-primary mb-3" />
              <h2 className="text-xl font-semibold text-card-foreground">თქვენ წარმატებით დარეგისტრირდით</h2>
              <p className="text-sm text-muted-foreground mt-2">ჩვენი მენეჯერი 24 საათის განმავლობაში დაგიკავშირდებათ თქვენს მიერ დატოვებულ ტელეფონის ნომერზე. გისურვებთ წარმატებებს.</p>
            </div>
          ) : error && !info ? (
            <div className="text-center py-8 space-y-4">
              <p className="text-sm text-destructive">{error}</p>
              <Button asChild variant="outline"><Link to="/login">მთავარ გვერდზე დაბრუნება</Link></Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <p className="rounded-2xl border border-primary/25 bg-primary/10 p-4 text-sm leading-6 text-card-foreground shadow-sm">
                მოხარული ვიქნებით, თუ ჩვენს კლუბს შემოუერთდებით. გთხოვთ, ყურადღებით შეავსოთ ქვემოთ მოცემული ველები და ჩვენი მენეჯერი 24 საათის განმავლობაში დაგიკავშირდებათ. წარმატებებს გისურვებთ!
              </p>
              {error && <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="text-sm text-muted-foreground mb-1 block">სახელი *</label><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required /></div>
                <div><label className="text-sm text-muted-foreground mb-1 block">გვარი *</label><Input value={lastName} onChange={(e) => setLastName(e.target.value)} required /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="text-sm text-muted-foreground mb-1 block">დაბადების თარიღი *</label><Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} max={new Date().toISOString().slice(0, 10)} required /></div>
              </div>
              <div className="rounded-2xl border border-border bg-secondary/30 p-4 space-y-3">
                <label className="text-sm text-muted-foreground block">საკონტაქტო ტელეფონი *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <label className="flex items-center gap-2"><input type="radio" name="primaryContact" checked={primaryContact === "player"} onChange={() => setPrimaryContact("player")} /> პირადი ნომერი</label>
                  <label className="flex items-center gap-2"><input type="radio" name="primaryContact" checked={primaryContact === "parent"} onChange={() => setPrimaryContact("parent")} /> მშობლის ნომერი</label>
                </div>
                {primaryContact === "player" ? <PhoneInput value={phone} onChange={setPhone} placeholder={dial.sample} /> : <PhoneInput value={parentPhone} onChange={setParentPhone} placeholder={dial.sample} />}
              </div>
              <div className="rounded-2xl border border-border bg-secondary/30 p-4 space-y-3">
                <label className="text-sm text-muted-foreground block">მოთამაშის გამოცდილება *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <label className="flex items-center gap-2"><input type="radio" name="experience" checked={experienceLevel === "experienced"} onChange={() => setExperienceLevel("experienced")} /> აქვს გამოცდილება</label>
                  <label className="flex items-center gap-2"><input type="radio" name="experience" checked={experienceLevel === "inexperienced"} onChange={() => setExperienceLevel("inexperienced")} /> გამოუცდელი</label>
                </div>
                {experienceLevel === "experienced" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="text-sm text-muted-foreground mb-1 block">წინა კლუბი *</label><Input value={previousClub} onChange={(e) => setPreviousClub(e.target.value)} required /></div>
                    <div><label className="text-sm text-muted-foreground mb-1 block">გუნდი *</label><Input value={previousTeam} onChange={(e) => setPreviousTeam(e.target.value)} required /></div>
                    <div><label className="text-sm text-muted-foreground mb-1 block">ლიგა *</label><select value={league} onChange={(e) => setLeague(e.target.value as "A" | "B" | "C" | "")} required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"><option value="">აირჩიეთ</option><option value="A">A</option><option value="B">B</option><option value="C">C</option></select></div>
                    <div><label className="text-sm text-muted-foreground mb-1 block">ბოლო მწვრთნელი *</label><Input value={lastCoach} onChange={(e) => setLastCoach(e.target.value)} required /></div>
                  </div>
                )}
              </div>
              <div><label className="text-sm text-muted-foreground mb-1 block">შენიშვნა</label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} /></div>
              <Button type="submit" disabled={submitting} size="lg" onMouseEnter={() => play("hover")} className="w-full btn-animated shadow-xl shadow-primary/30 hover:shadow-primary/40">
                <Send className="w-4 h-4 mr-2" /> {submitting ? "იგზავნება..." : "რეგისტრაცია"}
              </Button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}