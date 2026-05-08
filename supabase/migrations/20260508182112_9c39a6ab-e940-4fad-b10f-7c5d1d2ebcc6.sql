CREATE TABLE public.practice_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sport TEXT NOT NULL DEFAULT 'basketball',
  age_group TEXT NOT NULL,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_practice_templates_user_age ON public.practice_templates(user_id, sport, age_group);

ALTER TABLE public.practice_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view own practice templates"
ON public.practice_templates FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Owners insert own practice templates"
ON public.practice_templates FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners update own practice templates"
ON public.practice_templates FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Owners delete own practice templates"
ON public.practice_templates FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER trg_practice_templates_updated_at
BEFORE UPDATE ON public.practice_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();