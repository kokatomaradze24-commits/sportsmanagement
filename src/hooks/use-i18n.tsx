import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { translations, LANGUAGES, DEFAULT_LANGUAGE, type LanguageCode, type TranslationKey } from "@/lib/i18n/translations";

const STORAGE_KEY = "app_language";

export type CurrencyCode = "GEL" | "USD" | "EUR";

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  GEL: "₾",
  USD: "$",
  EUR: "€",
};

const LANGUAGE_CURRENCY: Record<LanguageCode, CurrencyCode> = {
  ka: "GEL",
  en: "USD",
  de: "EUR",
  es: "EUR",
  fr: "EUR",
  ru: "EUR",
};

export function getCurrencyForLanguage(lang: LanguageCode): CurrencyCode {
  return LANGUAGE_CURRENCY[lang] ?? "USD";
}

export function getCurrencySymbol(currency: CurrencyCode | "auto", lang: LanguageCode): string {
  const code = currency === "auto" ? getCurrencyForLanguage(lang) : currency;
  return CURRENCY_SYMBOLS[code];
}

interface I18nContextValue {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  monthShort: (m: number) => string;
  monthLong: (m: number) => string;
  currency: CurrencyCode;
  currencySymbol: string;
  formatMoney: (amount: number, currency?: CurrencyCode | "auto", decimals?: number) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const SHORT_MONTHS: TranslationKey[] = [
  "janShort", "febShort", "marShort", "aprShort", "mayShort", "junShort",
  "julShort", "augShort", "sepShort", "octShort", "novShort", "decShort",
];
const LONG_MONTHS: TranslationKey[] = [
  "janLong", "febLong", "marLong", "aprLong", "mayLong", "junLong",
  "julLong", "augLong", "sepLong", "octLong", "novLong", "decLong",
];

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    vars[key] !== undefined ? String(vars[key]) : `{${key}}`
  );
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(DEFAULT_LANGUAGE);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
    if (stored && LANGUAGES.some((l) => l.code === stored)) {
      setLanguageState(stored);
    }
  }, []);

  const setLanguage = useCallback((lang: LanguageCode) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, lang);
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      const dict = translations[language] as Record<string, string>;
      const fallback = translations[DEFAULT_LANGUAGE] as Record<string, string>;
      const template = dict[key] ?? fallback[key] ?? key;
      return interpolate(template, vars);
    },
    [language]
  );

  const monthShort = useCallback((m: number) => t(SHORT_MONTHS[m - 1]), [t]);
  const monthLong = useCallback((m: number) => t(LONG_MONTHS[m - 1]), [t]);

  const currency = getCurrencyForLanguage(language);
  const currencySymbol = CURRENCY_SYMBOLS[currency];

  const formatMoney = useCallback(
    (amount: number, cur: CurrencyCode | "auto" = "auto", decimals = 2) => {
      const sym = getCurrencySymbol(cur, language);
      const value = Number.isFinite(amount) ? amount.toFixed(decimals) : "0";
      return `${sym}${value}`;
    },
    [language]
  );

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, monthShort, monthLong, currency, currencySymbol, formatMoney }}>
      {children}
    </I18nContext.Provider>
  );
}

const fallbackT = (key: TranslationKey, vars?: Record<string, string | number>) => {
  const fallback = translations[DEFAULT_LANGUAGE] as Record<string, string>;
  return interpolate(fallback[key] ?? key, vars);
};

const defaultCurrency = getCurrencyForLanguage(DEFAULT_LANGUAGE);
const defaultCtx: I18nContextValue = {
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: fallbackT,
  monthShort: (m) => fallbackT(SHORT_MONTHS[m - 1]),
  monthLong: (m) => fallbackT(LONG_MONTHS[m - 1]),
  currency: defaultCurrency,
  currencySymbol: CURRENCY_SYMBOLS[defaultCurrency],
  formatMoney: (amount, cur = "auto", decimals = 2) =>
    `${getCurrencySymbol(cur, DEFAULT_LANGUAGE)}${(Number.isFinite(amount) ? amount : 0).toFixed(decimals)}`,
};

export function useI18n() {
  return useContext(I18nContext) ?? defaultCtx;
}
