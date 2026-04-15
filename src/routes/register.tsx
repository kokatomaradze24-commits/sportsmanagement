import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Check, ArrowLeft, Star, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Register — Basketball Club" },
      { name: "description", content: "Join our basketball club. 1 month free trial, then $20/month. Cancel anytime." },
    ],
  }),
  component: RegisterPage,
});

const benefits = [
  { icon: Zap, text: "Full access to training sessions" },
  { icon: Shield, text: "Professional coaching staff" },
  { icon: Star, text: "Tournament & league participation" },
  { icon: Check, text: "Team gear & equipment access" },
  { icon: Check, text: "Cancel anytime — no lock-in" },
];

function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [tNumber, setTNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !tNumber.trim()) return;

    setSubmitting(true);
    const { error } = await supabase.from("players").insert({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      t_number: parseInt(tNumber),
      phone: phone.trim() || null,
      email: email.trim() || null,
    });
    setSubmitting(false);

    if (error) {
      toast.error("Registration failed. Please try again.");
    } else {
      setSuccess(true);
      toast.success("Welcome to the team! 🏀");
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="text-7xl mb-6"
          >
            🏀
          </motion.div>
          <h1 className="text-3xl font-display tracking-wider text-foreground mb-3">
            You're In!
          </h1>
          <p className="text-muted-foreground mb-2">
            Welcome to the team, <span className="text-primary font-semibold">{firstName}</span>!
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            Your 1-month free trial starts now. Enjoy full access to all club benefits.
          </p>
          <Link to="/">
            <Button variant="accent" size="lg">
              <ArrowLeft className="w-4 h-4" /> Go to Dashboard
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Pricing Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-card rounded-3xl border border-border p-8 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/5 rounded-full translate-y-1/2 -translate-x-1/2" />

              <div className="relative">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  className="inline-block bg-success/10 text-success text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4"
                >
                  1 Month Free Trial
                </motion.div>

                <h2 className="text-4xl font-display tracking-wider text-foreground mb-1">
                  Club Membership
                </h2>
                <p className="text-muted-foreground mb-6">Everything you need to play and grow</p>

                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-5xl font-display tracking-wider text-primary">$20</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mb-8">
                  After your free trial. Cancel anytime.
                </p>

                <div className="space-y-4">
                  {benefits.map((benefit, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <benefit.icon className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-card-foreground">{benefit.text}</span>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-border">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Shield className="w-4 h-4" />
                    <span>No commitment — cancel anytime with zero fees</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Registration Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="bg-card rounded-3xl border border-border p-8 shadow-lg">
              <h2 className="text-2xl font-display tracking-wider text-foreground mb-1">
                Join the Team
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                Fill in your details to start your free trial
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                      First Name *
                    </label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                      required
                      className="h-11"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                      Last Name *
                    </label>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      required
                      className="h-11"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                    T-Shirt Number *
                  </label>
                  <Input
                    type="number"
                    value={tNumber}
                    onChange={(e) => setTNumber(e.target.value)}
                    placeholder="23"
                    required
                    min={0}
                    max={99}
                    className="h-11"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                    Phone
                  </label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 234 567 890"
                    className="h-11"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="h-11"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-12 text-base mt-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
                    />
                  ) : (
                    "Start Free Trial 🏀"
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By registering you agree to the club's terms. Your free month starts immediately.
                </p>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
