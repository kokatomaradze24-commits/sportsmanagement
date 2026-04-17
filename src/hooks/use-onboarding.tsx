import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const ONBOARDED_KEY = "onboarded";
const TUTORIAL_KEY = "tutorial_completed";

/**
 * Tracks per-user one-time onboarding flags stored in app_settings:
 *  - onboarded: user has picked their first sport
 *  - tutorial_completed: user has seen (or skipped) the UI tutorial
 *
 * Both flags are written once and never shown again.
 */
export function useOnboarding() {
  const [loading, setLoading] = useState(true);
  const [onboarded, setOnboarded] = useState(false);
  const [tutorialDone, setTutorialDone] = useState(false);

  const fetchFlags = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("app_settings")
      .select("key,value")
      .eq("user_id", user.id)
      .in("key", [ONBOARDED_KEY, TUTORIAL_KEY]);

    setOnboarded(data?.some((r) => r.key === ONBOARDED_KEY && r.value === "true") ?? false);
    setTutorialDone(data?.some((r) => r.key === TUTORIAL_KEY && r.value === "true") ?? false);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const setFlag = useCallback(async (key: string, setter: (v: boolean) => void) => {
    setter(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: existing } = await supabase
      .from("app_settings")
      .select("id")
      .eq("user_id", user.id)
      .eq("key", key)
      .maybeSingle();
    if (existing) {
      await supabase.from("app_settings").update({ value: "true" }).eq("id", existing.id);
    } else {
      await supabase.from("app_settings").insert({ user_id: user.id, key, value: "true" });
    }
  }, []);

  const markOnboarded = useCallback(() => setFlag(ONBOARDED_KEY, setOnboarded), [setFlag]);
  const markTutorialDone = useCallback(() => setFlag(TUTORIAL_KEY, setTutorialDone), [setFlag]);

  return { loading, onboarded, tutorialDone, markOnboarded, markTutorialDone };
}
