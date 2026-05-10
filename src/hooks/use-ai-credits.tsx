import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function useAICredits() {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) { setCredits(null); return; }
    setLoading(true);
    const { data } = await supabase
      .from("user_ai_credits")
      .select("credits")
      .eq("user_id", user.id)
      .maybeSingle();
    setCredits(data?.credits ?? 0);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  return { credits, loading, refresh, setCredits };
}
