ALTER TABLE public.app_settings DROP CONSTRAINT IF EXISTS app_settings_key_key;
CREATE UNIQUE INDEX IF NOT EXISTS app_settings_user_key_unique ON public.app_settings (user_id, key);