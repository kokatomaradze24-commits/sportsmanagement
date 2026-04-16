import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAppSettings() {
  const [schoolName, setSchoolName] = useState("Basketball Academy");
  const [logoUrl, setLogoUrl] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    const { data } = await supabase.from("app_settings").select("*");
    if (data) {
      const nameRow = data.find((r) => r.key === "school_name");
      const logoRow = data.find((r) => r.key === "logo_url");
      if (nameRow?.value) setSchoolName(nameRow.value);
      if (logoRow?.value) setLogoUrl(logoRow.value);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSchoolName = useCallback(async (name: string) => {
    setSchoolName(name);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Upsert: try update first, if no rows affected, insert
    const { data } = await supabase.from("app_settings").update({ value: name }).eq("key", "school_name").select();
    if (!data || data.length === 0) {
      await supabase.from("app_settings").insert({ key: "school_name", value: name, user_id: user.id });
    }
  }, []);

  const updateLogo = useCallback(async (file: File) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return "";

    const ext = file.name.split(".").pop();
    const path = `${user.id}/logo.${ext}`;

    await supabase.storage.from("logos").upload(path, file, { upsert: true });

    const { data } = supabase.storage.from("logos").getPublicUrl(path);
    const url = data.publicUrl + "?t=" + Date.now();
    setLogoUrl(url);

    const { data: existing } = await supabase.from("app_settings").update({ value: url }).eq("key", "logo_url").select();
    if (!existing || existing.length === 0) {
      await supabase.from("app_settings").insert({ key: "logo_url", value: url, user_id: user.id });
    }
    return url;
  }, []);

  return { schoolName, logoUrl, loading, updateSchoolName, updateLogo };
}
