import { useState } from "react";
import { Copy, Eye, EyeOff, KeyRound, Plus, Trash2, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useCoaches, type Coach } from "@/hooks/use-coaches";
import { generateCoachPassword, slugifyClubName } from "@/lib/coach-session";
import { useI18n } from "@/hooks/use-i18n";

interface Props {
  sportId: string;
  clubName: string;
}

export function CoachesPanel({ sportId, clubName }: Props) {
  const { coaches, loading, addCoach, resetPassword, toggleActive, deleteCoach } = useCoaches(sportId);
  const [openAdd, setOpenAdd] = useState(false);

  return (
    <section className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="font-display text-xl tracking-wider">მწვრთნელები</h2>
          <span className="text-sm text-muted-foreground">({coaches.length})</span>
        </div>
        <Button size="sm" onClick={() => setOpenAdd(true)}>
          <UserPlus className="w-4 h-4 mr-1" />
          მწვრთნელის დამატება
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        მწვრთნელები შედიან <code className="px-1 py-0.5 rounded bg-muted">/coach-login</code>-ზე საკუთარი username-ით და პაროლით.
      </p>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : coaches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground text-sm">
          მწვრთნელი ჯერ არ არის. დააჭირე „მწვრთნელის დამატება“-ს.
        </div>
      ) : (
        <div className="space-y-2">
          {coaches.map((c) => (
            <CoachRow
              key={c.id}
              coach={c}
              onResetPassword={resetPassword}
              onToggleActive={toggleActive}
              onDelete={deleteCoach}
            />
          ))}
        </div>
      )}

      <AddCoachDialog
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        clubName={clubName}
        existingUsernames={coaches.map((c) => c.username)}
        onCreate={addCoach}
      />
    </section>
  );
}

function CoachRow({
  coach,
  onResetPassword,
  onToggleActive,
  onDelete,
}: {
  coach: Coach;
  onResetPassword: (id: string, newPassword: string) => Promise<void>;
  onToggleActive: (id: string, active: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [showPwd, setShowPwd] = useState(false);

  const copy = (txt: string) => {
    navigator.clipboard.writeText(txt);
    toast.success("Copied");
  };

  const reset = async () => {
    const next = generateCoachPassword();
    try {
      await onResetPassword(coach.id, next);
      toast.success("Password reset", { description: `New password: ${next}` });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  const copyAll = () => {
    const txt = `Username: ${coach.username}\nPassword: ${coach.generated_password ?? "(reset to view)"}\nLogin URL: ${
      typeof window !== "undefined" ? window.location.origin + "/coach-login" : "/coach-login"
    }`;
    navigator.clipboard.writeText(txt);
    toast.success("Login info copied");
  };

  return (
    <div className="rounded-xl border border-border bg-background/50 p-3 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold">{coach.display_name}</span>
          {!coach.is_active && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Disabled</span>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
          <span>
            User: <code className="font-mono text-foreground">{coach.username}</code>
          </span>
          <button onClick={() => copy(coach.username)} className="hover:text-foreground" title="Copy username">
            <Copy className="w-3 h-3" />
          </button>
          <span>·</span>
          <span>
            Pass:{" "}
            <code className="font-mono text-foreground">
              {showPwd ? coach.generated_password ?? "(reset required)" : "••••••••"}
            </code>
          </span>
          <button onClick={() => setShowPwd((s) => !s)} className="hover:text-foreground">
            {showPwd ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </button>
          {coach.generated_password && (
            <button onClick={() => copy(coach.generated_password!)} className="hover:text-foreground" title="Copy password">
              <Copy className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs">
          <Switch
            checked={coach.is_active}
            onCheckedChange={(v) => onToggleActive(coach.id, v).catch((e) => toast.error(e.message))}
          />
        </div>
        <Button size="sm" variant="outline" onClick={copyAll} title="Copy login info">
          <Copy className="w-3.5 h-3.5 mr-1" /> Copy info
        </Button>
        <Button size="sm" variant="outline" onClick={reset} title="Reset password">
          <KeyRound className="w-3.5 h-3.5" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete coach?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove {coach.display_name}'s access. Their schedule entries stay (but unlinked).
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(coach.id).catch((e) => toast.error(e.message))}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

function AddCoachDialog({
  open,
  onClose,
  clubName,
  existingUsernames,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  clubName: string;
  existingUsernames: string[];
  onCreate: (input: { username: string; password: string; displayName: string }) => Promise<void>;
}) {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Auto-suggest username from club name + index
  const suggestUsername = () => {
    const base = slugifyClubName(clubName);
    let n = existingUsernames.length + 1;
    let candidate = `${base}_coach${n}`;
    while (existingUsernames.includes(candidate)) {
      n++;
      candidate = `${base}_coach${n}`;
    }
    return candidate;
  };

  // Initialize when opened
  const handleOpen = (o: boolean) => {
    if (o) {
      setDisplayName("");
      setUsername(suggestUsername());
      setPassword(generateCoachPassword());
    } else {
      onClose();
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onCreate({
        username: username.trim().toLowerCase(),
        password,
        displayName: displayName.trim(),
      });
      toast.success("Coach created", {
        description: `User: ${username}  ·  Pass: ${password}`,
        duration: 10000,
      });
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add coach</DialogTitle>
          <DialogDescription>
            Username is auto-suggested from your club name. Password is generated automatically.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label>Coach name</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Giorgi Beridze"
              required
            />
          </div>
          <div>
            <Label>Username</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
              required
              minLength={3}
            />
          </div>
          <div>
            <Label>Password</Label>
            <div className="flex gap-2">
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="font-mono"
              />
              <Button type="button" variant="outline" onClick={() => setPassword(generateCoachPassword())}>
                Regen
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Save these credentials — they're shown again in the coach list.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              <Plus className="w-4 h-4 mr-1" /> Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
