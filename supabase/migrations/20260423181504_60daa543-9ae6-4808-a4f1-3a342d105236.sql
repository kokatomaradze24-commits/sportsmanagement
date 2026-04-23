
-- Coaches table (custom auth, not Supabase auth)
CREATE TABLE public.coaches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,  -- club owner's auth.users id
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  generated_password TEXT,  -- stored so club owner can show it
  display_name TEXT NOT NULL,
  sport TEXT NOT NULL DEFAULT 'basketball',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_coaches_username ON public.coaches (username);
CREATE INDEX idx_coaches_user_id ON public.coaches (user_id);

ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Club owner can view own coaches"
  ON public.coaches FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Club owner can insert own coaches"
  ON public.coaches FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Club owner can update own coaches"
  ON public.coaches FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Club owner can delete own coaches"
  ON public.coaches FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Practices table
CREATE TABLE public.practices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,  -- club owner
  coach_id UUID REFERENCES public.coaches(id) ON DELETE SET NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  sport TEXT NOT NULL DEFAULT 'basketball',
  title TEXT NOT NULL,
  practice_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_practices_user_id ON public.practices (user_id);
CREATE INDEX idx_practices_coach_id ON public.practices (coach_id);
CREATE INDEX idx_practices_date ON public.practices (practice_date);

ALTER TABLE public.practices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Club owner can view own practices"
  ON public.practices FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Club owner can insert own practices"
  ON public.practices FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Club owner can update own practices"
  ON public.practices FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Club owner can delete own practices"
  ON public.practices FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Games table
CREATE TABLE public.games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,  -- club owner
  coach_id UUID REFERENCES public.coaches(id) ON DELETE SET NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  sport TEXT NOT NULL DEFAULT 'basketball',
  title TEXT NOT NULL,
  game_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location TEXT,
  opponent TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_games_user_id ON public.games (user_id);
CREATE INDEX idx_games_coach_id ON public.games (coach_id);
CREATE INDEX idx_games_date ON public.games (game_date);

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Club owner can view own games"
  ON public.games FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Club owner can insert own games"
  ON public.games FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Club owner can update own games"
  ON public.games FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Club owner can delete own games"
  ON public.games FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Timestamp triggers
CREATE TRIGGER update_coaches_updated_at
  BEFORE UPDATE ON public.coaches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_practices_updated_at
  BEFORE UPDATE ON public.practices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON public.games
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
