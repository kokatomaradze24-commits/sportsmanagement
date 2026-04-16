-- Drop all existing permissive policies on players
DROP POLICY IF EXISTS "Allow all access to players" ON public.players;

-- Create authenticated-only policies for players
CREATE POLICY "Authenticated users can view players"
ON public.players FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert players"
ON public.players FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update players"
ON public.players FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete players"
ON public.players FOR DELETE TO authenticated USING (true);

-- Drop all existing permissive policies on payments
DROP POLICY IF EXISTS "Allow all access to payments" ON public.payments;

CREATE POLICY "Authenticated users can view payments"
ON public.payments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert payments"
ON public.payments FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update payments"
ON public.payments FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete payments"
ON public.payments FOR DELETE TO authenticated USING (true);

-- Drop all existing permissive policies on app_settings
DROP POLICY IF EXISTS "Allow all access to app_settings" ON public.app_settings;

CREATE POLICY "Authenticated users can view app_settings"
ON public.app_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert app_settings"
ON public.app_settings FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update app_settings"
ON public.app_settings FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete app_settings"
ON public.app_settings FOR DELETE TO authenticated USING (true);

-- Fix storage policies for logos bucket
DROP POLICY IF EXISTS "Anyone can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete logos" ON storage.objects;

CREATE POLICY "Authenticated users can upload logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'logos');

CREATE POLICY "Authenticated users can update logos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'logos');

CREATE POLICY "Authenticated users can delete logos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'logos');