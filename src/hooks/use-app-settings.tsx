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
    await supabase.from("app_settings").update({ value: name }).eq("key", "school_name");
  }, []);

  const updateLogo = useCallback(async (file: File) => {
    const ext = file.name.split(".").pop();
    const path = `logo.${ext}`;
    
    await supabase.storage.from("logos").upload(path, file, { upsert: true });
    
    const { data } = supabase.storage.from("logos").getPublicUrl(path);
    const url = data.publicUrl + "?t=" + Date.now();
    setLogoUrl(url);
    await supabase.from("app_settings").update({ value: url }).eq("key", "logo_url");
    return url;
  }, []);

  return { schoolName, logoUrl, loading, updateSchoolName, updateLogo };
}
