import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Upload, Pencil, Check, X, LogOut, Trophy, Languages, RotateCcw, Shield, Volume2, VolumeX, Sparkles, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { getInitials, SPORT_LIST, type SportConfig, type SportId } from "@/lib/sports";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { useI18n } from "@/hooks/use-i18n";
import { useSounds } from "@/hooks/use-sounds";
import { LANGUAGES } from "@/lib/i18n/translations";
import { LogoAdjustDialog } from "./LogoAdjustDialog";
import { AIImageGenerator } from "./AIImageGenerator";
import { RegistrationNotificationsBell } from "./RegistrationNotificationsBell";
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
  themes?: { id: AppTheme; labelKey: "themeMidnight" }[];
  onSelectTheme?: (theme: AppTheme) => void;
  userId?: string;
  onGoToPlayers?: () => void;
}

export function AppHeader({ schoolName, logoUrl, sport, isDark, onToggleTheme, onUpdateName, onUploadLogo, onChangeSport, onResetBranding, onSignOut, currentTheme, themes = [], onSelectTheme, userId, onGoToPlayers }: AppHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [nameValue, setNameValue] = useState(schoolName);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { isAdmin } = useIsAdmin();
  const { t, language, setLanguage } = useI18n();
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="sticky top-0 z-30 h-16 border-b border-border bg-header/95 text-header-foreground backdrop-blur-xl"
    >
      <div className="mx-auto grid h-full max-w-[1600px] grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 sm:gap-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="icon" className="relative size-9 shrink-0 overflow-hidden rounded-md border border-border p-0 group sm:size-10" onClick={() => fileRef.current?.click()} title={t("uploadLogo")} aria-label={t("uploadLogo")}>
            {logoUrl ? <img src={logoUrl} alt={schoolName} className="h-full w-full object-cover" /> : <span className="font-display text-lg text-primary">{initials}</span>}
            <span className="absolute inset-0 flex items-center justify-center bg-primary/60 opacity-0 transition-opacity group-hover:opacity-100"><Upload className="size-4 text-primary-foreground" /></span>
          </Button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) { setLogoFile(file); setAdjustOpen(true); e.target.value = ""; }
          }} />
          {editing ? (
            <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-1">
              <Input value={nameValue} onChange={(e) => setNameValue(e.target.value)} className="h-9 min-w-0 font-display" aria-label={t("lblRenameClub")} autoFocus onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); }} />
              <Button size="icon" variant="ghost" className="size-7 shrink-0" onClick={handleSave} aria-label={t("save")} title={t("save")}><Check className="size-4" /></Button>
              <Button size="icon" variant="ghost" className="size-7 shrink-0" onClick={handleCancel} aria-label={t("cancel")} title={t("cancel")}><X className="size-4" /></Button>
            </div>
          ) : (
            <div className="min-w-0">
              <h1 className="truncate text-base sm:text-xl">{schoolName}</h1>
              <p className="truncate text-[10px] text-muted-foreground sm:text-xs">{sport.emoji} {sport.name}</p>
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <RegistrationNotificationsBell sportId={sport.id} userId={userId} label={t("notificationLabel")} compact onGoToPlayers={onGoToPlayers} />
          <AIImageGenerator title={t("aiGenStudioTitle")} presetPrompts={aiPresets} defaultPrompt={aiPresets[0].prompt} onUseImage={(file) => { setLogoFile(file); setAdjustOpen(true); }} trigger={
            <Button variant="ghost" size="icon" className="size-9 text-primary sm:size-10" title={t("aiGenButton")} aria-label={t("aiGenButton")}><Sparkles className="size-5" /></Button>
          } />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-9 sm:size-10" title={t("lblSettings")} aria-label={t("lblSettings")}><Settings className="size-5" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel>{t("lblSettings")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger><Trophy />{t("sportDiscipline")}</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup value={sport.id} onValueChange={(id) => { const choice = SPORT_LIST.find((s) => s.id === id); if (choice) onChangeSport(choice.id); }}>
                    {SPORT_LIST.map((s) => <DropdownMenuRadioItem key={s.id} value={s.id}><span>{s.emoji}</span>{s.name}</DropdownMenuRadioItem>)}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger><Languages />{t("language")}</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup value={language} onValueChange={(code) => { const choice = LANGUAGES.find((l) => l.code === code); if (choice) setLanguage(choice.code); }}>
                    {LANGUAGES.map((lang) => <DropdownMenuRadioItem key={lang.code} value={lang.code}><span>{lang.flag}</span>{lang.nativeName}</DropdownMenuRadioItem>)}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setResetOpen(true)}><RotateCcw />{t("lblResetLogo")}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setNameValue(schoolName); setEditing(true); }}><Pencil />{t("lblRenameClub")}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => { play("click"); toggleMuted(); }}>{muted ? <VolumeX /> : <Volume2 />}{muted ? t("soundOff") : t("soundOn")}</DropdownMenuItem>
              {isAdmin && <DropdownMenuItem asChild><Link to="/admin"><Shield className="text-warning" />{t("adminPanel")}</Link></DropdownMenuItem>}
              {onSignOut && <><DropdownMenuSeparator /><DropdownMenuItem onClick={onSignOut} className="text-destructive focus:text-destructive"><LogOut />{t("signOut")}</DropdownMenuItem></>}
            </DropdownMenuContent>
          </DropdownMenu>
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
