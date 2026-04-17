import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type SmsSettings = Database["public"]["Tables"]["user_sms_settings"]["Row"];
export type SmsSettingsUpdate = Partial<Omit<SmsSettings, "id" | "user_id" | "created_at" | "updated_at">>;

const DEFAULTS: Omit<SmsSettings, "id" | "user_id" | "created_at" | "updated_at"> = {
  enabled: false,
  provider: "magti",
  magti_api_key: null,
  magti_sender: null,
  twilio_account_sid: null,
  twilio_auth_token: null,
  twilio_from: null,
  email_from: null,
  email_from_name: null,
  reminder_days_before: 3,
  send_overdue: true,
  send_reminder: true,
};

export function useSmsSettings() {
  const [settings, setSettings] = useState<SmsSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSettings(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("user_sms_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setSettings(data ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const save = useCallback(async (updates: SmsSettingsUpdate) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: new Error("Not authenticated") };

    const payload = { ...DEFAULTS, ...settings, ...updates, user_id: user.id };
    // Strip server-managed fields
    delete (payload as Record<string, unknown>).id;
    delete (payload as Record<string, unknown>).created_at;
    delete (payload as Record<string, unknown>).updated_at;

    const { error } = await supabase
      .from("user_sms_settings")
      .upsert(payload, { onConflict: "user_id" });
    if (!error) await fetch();
    return { error };
  }, [settings, fetch]);

  return { settings, loading, save, refetch: fetch, defaults: DEFAULTS };
}
