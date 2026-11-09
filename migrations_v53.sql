CREATE OR REPLACE FUNCTION public.get_my_lifetime_spent()
RETURNS NUMERIC
LANGUAGE SQL
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(SUM(amount), 0)
  FROM public.coin_transactions
  WHERE contributor_id = auth.uid()
    AND type = 'redeemed';
$$;

REVOKE ALL ON FUNCTION public.get_my_lifetime_spent() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_lifetime_spent() TO authenticated;

CREATE INDEX IF NOT EXISTS coin_transactions_redeemed_contributor_created_at_idx
  ON public.coin_transactions (contributor_id, created_at)
  INCLUDE (amount)
  WHERE type = 'redeemed';
