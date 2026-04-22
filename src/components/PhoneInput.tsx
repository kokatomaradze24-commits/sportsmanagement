import { useMemo, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  PHONE_COUNTRIES,
  findCountryByPhone,
  getDialCodeForLanguage,
  type DialCodeInfo,
} from "@/lib/phone-codes";
import { useI18n } from "@/hooks/use-i18n";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Phone input with a clickable country flag/dial-code dropdown on the left.
 * Selecting a country swaps the leading dial code in the value while
 * preserving whatever digits the user has already typed.
 */
export function PhoneInput({ value, onChange, placeholder, className }: PhoneInputProps) {
  const { language } = useI18n();
  const [open, setOpen] = useState(false);

  const selected: DialCodeInfo = useMemo(() => {
    return findCountryByPhone(value) ?? getDialCodeForLanguage(language);
  }, [value, language]);

  const handleSelect = (country: DialCodeInfo) => {
    // Strip any known leading dial code from the current value, then prepend the new one.
    const trimmed = value.trim();
    let rest = trimmed;
    const current = findCountryByPhone(trimmed);
    if (current) {
      rest = trimmed.slice(current.code.length).trimStart();
    } else if (trimmed.startsWith("+")) {
      // Unknown +prefix — drop the leading "+digits" group.
      rest = trimmed.replace(/^\+\d+\s*/, "");
    }
    const next = rest ? `${country.code} ${rest}` : `${country.code} `;
    onChange(next);
    setOpen(false);
  };

  return (
    <div className={cn("flex items-stretch gap-1", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex h-9 items-center gap-1 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label="Select country code"
          >
            <span className="text-base leading-none">{selected.flag}</span>
            <span className="text-xs text-muted-foreground tabular-nums">{selected.code}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-1">
          <div className="max-h-72 overflow-y-auto">
            {PHONE_COUNTRIES.map((c) => {
              const active = c.code === selected.code && c.country === selected.country;
              return (
                <button
                  key={`${c.code}-${c.country}`}
                  type="button"
                  onClick={() => handleSelect(c)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm px-2 py-2 text-sm hover:bg-accent",
                    active && "bg-accent/60"
                  )}
                >
                  <span className="text-lg leading-none">{c.flag}</span>
                  <span className="flex-1 text-left">{c.country}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{c.code}</span>
                  {active && <Check className="h-3.5 w-3.5 text-primary" />}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
      <Input
        type="tel"
        inputMode="tel"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1"
      />
    </div>
  );
}
