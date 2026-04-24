import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Send, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInput } from "@/components/PhoneInput";
import { useI18n } from "@/hooks/use-i18n";
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
  const dial = getDialCodeForLanguage(language);
  const [info, setInfo] = useState<LinkInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [tNumber, setTNumber] = useState("");
  const [phone, setPhone] = useState(() => prefillPhone("", language));
  const [parentPhone, setParentPhone] = useState(() => prefillPhone("", language));
  const [email, setEmail] = useState("");
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
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/public/player-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          linkId,
          firstName,
          lastName,
          birthDate,
          tNumber: tNumber ? Number(tNumber) : null,
          phone: cleanPhone(phone),
          parentPhone: cleanPhone(parentPhone),
          email,
          notes,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Registration failed");
      setDone(true);
    } catch (e: any) {
      setError(e?.message ?? "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  const sport = getSport(info?.sport);

  return (
    <main className="min-h-screen bg-background px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-xl">
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden">
            {info?.logoUrl ? <img src={info.logoUrl} alt={info.clubName} className="w-full h-full object-cover" /> : <Trophy className="w-8 h-8 text-primary" />}
          </div>
          <h1 className="text-3xl font-display tracking-wide text-foreground">{info?.clubName ?? "Club"}</h1>
          <p className="text-sm text-muted-foreground mt-1">მოთამაშის რეგისტრაცია · {sport.name}</p>
        </div>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
          ) : done ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-14 h-14 mx-auto text-primary mb-3" />
              <h2 className="text-xl font-semibold text-card-foreground">რეგისტრაცია მიღებულია</h2>
              <p className="text-sm text-muted-foreground mt-2">თქვენი მონაცემები კლუბის სიაში გამოჩნდა.</p>
            </div>
          ) : error && !info ? (
            <div className="text-center py-8 space-y-4">
              <p className="text-sm text-destructive">{error}</p>
              <Button asChild variant="outline"><Link to="/login">მთავარ გვერდზე დაბრუნება</Link></Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              {error && <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="text-sm text-muted-foreground mb-1 block">სახელი *</label><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required /></div>
                <div><label className="text-sm text-muted-foreground mb-1 block">გვარი *</label><Input value={lastName} onChange={(e) => setLastName(e.target.value)} required /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="text-sm text-muted-foreground mb-1 block">დაბადების თარიღი *</label><Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} max={new Date().toISOString().slice(0, 10)} required /></div>
                <div><label className="text-sm text-muted-foreground mb-1 block">{sport.numberLabel}</label><Input type="number" min={0} max={999} value={tNumber} onChange={(e) => setTNumber(e.target.value)} placeholder="ავტომატურად თუ ცარიელია" /></div>
              </div>
              <div><label className="text-sm text-muted-foreground mb-1 block">მოთამაშის ტელეფონი</label><PhoneInput value={phone} onChange={setPhone} placeholder={dial.sample} /></div>
              <div><label className="text-sm text-muted-foreground mb-1 block">მშობლის ტელეფონი</label><PhoneInput value={parentPhone} onChange={setParentPhone} placeholder={dial.sample} /></div>
              <div><label className="text-sm text-muted-foreground mb-1 block">Email</label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><label className="text-sm text-muted-foreground mb-1 block">შენიშვნა</label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} /></div>
              <Button type="submit" disabled={submitting} className="w-full">
                <Send className="w-4 h-4 mr-2" /> {submitting ? "იგზავნება..." : "რეგისტრაცია"}
              </Button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}