import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Player = Database["public"]["Tables"]["players"]["Row"];
type PlayerInsert = Database["public"]["Tables"]["players"]["Insert"];

export function usePlayers(sport: string) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlayers = useCallback(async () => {
    if (!sport) {
      setPlayers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("players")
      .select("*")
      .eq("sport", sport)
      .order("last_name");
    if (data) setPlayers(data);
    setLoading(false);
  }, [sport]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const addPlayer = useCallback(async (player: PlayerInsert) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: new Error("Not authenticated") };
    const { error } = await supabase
      .from("players")
      .insert({ ...player, user_id: user.id, sport });
    if (!error) await fetchPlayers();
    return { error };
  }, [fetchPlayers, sport]);

  const updatePlayer = useCallback(async (id: string, updates: Partial<Player>) => {
    const { error } = await supabase.from("players").update(updates).eq("id", id);
    if (!error) await fetchPlayers();
    return { error };
  }, [fetchPlayers]);

  const deletePlayer = useCallback(async (id: string) => {
    const { error } = await supabase.from("players").delete().eq("id", id);
    if (!error) await fetchPlayers();
    return { error };
  }, [fetchPlayers]);

  return { players, loading, addPlayer, updatePlayer, deletePlayer, refetch: fetchPlayers };
}
