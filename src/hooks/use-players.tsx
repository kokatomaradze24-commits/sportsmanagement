import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Player = Database["public"]["Tables"]["players"]["Row"];
type PlayerInsert = Database["public"]["Tables"]["players"]["Insert"];

export function usePlayers(sport: string, onPlayersChanged?: () => void) {
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
      .order("created_at", { ascending: false });
    if (data) setPlayers(data);
    setLoading(false);
  }, [sport]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const addPlayer = useCallback(
    async (
      player: PlayerInsert & { firstMonthPaid?: boolean }
    ): Promise<{ error: unknown; created?: Player }> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: new Error("Not authenticated") };

      const { firstMonthPaid, ...rest } = player;

      const { data: created, error } = await supabase
        .from("players")
        .insert({ ...rest, user_id: user.id, sport })
        .select("*")
        .single();

      if (error) return { error };

      // If user said the first month is already paid, flip the auto-generated
      // payment for the start month/year to "paid".
      if (created && firstMonthPaid) {
        const today = new Date();
        await supabase
          .from("payments")
          .update({
            status: "paid",
            payment_date: today.toISOString().slice(0, 10),
          })
          .eq("player_id", created.id)
          .eq("month", created.start_month)
          .eq("year", created.start_year);
      }

      await fetchPlayers();
      onPlayersChanged?.();
      return { error: null, created: created ?? undefined };
    },
    [fetchPlayers, sport, onPlayersChanged]
  );

  const updatePlayer = useCallback(async (id: string, updates: Partial<Player>) => {
    const { error } = await supabase.from("players").update(updates).eq("id", id);
    if (error) return { error };

    if (updates.monthly_fee !== undefined) {
      const { error: paymentsError } = await supabase
        .from("payments")
        .update({ amount: updates.monthly_fee })
        .eq("player_id", id);
      if (paymentsError) return { error: paymentsError };
      onPlayersChanged?.();
    }

    await fetchPlayers();
    return { error: null };
  }, [fetchPlayers, onPlayersChanged]);

  const deletePlayer = useCallback(async (id: string) => {
    const { error } = await supabase.from("players").delete().eq("id", id);
    if (!error) {
      await fetchPlayers();
      onPlayersChanged?.();
    }
    return { error };
  }, [fetchPlayers, onPlayersChanged]);

  return { players, loading, addPlayer, updatePlayer, deletePlayer, refetch: fetchPlayers };
}
