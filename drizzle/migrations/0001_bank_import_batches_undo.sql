ALTER TABLE public.bank_import_transactions ADD COLUMN IF NOT EXISTS batch_id uuid, ADD COLUMN IF NOT EXISTS batch_seq integer;
CREATE INDEX IF NOT EXISTS bank_import_transactions_batch_idx ON public.bank_import_transactions(user_id, batch_id);

CREATE OR REPLACE FUNCTION public.apply_bank_import(_sport text, _rows jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
 owner_id uuid := auth.uid();
 batch uuid := gen_random_uuid(); seq integer := 0;
 tx jsonb; part jsonb; target public.players%ROWTYPE; pay public.payments%ROWTYPE;
 increment numeric; expected numeric; allocated numeric; is_handled boolean; details jsonb;
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
  IF (tx->>'date')::date > (now() AT TIME ZONE 'Asia/Tbilisi')::date THEN RAISE EXCEPTION 'BANK_IMPORT_FUTURE_DATE'; END IF;
  is_handled := coalesce((tx->>'handled')::boolean, false);
  IF is_handled AND jsonb_array_length(tx->'allocations') > 0 THEN RAISE EXCEPTION 'Invalid transaction'; END IF;
  allocated := 0; details := '[]'::jsonb;
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
   details := details || jsonb_build_array(jsonb_build_object(
     'paymentId', pay.id, 'playerId', pay.player_id, 'month', pay.month, 'year', pay.year,
     'amount', increment, 'expectedPaid', pay.paid_amount, 'resultingPaid', pay.paid_amount + increment,
     'fullyPaid', pay.paid_amount + increment >= pay.amount, 'previousDate', pay.payment_date));
   IF pay.paid_amount + increment >= pay.amount THEN confirmations := confirmations || jsonb_build_array(jsonb_build_object('playerId', pay.player_id, 'paymentId', pay.id)); END IF;
  END LOOP;
  IF allocated <= 0 AND NOT is_handled THEN RAISE EXCEPTION 'Empty allocation'; END IF;
  seq := seq + 1;
  INSERT INTO public.bank_import_transactions(user_id, sport, transaction_key, transaction_date, amount, sender, purpose, player_id, allocation_details, batch_id, batch_seq)
   VALUES(owner_id, _sport, tx->>'key', (tx->>'date')::date, (tx->>'amount')::numeric, coalesce(tx->>'sender',''), coalesce(tx->>'purpose',''), target.id, details, batch, seq);
  IF coalesce((tx->>'remember')::boolean, false) AND length(trim(coalesce(tx->>'payerName',''))) > 0 THEN
   INSERT INTO public.payer_aliases(user_id, sport, payer_name, player_id) VALUES(owner_id, _sport, tx->>'payerName', target.id)
   ON CONFLICT(user_id, sport, payer_name) DO UPDATE SET player_id = EXCLUDED.player_id;
  END IF;
  applied := applied || jsonb_build_array(tx->>'key');
 END LOOP;
 RETURN jsonb_build_object('applied', applied, 'duplicates', duplicates, 'confirmations', confirmations, 'batchId', batch);
END;
$$;
REVOKE ALL ON FUNCTION public.apply_bank_import(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_bank_import(text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_bank_import(text, jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.undo_bank_import(_batch_id uuid) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
 owner_id uuid := auth.uid();
 led public.bank_import_transactions%ROWTYPE; part jsonb; pay public.payments%ROWTYPE; removed integer;
BEGIN
 IF owner_id IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
 SELECT * INTO led FROM public.bank_import_transactions WHERE user_id = owner_id AND batch_id = _batch_id LIMIT 1;
 IF NOT FOUND THEN RAISE EXCEPTION 'BANK_UNDO_NOT_FOUND'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(owner_id::text || ':' || led.sport, 0));
 PERFORM id FROM public.payments WHERE user_id = owner_id AND sport = led.sport ORDER BY id FOR UPDATE;
 FOR led IN SELECT * FROM public.bank_import_transactions WHERE user_id = owner_id AND batch_id = _batch_id ORDER BY batch_seq DESC LOOP
  FOR part IN SELECT e.value FROM jsonb_array_elements(led.allocation_details) WITH ORDINALITY AS e(value, n) ORDER BY e.n DESC LOOP
   SELECT * INTO pay FROM public.payments WHERE id = (part->>'paymentId')::uuid AND user_id = owner_id;
   IF NOT FOUND OR pay.paid_amount <> (part->>'resultingPaid')::numeric OR pay.payment_date IS DISTINCT FROM led.transaction_date THEN
    RAISE EXCEPTION 'BANK_UNDO_CHANGED';
   END IF;
   UPDATE public.payments SET paid_amount = (part->>'expectedPaid')::numeric, payment_date = (part->>'previousDate')::date WHERE id = pay.id;
  END LOOP;
 END LOOP;
 DELETE FROM public.bank_import_transactions WHERE user_id = owner_id AND batch_id = _batch_id;
 GET DIAGNOSTICS removed = ROW_COUNT;
 RETURN removed;
END;
$$;
REVOKE ALL ON FUNCTION public.undo_bank_import(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.undo_bank_import(uuid) TO authenticated;