import { useMemo } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { getSport, type SportConfig, type SportId } from "@/lib/sports";
import type { TranslationKey } from "@/lib/i18n/translations";

/**
 * Returns a SportConfig with translated `name`, `member`, `members`,
 * `numberLabel`, `eventSingular`, `eventPlural` based on the current language.
 * Falls back to the English defaults from sports.ts when no translation exists.
 */
export function useSportLabels(sportOrId: SportConfig | SportId | string): SportConfig {
  const { t, language } = useI18n();
  const base = typeof sportOrId === "string" ? getSport(sportOrId) : sportOrId;

  return useMemo(() => {
    const id = base.id;
    const tr = (key: string, fallback: string): string => {
      const k = key as TranslationKey;
      const out = t(k);
      // If the key is not translated, our t() returns the key itself.
      return out === key ? fallback : out;
    };
    return {
      ...base,
      name: tr(`sport.${id}.name`, base.name),
      member: tr(`sport.${id}.member`, base.member),
      members: tr(`sport.${id}.members`, base.members),
      numberLabel: tr(`sport.${id}.numberLabel`, base.numberLabel),
      eventSingular: tr(`sport.${id}.eventSingular`, base.eventSingular),
      eventPlural: tr(`sport.${id}.eventPlural`, base.eventPlural),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base.id, language]);
}
