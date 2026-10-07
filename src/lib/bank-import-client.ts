import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BankTransaction, PayerAlias, Allocation, BankPayment } from "./bank-import";

type AliasRow = PayerAlias & { user_id: string; sport: string; created_at: string };
type ImportRow = BankTransaction & {
  id: string;
  user_id: string;
  sport: string;
  transaction_key: string;
  transaction_date: string;
  player_id: string | null;
  allocation_details: unknown;
  created_at: string;
  batch_id: string | null;
  batch_seq: number | null;
};
type FeatureDatabase = {
  public: {
    Tables: {
      payer_aliases: {
        Row: AliasRow;
        Insert: { user_id?: string; sport: string; payer_name: string; player_id: string };
        Update: Partial<AliasRow>;
        Relationships: [];
      };
      bank_import_transactions: {
        Row: ImportRow;
        Insert: Partial<ImportRow>;
        Update: Partial<ImportRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      apply_bank_import: { Args: { _sport: string; _rows: unknown }; Returns: ImportResult };
      undo_bank_import: { Args: { _batch_id: string }; Returns: number };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
const db = supabase as unknown as SupabaseClient<FeatureDatabase>;
export type ApplyRow = BankTransaction & {
  playerId: string;
  remember: boolean;
  handled: boolean;
  payerName: string;
  allocations: Allocation[];
};
export type ImportResult = {
  applied: string[];
  duplicates: string[];
  confirmations: { paymentId: string; playerId: string }[];
  batchId?: string;
};
export type ImportBatch = {
  batchId: string;
  createdAt: string;
  count: number;
  applied: number;
  total: number;
};
export async function loadImportHistory(sport: string): Promise<ImportBatch[]> {
  const batches = new Map<string, ImportBatch>();
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await db
      .from("bank_import_transactions")
      .select("batch_id,created_at,allocation_details")
      .eq("sport", sport)
      .not("batch_id", "is", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + 999);
    if (error) throw error;
    for (const row of data ?? []) {
      const id = row.batch_id as string;
      const parts = Array.isArray(row.allocation_details)
        ? (row.allocation_details as { amount: number | string }[])
        : [];
      const batch = batches.get(id) ?? { batchId: id, createdAt: row.created_at, count: 0, applied: 0, total: 0 };
      batch.count += 1;
      if (parts.length) batch.applied += 1;
      batch.total += parts.reduce((sum, p) => sum + Number(p.amount), 0);
      batches.set(id, batch);
    }
    if (!data || data.length < 1000) break;
  }
  return [...batches.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export async function undoBankImport(batchId: string) {
  const { error } = await db.rpc("undo_bank_import", { _batch_id: batchId });
  if (error) throw error;
}
export async function loadBankImportData(sport: string, keys: string[]) {
  const aliasResponse = await db.from("payer_aliases").select("*").eq("sport", sport);
  if (aliasResponse.error) throw aliasResponse.error;
  const imported = new Set<string>();
  for (let i = 0; i < keys.length; i += 100) {
    const response = await db
      .from("bank_import_transactions")
      .select("transaction_key")
      .in("transaction_key", keys.slice(i, i + 100));
    if (response.error) throw response.error;
    response.data?.forEach((row) => imported.add(row.transaction_key));
  }
  return { aliases: aliasResponse.data ?? [], imported };
}
export async function deletePayerAlias(id: string) {
  const { error } = await db.from("payer_aliases").delete().eq("id", id);
  if (error) throw error;
}
export async function applyBankImport(sport: string, rows: ApplyRow[]): Promise<ImportResult> {
  const { data, error } = await db.rpc("apply_bank_import", { _sport: sport, _rows: rows });
  if (error) throw error;
  if (!data) throw new Error("Empty import response");
  return data;
}
export async function loadBankBalances(sport: string): Promise<BankPayment[]> {
  const rows: BankPayment[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase.from("payments")
      .select("id,player_id,month,year,amount,paid_amount,status,payment_date")
      .eq("sport", sport).order("id").range(offset, offset + 499);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < 500) break;
  }
  return rows;
}
