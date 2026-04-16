import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Payment = Database["public"]["Tables"]["payments"]["Row"];
type PaymentInsert = Database["public"]["Tables"]["payments"]["Insert"];

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("payments").select("*").order("year", { ascending: false }).order("month", { ascending: false });
    if (data) setPayments(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const addPayment = useCallback(async (payment: PaymentInsert) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: new Error("Not authenticated") };
    const { error } = await supabase.from("payments").insert({ ...payment, user_id: user.id });
    if (!error) await fetchPayments();
    return { error };
  }, [fetchPayments]);

  const updatePayment = useCallback(async (id: string, updates: Partial<Payment>) => {
    const { error } = await supabase.from("payments").update(updates).eq("id", id);
    if (!error) await fetchPayments();
    return { error };
  }, [fetchPayments]);

  const deletePayment = useCallback(async (id: string) => {
    const { error } = await supabase.from("payments").delete().eq("id", id);
    if (!error) await fetchPayments();
    return { error };
  }, [fetchPayments]);

  return { payments, loading, addPayment, updatePayment, deletePayment, refetch: fetchPayments };
}
