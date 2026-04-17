import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-is-admin";

interface SubscriptionState {
  expiresAt: Date | null;
  isTrial: boolean;
  loading: boolean;
  daysLeft: number;
  isActive: boolean;
  refresh: () => Promise<void>;
}

export function useSubscription(): SubscriptionState {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [isTrial, setIsTrial] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) {
      setExpiresAt(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("user_subscriptions")
      .select("expires_at, is_trial")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setExpiresAt(new Date(data.expires_at));
      setIsTrial(data.is_trial);
    } else {
      setExpiresAt(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const now = new Date();
  const daysLeft = expiresAt
    ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  const isActive = isAdmin || (expiresAt ? expiresAt.getTime() > now.getTime() : false);

  return { expiresAt, isTrial, loading, daysLeft, isActive, refresh: load };
}
