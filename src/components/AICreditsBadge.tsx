import { useState } from "react";
import { Sparkles, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useAICredits } from "@/hooks/use-ai-credits";
import { AICreditsPurchaseDialog } from "./AICreditsPurchaseDialog";

export function AICreditsBadge() {
  const { user } = useAuth();
  const { credits, refresh } = useAICredits();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-9 gap-1.5 rounded-full px-3 border-primary/30 bg-primary/5 hover:bg-primary/10"
        title="AI კრედიტების შეძენა"
      >
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span className="font-semibold tabular-nums text-sm">{credits ?? 0}</span>
        <Plus className="h-3.5 w-3.5 opacity-60" />
      </Button>
      <AICreditsPurchaseDialog
        open={open}
        onOpenChange={setOpen}
        onSuccess={() => refresh()}
      />
    </>
  );
}
