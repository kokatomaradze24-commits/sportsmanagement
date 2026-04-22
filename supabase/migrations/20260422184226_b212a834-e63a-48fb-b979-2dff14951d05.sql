CREATE TABLE IF NOT EXISTS public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sport TEXT NOT NULL DEFAULT 'basketball',
  name TEXT NOT NULL,
  age_group TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY teams_select_own ON public.teams FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY teams_insert_own ON public.teams FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY teams_update_own ON public.teams FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY teams_delete_own ON public.teams FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (team_id, player_id)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY team_members_select_own ON public.team_members FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY team_members_insert_own ON public.team_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY team_members_delete_own ON public.team_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_team_members_team ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_player ON public.team_members(player_id);
CREATE INDEX IF NOT EXISTS idx_teams_user_sport ON public.teams(user_id, sport);