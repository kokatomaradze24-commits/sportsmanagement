import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

const SPORT_KEY = "sport"; // global — which sport is currently selected
const nameKey = (sport: string) => `school_name:${sport}`;
const logoKey = (sport: string) => `logo_url:${sport}`;

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
  const [sportId, setSportId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("app_settings").select("*");
    if (!data) {
      setLoading(false);
      return;
    }

    const sportRow = data.find((r) => r.key === SPORT_KEY);
    const currentSport = sportRow?.value || "";
    setSportId(currentSport);

    if (currentSport) {
      const nameRow = data.find((r) => r.key === nameKey(currentSport));
      const logoRow = data.find((r) => r.key === logoKey(currentSport));
      setSchoolName(nameRow?.value || "My Club");
      setLogoUrl(logoRow?.value || "");
    } else {
      setSchoolName("My Club");
      setLogoUrl("");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const upsertSetting = useCallback(async (key: string, value: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("[app-settings] upsert failed: not authenticated", { key });
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

  const loadSportBranding = useCallback(async (sport: string) => {
    if (!sport) {
      setSchoolName("My Club");
      setLogoUrl("");
      return;
    }
    const { data } = await supabase
      .from("app_settings")
      .select("*")
      .in("key", [nameKey(sport), logoKey(sport)]);
    const nameRow = data?.find((r) => r.key === nameKey(sport));
    const logoRow = data?.find((r) => r.key === logoKey(sport));
    setSchoolName(nameRow?.value || "My Club");
    setLogoUrl(logoRow?.value || "");
  }, []);

  const updateSchoolName = useCallback(async (name: string) => {
    if (!sportId) return;
    setSchoolName(name);
    await upsertSetting(nameKey(sportId), name);
  }, [upsertSetting, sportId]);

  const updateSport = useCallback(async (id: string) => {
    setSportId(id);
    await upsertSetting(SPORT_KEY, id);
    await loadSportBranding(id);
  }, [upsertSetting, loadSportBranding]);

  const updateLogo = useCallback(async (file: File) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !sportId) return "";

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
    const path = `${user.id}/logo-${sportId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("logos")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("logos").getPublicUrl(path);
    const url = data.publicUrl + "?t=" + Date.now();
    setLogoUrl(url);

    await upsertSetting(logoKey(sportId), url);
    return url;
  }, [upsertSetting, sportId]);

  const resetBranding = useCallback(async () => {
    if (!sportId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSchoolName("My Club");
    setLogoUrl("");

    await supabase
      .from("app_settings")
      .delete()
      .eq("user_id", user.id)
      .in("key", [nameKey(sportId), logoKey(sportId)]);

    // Best-effort cleanup of any uploaded logo files for this sport
    const exts = ["jpg", "png", "webp", "gif"];
    await supabase.storage
      .from("logos")
      .remove(exts.map((ext) => `${user.id}/logo-${sportId}.${ext}`));
  }, [sportId]);

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
  sportId: "",
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
