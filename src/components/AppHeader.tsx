import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Moon, Sun, Upload, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AppHeaderProps {
  schoolName: string;
  logoUrl: string;
  isDark: boolean;
  onToggleTheme: () => void;
  onUpdateName: (name: string) => void;
  onUploadLogo: (file: File) => void;
}

export function AppHeader({ schoolName, logoUrl, isDark, onToggleTheme, onUpdateName, onUploadLogo }: AppHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [nameValue, setNameValue] = useState(schoolName);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    onUpdateName(nameValue);
    setEditing(false);
  };

  const handleCancel = () => {
    setNameValue(schoolName);
    setEditing(false);
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-card border-b border-border px-6 py-4"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className="relative w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden cursor-pointer group"
            onClick={() => fileRef.current?.click()}
          >
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl">🏀</span>
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
            <div className="flex items-center gap-2">
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
            <div className="flex items-center gap-2">
              <h1 className="text-3xl tracking-wider text-foreground">{schoolName}</h1>
              <Button size="icon" variant="ghost" onClick={() => { setNameValue(schoolName); setEditing(true); }}>
                <Pencil className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleTheme}
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
      </div>
    </motion.header>
  );
}
