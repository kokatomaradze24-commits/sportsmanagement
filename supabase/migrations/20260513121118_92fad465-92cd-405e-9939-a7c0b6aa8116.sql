CREATE OR REPLACE FUNCTION public.admin_list_subscription_revenue()
RETURNS TABLE(
  user_id uuid,
  email text,
  plan text,
  paypal_order_id text,
  paypal_status text,
  expires_at timestamptz,
  activated_at timestamptz,
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
    s.user_id,
    u.email::text,
    s.plan,
    s.paypal_order_id,
    s.paypal_status,
    s.expires_at,
    s.activated_at,
    s.is_trial
  FROM public.user_subscriptions s
  LEFT JOIN auth.users u ON u.id = s.user_id
  WHERE s.paypal_order_id IS NOT NULL
    AND s.is_trial = false
  ORDER BY s.activated_at DESC;
END;
$$;