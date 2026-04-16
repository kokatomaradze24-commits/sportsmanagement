-- 1. Add sport column with default
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS sport text NOT NULL DEFAULT 'basketball';

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS sport text NOT NULL DEFAULT 'basketball';

-- 2. Backfill existing rows with the user's currently selected sport (if any)
UPDATE public.players p
SET sport = COALESCE(
  (SELECT s.value FROM public.app_settings s
   WHERE s.user_id = p.user_id AND s.key = 'sport' LIMIT 1),
  'basketball'
)
WHERE p.sport = 'basketball';

UPDATE public.payments pay
SET sport = COALESCE(
  (SELECT s.value FROM public.app_settings s
   WHERE s.user_id = pay.user_id AND s.key = 'sport' LIMIT 1),
  'basketball'
)
WHERE pay.sport = 'basketball';

-- 3. Indexes for filtered queries
CREATE INDEX IF NOT EXISTS idx_players_user_sport
  ON public.players (user_id, sport);

CREATE INDEX IF NOT EXISTS idx_payments_user_sport
  ON public.payments (user_id, sport);