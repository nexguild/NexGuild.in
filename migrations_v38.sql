CREATE OR REPLACE FUNCTION public.admin_dashboard_earned_coins()
RETURNS NUMERIC
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(SUM(amount), 0)
  FROM public.coin_transactions
  WHERE type = 'earned';
$$;

REVOKE ALL ON FUNCTION public.admin_dashboard_earned_coins() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_dashboard_earned_coins() TO service_role;
