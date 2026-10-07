import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ShieldCheck, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignInScene, PublicReveal } from "@/components/PublicPresentation";
import myClubLogo from "@/assets/my-club-logo.png";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { setCoachSession, getCoachSession } from "@/lib/coach-session";

export const Route = createFileRoute("/coach-login")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Coach Sign In — My Club" },
      { name: "description", content: "Coach sign-in to My Club to view your training schedule, players and assignments." },
      { property: "og:title", content: "Coach Sign In — My Club" },
      { property: "og:description", content: "Coach sign-in to My Club to view your training schedule, players and assignments." },
      { property: "og:url", content: "https://my-club.live/coach-login" },
    ],
    links: [{ rel: "canonical", href: "https://my-club.live/coach-login" }],
  }),
  component: CoachLoginPage,
});

function CoachLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (getCoachSession()) navigate({ to: "/coach" });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/coach/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Login failed");
      }
      const data = await res.json();
      setCoachSession(data);
      navigate({ to: "/coach" });
    } catch (err: any) {
      setError(err?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SignInScene>
      <PublicReveal className="signin-topbar"><img src={myClubLogo} alt="My Club" width={160} height={64} /><LanguageSwitcher variant="header" /></PublicReveal>
      <div className="coach-signin-layout">
      <PublicReveal className="signin-card-entrance" delay={.18}>
        <div className="signin-card">
          <ShieldCheck className="size-8 text-primary mb-4" />
          <h1>მწვრთნელის შესვლა</h1>
          <p className="signin-card-subtitle">შედით კლუბისგან მიღებული username-ით და პაროლით</p>
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {error && (
            <div className="public-error">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-foreground">Username</Label>
            <Input
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              className="coach-input"
              placeholder="e.g. lakers_coach1"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-foreground">Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="coach-input"
            />
          </div>

          <Button type="submit" disabled={loading} className="signin-primary public-press">
            {loading && <LoaderCircle className="size-5 animate-spin" />}<span className="public-label-swap" key={String(loading)}>{loading ? "Signing in..." : "Sign In"}</span>
          </Button>

          <div className="signin-legal">
            Are you the club admin?{" "}
            <Link to="/login" className="text-primary hover:underline">
              კლუბის შესვლა
            </Link>
          </div>
        </form>
        </div>
      </PublicReveal>
      </div>
    </SignInScene>
  );
}
