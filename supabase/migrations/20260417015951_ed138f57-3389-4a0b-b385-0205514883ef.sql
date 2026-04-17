-- 1. Add subscription fields to players
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS monthly_fee NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subscription_months INTEGER NOT NULL DEFAULT 12 CHECK (subscription_months BETWEEN 1 AND 12),
  ADD COLUMN IF NOT EXISTS start_month INTEGER NOT NULL DEFAULT EXTRACT(MONTH FROM now()) CHECK (start_month BETWEEN 1 AND 12),
  ADD COLUMN IF NOT EXISTS start_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  ADD COLUMN IF NOT EXISTS start_day INTEGER NOT NULL DEFAULT EXTRACT(DAY FROM now()) CHECK (start_day BETWEEN 1 AND 31);

-- 2. Function: generate pending payments for a player based on subscription
CREATE OR REPLACE FUNCTION public.generate_player_payments(_player_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _player public.players%ROWTYPE;
  _i INTEGER;
  _m INTEGER;
  _y INTEGER;
BEGIN
  SELECT * INTO _player FROM public.players WHERE id = _player_id;
  IF NOT FOUND THEN RETURN; END IF;

  FOR _i IN 0..(_player.subscription_months - 1) LOOP
    _m := ((_player.start_month - 1 + _i) % 12) + 1;
    _y := _player.start_year + ((_player.start_month - 1 + _i) / 12);

    INSERT INTO public.payments (player_id, user_id, sport, amount, month, year, status)
    SELECT _player.id, _player.user_id, _player.sport, _player.monthly_fee, _m, _y, 'pending'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.payments
      WHERE player_id = _player.id AND month = _m AND year = _y
    );
  END LOOP;
END;
$$;

-- 3. Function: mark overdue payments (pending whose due date has passed)
CREATE OR REPLACE FUNCTION public.mark_overdue_payments()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count INTEGER;
BEGIN
  WITH updated AS (
    UPDATE public.payments p
    SET status = 'overdue', updated_at = now()
    FROM public.players pl
    WHERE p.player_id = pl.id
      AND p.status = 'pending'
      AND make_date(p.year, p.month, LEAST(pl.start_day, 28)) < CURRENT_DATE
    RETURNING p.id
  )
  SELECT COUNT(*) INTO _count FROM updated;
  RETURN _count;
END;
$$;

-- 4. Trigger: when a player is inserted, auto-generate payments
CREATE OR REPLACE FUNCTION public.on_player_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.generate_player_payments(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_player_created ON public.players;
CREATE TRIGGER trg_player_created
AFTER INSERT ON public.players
FOR EACH ROW EXECUTE FUNCTION public.on_player_created();

-- 5. Schedule daily overdue check (pg_cron)
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'mark-overdue-payments-daily') THEN
    PERFORM cron.unschedule('mark-overdue-payments-daily');
  END IF;
END $$;

SELECT cron.schedule(
  'mark-overdue-payments-daily',
  '0 3 * * *',
  $$ SELECT public.mark_overdue_payments(); $$
);

-- 6. Run once now to mark any existing overdue
SELECT public.mark_overdue_payments();