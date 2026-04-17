import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, CreditCard, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaymentInfoDialog } from "./PaymentInfoDialog";
import { useAuth } from "@/hooks/use-auth";

export function SubscriptionExpired() {
  const [open, setOpen] = useState(false);
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center shadow-lg"
      >
        <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <Lock className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-display tracking-wider mb-2">წვდომა შეჩერებულია</h1>
        <p className="text-muted-foreground text-sm mb-6">
          თქვენი საბსკრიფშენის ვადა ამოიწურა. საიტით სარგებლობის გასაგრძელებლად გთხოვთ გადაიხადოთ.
        </p>
        <div className="flex flex-col gap-2">
          <Button size="lg" onClick={() => setOpen(true)}>
            <CreditCard className="h-4 w-4 mr-2" />
            გადახდის ინსტრუქცია
          </Button>
          <Button size="lg" variant="ghost" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            გასვლა
          </Button>
        </div>
      </motion.div>
      <PaymentInfoDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
