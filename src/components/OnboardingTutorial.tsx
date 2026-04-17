import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, RotateCcw, Moon, LogOut, Users, CreditCard, Bell, BarChart3 } from "lucide-react";

interface OnboardingTutorialProps {
  open: boolean;
  onComplete: () => void;
}

const STEPS = [
  {
    icon: Trophy,
    title: "სპორტის შეცვლა",
    body: "ამ ღილაკით ნებისმიერ დროს შეგიძლიათ შეცვალოთ არჩეული სპორტი/დისციპლინა. თითოეულ სპორტს აქვს თავისი სახელი, ლოგო და მონაცემები.",
  },
  {
    icon: RotateCcw,
    title: "ბრენდინგის გადაყენება",
    body: "მიმდინარე სპორტისთვის კლუბის სახელი და ლოგო დაუბრუნდება საწყის მნიშვნელობებს. სხვა სპორტებზე გავლენას არ ახდენს.",
  },
  {
    icon: Moon,
    title: "თემა (ბნელი/ნათელი)",
    body: "გადართეთ ნათელ ან ბნელ რეჟიმს შორის თქვენი კომფორტისთვის.",
  },
  {
    icon: LogOut,
    title: "გასვლა",
    body: "ანგარიშიდან გასვლა. შემდგომში ისევ შეგიძლიათ შეხვიდეთ იმავე მეილით.",
  },
  {
    icon: Users,
    title: "მოთამაშეების სია",
    body: "მარცხენა პანელში დაამატეთ, რედაქტირება გაუკეთეთ ან წაშალეთ თქვენი კლუბის წევრები. დააჭირეთ წევრს რომ ნახოთ მისი გადახდები.",
  },
  {
    icon: CreditCard,
    title: "გადახდების მართვა",
    body: "მოთამაშის არჩევის შემდეგ მარჯვენა პანელში დაინახავთ მის ყოველთვიურ გადახდებს — შეგიძლიათ დაამატოთ, შეცვალოთ ან წაშალოთ.",
  },
  {
    icon: Bell,
    title: "შეტყობინებები",
    body: "ზევით გამოჩნდება გაფრთხილებები არასრული ან გადახდების შესახებ, რომ არაფერი გამოგრჩეთ.",
  },
  {
    icon: BarChart3,
    title: "სტატისტიკა",
    body: "ერთ შეხედვით ნახეთ აქტიური წევრების რაოდენობა, შემოსავალი და სხვა ძირითადი მაჩვენებლები.",
  },
];

export function OnboardingTutorial({ open, onComplete }: OnboardingTutorialProps) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];
  const Icon = current.icon;

  const handleNext = () => {
    if (isLast) onComplete();
    else setStep((s) => s + 1);
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-lg"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl tracking-wider flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-1 rounded-md bg-primary/10 text-primary">
              {step + 1} / {STEPS.length}
            </span>
            გაცნობა
          </DialogTitle>
          <DialogDescription>
            მოკლე ტური აპლიკაციის ძირითად ფუნქციებზე.
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="py-4 flex flex-col items-center text-center gap-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/30 flex items-center justify-center">
              <Icon className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-display tracking-wider">{current.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
              {current.body}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-center gap-1.5 pb-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-6 bg-primary" : "w-1.5 bg-muted"
              }`}
            />
          ))}
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between gap-2">
          <Button variant="ghost" onClick={onComplete}>
            გამოტოვება
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
                უკან
              </Button>
            )}
            <Button onClick={handleNext}>
              {isLast ? "დასრულება" : "შემდეგი"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
