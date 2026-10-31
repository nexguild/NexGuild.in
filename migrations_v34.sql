-- Preserve fractional NexCoins throughout balances, offerwall conversions,
-- transaction history, and NexLeader commission accounting.
ALTER TABLE public.profiles
  ALTER COLUMN nexcoins TYPE NUMERIC(20, 6) USING nexcoins::NUMERIC(20, 6),
  ALTER COLUMN guild_total_earned TYPE NUMERIC(20, 6) USING guild_total_earned::NUMERIC(20, 6);

ALTER TABLE public.coin_transactions
  ALTER COLUMN amount TYPE NUMERIC(20, 6) USING amount::NUMERIC(20, 6);

ALTER TABLE public.offerwall_transactions
  ALTER COLUMN gross_amount TYPE NUMERIC(20, 6) USING gross_amount::NUMERIC(20, 6),
  ALTER COLUMN nexcoins_awarded TYPE NUMERIC(20, 6) USING nexcoins_awarded::NUMERIC(20, 6);

ALTER TABLE public.nexleader_commissions
  ALTER COLUMN gross_amount TYPE NUMERIC(20, 6) USING gross_amount::NUMERIC(20, 6),
  ALTER COLUMN contributor_credit TYPE NUMERIC(20, 6) USING contributor_credit::NUMERIC(20, 6),
  ALTER COLUMN nexleader_credit TYPE NUMERIC(20, 6) USING nexleader_credit::NUMERIC(20, 6),
  ALTER COLUMN platform_cut TYPE NUMERIC(20, 6) USING platform_cut::NUMERIC(20, 6);

