import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Coach {
  id: string;
  user_id: string;
  username: string;
  generated_password: string | null;
  display_name: string;
  sport: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useCoaches(sportId: string) {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("coaches")
      .select("*")
      .eq("sport", sportId)
      .order("created_at", { ascending: false });
    setCoaches((data ?? []) as Coach[]);
    setLoading(false);
  }, [sportId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const addCoach = useCallback(
    async (input: { username: string; password: string; displayName: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not signed in");
      const res = await fetch("/api/coach/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ ...input, sport: sportId }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed to create coach");
      }
      await refetch();
    },
    [refetch, sportId],
  );

  const resetPassword = useCallback(
    async (coachId: string, newPassword: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not signed in");
      const res = await fetch("/api/coach/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ coachId, newPassword }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed");
      }
      await refetch();
    },
    [refetch],
  );

  const toggleActive = useCallback(
    async (coachId: string, active: boolean) => {
      const { error } = await supabase
        .from("coaches")
        .update({ is_active: active })
        .eq("id", coachId);
      if (error) throw error;
      await refetch();
    },
    [refetch],
  );

  const deleteCoach = useCallback(
    async (coachId: string) => {
      const { error } = await supabase.from("coaches").delete().eq("id", coachId);
      if (error) throw error;
      await refetch();
    },
    [refetch],
  );

  return { coaches, loading, addCoach, resetPassword, toggleActive, deleteCoach, refetch };
}
