CREATE TABLE public.payer_aliases (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL DEFAULT auth.uid(),
 sport text NOT NULL,
 payer_name text NOT NULL,
 player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id, sport, payer_name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payer_aliases TO authenticated;
GRANT ALL ON public.payer_aliases TO service_role;
ALTER TABLE public.payer_aliases ENABLE ROW LEVEL SECURITY;
CREATE POLICY aliases_read ON public.payer_aliases FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY aliases_insert ON public.payer_aliases FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.players p WHERE p.id = player_id AND p.user_id = auth.uid() AND p.sport = payer_aliases.sport));
CREATE POLICY aliases_update ON public.payer_aliases FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.players p WHERE p.id = player_id AND p.user_id = auth.uid() AND p.sport = payer_aliases.sport));
CREATE POLICY aliases_delete ON public.payer_aliases FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TABLE public.bank_import_transactions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL DEFAULT auth.uid(),
 sport text NOT NULL,
 transaction_key text NOT NULL,
 transaction_date date NOT NULL,
 amount numeric NOT NULL,
 sender text NOT NULL DEFAULT '',
 purpose text NOT NULL DEFAULT '',
 player_id uuid REFERENCES public.players(id) ON DELETE SET NULL,
 allocation_details jsonb NOT NULL DEFAULT '[]'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id, transaction_key)
);
GRANT SELECT, INSERT ON public.bank_import_transactions TO authenticated;
GRANT ALL ON public.bank_import_transactions TO service_role;
ALTER TABLE public.bank_import_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY imports_read ON public.bank_import_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY imports_insert ON public.bank_import_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.players p WHERE p.id = player_id AND p.user_id = auth.uid() AND p.sport = bank_import_transactions.sport));
CREATE OR REPLACE FUNCTION public.apply_bank_import(_sport text, _rows jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
 owner_id uuid := auth.uid();
 tx jsonb; part jsonb; target public.players%ROWTYPE; pay public.payments%ROWTYPE;
 increment numeric; expected numeric; allocated numeric; ledger_id uuid;
 applied jsonb := '[]'::jsonb; duplicates jsonb := '[]'::jsonb; confirmations jsonb := '[]'::jsonb;
BEGIN
 IF owner_id IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
 IF jsonb_typeof(_rows) <> 'array' OR jsonb_array_length(_rows) > 2000 THEN RAISE EXCEPTION 'Invalid batch'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(owner_id::text || ':' || _sport, 0));
 PERFORM id FROM public.payments WHERE user_id = owner_id AND sport = _sport ORDER BY id FOR UPDATE;
 FOR tx IN SELECT value FROM jsonb_array_elements(_rows) LOOP
  IF EXISTS (SELECT 1 FROM public.bank_import_transactions WHERE user_id = owner_id AND transaction_key = tx->>'key') THEN
   duplicates := duplicates || jsonb_build_array(tx->>'key'); CONTINUE;
  END IF;
  SELECT * INTO target FROM public.players WHERE id = (tx->>'playerId')::uuid AND user_id = owner_id AND sport = _sport;
  IF NOT FOUND OR NOT target.is_active THEN RAISE EXCEPTION 'Invalid player'; END IF;
  IF (tx->>'amount')::numeric <= 0 OR length(tx->>'key') NOT BETWEEN 1 AND 2048 OR jsonb_typeof(tx->'allocations') <> 'array' THEN RAISE EXCEPTION 'Invalid transaction'; END IF;
  allocated := 0;
  FOR part IN SELECT value FROM jsonb_array_elements(tx->'allocations') LOOP
   increment := (part->>'amount')::numeric;
   expected := (part->>'expectedPaid')::numeric;
   SELECT * INTO pay FROM public.payments WHERE id = (part->>'paymentId')::uuid AND user_id = owner_id AND sport = _sport;
   IF NOT FOUND THEN RAISE EXCEPTION 'Invalid payment'; END IF;
   IF pay.player_id <> target.id AND (target.family_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.players p WHERE p.id = pay.player_id AND p.family_id = target.family_id AND p.user_id = owner_id AND p.sport = _sport)) THEN RAISE EXCEPTION 'Invalid family allocation'; END IF;
   IF pay.paid_amount <> expected THEN RAISE EXCEPTION 'BANK_IMPORT_STALE'; END IF;
   IF increment <= 0 OR pay.status = 'paid' OR increment > greatest(0, pay.amount - pay.paid_amount) OR increment <> round(increment, 2) THEN RAISE EXCEPTION 'Invalid allocation'; END IF;
   allocated := allocated + increment;
   IF allocated > (tx->>'amount')::numeric THEN RAISE EXCEPTION 'Allocation exceeds transfer'; END IF;
   UPDATE public.payments SET paid_amount = pay.paid_amount + increment, payment_date = (tx->>'date')::date WHERE id = pay.id;
   IF pay.paid_amount + increment >= pay.amount THEN confirmations := confirmations || jsonb_build_array(jsonb_build_object('playerId', pay.player_id, 'paymentId', pay.id)); END IF;
  END LOOP;
  IF allocated <= 0 THEN RAISE EXCEPTION 'Empty allocation'; END IF;
  INSERT INTO public.bank_import_transactions(user_id, sport, transaction_key, transaction_date, amount, sender, purpose, player_id, allocation_details)
   VALUES(owner_id, _sport, tx->>'key', (tx->>'date')::date, (tx->>'amount')::numeric, coalesce(tx->>'sender',''), coalesce(tx->>'purpose',''), target.id, tx->'allocations') RETURNING id INTO ledger_id;
  IF coalesce((tx->>'remember')::boolean, false) AND length(trim(coalesce(tx->>'payerName',''))) > 0 THEN
   INSERT INTO public.payer_aliases(user_id, sport, payer_name, player_id) VALUES(owner_id, _sport, tx->>'payerName', target.id)
   ON CONFLICT(user_id, sport, payer_name) DO UPDATE SET player_id = EXCLUDED.player_id;
  END IF;
  applied := applied || jsonb_build_array(tx->>'key');
 END LOOP;
 RETURN jsonb_build_object('applied', applied, 'duplicates', duplicates, 'confirmations', confirmations);
END;
$$;
REVOKE ALL ON FUNCTION public.apply_bank_import(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_bank_import(text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_bank_import(text, jsonb) TO service_role;