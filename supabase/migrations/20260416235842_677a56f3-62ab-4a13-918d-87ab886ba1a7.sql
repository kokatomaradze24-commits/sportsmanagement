-- Drop old admin_list_users to allow return type change
DROP FUNCTION IF EXISTS public.admin_list_users();

CREATE TABLE public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  activated_by UUID,
  activated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_trial BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
ON public.user_subscriptions FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage subscriptions insert"
ON public.user_subscriptions FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage subscriptions update"
ON public.user_subscriptions FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage subscriptions delete"
ON public.user_subscriptions FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update new-user handler to also create 7-day trial
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.user_subscriptions (user_id, expires_at, is_trial, activated_by)
  VALUES (NEW.id, now() + interval '7 days', true, NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Backfill existing users with 30 days
INSERT INTO public.user_subscriptions (user_id, expires_at, is_trial, activated_by)
SELECT id, now() + interval '30 days', false, id
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_subscriptions)
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_subscription_active(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_subscriptions
    WHERE user_id = _user_id AND expires_at > now()
  ) OR public.has_role(_user_id, 'admin');
$$;

CREATE OR REPLACE FUNCTION public.admin_extend_subscription(_user_id UUID, _days INTEGER)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current TIMESTAMPTZ;
  _new TIMESTAMPTZ;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT expires_at INTO _current FROM public.user_subscriptions WHERE user_id = _user_id;

  IF _current IS NULL OR _current < now() THEN
    _new := now() + (_days || ' days')::interval;
  ELSE
    _new := _current + (_days || ' days')::interval;
  END IF;

  INSERT INTO public.user_subscriptions (user_id, expires_at, is_trial, activated_by)
  VALUES (_user_id, _new, false, auth.uid())
  ON CONFLICT (user_id) DO UPDATE
    SET expires_at = _new, is_trial = false, activated_by = auth.uid(), activated_at = now();

  RETURN _new;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_deactivate_subscription(_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  UPDATE public.user_subscriptions
  SET expires_at = now() - interval '1 second', is_trial = false
  WHERE user_id = _user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE(
  user_id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  is_admin boolean,
  player_count bigint,
  payment_count bigint,
  subscription_expires_at timestamptz,
  is_trial boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.email::TEXT,
    u.created_at,
    u.last_sign_in_at,
    EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id AND r.role = 'admin'),
    (SELECT COUNT(*) FROM public.players p WHERE p.user_id = u.id),
    (SELECT COUNT(*) FROM public.payments pa WHERE pa.user_id = u.id),
    s.expires_at,
    COALESCE(s.is_trial, false)
  FROM auth.users u
  LEFT JOIN public.user_subscriptions s ON s.user_id = u.id
  ORDER BY u.created_at DESC;
END;
$$;