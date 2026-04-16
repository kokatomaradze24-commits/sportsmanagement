import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, Trash2, ArrowLeft, Crown, User as UserIcon, Mail, Calendar, Users, CreditCard } from "lucide-react";
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
}

function AdminPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [users, setUsers] = useState<AdminUser[]>([]);
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
  }, [user, isAdmin, authLoading, adminLoading, navigate]);

  const loadUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_list_users");
    if (error) {
      toast.error("ვერ ჩაიტვირთა მომხმარებლები");
    } else {
      setUsers((data as AdminUser[]) || []);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const { error } = await supabase.rpc("admin_delete_user", { _user_id: confirmDelete.user_id });
    if (error) {
      toast.error(error.message || "წაშლა ვერ მოხერხდა");
    } else {
      toast.success(`მომხმარებელი ${confirmDelete.email} წაიშალა`);
      loadUsers();
    }
    setConfirmDelete(null);
  };

  const handleToggleAdmin = async (u: AdminUser) => {
    const { error } = await supabase.rpc("admin_toggle_admin", { _user_id: u.user_id });
    if (error) {
      toast.error(error.message || "ვერ მოხერხდა");
    } else {
      toast.success(u.is_admin ? "ადმინ უფლება ჩამორთმეულია" : "ადმინ უფლება მინიჭებულია");
      loadUsers();
    }
  };

  if (authLoading || adminLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <span className="text-5xl block mb-4 animate-bounce">🛡️</span>
          <p className="text-muted-foreground">იტვირთება...</p>
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
              <h1 className="text-2xl font-display tracking-wider">Admin Panel</h1>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            სულ: <span className="font-bold text-foreground">{users.length}</span> მომხმარებელი
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
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
                        თქვენ
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      რეგისტრაცია: {new Date(u.created_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {u.player_count} მოთამაშე
                    </span>
                    <span className="flex items-center gap-1">
                      <CreditCard className="h-3 w-3" />
                      {u.payment_count} გადახდა
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {u.user_id !== user?.id && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleAdmin(u)}
                    >
                      {u.is_admin ? "ჩამოართვი admin" : "გახადე admin"}
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
          <div className="text-center py-12 text-muted-foreground">მომხმარებლები არ არის</div>
        )}
      </main>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>მომხმარებლის წაშლა</AlertDialogTitle>
            <AlertDialogDescription>
              ნამდვილად გსურთ <strong>{confirmDelete?.email}</strong>-ის წაშლა? წაიშლება მისი ყველა მოთამაშე, გადახდა და მონაცემი. ეს მოქმედება შეუქცევადია.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>გაუქმება</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              წაშლა
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
