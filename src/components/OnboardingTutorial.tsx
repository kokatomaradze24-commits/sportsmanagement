import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, RotateCcw, Moon, LogOut, Users, CreditCard, Bell, BarChart3 } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import type { TranslationKey } from "@/lib/i18n/translations";

interface OnboardingTutorialProps {
  open: boolean;
  onComplete: () => void;
}

const STEPS: { icon: React.ComponentType<{ className?: string }>; titleKey: TranslationKey; bodyKey: TranslationKey }[] = [
  { icon: Trophy, titleKey: "tutorialStep1Title", bodyKey: "tutorialStep1Body" },
  { icon: RotateCcw, titleKey: "tutorialStep2Title", bodyKey: "tutorialStep2Body" },
  { icon: Moon, titleKey: "tutorialStep3Title", bodyKey: "tutorialStep3Body" },
  { icon: LogOut, titleKey: "tutorialStep4Title", bodyKey: "tutorialStep4Body" },
  { icon: Users, titleKey: "tutorialStep5Title", bodyKey: "tutorialStep5Body" },
  { icon: CreditCard, titleKey: "tutorialStep6Title", bodyKey: "tutorialStep6Body" },
  { icon: Bell, titleKey: "tutorialStep7Title", bodyKey: "tutorialStep7Body" },
  { icon: BarChart3, titleKey: "tutorialStep8Title", bodyKey: "tutorialStep8Body" },
];

export function OnboardingTutorial({ open, onComplete }: OnboardingTutorialProps) {
  const { t } = useI18n();
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
            {t("tutorialTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("tutorialIntro")}
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
            <h3 className="text-xl font-display tracking-wider">{t(current.titleKey)}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
              {t(current.bodyKey)}
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
            {t("skip")}
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
                {t("back")}
              </Button>
            )}
            <Button onClick={handleNext}>
              {isLast ? t("finish") : t("next")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
