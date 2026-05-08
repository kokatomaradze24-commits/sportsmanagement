CREATE TABLE public.age_development_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  sport text NOT NULL DEFAULT 'basketball',
  age_group text NOT NULL,
  plan text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, sport, age_group)
);

ALTER TABLE public.age_development_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view own age plans" ON public.age_development_plans
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners insert own age plans" ON public.age_development_plans
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update own age plans" ON public.age_development_plans
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners delete own age plans" ON public.age_development_plans
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_age_development_plans_updated_at
  BEFORE UPDATE ON public.age_development_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();