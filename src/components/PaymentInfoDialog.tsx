import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, CreditCard } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/hooks/use-i18n";

interface PaymentInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ACCOUNTS = [
  { bank: "TBC Bank", iban: "GE08TB7019336010100099" },
  { bank: "Bank of Georgia", iban: "GE67BG0000000611476449" },
];

export function PaymentInfoDialog({ open, onOpenChange }: PaymentInfoDialogProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (iban: string) => {
    await navigator.clipboard.writeText(iban);
    setCopied(iban);
    toast.success(t("accountCopied"));
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            {t("paymentInstructionsTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("paymentInstructionsDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {ACCOUNTS.map((acc) => (
            <div
              key={acc.iban}
              className="border border-border rounded-xl p-4 bg-muted/30"
            >
              <div className="text-xs text-muted-foreground font-medium mb-1">{acc.bank}</div>
              <div className="flex items-center justify-between gap-2">
                <code className="text-sm font-mono font-semibold tracking-wide break-all">
                  {acc.iban}
                </code>
                <Button
                  size="icon"
                  variant="ghost"
                  className="shrink-0"
                  onClick={() => copy(acc.iban)}
                >
                  {copied === acc.iban ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}

          <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 mt-4">
            {t("paymentTip")}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
