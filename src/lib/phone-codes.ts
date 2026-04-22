// Maps the app's UI language to a sensible default international dial code
// shown in phone-number inputs. Users can still type any country code.

import type { LanguageCode } from "@/lib/i18n/translations";

export interface DialCodeInfo {
  /** International dial code prefix, e.g. "+995" */
  code: string;
  /** ISO country flag emoji */
  flag: string;
  /** Country label for screen readers / placeholders */
  country: string;
  /** Hint pattern shown in placeholder, without the dial code */
  sample: string;
}

const DIAL_CODES: Record<LanguageCode, DialCodeInfo> = {
  ka: { code: "+995", flag: "🇬🇪", country: "Georgia", sample: "5xx xxx xxx" },
  en: { code: "+44", flag: "🇬🇧", country: "United Kingdom", sample: "7xxx xxx xxx" },
  de: { code: "+49", flag: "🇩🇪", country: "Germany", sample: "1xx xxxxxxx" },
  es: { code: "+34", flag: "🇪🇸", country: "Spain", sample: "6xx xxx xxx" },
  fr: { code: "+33", flag: "🇫🇷", country: "France", sample: "6 xx xx xx xx" },
  ru: { code: "+7", flag: "🇷🇺", country: "Russia", sample: "9xx xxx xx xx" },
};

/**
 * The full list of countries shown in the phone country picker.
 * Includes one entry per supported UI language plus the USA.
 */
export const PHONE_COUNTRIES: DialCodeInfo[] = [
  { code: "+995", flag: "🇬🇪", country: "Georgia", sample: "5xx xxx xxx" },
  { code: "+1", flag: "🇺🇸", country: "United States", sample: "xxx xxx xxxx" },
  { code: "+44", flag: "🇬🇧", country: "United Kingdom", sample: "7xxx xxx xxx" },
  { code: "+49", flag: "🇩🇪", country: "Germany", sample: "1xx xxxxxxx" },
  { code: "+34", flag: "🇪🇸", country: "Spain", sample: "6xx xxx xxx" },
  { code: "+33", flag: "🇫🇷", country: "France", sample: "6 xx xx xx xx" },
  { code: "+7", flag: "🇷🇺", country: "Russia", sample: "9xx xxx xx xx" },
];

export function getDialCodeForLanguage(lang: LanguageCode): DialCodeInfo {
  return DIAL_CODES[lang] ?? DIAL_CODES.en;
}

/**
 * Find the country entry that matches a phone number's leading dial code.
 * Returns null if no known country prefix matches.
 */
export function findCountryByPhone(phone: string | null | undefined): DialCodeInfo | null {
  const v = (phone ?? "").trim().replace(/\s+/g, "");
  if (!v.startsWith("+")) return null;
  // Sort longest first so "+995" wins over "+9"
  const sorted = [...PHONE_COUNTRIES].sort((a, b) => b.code.length - a.code.length);
  return sorted.find((c) => v.startsWith(c.code)) ?? null;
}

/**
 * Returns the value to prefill a phone input with, given the existing value
 * (which might already include a different country prefix) and the active
 * UI language. If the value is empty, it returns the dial code + space.
 * If the value already starts with "+", it is returned as-is.
 */
export function prefillPhone(existing: string | null | undefined, lang: LanguageCode): string {
  const v = (existing ?? "").trim();
  if (v.startsWith("+")) return existing ?? "";
  if (v.length > 0) return existing ?? "";
  return `${getDialCodeForLanguage(lang).code} `;
}
