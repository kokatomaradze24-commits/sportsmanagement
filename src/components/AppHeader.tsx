import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Moon, Sun, Upload, Pencil, Check, X, LogOut, Trophy, RotateCcw, Shield, Volume2, VolumeX, Palette, Sparkles, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { getInitials, SPORT_LIST, type SportConfig, type SportId } from "@/lib/sports";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { useI18n } from "@/hooks/use-i18n";
import { useSounds } from "@/hooks/use-sounds";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { LogoAdjustDialog } from "./LogoAdjustDialog";
import { AIImageGenerator } from "./AIImageGenerator";
import { AICreditsBadge } from "./AICreditsBadge";
import type { AppTheme } from "@/hooks/use-theme";

interface AppHeaderProps {
  schoolName: string;
  logoUrl: string;
  sport: SportConfig;
  isDark: boolean;
  onToggleTheme: () => void;
  onUpdateName: (name: string) => void;
  onUploadLogo: (file: File) => void;
  onChangeSport: (id: SportId) => void;
  onResetBranding: () => void;
  onSignOut?: () => void;
  currentTheme?: AppTheme;
  themes?: { id: AppTheme; label: string }[];
  onSelectTheme?: (theme: AppTheme) => void;
}

export function AppHeader({ schoolName, logoUrl, sport, isDark, onToggleTheme, onUpdateName, onUploadLogo, onChangeSport, onResetBranding, onSignOut, currentTheme, themes = [], onSelectTheme }: AppHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [nameValue, setNameValue] = useState(schoolName);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { isAdmin } = useIsAdmin();
  const { t } = useI18n();
  const { muted, toggleMuted, play } = useSounds();

  const handleSave = () => {
    onUpdateName(nameValue);
    setEditing(false);
  };

  const handleCancel = () => {
    setNameValue(schoolName);
    setEditing(false);
  };

  const initials = getInitials(schoolName);

  const aiPresets = [
    { label: t("aiPresetLogo"), prompt: t("aiPresetLogoPrompt", { name: schoolName, sport: sport.name }) },
    { label: t("aiPresetUniform"), prompt: t("aiPresetUniformPrompt", { name: schoolName, sport: sport.name }) },
    { label: t("aiPresetCustom"), prompt: t("aiPresetCustomPrompt", { name: schoolName, sport: sport.name }) },
  ];

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="theme-header border-b border-border/60 px-6 py-4"
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-4">
        <div className="flex items-center gap-4 min-w-0 justify-center">
          <div
            className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br from-primary-foreground/30 to-primary/10 flex items-center justify-center overflow-hidden cursor-pointer group flex-shrink-0 ring-1 ring-primary-foreground/25 shadow-lg"
            onClick={() => fileRef.current?.click()}
          >
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="font-display tracking-wider text-2xl sm:text-3xl text-primary">{initials}</span>
            )}
            <div className="absolute inset-0 bg-primary/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Upload className="w-5 h-5 text-primary-foreground" />
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setLogoFile(file);
                  setAdjustOpen(true);
                  e.target.value = "";
                }
              }}
            />
          </div>

          {editing ? (
            <div className="flex items-center gap-2 min-w-0">
              <Input
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                className="text-xl font-display tracking-wider h-10"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") handleCancel();
                }}
              />
              <Button size="icon" variant="ghost" onClick={handleSave}>
                <Check className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={handleCancel}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl tracking-wider text-current truncate">{schoolName}</h1>
                <p className="text-xs text-current/75 flex items-center gap-1">
                  <span>{sport.emoji}</span> {sport.name}
                </p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => { setNameValue(schoolName); setEditing(true); }}>
                <Pencil className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-start gap-2 flex-wrap justify-center border-t border-primary-foreground/20 pt-3">
          <div className="flex flex-col items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full w-10 h-10" title={t("changeSport")}>
                  <Trophy className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t("sportDiscipline")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {SPORT_LIST.map((s) => (
                  <DropdownMenuItem
                    key={s.id}
                    onClick={() => onChangeSport(s.id)}
                    className={s.id === sport.id ? "bg-primary/10 font-semibold" : ""}
                  >
                    <span className="mr-2">{s.emoji}</span>
                    {s.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="text-[10px] text-muted-foreground leading-none">{t("lblSport")}</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <LanguageSwitcher />
            <span className="text-[10px] text-muted-foreground leading-none">{t("lblLanguage")}</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <AICreditsBadge />
            <span className="text-[10px] text-muted-foreground leading-none">AI კრედიტი</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <AIImageGenerator
              title={t("aiGenStudioTitle")}
              presetPrompts={aiPresets}
              defaultPrompt={aiPresets[0].prompt}
              onUseImage={(file) => {
                setLogoFile(file);
                setAdjustOpen(true);
              }}
              trigger={
                <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 text-primary" title={t("aiGenButton")}>
                  <Sparkles className="w-5 h-5" />
                </Button>
              }
            />
            <span className="text-[10px] text-muted-foreground leading-none">{t("aiGenButton")}</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => play("click")} className="rounded-full w-10 h-10" title={t("lblTheme")}>
                  <motion.div key={currentTheme ?? (isDark ? "moon" : "sun")} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
                    <Palette className="w-5 h-5" />
                  </motion.div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t("lblTheme")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {themes.length > 0 ? themes.map((themeOption) => (
                  <DropdownMenuItem key={themeOption.id} onClick={() => { play("click"); onSelectTheme?.(themeOption.id); }} className={themeOption.id === currentTheme ? "bg-primary/10 font-semibold" : ""}>
                    <span className={`mr-2 h-4 w-4 rounded-full border border-border theme-swatch-${themeOption.id}`} />
                    {themeOption.label}
                  </DropdownMenuItem>
                )) : (
                  <DropdownMenuItem onClick={() => { play("click"); onToggleTheme(); }}>
                    {isDark ? <Sun className="mr-2 w-4 h-4" /> : <Moon className="mr-2 w-4 h-4" />}
                    {t("lblTheme")}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="text-[10px] text-muted-foreground leading-none">{t("lblTheme")}</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full w-10 h-10" title={t("lblSettings")}>
                  <Settings className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t("lblSettings")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setResetOpen(true)}>
                  <RotateCcw className="mr-2 w-4 h-4" />
                  {t("lblResetLogo")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { play("click"); toggleMuted(); }}>
                  {muted ? <VolumeX className="mr-2 w-4 h-4" /> : <Volume2 className="mr-2 w-4 h-4" />}
                  {muted ? t("soundOff") : t("soundOn")}
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">
                      <Shield className="mr-2 w-4 h-4 text-warning" />
                      {t("adminPanel")}
                    </Link>
                  </DropdownMenuItem>
                )}
                {onSignOut && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onSignOut} className="text-destructive focus:text-destructive">
                      <LogOut className="mr-2 w-4 h-4" />
                      {t("signOut")}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="text-[10px] text-muted-foreground leading-none">{t("lblSettings")}</span>
          </div>
        </div>

        <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("resetBrandingTitle", { sport: sport.name })}</AlertDialogTitle>
              <AlertDialogDescription>{t("resetBrandingDesc")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={onResetBranding}>{t("reset")}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <LogoAdjustDialog
          file={logoFile}
          open={adjustOpen}
          onOpenChange={setAdjustOpen}
          onConfirm={onUploadLogo}
        />
      </div>
    </motion.header>
  );
}
