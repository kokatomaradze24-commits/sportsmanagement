ALTER TABLE public.practices ADD COLUMN IF NOT EXISTS age_group TEXT;
CREATE INDEX IF NOT EXISTS idx_practices_age_group ON public.practices(age_group);