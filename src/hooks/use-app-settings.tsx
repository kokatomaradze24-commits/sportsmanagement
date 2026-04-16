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
    // Check if a row already exists for this user + key
    const { data: existing } = await supabase
      .from("app_settings")
      .select("id")
      .eq("key", key)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("app_settings")
        .update({ value })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("app_settings")
        .insert({ key, value, user_id: user.id });
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

    // Server-side-style validation on the client (still useful even though RLS owns auth)
    const ALLOWED_TYPES: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
    };
    const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

    if (!ALLOWED_TYPES[file.type]) {
      throw new Error("Invalid file type. Please upload a JPG, PNG, WEBP, or GIF image.");
    }
    if (file.size > MAX_SIZE_BYTES) {
      throw new Error("File too large. Maximum size is 2 MB.");
    }

    // Derive extension from the verified MIME type, NOT from the user-supplied filename.
    const ext = ALLOWED_TYPES[file.type];
    const path = `${user.id}/logo.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("logos")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("logos").getPublicUrl(path);
    const url = data.publicUrl + "?t=" + Date.now();
    setLogoUrl(url);

    await upsertSetting("logo_url", url);
    return url;
  }, [upsertSetting]);

  return { schoolName, logoUrl, sportId, loading, updateSchoolName, updateLogo, updateSport };
}
