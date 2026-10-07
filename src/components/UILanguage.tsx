import { useEffect } from "react";
import { useI18n } from "@/hooks/use-i18n";

/** Presentation bridge also covers headings in portaled dialogs. */
export function UILanguage() {
  const { language } = useI18n();
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  return null;
}