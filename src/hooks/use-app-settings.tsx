import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

const SPORT_KEY = "sport";
const NAME_KEY = "school_name";
const LOGO_KEY = "logo_url";
const DEFAULT_SPORT = "basketball";

interface AppSettingsContextValue {
  schoolName: string;
  logoUrl: string;
  sportId: string;
  loading: boolean;
  updateSchoolName: (name: string) => Promise<void>;
  updateLogo: (file: File) => Promise<string>;
  updateSport: (id: string) => Promise<void>;
  resetBranding: () => Promise<void>;
}

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [schoolName, setSchoolName] = useState("My Club");
  const [logoUrl, setLogoUrl] = useState("");
  const [sportId, setSportId] = useState<string>(DEFAULT_SPORT);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("app_settings")
      .select("*")
      .eq("user_id", user.id);

    if (!data) {
      setLoading(false);
      return;
    }

    const sportRow = data.find((r) => r.key === SPORT_KEY);
    const nameRow = data.find((r) => r.key === NAME_KEY);
    const logoRow = data.find((r) => r.key === LOGO_KEY);

    setSportId(sportRow?.value || DEFAULT_SPORT);
    setSchoolName(nameRow?.value || "My Club");
    setLogoUrl(logoRow?.value || "");
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const upsertSetting = useCallback(async (key: string, value: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("[app-settings] not authenticated", { key });
      throw new Error("Not authenticated");
    }
    const { data: existing, error: selErr } = await supabase
      .from("app_settings")
      .select("id")
      .eq("key", key)
      .eq("user_id", user.id)
      .maybeSingle();
    if (selErr) {
      console.error("[app-settings] select failed", selErr);
      throw selErr;
    }

    if (existing) {
      const { error } = await supabase.from("app_settings").update({ value }).eq("id", existing.id);
      if (error) {
        console.error("[app-settings] update failed", error);
        throw error;
      }
    } else {
      const { error } = await supabase.from("app_settings").insert({ key, value, user_id: user.id });
      if (error) {
        console.error("[app-settings] insert failed", error);
        throw error;
      }
    }
  }, []);

  const updateSchoolName = useCallback(async (name: string) => {
    setSchoolName(name);
    await upsertSetting(NAME_KEY, name);
  }, [upsertSetting]);

  const updateSport = useCallback(async (id: string) => {
    setSportId(id);
    await upsertSetting(SPORT_KEY, id);
  }, [upsertSetting]);

  const updateLogo = useCallback(async (file: File) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const ALLOWED_TYPES: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
    };
    const MAX_SIZE_BYTES = 2 * 1024 * 1024;

    if (!ALLOWED_TYPES[file.type]) {
      throw new Error("Invalid file type. Please upload a JPG, PNG, WEBP, or GIF image.");
    }
    if (file.size > MAX_SIZE_BYTES) {
      throw new Error("File too large. Maximum size is 2 MB.");
    }

    const ext = ALLOWED_TYPES[file.type];
    const path = `${user.id}/logo.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("logos")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("logos").getPublicUrl(path);
    const url = data.publicUrl + "?t=" + Date.now();
    setLogoUrl(url);

    await upsertSetting(LOGO_KEY, url);
    return url;
  }, [upsertSetting]);

  const resetBranding = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSchoolName("My Club");
    setLogoUrl("");

    await supabase
      .from("app_settings")
      .delete()
      .eq("user_id", user.id)
      .in("key", [NAME_KEY, LOGO_KEY]);

    const exts = ["jpg", "png", "webp", "gif"];
    await supabase.storage
      .from("logos")
      .remove(exts.map((ext) => `${user.id}/logo.${ext}`));
  }, []);

  return (
    <AppSettingsContext.Provider
      value={{ schoolName, logoUrl, sportId, loading, updateSchoolName, updateLogo, updateSport, resetBranding }}
    >
      {children}
    </AppSettingsContext.Provider>
  );
}

const defaultAppSettings: AppSettingsContextValue = {
  schoolName: "My Club",
  logoUrl: "",
  sportId: DEFAULT_SPORT,
  loading: true,
  updateSchoolName: async () => {},
  updateLogo: async () => "",
  updateSport: async () => {},
  resetBranding: async () => {},
};

export function useAppSettings() {
  const ctx = useContext(AppSettingsContext);
  return ctx ?? defaultAppSettings;
}
