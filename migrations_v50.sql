CREATE OR REPLACE FUNCTION public.get_my_lifetime_earned()
RETURNS NUMERIC
LANGUAGE SQL
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(SUM(amount), 0)
  FROM public.coin_transactions
  WHERE contributor_id = auth.uid()
    AND type IN ('earned', 'reversed');
$$;

REVOKE ALL ON FUNCTION public.get_my_lifetime_earned() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_lifetime_earned() TO authenticated;
