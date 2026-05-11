
ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS paypal_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS paypal_status TEXT,
  ADD COLUMN IF NOT EXISTS plan TEXT,
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS user_subscriptions_paypal_sub_idx
  ON public.user_subscriptions (paypal_subscription_id)
  WHERE paypal_subscription_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.paypal_plans (
  env TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  trial_days INTEGER NOT NULL DEFAULT 7,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.paypal_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view paypal plans" ON public.paypal_plans;
CREATE POLICY "Admins can view paypal plans"
  ON public.paypal_plans FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
