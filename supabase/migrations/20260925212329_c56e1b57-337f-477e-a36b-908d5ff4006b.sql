ALTER TABLE public.players ADD COLUMN IF NOT EXISTS family_id uuid;
CREATE INDEX IF NOT EXISTS players_family_id_idx ON public.players(family_id);