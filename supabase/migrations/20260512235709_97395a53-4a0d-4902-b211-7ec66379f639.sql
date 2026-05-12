CREATE OR REPLACE FUNCTION public.deduct_ai_credits(_user_id uuid, _amount integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current integer;
BEGIN
  IF _amount <= 0 THEN
    RETURN true;
  END IF;

  SELECT credits INTO _current
  FROM public.user_ai_credits
  WHERE user_id = _user_id
  FOR UPDATE;

  IF _current IS NULL OR _current < _amount THEN
    RETURN false;
  END IF;

  UPDATE public.user_ai_credits
  SET credits = credits - _amount, updated_at = now()
  WHERE user_id = _user_id;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_ai_credits(_user_id uuid, _amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _amount <= 0 THEN RETURN; END IF;
  INSERT INTO public.user_ai_credits (user_id, credits)
  VALUES (_user_id, _amount)
  ON CONFLICT (user_id) DO UPDATE
    SET credits = public.user_ai_credits.credits + _amount, updated_at = now();
END;
$$;