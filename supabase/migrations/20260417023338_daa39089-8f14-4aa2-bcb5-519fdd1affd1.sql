-- 1. Add parent_phone to players
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS parent_phone TEXT;

-- 2. user_sms_settings table
CREATE TABLE IF NOT EXISTS public.user_sms_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  provider TEXT NOT NULL DEFAULT 'magti' CHECK (provider IN ('magti','twilio')),
  -- Magti / SMSOffice.ge
  magti_api_key TEXT,
  magti_sender TEXT,
  -- Twilio
  twilio_account_sid TEXT,
  twilio_auth_token TEXT,
  twilio_from TEXT,
  -- Reminder timing
  reminder_days_before INTEGER NOT NULL DEFAULT 3 CHECK (reminder_days_before BETWEEN 0 AND 14),
  send_overdue BOOLEAN NOT NULL DEFAULT true,
  send_reminder BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_sms_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own sms settings" ON public.user_sms_settings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own sms settings" ON public.user_sms_settings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own sms settings" ON public.user_sms_settings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own sms settings" ON public.user_sms_settings
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_user_sms_settings_updated
  BEFORE UPDATE ON public.user_sms_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. sms_logs table
CREATE TABLE IF NOT EXISTS public.sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  player_id UUID,
  payment_id UUID,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('reminder','overdue','manual')),
  provider TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent','failed')),
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sms_logs_user_created ON public.sms_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_logs_payment ON public.sms_logs(payment_id);

ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own sms logs" ON public.sms_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
-- Inserts happen from server with service role; no client insert policy needed.