import { useEffect } from "react";

export type AppTheme = "midnight";

export const APP_THEMES: { id: AppTheme; labelKey: "themeMidnight" }[] = [
  { id: "midnight", labelKey: "themeMidnight" },
];

/**
 * The app now ships a single theme (midnight) applied by default.
 */
export function useTheme() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    root.dataset.theme = "midnight";
    root.classList.add("dark");
    localStorage.setItem("theme", "midnight");
  }, []);

  const noop = () => {};

  return { isDark: true, theme: "midnight" as AppTheme, themes: APP_THEMES, setTheme: noop, toggle: noop };
}
