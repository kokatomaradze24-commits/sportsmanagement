import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Practice {
  id: string;
  user_id: string;
  coach_id: string | null;
  team_id: string | null;
  sport: string;
  title: string;
  practice_date: string; // YYYY-MM-DD
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Game {
  id: string;
  user_id: string;
  coach_id: string | null;
  team_id: string | null;
  sport: string;
  title: string;
  game_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  opponent: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useSchedule(sportId: string) {
  const [practices, setPractices] = useState<Practice[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const [{ data: p }, { data: g }] = await Promise.all([
      supabase.from("practices").select("*").eq("sport", sportId).order("practice_date"),
      supabase.from("games").select("*").eq("sport", sportId).order("game_date"),
    ]);
    setPractices((p ?? []) as Practice[]);
    setGames((g ?? []) as Game[]);
    setLoading(false);
  }, [sportId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const addPractice = useCallback(
    async (input: Omit<Practice, "id" | "user_id" | "created_at" | "updated_at" | "sport"> & { coach_id?: string | null }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("practices")
        .insert({ ...input, user_id: user.id, sport: sportId });
      if (error) throw error;
      await refetch();
    },
    [sportId, refetch],
  );

  const addGame = useCallback(
    async (input: Omit<Game, "id" | "user_id" | "created_at" | "updated_at" | "sport"> & { coach_id?: string | null }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("games")
        .insert({ ...input, user_id: user.id, sport: sportId });
      if (error) throw error;
      await refetch();
    },
    [sportId, refetch],
  );

  const updatePractice = useCallback(
    async (id: string, patch: Partial<Practice>) => {
      const { error } = await supabase.from("practices").update(patch).eq("id", id);
      if (error) throw error;
      await refetch();
    },
    [refetch],
  );

  const updateGame = useCallback(
    async (id: string, patch: Partial<Game>) => {
      const { error } = await supabase.from("games").update(patch).eq("id", id);
      if (error) throw error;
      await refetch();
    },
    [refetch],
  );

  const deletePractice = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("practices").delete().eq("id", id);
      if (error) throw error;
      await refetch();
    },
    [refetch],
  );

  const deleteGame = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("games").delete().eq("id", id);
      if (error) throw error;
      await refetch();
    },
    [refetch],
  );

  return {
    practices,
    games,
    loading,
    addPractice,
    addGame,
    updatePractice,
    updateGame,
    deletePractice,
    deleteGame,
    refetch,
  };
}
