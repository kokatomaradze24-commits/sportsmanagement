import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LANGUAGES } from "@/lib/i18n/translations";
import { useI18n } from "@/hooks/use-i18n";

interface LanguageSwitcherProps {
  variant?: "header" | "floating" | "topbar";
  className?: string;
}

export function LanguageSwitcher({ variant = "header", className }: LanguageSwitcherProps) {
  const { language, setLanguage, t } = useI18n();
  const current = LANGUAGES.find((l) => l.code === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant === "header" ? "ghost" : "outline"}
          size={variant === "header" ? "icon" : "sm"}
          className={
            (variant === "header"
              ? "rounded-full w-10 h-10 "
              : variant === "topbar"
                ? "gap-2 bg-white/[0.06] border-white/15 text-white hover:bg-white/[0.12] hover:text-white backdrop-blur-md "
                : "gap-1.5 ") + (className ?? "")
          }
          title={t("language")}
        >
          {variant === "header" ? (
            <Languages className="w-5 h-5" />
          ) : (
            <>
              <span className="text-base leading-none">{current?.flag}</span>
              <span className="text-xs font-medium">
                {variant === "topbar" ? t("language") : current?.nativeName}
              </span>
            </>
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
