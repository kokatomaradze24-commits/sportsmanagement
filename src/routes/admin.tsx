import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, Trash2, ArrowLeft, Crown, User as UserIcon, Mail, Calendar, Users, CreditCard, Clock, Plus, X, Database, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { useI18n } from "@/hooks/use-i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin Panel" }, { name: "description", content: "Manage all users" }],
  }),
  component: AdminPage,
});

interface AdminUser {
  user_id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  is_admin: boolean;
  player_count: number;
  payment_count: number;
  subscription_expires_at: string | null;
  is_trial: boolean;
}

interface StorageStats {
  db_bytes: number;
  db_limit_bytes: number;
  storage_bytes: number;
  storage_limit_bytes: number;
  storage_file_count: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function AdminPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { t } = useI18n();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null);

  useEffect(() => {
    if (authLoading || adminLoading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (!isAdmin) {
      navigate({ to: "/" });
      return;
    }
    loadUsers();
    loadStats();
  }, [user, isAdmin, authLoading, adminLoading, navigate]);

  const loadUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_list_users");
    if (error) {
      toast.error(t("failedLoad"));
    } else {
      setUsers((data as AdminUser[]) || []);
    }
    setLoading(false);
  };

  const loadStats = async () => {
    const { data, error } = await supabase.rpc("admin_storage_stats");
    if (!error && data && Array.isArray(data) && data.length > 0) {
      setStats(data[0] as StorageStats);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const { error } = await supabase.rpc("admin_delete_user", { _user_id: confirmDelete.user_id });
    if (error) {
      toast.error(error.message || t("deleteFailed"));
    } else {
      toast.success(t("userDeleted", { email: confirmDelete.email }));
      loadUsers();
    }
    setConfirmDelete(null);
  };

  const handleToggleAdmin = async (u: AdminUser) => {
    const { error } = await supabase.rpc("admin_toggle_admin", { _user_id: u.user_id });
    if (error) {
      toast.error(error.message || t("failed"));
    } else {
      toast.success(u.is_admin ? t("adminRevoked") : t("adminGranted"));
      loadUsers();
    }
  };

  const handleExtend = async (u: AdminUser, days: number) => {
    const { error } = await supabase.rpc("admin_extend_subscription", {
      _user_id: u.user_id,
      _days: days,
    });
    if (error) {
      toast.error(error.message || t("failed"));
    } else {
      toast.success(t("daysAdded", { email: u.email, days }));
      loadUsers();
    }
  };

  const handleDeactivate = async (u: AdminUser) => {
    const { error } = await supabase.rpc("admin_deactivate_subscription", {
      _user_id: u.user_id,
    });
    if (error) {
      toast.error(error.message || t("failed"));
    } else {
      toast.success(t("accessSuspended", { email: u.email }));
      loadUsers();
    }
  };

  const getSubStatus = (u: AdminUser) => {
    if (!u.subscription_expires_at) return { label: t("notSet"), color: "muted", days: 0, active: false };
    const exp = new Date(u.subscription_expires_at);
    const days = Math.ceil((exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days <= 0) return { label: t("expired"), color: "red", days: 0, active: false };
    if (days <= 5) return { label: t("daysShort", { days }), color: "red", days, active: true };
    return { label: t("daysShort", { days }), color: "green", days, active: true };
  };

  if (authLoading || adminLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <span className="text-5xl block mb-4 animate-bounce">🛡️</span>
          <p className="text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-display tracking-wider">{t("adminPanel")}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="floating" />
            <div className="text-sm text-muted-foreground">
              {t("totalUsers", { count: users.length })}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {stats && (() => {
          const dbPct = Math.min(100, (stats.db_bytes / stats.db_limit_bytes) * 100);
          const stPct = Math.min(100, (stats.storage_bytes / stats.storage_limit_bytes) * 100);
          const barColor = (p: number) => p > 80 ? "bg-red-500" : p > 60 ? "bg-yellow-500" : "bg-green-500";
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    <h3 className="font-display tracking-wider">{t("database")}</h3>
                  </div>
                  <span className="text-xs text-muted-foreground">{dbPct.toFixed(1)}%</span>
                </div>
                <div className="text-2xl font-bold">
                  {formatBytes(stats.db_bytes)}
                  <span className="text-sm font-normal text-muted-foreground"> / {formatBytes(stats.db_limit_bytes)}</span>
                </div>
                <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full transition-all ${barColor(dbPct)}`} style={{ width: `${dbPct}%` }} />
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-5 w-5 text-primary" />
                    <h3 className="font-display tracking-wider">{t("fileStorage")}</h3>
                  </div>
                  <span className="text-xs text-muted-foreground">{stPct.toFixed(1)}%</span>
                </div>
                <div className="text-2xl font-bold">
                  {formatBytes(stats.storage_bytes)}
                  <span className="text-sm font-normal text-muted-foreground"> / {formatBytes(stats.storage_limit_bytes)}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{t("files", { count: stats.storage_file_count })}</div>
                <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full transition-all ${barColor(stPct)}`} style={{ width: `${stPct}%` }} />
                </div>
              </div>
            </div>
          );
        })()}

        <div className="grid gap-3">
          {users.map((u, i) => (
            <motion.div
              key={u.user_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${u.is_admin ? "bg-yellow-500/20 text-yellow-500" : "bg-muted text-muted-foreground"}`}>
                  {u.is_admin ? <Crown className="h-5 w-5" /> : <UserIcon className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      {u.email}
                    </span>
                    {u.is_admin && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 font-medium">
                        ADMIN
                      </span>
                    )}
                    {u.user_id === user?.id && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                        {t("you")}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {t("registered")}: {new Date(u.created_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {u.player_count} {u.player_count === 1 ? t("member_singular") : t("member_plural")}
                    </span>
                    <span className="flex items-center gap-1">
                      <CreditCard className="h-3 w-3" />
                      {u.payment_count} {u.payment_count === 1 ? t("payment_singular") : t("payment_plural")}
                    </span>
                    {(() => {
                      const s = getSubStatus(u);
                      if (u.is_admin) return null;
                      return (
                        <span
                          className={`flex items-center gap-1 font-medium ${
                            s.color === "red"
                              ? "text-red-500"
                              : s.color === "green"
                              ? "text-green-600 dark:text-green-400"
                              : "text-muted-foreground"
                          }`}
                        >
                          <Clock className="h-3 w-3" />
                          {s.label}
                          {u.is_trial && s.active && (
                            <span className="ml-1 text-[10px] uppercase opacity-70">{t("trial")}</span>
                          )}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                {u.user_id !== user?.id && (
                  <>
                    {!u.is_admin && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExtend(u, 30)}
                          title={t("extendTitle")}
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          {t("extend30Days")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeactivate(u)}
                          disabled={!getSubStatus(u).active}
                          title={t("suspendTitle")}
                          className="text-red-600 border-red-500/40 hover:bg-red-500/10 hover:text-red-600 disabled:opacity-40"
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
                          {t("suspendAccess")}
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleAdmin(u)}
                    >
                      {u.is_admin ? t("revokeAdmin") : t("makeAdmin")}
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => setConfirmDelete(u)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {users.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">{t("noUsers")}</div>
        )}
      </main>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteUserTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteUserDesc", { email: confirmDelete?.email ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
