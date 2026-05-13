import { useEffect, useState } from "react";
import { CreditCard, DollarSign, Users, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SUBSCRIPTION_PLAN } from "@/lib/subscription-plan";

interface SubRevenue {
  user_id: string;
  email: string | null;
  plan: string | null;
  paypal_order_id: string | null;
  paypal_status: string | null;
  expires_at: string;
  activated_at: string;
  is_trial: boolean;
}

export function SubscriptionRevenuePanel() {
  const [rows, setRows] = useState<SubRevenue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("admin_list_subscription_revenue");
      if (!error && data) setRows(data as SubRevenue[]);
      setLoading(false);
    })();
  }, []);

  const perPayment = SUBSCRIPTION_PLAN.amount;
  const totalRevenue = rows.length * perPayment;
  const uniquePayers = new Set(rows.map((r) => r.user_id)).size;

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="h-5 w-5 text-primary" />
        <h3 className="font-display tracking-wider">საიტის წვდომის შემოსავალი</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        <div className="rounded-lg bg-muted/40 p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <DollarSign className="h-3.5 w-3.5" /> სრული შემოსავალი
          </div>
          <div className="text-xl font-bold">${totalRevenue.toFixed(2)}</div>
        </div>
        <div className="rounded-lg bg-muted/40 p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <TrendingUp className="h-3.5 w-3.5" /> გადახდები
          </div>
          <div className="text-xl font-bold">{rows.length}</div>
        </div>
        <div className="rounded-lg bg-muted/40 p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <Users className="h-3.5 w-3.5" /> უნიკალური მომხმარებლები
          </div>
          <div className="text-xl font-bold">{uniquePayers}</div>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground py-6 text-center">იტვირთება…</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-muted-foreground py-6 text-center">ჯერ არავინ გადაიხადა</div>
      ) : (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="px-2 py-2 font-medium">გადახდის თარიღი</th>
                <th className="px-2 py-2 font-medium">მომხმარებელი</th>
                <th className="px-2 py-2 font-medium">პაკეტი</th>
                <th className="px-2 py-2 font-medium text-right">თანხა</th>
                <th className="px-2 py-2 font-medium">მოქმედებს</th>
                <th className="px-2 py-2 font-medium">PayPal Order</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.paypal_order_id ?? r.user_id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-2 py-2 text-xs whitespace-nowrap">
                    {new Date(r.activated_at).toLocaleString()}
                  </td>
                  <td className="px-2 py-2 truncate max-w-[220px]">{r.email ?? r.user_id.slice(0, 8)}</td>
                  <td className="px-2 py-2 text-xs uppercase">{r.plan ?? "—"}</td>
                  <td className="px-2 py-2 text-right tabular-nums font-medium">
                    ${perPayment.toFixed(2)} {SUBSCRIPTION_PLAN.currency}
                  </td>
                  <td className="px-2 py-2 text-xs whitespace-nowrap text-muted-foreground">
                    {new Date(r.expires_at).toLocaleDateString()}-მდე
                  </td>
                  <td className="px-2 py-2 text-[11px] font-mono text-muted-foreground truncate max-w-[140px]">
                    {r.paypal_order_id ?? "—"}
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