DROP FUNCTION IF EXISTS public.credit_offerwall_conversion(UUID, UUID, TEXT, INTEGER, INTEGER, JSONB, TEXT);
CREATE OR REPLACE FUNCTION public.credit_offerwall_conversion(
  p_provider_id UUID,
  p_contributor_id UUID,
  p_provider_transaction_id TEXT,
  p_gross_amount NUMERIC,
  p_nexcoins_awarded NUMERIC,
  p_raw_payload JSONB,
  p_provider_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_transaction_id UUID;
  v_nexleader_id UUID;
  v_member_name TEXT;
  v_implied_gross NUMERIC(20, 6);
  v_nexleader_credit NUMERIC(20, 6);
  v_platform_cut NUMERIC(20, 6);
BEGIN
  IF p_provider_id IS NULL OR p_contributor_id IS NULL
    OR NULLIF(trim(p_provider_transaction_id), '') IS NULL
    OR p_gross_amount IS NULL OR p_gross_amount <= 0
    OR p_nexcoins_awarded IS NULL OR p_nexcoins_awarded <= 0
    OR p_gross_amount > 2147483647 OR p_nexcoins_awarded > 2147483647 THEN
    RAISE EXCEPTION 'Invalid offerwall conversion input';
  END IF;

  INSERT INTO public.offerwall_transactions (
    provider_id,
    contributor_id,
    provider_transaction_id,
    gross_amount,
    nexcoins_awarded,
    status,
    raw_payload
  ) VALUES (
    p_provider_id,
    p_contributor_id,
    p_provider_transaction_id,
    p_gross_amount,
    p_nexcoins_awarded,
    'credited',
    COALESCE(p_raw_payload, '{}'::jsonb)
  )
  ON CONFLICT (provider_id, provider_transaction_id) DO NOTHING
  RETURNING id INTO v_transaction_id;

  IF v_transaction_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT nexleader_id, full_name
  INTO v_nexleader_id, v_member_name
  FROM public.profiles
  WHERE id = p_contributor_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offerwall contributor profile not found';
  END IF;

  UPDATE public.profiles
  SET nexcoins = COALESCE(nexcoins, 0) + p_nexcoins_awarded
  WHERE id = p_contributor_id;

  INSERT INTO public.coin_transactions (
    contributor_id, amount, type, source, description
  ) VALUES (
    p_contributor_id,
    p_nexcoins_awarded,
    'earned',
    'offerwall',
    p_provider_name || ' offer completed'
  );

  v_nexleader_id := COALESCE(v_nexleader_id, '6c95c54a-33e6-489b-9175-3626c774635e'::uuid);
  v_member_name := COALESCE(NULLIF(trim(v_member_name), ''), 'Member');
  v_implied_gross := ROUND(p_nexcoins_awarded * 100 / 66, 6);
  v_nexleader_credit := ROUND(v_implied_gross * 10 / 100, 6);
  v_platform_cut := v_implied_gross - p_nexcoins_awarded - v_nexleader_credit;

  IF v_nexleader_credit > 0 THEN
    UPDATE public.profiles
    SET nexcoins = COALESCE(nexcoins, 0) + v_nexleader_credit,
        guild_total_earned = COALESCE(guild_total_earned, 0) + v_nexleader_credit
    WHERE id = v_nexleader_id;

    INSERT INTO public.coin_transactions (
      contributor_id, amount, type, source, description
    ) VALUES (
      v_nexleader_id,
      v_nexleader_credit,
      'earned',
      'nexleader_commission',
      'Commission: ' || v_member_name || ' (' || left(p_contributor_id::text, 8)
        || ') · ' || p_provider_name || ' offer completed'
    );

    INSERT INTO public.nexleader_commissions (
      nexleader_id,
      member_id,
      event_type,
      gross_amount,
      contributor_credit,
      nexleader_credit,
      platform_cut,
      description
    ) VALUES (
      v_nexleader_id,
      p_contributor_id,
      'offerwall',
      v_implied_gross,
      p_nexcoins_awarded,
      v_nexleader_credit,
      v_platform_cut,
      p_provider_name || ' offer completed'
    );
  END IF;

  RETURN TRUE;
END;
$$;

DROP FUNCTION IF EXISTS public.reserve_nexcoins(UUID, INTEGER);
CREATE OR REPLACE FUNCTION public.reserve_nexcoins(p_contributor_id UUID, p_coins NUMERIC)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.profiles
  SET nexcoins = COALESCE(nexcoins, 0) - p_coins
  WHERE id = p_contributor_id AND COALESCE(nexcoins, 0) >= p_coins;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count = 1;
END;
$$;

DROP FUNCTION IF EXISTS public.refund_nexcoins(UUID, INTEGER);
CREATE OR REPLACE FUNCTION public.refund_nexcoins(p_contributor_id UUID, p_coins NUMERIC)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET nexcoins = COALESCE(nexcoins, 0) + p_coins
  WHERE id = p_contributor_id;
  RETURN FOUND;
END;
$$;

DROP FUNCTION IF EXISTS public.increment_nexcoins(UUID, INTEGER);
CREATE OR REPLACE FUNCTION public.increment_nexcoins(p_contributor_id UUID, p_coins NUMERIC)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  UPDATE public.profiles
  SET nexcoins = COALESCE(nexcoins, 0) + p_coins
  WHERE id = p_contributor_id;
$$;

DROP FUNCTION IF EXISTS public.decrement_nexcoins(UUID, INTEGER);
CREATE OR REPLACE FUNCTION public.decrement_nexcoins(p_contributor_id UUID, p_coins NUMERIC)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  UPDATE public.profiles
  SET nexcoins = COALESCE(nexcoins, 0) - p_coins
  WHERE id = p_contributor_id
    AND COALESCE(nexcoins, 0) >= p_coins;
$$;

DROP FUNCTION IF EXISTS public.increment_guild_earned(UUID, INTEGER);
CREATE OR REPLACE FUNCTION public.increment_guild_earned(p_nexleader_id UUID, p_amount NUMERIC)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  UPDATE public.profiles
  SET guild_total_earned = COALESCE(guild_total_earned, 0) + p_amount
  WHERE id = p_nexleader_id;
$$;

REVOKE ALL ON FUNCTION public.credit_offerwall_conversion(UUID, UUID, TEXT, NUMERIC, NUMERIC, JSONB, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_offerwall_conversion(UUID, UUID, TEXT, NUMERIC, NUMERIC, JSONB, TEXT)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.reverse_offerwall_conversion(UUID, TEXT)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.reserve_nexcoins(UUID, NUMERIC)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.refund_nexcoins(UUID, NUMERIC)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_nexcoins(UUID, NUMERIC)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.decrement_nexcoins(UUID, NUMERIC)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_guild_earned(UUID, NUMERIC)
  TO service_role;

NOTIFY pgrst, 'reload schema';
