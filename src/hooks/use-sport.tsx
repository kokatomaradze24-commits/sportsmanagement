import { useEffect } from "react";
import { useAppSettings } from "@/hooks/use-app-settings";
import { applySportTheme, getSport, type SportConfig } from "@/lib/sports";

/**
 * Reads the user's sport preference from app_settings, applies the
 * matching theme to CSS variables, and returns the sport config + setter.
 */
export function useSport(): {
  sport: SportConfig;
  sportId: string;
  loading: boolean;
  setSport: (id: string) => Promise<void>;
} {
  const { sportId, loading, updateSport } = useAppSettings();
  const sport = getSport(sportId);

  useEffect(() => {
    applySportTheme(sport);
  }, [sport]);

  return { sport, sportId, loading, setSport: updateSport };
}
