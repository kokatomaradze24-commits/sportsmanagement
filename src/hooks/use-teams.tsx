import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Team = Database["public"]["Tables"]["teams"]["Row"];
type TeamInsert = Database["public"]["Tables"]["teams"]["Insert"];
type TeamMember = Database["public"]["Tables"]["team_members"]["Row"];

export function useTeams(sport: string) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!sport) {
      setTeams([]);
      setMembers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: teamsData } = await supabase
      .from("teams")
      .select("*")
      .eq("sport", sport)
      .order("created_at", { ascending: false });

    const teamIds = (teamsData ?? []).map((t) => t.id);
    let membersData: TeamMember[] = [];
    if (teamIds.length > 0) {
      const { data } = await supabase
        .from("team_members")
        .select("*")
        .in("team_id", teamIds);
      membersData = data ?? [];
    }
    setTeams(teamsData ?? []);
    setMembers(membersData);
    setLoading(false);
  }, [sport]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addTeam = useCallback(
    async (team: Omit<TeamInsert, "user_id" | "sport">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: new Error("Not authenticated"), data: null };
      const { data, error } = await supabase
        .from("teams")
        .insert({ ...team, user_id: user.id, sport })
        .select("*")
        .single();
      if (!error) await fetchAll();
      return { error, data };
    },
    [fetchAll, sport]
  );

  const updateTeam = useCallback(
    async (id: string, updates: Partial<Team>) => {
      const { error } = await supabase.from("teams").update(updates).eq("id", id);
      if (!error) await fetchAll();
      return { error };
    },
    [fetchAll]
  );

  const deleteTeam = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("teams").delete().eq("id", id);
      if (!error) await fetchAll();
      return { error };
    },
    [fetchAll]
  );

  /** Replace the team's roster with the given player ids (additive + remove-missing). */
  const setTeamRoster = useCallback(
    async (teamId: string, playerIds: string[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: new Error("Not authenticated") };

      const current = members.filter((m) => m.team_id === teamId);
      const currentSet = new Set(current.map((m) => m.player_id));
      const nextSet = new Set(playerIds);

      const toAdd = playerIds.filter((id) => !currentSet.has(id));
      const toRemoveIds = current.filter((m) => !nextSet.has(m.player_id)).map((m) => m.id);

      if (toRemoveIds.length > 0) {
        const { error } = await supabase
          .from("team_members")
          .delete()
          .in("id", toRemoveIds);
        if (error) return { error };
      }
      if (toAdd.length > 0) {
        const rows = toAdd.map((player_id) => ({
          team_id: teamId,
          player_id,
          user_id: user.id,
        }));
        const { error } = await supabase.from("team_members").insert(rows);
        if (error) return { error };
      }
      await fetchAll();
      return { error: null };
    },
    [members, fetchAll]
  );

  const removeMember = useCallback(
    async (memberId: string) => {
      const { error } = await supabase.from("team_members").delete().eq("id", memberId);
      if (!error) await fetchAll();
      return { error };
    },
    [fetchAll]
  );

  return {
    teams,
    members,
    loading,
    addTeam,
    updateTeam,
    deleteTeam,
    setTeamRoster,
    removeMember,
    refetch: fetchAll,
  };
}
