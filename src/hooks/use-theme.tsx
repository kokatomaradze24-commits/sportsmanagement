import { useState, useEffect, useCallback } from "react";

export type AppTheme = "classic" | "midnight" | "emerald" | "sunset" | "royal";

export const APP_THEMES: { id: AppTheme; label: string }[] = [
  { id: "classic", label: "კლასიკური" },
  { id: "midnight", label: "ღამის" },
  { id: "emerald", label: "ზურმუხტი" },
  { id: "sunset", label: "მზის ჩასვლა" },
  { id: "royal", label: "სამეფო" },
];

const isAppTheme = (value: string | null): value is AppTheme => APP_THEMES.some((theme) => theme.id === value);

export function useTheme() {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    if (typeof window === "undefined") return "classic";
    const saved = localStorage.getItem("theme");
    if (isAppTheme(saved)) return saved;
    return saved === "dark" ? "midnight" : "classic";
  });

  const isDark = theme === "midnight";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle("dark", isDark);
    localStorage.setItem("theme", theme);
  }, [theme, isDark]);

  const toggle = useCallback(() => setThemeState((current) => (current === "midnight" ? "classic" : "midnight")), []);
  const setTheme = useCallback((nextTheme: AppTheme) => setThemeState(nextTheme), []);

  return { isDark, theme, themes: APP_THEMES, setTheme, toggle };
}
