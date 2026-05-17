import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { usePlayerRegistrationRequests } from "@/hooks/use-player-registration-requests";

interface Props {
  sportId: string;
  userId?: string;
  label: string;
}

export function RegistrationNotificationsBell({ sportId, userId, label }: Props) {
  const { requests, refetch } = usePlayerRegistrationRequests(sportId);
  const [open, setOpen] = useState(false);
  const count = requests.length;

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
          toast.success("ახალი რეგისტრაცია", {
            description: `${row.first_name ?? ""} ${row.last_name ?? ""} დარეგისტრირდა`,
            icon: <UserPlus className="w-4 h-4" />,
          });
          void refetch();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, sportId, refetch]);

  const handleScrollToList = () => {
    setOpen(false);
    const el = document.querySelector<HTMLElement>("[data-players-list]");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 relative" title={label}>
            <Bell className="w-5 h-5" />
            <AnimatePresence>
              {count > 0 && (
                <motion.span
                  key="badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center leading-none ring-2 ring-background"
                >
                  {count > 9 ? "9+" : count}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          <div className="px-4 py-3 border-b border-border">
            <p className="font-semibold text-sm">შეტყობინებები</p>
            <p className="text-xs text-muted-foreground">ახალი რეგისტრაციის მოთხოვნები</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {count === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                ახალი შეტყობინება არ არის
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {requests.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={handleScrollToList}
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
                          ბმულით დარეგისტრირდა • {new Date(r.created_at).toLocaleDateString()}
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
              <Button variant="ghost" size="sm" className="w-full text-xs" onClick={handleScrollToList}>
                მოთამაშეების სიაში გადასვლა
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
      <span className="text-[10px] text-muted-foreground leading-none">{label}</span>
    </div>
  );
}
