import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PracticeTemplate {
  id: string;
  user_id: string;
  sport: string;
  age_group: string;
  day_of_week: number; // 0 = Sunday ... 6 = Saturday
  start_time: string; // HH:MM:SS
  end_time: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
}

export type NewPracticeTemplate = Omit<
  PracticeTemplate,
  "id" | "user_id" | "sport" | "created_at" | "updated_at"
>;

export function usePracticeTemplates(sportId: string) {
  const [templates, setTemplates] = useState<PracticeTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("practice_templates")
      .select("*")
      .eq("sport", sportId)
      .order("age_group")
      .order("day_of_week")
      .order("start_time");
    setTemplates((data ?? []) as PracticeTemplate[]);
    setLoading(false);
  }, [sportId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const add = useCallback(
    async (input: NewPracticeTemplate) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("practice_templates")
        .insert({ ...input, user_id: user.id, sport: sportId });
      if (error) throw error;
      await refetch();
    },
    [sportId, refetch],
  );

  const update = useCallback(
    async (id: string, patch: Partial<NewPracticeTemplate>) => {
      const { error } = await supabase
        .from("practice_templates")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
      await refetch();
    },
    [refetch],
  );

  const remove = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from("practice_templates")
        .delete()
        .eq("id", id);
      if (error) throw error;
      await refetch();
    },
    [refetch],
  );

  return { templates, loading, add, update, remove, refetch };
}

export function templatesForAge(
  templates: PracticeTemplate[],
  age: string,
): PracticeTemplate[] {
  return templates.filter((t) => t.age_group === age);
}

/** Find the next date (>= startDate) matching a slot's day_of_week. */
export function nextDateForSlot(slot: PracticeTemplate, startDate: Date): string {
  const d = new Date(startDate);
  d.setHours(0, 0, 0, 0);
  const diff = (slot.day_of_week - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}
