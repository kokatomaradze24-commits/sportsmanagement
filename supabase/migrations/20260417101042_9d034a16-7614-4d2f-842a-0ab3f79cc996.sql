
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS birth_date date;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS primary_contact text NOT NULL DEFAULT 'player';
ALTER TABLE public.user_sms_settings ADD COLUMN IF NOT EXISTS email_from text;
ALTER TABLE public.user_sms_settings ADD COLUMN IF NOT EXISTS email_from_name text;
