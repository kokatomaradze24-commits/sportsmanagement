import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAppSettings() {
  const [schoolName, setSchoolName] = useState("My Club");
  const [logoUrl, setLogoUrl] = useState("");
  const [sportId, setSportId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    const { data } = await supabase.from("app_settings").select("*");
    if (data) {
      const nameRow = data.find((r) => r.key === "school_name");
      const logoRow = data.find((r) => r.key === "logo_url");
      const sportRow = data.find((r) => r.key === "sport");
      if (nameRow?.value) setSchoolName(nameRow.value);
      if (logoRow?.value) setLogoUrl(logoRow.value);
      if (sportRow?.value) setSportId(sportRow.value);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const upsertSetting = useCallback(async (key: string, value: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("app_settings").update({ value }).eq("key", key).select();
    if (!data || data.length === 0) {
      await supabase.from("app_settings").insert({ key, value, user_id: user.id });
    }
  }, []);

  const updateSchoolName = useCallback(async (name: string) => {
    setSchoolName(name);
    await upsertSetting("school_name", name);
  }, [upsertSetting]);

  const updateSport = useCallback(async (id: string) => {
    setSportId(id);
    await upsertSetting("sport", id);
  }, [upsertSetting]);

  const updateLogo = useCallback(async (file: File) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return "";

    const ext = file.name.split(".").pop();
    const path = `${user.id}/logo.${ext}`;

    await supabase.storage.from("logos").upload(path, file, { upsert: true });

    const { data } = supabase.storage.from("logos").getPublicUrl(path);
    const url = data.publicUrl + "?t=" + Date.now();
    setLogoUrl(url);

    await upsertSetting("logo_url", url);
    return url;
  }, [upsertSetting]);

  return { schoolName, logoUrl, sportId, loading, updateSchoolName, updateLogo, updateSport };
}
