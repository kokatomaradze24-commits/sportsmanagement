CREATE OR REPLACE FUNCTION public.admin_list_ai_purchases()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  email text,
  package_id text,
  credits integer,
  amount numeric,
  currency text,
  status text,
  provider text,
  provider_order_id text,
  created_at timestamptz
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
    p.id,
    p.user_id,
    u.email::text,
    p.package_id,
    p.credits,
    p.amount,
    p.currency,
    p.status,
    p.provider,
    p.provider_order_id,
    p.created_at
  FROM public.ai_credit_purchases p
  LEFT JOIN auth.users u ON u.id = p.user_id
  ORDER BY p.created_at DESC;
END;
$$;