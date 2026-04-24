-- Set the default season length to 10 months (September through June).
ALTER TABLE public.players
  ALTER COLUMN subscription_months SET DEFAULT 10;

-- Keep automatic payment generation aligned with the football/sports season model.
CREATE OR REPLACE FUNCTION public.generate_player_payments(_player_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _player public.players%ROWTYPE;
  _i int;
  _m int;
  _y int;
BEGIN
  SELECT * INTO _player FROM public.players WHERE id = _player_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

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