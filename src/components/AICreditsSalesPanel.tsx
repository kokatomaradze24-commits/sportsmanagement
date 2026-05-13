import { useEffect, useState } from "react";
import { Sparkles, DollarSign, ShoppingCart, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Purchase {
  id: string;
  user_id: string;
  email: string | null;
  package_id: string;
  credits: number;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  provider_order_id: string | null;
  created_at: string;
}

export function AICreditsSalesPanel() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("admin_list_ai_purchases");
      if (!error && data) setPurchases(data as Purchase[]);
      setLoading(false);
    })();
  }, []);

  const completed = purchases.filter((p) => p.status === "completed");
  const totalRevenue = completed.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalCredits = completed.reduce((sum, p) => sum + p.credits, 0);
  const uniqueBuyers = new Set(completed.map((p) => p.user_id)).size;

  const statusBadge = (s: string) => {
    if (s === "completed") return "bg-green-500/20 text-green-600 dark:text-green-400";
    if (s === "pending") return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400";
    return "bg-red-500/20 text-red-600 dark:text-red-400";
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-display tracking-wider">AI კრედიტების გაყიდვები</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="rounded-lg bg-muted/40 p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <DollarSign className="h-3.5 w-3.5" /> სრული შემოსავალი
          </div>
          <div className="text-xl font-bold">${totalRevenue.toFixed(2)}</div>
        </div>
        <div className="rounded-lg bg-muted/40 p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <ShoppingCart className="h-3.5 w-3.5" /> შესყიდვები
          </div>
          <div className="text-xl font-bold">{completed.length}</div>
        </div>
        <div className="rounded-lg bg-muted/40 p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <Sparkles className="h-3.5 w-3.5" /> გაცემული კრედიტი
          </div>
          <div className="text-xl font-bold">{totalCredits.toLocaleString()}</div>
        </div>
        <div className="rounded-lg bg-muted/40 p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <TrendingUp className="h-3.5 w-3.5" /> უნიკალური მყიდველები
          </div>
          <div className="text-xl font-bold">{uniqueBuyers}</div>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground py-6 text-center">იტვირთება…</div>
      ) : purchases.length === 0 ? (
        <div className="text-sm text-muted-foreground py-6 text-center">ჯერ არ არის შესყიდვები</div>
      ) : (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="px-2 py-2 font-medium">თარიღი</th>
                <th className="px-2 py-2 font-medium">მომხმარებელი</th>
                <th className="px-2 py-2 font-medium">პაკეტი</th>
                <th className="px-2 py-2 font-medium text-right">კრედიტი</th>
                <th className="px-2 py-2 font-medium text-right">თანხა</th>
                <th className="px-2 py-2 font-medium">სტატუსი</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-2 py-2 text-xs whitespace-nowrap">
                    {new Date(p.created_at).toLocaleString()}
                  </td>
                  <td className="px-2 py-2 truncate max-w-[200px]">{p.email ?? p.user_id.slice(0, 8)}</td>
                  <td className="px-2 py-2 text-xs uppercase">{p.package_id}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{p.credits}</td>
                  <td className="px-2 py-2 text-right tabular-nums font-medium">
                    ${Number(p.amount).toFixed(2)} {p.currency}
                  </td>
                  <td className="px-2 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(p.status)}`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
