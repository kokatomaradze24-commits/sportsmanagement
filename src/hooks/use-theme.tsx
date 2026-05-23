import { useState, useEffect, useCallback } from "react";

export type AppTheme = "myclub" | "classic" | "midnight" | "emerald" | "sunset" | "royal";

export const APP_THEMES: { id: AppTheme; labelKey: "themeMyClub" | "themeClassic" | "themeMidnight" | "themeEmerald" | "themeSunset" | "themeRoyal" }[] = [
  { id: "myclub", labelKey: "themeMyClub" },
  { id: "classic", labelKey: "themeClassic" },
  { id: "midnight", labelKey: "themeMidnight" },
  { id: "emerald", labelKey: "themeEmerald" },
  { id: "sunset", labelKey: "themeSunset" },
  { id: "royal", labelKey: "themeRoyal" },
];

const isAppTheme = (value: string | null): value is AppTheme => APP_THEMES.some((theme) => theme.id === value);

export function useTheme() {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    if (typeof window === "undefined") return "myclub";
    const saved = localStorage.getItem("theme");
    if (isAppTheme(saved)) return saved;
    if (saved === "dark") return "midnight";
    return "myclub";
  });

  const isDark = theme === "midnight" || theme === "myclub";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle("dark", isDark);
    localStorage.setItem("theme", theme);
  }, [theme, isDark]);

  const toggle = useCallback(() => setThemeState((current) => (current === "myclub" || current === "midnight" ? "classic" : "myclub")), []);
  const setTheme = useCallback((nextTheme: AppTheme) => setThemeState(nextTheme), []);

  return { isDark, theme, themes: APP_THEMES, setTheme, toggle };
}
