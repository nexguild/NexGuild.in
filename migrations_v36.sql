ALTER TABLE public.voucher_requests
  ADD COLUMN IF NOT EXISTS charged_coins INTEGER,
  ADD COLUMN IF NOT EXISTS refund_reason TEXT,
  ADD COLUMN IF NOT EXISTS refund_amount INTEGER,
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refunded_by UUID REFERENCES public.profiles(id);

CREATE OR REPLACE FUNCTION public.refund_voucher_request(
  p_request_id UUID,
  p_reason TEXT,
  p_admin_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_request public.voucher_requests%ROWTYPE;
  v_reason TEXT := trim(COALESCE(p_reason, ''));
BEGIN
  IF p_request_id IS NULL OR p_admin_id IS NULL
    OR length(v_reason) < 10 OR length(v_reason) > 500 THEN
    RAISE EXCEPTION 'A request ID, staff ID, and reason between 10 and 500 characters are required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = p_admin_id AND role IN ('owner', 'admin', 'finance')
  ) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT *
  INTO v_request
  FROM public.voucher_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Voucher request not found';
  END IF;

  IF v_request.status NOT IN ('pending', 'processing') THEN
    RAISE EXCEPTION 'Only pending or processing voucher requests can be refunded';
  END IF;

  IF v_request.charged_coins IS NULL OR v_request.charged_coins < 0 THEN
    RAISE EXCEPTION 'The exact coin charge is unavailable for this legacy request';
  END IF;

  IF NOT public.refund_nexcoins(v_request.contributor_id, v_request.charged_coins) THEN
    RAISE EXCEPTION 'Contributor balance could not be refunded';
  END IF;

  INSERT INTO public.coin_transactions (
    contributor_id, amount, type, source, description, created_at
  ) VALUES (
    v_request.contributor_id,
    v_request.charged_coins,
    'earned',
    'voucher_refund',
    format('Refund for voucher request %s: %s', p_request_id, v_reason),
    NOW()
  );

  UPDATE public.voucher_requests
  SET status = 'cancelled',
      refund_reason = v_reason,
      refund_amount = v_request.charged_coins,
      refunded_at = NOW(),
      refunded_by = p_admin_id
  WHERE id = p_request_id;

  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    v_request.contributor_id,
    'Voucher request cancelled',
    format('%s NexCoins were refunded for your cancelled voucher request.', v_request.charged_coins),
    'voucher'
  );

  RETURN v_request.charged_coins;
END;
$$;

REVOKE ALL ON FUNCTION public.refund_voucher_request(UUID, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_voucher_request(UUID, TEXT, UUID) TO service_role;
