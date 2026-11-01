BEGIN;

CREATE TABLE IF NOT EXISTS public.global_payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contributor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  coins_requested INTEGER NOT NULL CHECK (coins_requested IN (10000, 20000, 50000)),
  usdt_amount NUMERIC(12, 2) NOT NULL CHECK (usdt_amount IN (10, 20, 50)),
  payout_method TEXT NOT NULL CHECK (payout_method IN ('binance_pay', 'usdt_trc20', 'usdt_bep20', 'usdt_erc20')),
  destination TEXT NOT NULL CHECK (char_length(destination) BETWEEN 4 AND 200),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'paid', 'rejected')),
  payment_reference TEXT,
  rejection_reason TEXT,
  admin_notes TEXT,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS global_payout_requests_created_at_idx
  ON public.global_payout_requests (created_at DESC);

CREATE INDEX IF NOT EXISTS global_payout_requests_contributor_created_at_idx
  ON public.global_payout_requests (contributor_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS global_payout_requests_one_open_per_contributor_idx
  ON public.global_payout_requests (contributor_id)
  WHERE status IN ('pending', 'under_review');

CREATE UNIQUE INDEX IF NOT EXISTS global_payout_requests_payment_reference_idx
  ON public.global_payout_requests (LOWER(payment_reference))
  WHERE payment_reference IS NOT NULL;

ALTER TABLE public.global_payout_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS global_payout_requests_select_own ON public.global_payout_requests;
CREATE POLICY global_payout_requests_select_own
  ON public.global_payout_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = contributor_id);

REVOKE ALL ON public.global_payout_requests FROM anon, authenticated;
GRANT SELECT ON public.global_payout_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.global_payout_requests TO service_role;

CREATE OR REPLACE FUNCTION public.create_global_payout_request(
  p_contributor_id UUID,
  p_coins INTEGER,
  p_usdt NUMERIC,
  p_method TEXT,
  p_destination TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_request_id UUID;
BEGIN
  IF p_coins NOT IN (10000, 20000, 50000)
     OR p_usdt <> p_coins::NUMERIC / 1000
     OR p_method NOT IN ('binance_pay', 'usdt_trc20', 'usdt_bep20', 'usdt_erc20')
     OR char_length(btrim(p_destination)) NOT BETWEEN 4 AND 200 THEN
    RAISE EXCEPTION 'invalid_payout_request' USING ERRCODE = '22023';
  END IF;

  UPDATE public.profiles
  SET nexcoins = COALESCE(nexcoins, 0) - p_coins
  WHERE id = p_contributor_id
    AND role = 'contributor'
    AND COALESCE(nexcoins, 0) >= p_coins;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'insufficient_balance' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.global_payout_requests (
    contributor_id, coins_requested, usdt_amount, payout_method, destination
  )
  VALUES (
    p_contributor_id, p_coins, p_usdt, p_method, btrim(p_destination)
  )
  RETURNING id INTO v_request_id;

  INSERT INTO public.coin_transactions (
    contributor_id, amount, type, source, description
  )
  VALUES (
    p_contributor_id, p_coins, 'redeemed', 'global_payout',
    format('Reserved %s USDT global payout request %s', p_usdt, v_request_id)
  );

  RETURN v_request_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_global_payout_request(
  p_request_id UUID,
  p_actor_id UUID,
  p_action TEXT,
  p_payment_reference TEXT DEFAULT NULL,
  p_rejection_reason TEXT DEFAULT NULL,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_request public.global_payout_requests%ROWTYPE;
  v_actor_role TEXT;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  SELECT role INTO v_actor_role
  FROM public.profiles
  WHERE id = p_actor_id;

  IF v_actor_role NOT IN ('owner', 'admin', 'finance') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF p_action NOT IN ('under_review', 'paid', 'rejected') THEN
    RAISE EXCEPTION 'invalid_action' USING ERRCODE = '22023';
  END IF;

  IF p_action = 'paid' AND char_length(btrim(COALESCE(p_payment_reference, ''))) NOT BETWEEN 1 AND 200 THEN
    RAISE EXCEPTION 'payment_reference_required' USING ERRCODE = '22023';
  END IF;

  IF p_action = 'rejected' AND char_length(btrim(COALESCE(p_rejection_reason, ''))) NOT BETWEEN 1 AND 500 THEN
    RAISE EXCEPTION 'rejection_reason_required' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_request
  FROM public.global_payout_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'request_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF v_request.status NOT IN ('pending', 'under_review') THEN
    RAISE EXCEPTION 'request_finalized' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.global_payout_requests
  SET status = p_action,
      payment_reference = CASE WHEN p_action = 'paid' THEN btrim(p_payment_reference) ELSE payment_reference END,
      rejection_reason = CASE WHEN p_action = 'rejected' THEN btrim(p_rejection_reason) ELSE rejection_reason END,
      admin_notes = NULLIF(btrim(COALESCE(p_admin_notes, '')), ''),
      reviewed_by = p_actor_id,
      reviewed_at = v_now,
      paid_at = CASE WHEN p_action = 'paid' THEN v_now ELSE paid_at END,
      updated_at = v_now
  WHERE id = p_request_id;

  IF p_action = 'rejected' THEN
    UPDATE public.profiles
    SET nexcoins = COALESCE(nexcoins, 0) + v_request.coins_requested
    WHERE id = v_request.contributor_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'contributor_not_found' USING ERRCODE = 'P0002';
    END IF;

    INSERT INTO public.coin_transactions (
      contributor_id, amount, type, source, description
    )
    VALUES (
      v_request.contributor_id, v_request.coins_requested, 'earned', 'global_payout_refund',
      format('Refund for rejected global payout request %s', v_request.id)
    );
  END IF;

  RETURN v_request.id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_global_payout_request(UUID, INTEGER, NUMERIC, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_global_payout_request(UUID, UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_global_payout_request(UUID, INTEGER, NUMERIC, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_global_payout_request(UUID, UUID, TEXT, TEXT, TEXT, TEXT) TO service_role;

COMMIT;
