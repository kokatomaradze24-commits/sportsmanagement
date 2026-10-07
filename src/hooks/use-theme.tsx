import { useEffect, useState } from "react";

export type AppTheme = "light" | "dark";

export const APP_THEMES: { id: AppTheme; labelKey: "themeMidnight" }[] = [];

/**
 * Presentation-only workspace mode; public pages keep their previous theme.
 */
export function useTheme() {
  const [theme, setCurrentTheme] = useState<AppTheme>("light");
  useEffect(() => {
    const root = document.documentElement;
    const previousDark = root.classList.contains("dark");
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => {
      const saved = localStorage.getItem("workspace-mode");
      const next: AppTheme = saved === "light" || saved === "dark" ? saved : media.matches ? "dark" : "light";
      setCurrentTheme(next);
      root.dataset.appUi = next;
      root.classList.toggle("dark", next === "dark");
    };
    update();
    media.addEventListener("change", update);
    return () => {
      media.removeEventListener("change", update);
      delete root.dataset.appUi;
      root.classList.toggle("dark", previousDark);
    };
  }, []);

  const setTheme = (next: AppTheme) => {
    localStorage.setItem("workspace-mode", next);
    setCurrentTheme(next);
    document.documentElement.dataset.appUi = next;
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  return { isDark: theme === "dark", theme, themes: APP_THEMES, setTheme, toggle: () => setTheme(theme === "dark" ? "light" : "dark") };
}
