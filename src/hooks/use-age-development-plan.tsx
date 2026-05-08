import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAgeDevelopmentPlan(sportId: string, ageGroup: string) {
  const [plan, setPlan] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("age_development_plans")
      .select("plan")
      .eq("sport", sportId)
      .eq("age_group", ageGroup)
      .maybeSingle();
    setPlan((data?.plan as string) ?? "");
    setLoading(false);
  }, [sportId, ageGroup]);

  useEffect(() => { refetch(); }, [refetch]);

  const save = useCallback(
    async (next: string) => {
      setSaving(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not signed in");
        const { error } = await supabase
          .from("age_development_plans")
          .upsert(
            { user_id: user.id, sport: sportId, age_group: ageGroup, plan: next },
            { onConflict: "user_id,sport,age_group" },
          );
        if (error) throw error;
        setPlan(next);
      } finally {
        setSaving(false);
      }
    },
    [sportId, ageGroup],
  );

  return { plan, loading, saving, save };
}
