import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setCoachSession, getCoachSession } from "@/lib/coach-session";

export const Route = createFileRoute("/coach-login")({
  head: () => ({
    meta: [
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
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center px-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <motion.div
        animate={{ x: [0, 80, 0], y: [0, -50, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-emerald-500/20 blur-[120px]"
      />
      <motion.div
        animate={{ x: [0, -60, 0], y: [0, 40, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-blue-500/20 blur-[120px]"
      />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md z-10"
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-lg shadow-emerald-500/30 mb-4">
            <ShieldCheck className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-display tracking-wide text-white">მწვრთნელის შესვლა</h1>
          <p className="text-sm text-slate-400 mt-1">შედით კლუბისგან მიღებული username-ით და პაროლით</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/[0.04] backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl space-y-4"
        >
          {error && (
            <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-slate-200">Username</Label>
            <Input
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
              placeholder="e.g. lakers_coach1"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-slate-200">Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full h-11">
            {loading ? "Signing in..." : "Sign In"}
          </Button>

          <div className="text-center text-xs text-slate-400 pt-2">
            Are you the club admin?{" "}
            <Link to="/login" className="text-emerald-300 hover:underline">
              კლუბის შესვლა
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
