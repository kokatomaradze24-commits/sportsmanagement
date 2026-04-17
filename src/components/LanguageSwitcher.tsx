import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LANGUAGES } from "@/lib/i18n/translations";
import { useI18n } from "@/hooks/use-i18n";

interface LanguageSwitcherProps {
  variant?: "header" | "floating";
}

export function LanguageSwitcher({ variant = "header" }: LanguageSwitcherProps) {
  const { language, setLanguage, t } = useI18n();
  const current = LANGUAGES.find((l) => l.code === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant === "floating" ? "outline" : "ghost"}
          size={variant === "floating" ? "sm" : "icon"}
          className={variant === "floating" ? "gap-1.5" : "rounded-full w-10 h-10"}
          title={t("language")}
        >
          {variant === "floating" ? (
            <>
              <span className="text-base leading-none">{current?.flag}</span>
              <span className="text-xs font-medium">{current?.nativeName}</span>
            </>
          ) : (
            <Languages className="w-5 h-5" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t("language")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={lang.code === language ? "bg-primary/10 font-semibold" : ""}
          >
            <span className="mr-2 text-base">{lang.flag}</span>
            {lang.nativeName}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
