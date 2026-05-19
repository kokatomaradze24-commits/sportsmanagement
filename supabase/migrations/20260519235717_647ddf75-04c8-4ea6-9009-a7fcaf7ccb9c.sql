
-- Add short_code for shorter registration URLs
ALTER TABLE public.player_registration_links
  ADD COLUMN IF NOT EXISTS short_code text;

-- Backfill existing rows with random 8-char base36 codes
UPDATE public.player_registration_links
SET short_code = lower(substring(encode(gen_random_bytes(8), 'hex') from 1 for 8))
WHERE short_code IS NULL;

-- Ensure uniqueness + not null + default for new rows
ALTER TABLE public.player_registration_links
  ALTER COLUMN short_code SET NOT NULL,
  ALTER COLUMN short_code SET DEFAULT lower(substring(encode(gen_random_bytes(8), 'hex') from 1 for 8));

CREATE UNIQUE INDEX IF NOT EXISTS player_registration_links_short_code_key
  ON public.player_registration_links(short_code);
