CREATE TABLE public.player_registration_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  link_id uuid NOT NULL,
  user_id uuid NOT NULL,
  sport text NOT NULL DEFAULT 'basketball',
  status text NOT NULL DEFAULT 'pending',
  first_name text NOT NULL,
  last_name text NOT NULL,
  birth_date date NOT NULL,
  phone text,
  parent_phone text,
  primary_contact text NOT NULL DEFAULT 'player',
  experience_level text NOT NULL DEFAULT 'experienced',
  previous_club text,
  previous_team text,
  league text,
  last_coach text,
  notes text,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.player_registration_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Club owner can view own registration requests"
ON public.player_registration_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Club owner can update own registration requests"
ON public.player_registration_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Club owner can delete own registration requests"
ON public.player_registration_requests
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_player_registration_requests_owner_sport_status
ON public.player_registration_requests (user_id, sport, status, created_at DESC);

CREATE TRIGGER update_player_registration_requests_updated_at
BEFORE UPDATE ON public.player_registration_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();