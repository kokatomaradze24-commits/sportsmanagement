CREATE TABLE IF NOT EXISTS public.player_registration_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sport TEXT NOT NULL DEFAULT 'basketball',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, sport)
);

ALTER TABLE public.player_registration_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Club owner can view own registration links" ON public.player_registration_links;
DROP POLICY IF EXISTS "Club owner can insert own registration links" ON public.player_registration_links;
DROP POLICY IF EXISTS "Club owner can update own registration links" ON public.player_registration_links;
DROP POLICY IF EXISTS "Club owner can delete own registration links" ON public.player_registration_links;

CREATE POLICY "Club owner can view own registration links"
ON public.player_registration_links
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Club owner can insert own registration links"
ON public.player_registration_links
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Club owner can update own registration links"
ON public.player_registration_links
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Club owner can delete own registration links"
ON public.player_registration_links
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER update_player_registration_links_updated_at
BEFORE UPDATE ON public.player_registration_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_player_registration_links_user_sport
ON public.player_registration_links (user_id, sport);

CREATE INDEX IF NOT EXISTS idx_player_registration_links_active
ON public.player_registration_links (id, is_active);