import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface RegistrationLinkRow {
  id: string;
  is_active: boolean;
  short_code: string;
}

export function usePlayerRegistrationLink(sport: string) {
  const [link, setLink] = useState<RegistrationLinkRow | null>(null);
  const [loading, setLoading] = useState(true);

  const ensureLink = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const client = supabase as any;
    const { data: existing } = await client
      .from("player_registration_links")
      .select("id, is_active, short_code")
      .eq("user_id", user.id)
      .eq("sport", sport)
      .maybeSingle();

    if (existing) {
      setLink(existing);
      setLoading(false);
      return;
    }

    const { data: created } = await client
      .from("player_registration_links")
      .insert({ user_id: user.id, sport, is_active: true })
      .select("id, is_active, short_code")
      .single();

    setLink(created ?? null);
    setLoading(false);
  }, [sport]);

  useEffect(() => {
    if (sport) void ensureLink();
  }, [sport, ensureLink]);

  const registrationUrl = useMemo(() => {
    if (!link?.short_code || typeof window === "undefined") return "";
    return `${window.location.origin}/r/${link.short_code}`;
  }, [link?.short_code]);

  return { link, registrationUrl, loading, refetch: ensureLink };
}