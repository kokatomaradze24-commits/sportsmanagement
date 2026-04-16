
-- Add user_id to players
ALTER TABLE public.players ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to payments
ALTER TABLE public.payments ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to app_settings
ALTER TABLE public.app_settings ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop old RLS policies on players
DROP POLICY IF EXISTS "Authenticated users can view players" ON public.players;
DROP POLICY IF EXISTS "Authenticated users can insert players" ON public.players;
DROP POLICY IF EXISTS "Authenticated users can update players" ON public.players;
DROP POLICY IF EXISTS "Authenticated users can delete players" ON public.players;

-- New per-user RLS on players
CREATE POLICY "Users can view own players" ON public.players FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own players" ON public.players FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own players" ON public.players FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own players" ON public.players FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Drop old RLS policies on payments
DROP POLICY IF EXISTS "Authenticated users can view payments" ON public.payments;
DROP POLICY IF EXISTS "Authenticated users can insert payments" ON public.payments;
DROP POLICY IF EXISTS "Authenticated users can update payments" ON public.payments;
DROP POLICY IF EXISTS "Authenticated users can delete payments" ON public.payments;

-- New per-user RLS on payments
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own payments" ON public.payments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own payments" ON public.payments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Drop old RLS policies on app_settings
DROP POLICY IF EXISTS "Authenticated users can view app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Authenticated users can insert app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Authenticated users can update app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Authenticated users can delete app_settings" ON public.app_settings;

-- New per-user RLS on app_settings
CREATE POLICY "Users can view own settings" ON public.app_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.app_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.app_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own settings" ON public.app_settings FOR DELETE TO authenticated USING (auth.uid() = user_id);
