import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { usePlayerRegistrationRequests } from "@/hooks/use-player-registration-requests";
import { useSounds } from "@/hooks/use-sounds";
import { useI18n } from "@/hooks/use-i18n";

interface Props {
  sportId: string;
  userId?: string;
  label: string;
}

export function RegistrationNotificationsBell({ sportId, userId, label }: Props) {
  const { requests, refetch } = usePlayerRegistrationRequests(sportId);
  const { play } = useSounds();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const visibleRequests = requests.filter((r) => !seenIds.has(r.id));
  const count = visibleRequests.length;

  useEffect(() => {
    if (!userId || !sportId) return;
    const channel = supabase
      .channel(`reg-requests-${userId}-${sportId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "player_registration_requests",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as { sport?: string; first_name?: string; last_name?: string };
          if (row.sport !== sportId) return;
          toast.success(t("notifNewRegistration"), {
            description: t("notifRegisteredDesc", { name: `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() }),
            icon: <UserPlus className="w-4 h-4" />,
          });
          play("success");
          void refetch();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, sportId, refetch, play, t]);

  const handleScrollToList = (requestId?: string) => {
    setOpen(false);
    if (requestId) {
      setSeenIds((prev) => {
        const next = new Set(prev);
        next.add(requestId);
        return next;
      });
    } else {
      setSeenIds(new Set(requests.map((r) => r.id)));
    }
    const el = document.querySelector<HTMLElement>("[data-players-list]");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full w-12 h-12 sm:w-14 sm:h-14 relative" title={label}>
            <Bell className="w-6 h-6 sm:w-7 sm:h-7" />
            <AnimatePresence>
              {count > 0 && (
                <motion.span
                  key="badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1.5 rounded-full bg-destructive text-destructive-foreground text-[11px] font-bold flex items-center justify-center leading-none ring-2 ring-background"
                >
                  {count > 99 ? "99+" : count}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          <div className="px-4 py-3 border-b border-border">
            <p className="font-semibold text-sm">{t("notifPanelTitle")}</p>
            <p className="text-xs text-muted-foreground">{t("notifPanelSubtitle")}</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {count === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                {t("notifPanelEmpty")}
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {visibleRequests.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => handleScrollToList(r.id)}
                      className="w-full px-4 py-3 flex items-start gap-3 hover:bg-muted/50 text-left transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
                        <UserPlus className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {r.first_name} {r.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {t("notifRegisteredViaLink")} • {new Date(r.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {count > 0 && (
            <div className="px-4 py-2 border-t border-border">
              <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => handleScrollToList()}>
                {t("notifGoToPlayers")}
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
      <span className="text-[11px] sm:text-xs text-muted-foreground leading-none">{label}</span>
    </div>
  );
}
