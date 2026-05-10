
CREATE TABLE public.user_ai_credits (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  credits INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_ai_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own credits"
  ON public.user_ai_credits FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.ai_credit_purchases (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id TEXT NOT NULL,
  credits INTEGER NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  provider TEXT NOT NULL DEFAULT 'paypal',
  provider_order_id TEXT,
  provider_capture_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_credit_purchases_user ON public.ai_credit_purchases(user_id);
CREATE UNIQUE INDEX idx_ai_credit_purchases_order ON public.ai_credit_purchases(provider_order_id) WHERE provider_order_id IS NOT NULL;

ALTER TABLE public.ai_credit_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own purchases"
  ON public.ai_credit_purchases FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_user_ai_credits_updated
  BEFORE UPDATE ON public.user_ai_credits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_ai_credit_purchases_updated
  BEFORE UPDATE ON public.ai_credit_purchases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
