import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Trip = Database["public"]["Tables"]["trips"]["Row"];
type TripInsert = Database["public"]["Tables"]["trips"]["Insert"];
type TripParticipant = Database["public"]["Tables"]["trip_participants"]["Row"];
type TripParticipantInsert = Database["public"]["Tables"]["trip_participants"]["Insert"];

export function useTrips(sport: string) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [participants, setParticipants] = useState<TripParticipant[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!sport) {
      setTrips([]);
      setParticipants([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: tripsData } = await supabase
      .from("trips")
      .select("*")
      .eq("sport", sport)
      .order("trip_date", { ascending: false });
    const tripIds = (tripsData ?? []).map((t) => t.id);
    let partsData: TripParticipant[] = [];
    if (tripIds.length > 0) {
      const { data } = await supabase
        .from("trip_participants")
        .select("*")
        .in("trip_id", tripIds);
      partsData = data ?? [];
    }
    setTrips(tripsData ?? []);
    setParticipants(partsData);
    setLoading(false);
  }, [sport]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addTrip = useCallback(
    async (trip: Omit<TripInsert, "user_id" | "sport">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: new Error("Not authenticated"), data: null };
      const { data, error } = await supabase
        .from("trips")
        .insert({ ...trip, user_id: user.id, sport })
        .select("*")
        .single();
      if (!error) await fetchAll();
      return { error, data };
    },
    [fetchAll, sport]
  );

  const updateTrip = useCallback(
    async (id: string, updates: Partial<Trip>) => {
      const { error } = await supabase.from("trips").update(updates).eq("id", id);
      if (!error) await fetchAll();
      return { error };
    },
    [fetchAll]
  );

  const deleteTrip = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("trips").delete().eq("id", id);
      if (!error) await fetchAll();
      return { error };
    },
    [fetchAll]
  );

  const addParticipant = useCallback(
    async (tripId: string, playerId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: new Error("Not authenticated") };
      const payload: TripParticipantInsert = {
        trip_id: tripId,
        player_id: playerId,
        user_id: user.id,
      };
      const { error } = await supabase.from("trip_participants").insert(payload);
      if (!error) await fetchAll();
      return { error };
    },
    [fetchAll]
  );

  const updateParticipant = useCallback(
    async (id: string, updates: Partial<TripParticipant>) => {
      const { error } = await supabase
        .from("trip_participants")
        .update(updates)
        .eq("id", id);
      if (!error) await fetchAll();
      return { error };
    },
    [fetchAll]
  );

  const removeParticipant = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("trip_participants").delete().eq("id", id);
      if (!error) await fetchAll();
      return { error };
    },
    [fetchAll]
  );

  return {
    trips,
    participants,
    loading,
    addTrip,
    updateTrip,
    deleteTrip,
    addParticipant,
    updateParticipant,
    removeParticipant,
    refetch: fetchAll,
  };
}
