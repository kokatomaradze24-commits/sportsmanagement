import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Moon, Sun, Upload, Pencil, Check, X, LogOut, Trophy, RotateCcw, Shield, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { getInitials, SPORT_LIST, type SportConfig, type SportId } from "@/lib/sports";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { useI18n } from "@/hooks/use-i18n";
import { useSounds } from "@/hooks/use-sounds";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { SmsSettingsDialog } from "./SmsSettingsDialog";

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
}

export function AppHeader({ schoolName, logoUrl, sport, isDark, onToggleTheme, onUpdateName, onUploadLogo, onChangeSport, onResetBranding, onSignOut }: AppHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [nameValue, setNameValue] = useState(schoolName);
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

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-card border-b border-border px-6 py-4"
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-4">
        <div className="flex items-center gap-4 min-w-0 justify-center">
          <div
            className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden cursor-pointer group flex-shrink-0 ring-1 ring-primary/20"
            onClick={() => fileRef.current?.click()}
          >
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="font-display tracking-wider text-xl text-primary">{initials}</span>
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
                if (file) onUploadLogo(file);
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
                <h1 className="text-2xl sm:text-3xl tracking-wider text-foreground truncate">{schoolName}</h1>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span>{sport.emoji}</span> {sport.name}
                </p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => { setNameValue(schoolName); setEditing(true); }}>
                <Pencil className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 flex-wrap justify-center border-t border-border pt-3">
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

          <LanguageSwitcher />

          <SmsSettingsDialog />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 text-muted-foreground hover:text-foreground" title={t("resetBranding")}>
                <RotateCcw className="w-5 h-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("resetBrandingTitle", { sport: sport.name })}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("resetBrandingDesc")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={onResetBranding}>{t("reset")}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {isAdmin && (
            <Link to="/admin">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full w-10 h-10 text-yellow-600 hover:text-yellow-500"
                title={t("adminPanel")}
              >
                <Shield className="w-5 h-5" />
              </Button>
            </Link>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => { play("click"); toggleMuted(); }}
            className="rounded-full w-10 h-10"
            title={muted ? t("soundOff") : t("soundOn")}
          >
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => { play("click"); onToggleTheme(); }}
            className="rounded-full w-10 h-10"
          >
            <motion.div
              key={isDark ? "moon" : "sun"}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.div>
          </Button>
          {onSignOut && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onSignOut}
              className="rounded-full w-10 h-10 text-muted-foreground hover:text-destructive"
              title={t("signOut")}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </motion.header>
  );
}
