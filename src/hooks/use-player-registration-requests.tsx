import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getSeasonRegistrationDefaults } from "@/lib/season";

export interface PlayerRegistrationRequest {
  id: string;
  link_id: string;
  user_id: string;
  sport: string;
  status: "pending" | "approved" | "rejected";
  first_name: string;
  last_name: string;
  birth_date: string;
  phone: string | null;
  parent_phone: string | null;
  primary_contact: "player" | "parent";
  experience_level: "experienced" | "inexperienced";
  previous_club: string | null;
  previous_team: string | null;
  league: "A" | "B" | "C" | null;
  last_coach: string | null;
  notes: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export function usePlayerRegistrationRequests(sport: string, onApproved?: () => void) {
  const [requests, setRequests] = useState<PlayerRegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    if (!sport) {
      setRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const client = supabase as any;
    const { data } = await client
      .from("player_registration_requests")
      .select("*")
      .eq("sport", sport)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    setRequests(data ?? []);
    setLoading(false);
  }, [sport]);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  const approveRequest = useCallback(async (request: PlayerRegistrationRequest) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: new Error("Not authenticated") };

    const client = supabase as any;
    const { data: lastPlayer } = await client
      .from("players")
      .select("t_number")
      .eq("user_id", user.id)
      .eq("sport", request.sport)
      .order("t_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const seasonDefaults = getSeasonRegistrationDefaults(new Date(request.created_at));
    const { error } = await client.from("players").insert({
      user_id: user.id,
      sport: request.sport,
      first_name: request.first_name,
      last_name: request.last_name,
      t_number: Number(lastPlayer?.t_number ?? 0) + 1,
      birth_date: request.birth_date,
      phone: request.phone,
      parent_phone: request.parent_phone,
      primary_contact: request.primary_contact,
      monthly_fee: 0,
      subscription_months: seasonDefaults.subscriptionMonths,
      start_month: seasonDefaults.startMonth,
      start_year: seasonDefaults.startYear,
      start_day: 1,
      notes: [
        request.experience_level === "inexperienced" ? "გამოცდილება: გამოუცდელი" : "გამოცდილება: გამოცდილი",
        request.previous_club ? `წინა კლუბი: ${request.previous_club}` : null,
        request.previous_team ? `გუნდი: ${request.previous_team}` : null,
        request.league ? `ლიგა: ${request.league}` : null,
        request.last_coach ? `ბოლო მწვრთნელი: ${request.last_coach}` : null,
        request.notes ? `შენიშვნა: ${request.notes}` : null,
      ].filter(Boolean).join("\n") || null,
    });

    if (error) return { error };

    const { error: updateError } = await client
      .from("player_registration_requests")
      .update({ status: "approved", reviewed_at: new Date().toISOString() })
      .eq("id", request.id);

    if (!updateError) {
      await fetchRequests();
      onApproved?.();
    }
    return { error: updateError };
  }, [fetchRequests, onApproved]);

  return { requests, loading, approveRequest, refetch: fetchRequests };
}