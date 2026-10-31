-- Retire the NexLeader program and credit its full 34% share to the platform owner.
-- Existing NexLeader applications and commission rows remain available as history.

CREATE TABLE IF NOT EXISTS public.platform_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id),
  contributor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('task', 'offerwall')),
  source_event_id TEXT NOT NULL,
  gross_amount NUMERIC(20, 6) NOT NULL,
  contributor_credit NUMERIC(20, 6) NOT NULL,
  owner_credit NUMERIC(20, 6) NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'credited' CHECK (status IN ('credited', 'reversed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_type, source_event_id)
);

ALTER TABLE public.platform_commissions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.platform_commissions FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.platform_commissions TO service_role;

UPDATE public.profiles
SET is_nexleader = false,
    nexleader_approved_at = NULL
WHERE COALESCE(is_nexleader, false);

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
  v_owner_id CONSTANT UUID := '6c95c54a-33e6-489b-9175-3626c774635e';
  v_implied_gross NUMERIC(20, 6);
  v_owner_credit NUMERIC(20, 6);
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

  PERFORM 1
  FROM public.profiles
  WHERE id = v_owner_id AND role = 'owner'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Platform owner profile not found';
  END IF;

  PERFORM 1
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
    COALESCE(p_provider_name, 'Offerwall') || ' offer completed'
  );

  v_implied_gross := ROUND(p_nexcoins_awarded * 100 / 66, 6);
  v_owner_credit := v_implied_gross - p_nexcoins_awarded;

  INSERT INTO public.platform_commissions (
    owner_id,
    contributor_id,
    source_type,
    source_event_id,
    gross_amount,
    contributor_credit,
    owner_credit,
    description
  ) VALUES (
    v_owner_id,
    p_contributor_id,
    'offerwall',
    v_transaction_id::text,
    v_implied_gross,
    p_nexcoins_awarded,
    v_owner_credit,
    COALESCE(p_provider_name, 'Offerwall') || ' offer completed'
  );

  UPDATE public.profiles
  SET nexcoins = COALESCE(nexcoins, 0) + v_owner_credit
  WHERE id = v_owner_id;

  INSERT INTO public.coin_transactions (
    contributor_id, amount, type, source, description
  ) VALUES (
    v_owner_id,
    v_owner_credit,
    'earned',
    'platform_commission',
    'Platform commission: ' || COALESCE(p_provider_name, 'Offerwall') || ' offer completed'
  );

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.credit_task_with_platform_commission(
  p_contributor_id UUID,
  p_source_event_id TEXT,
  p_gross_amount NUMERIC,
  p_contributor_credit NUMERIC,
  p_owner_credit NUMERIC,
  p_description TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_owner_id CONSTANT UUID := '6c95c54a-33e6-489b-9175-3626c774635e';
  v_commission_id UUID;
  v_existing public.platform_commissions%ROWTYPE;
BEGIN
  IF p_contributor_id IS NULL
    OR NULLIF(trim(p_source_event_id), '') IS NULL
    OR p_gross_amount IS NULL OR p_gross_amount <= 0
    OR p_contributor_credit IS NULL OR p_contributor_credit < 0
    OR p_owner_credit IS NULL OR p_owner_credit < 0
    OR p_gross_amount > 2147483647
    OR p_contributor_credit > p_gross_amount
    OR p_owner_credit > p_gross_amount THEN
    RAISE EXCEPTION 'Invalid task commission input';
  END IF;

  PERFORM 1
  FROM public.profiles
  WHERE id = v_owner_id AND role = 'owner'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Platform owner profile not found';
  END IF;

  PERFORM 1
  FROM public.profiles
  WHERE id = p_contributor_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task contributor profile not found';
  END IF;

  INSERT INTO public.platform_commissions (
    owner_id,
    contributor_id,
    source_type,
    source_event_id,
    gross_amount,
    contributor_credit,
    owner_credit,
    description
  ) VALUES (
    v_owner_id,
    p_contributor_id,
    'task',
    p_source_event_id,
    p_gross_amount,
    p_contributor_credit,
    p_owner_credit,
    p_description
  )
  ON CONFLICT (source_type, source_event_id) DO NOTHING
  RETURNING id INTO v_commission_id;

  IF v_commission_id IS NULL THEN
    SELECT *
    INTO v_existing
    FROM public.platform_commissions
    WHERE source_type = 'task' AND source_event_id = p_source_event_id;

    RETURN jsonb_build_object(
      'already_credited', true,
      'contributor_credit', v_existing.contributor_credit,
      'owner_credit', v_existing.owner_credit
    );
  END IF;

  IF p_contributor_credit > 0 THEN
    UPDATE public.profiles
    SET nexcoins = COALESCE(nexcoins, 0) + p_contributor_credit
    WHERE id = p_contributor_id;

    INSERT INTO public.coin_transactions (
      contributor_id, amount, type, source, description
    ) VALUES (
      p_contributor_id,
      p_contributor_credit,
      'earned',
      'task',
      p_description
    );
  END IF;

  IF p_owner_credit > 0 THEN
    UPDATE public.profiles
    SET nexcoins = COALESCE(nexcoins, 0) + p_owner_credit
    WHERE id = v_owner_id;

    INSERT INTO public.coin_transactions (
      contributor_id, amount, type, source, description
    ) VALUES (
      v_owner_id,
      p_owner_credit,
      'earned',
      'platform_commission',
      'Platform commission: ' || COALESCE(p_description, 'task approved')
    );
  END IF;

  RETURN jsonb_build_object(
    'already_credited', false,
    'contributor_credit', p_contributor_credit,
    'owner_credit', p_owner_credit
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.reverse_offerwall_conversion(
  p_provider_id UUID,
  p_provider_transaction_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_transaction RECORD;
  v_commission RECORD;
  v_owner_id CONSTANT UUID := '6c95c54a-33e6-489b-9175-3626c774635e';
BEGIN
  UPDATE public.offerwall_transactions
  SET status = 'reversed'
  WHERE provider_id = p_provider_id
    AND provider_transaction_id = p_provider_transaction_id
    AND status <> 'reversed'
  RETURNING id, contributor_id, nexcoins_awarded, provider_transaction_id
  INTO v_transaction;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  PERFORM 1
  FROM public.profiles
  WHERE id = v_owner_id AND role = 'owner'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Platform owner profile not found';
  END IF;

  UPDATE public.profiles
  SET nexcoins = GREATEST(0, COALESCE(nexcoins, 0) - v_transaction.nexcoins_awarded)
  WHERE id = v_transaction.contributor_id;

  INSERT INTO public.coin_transactions (
    contributor_id, amount, type, source, description
  ) VALUES (
    v_transaction.contributor_id,
    -v_transaction.nexcoins_awarded,
    'reversed',
    'offerwall',
    'Offerwall fraud reversal (tx: ' || v_transaction.provider_transaction_id || ')'
  );

  UPDATE public.platform_commissions
  SET status = 'reversed'
  WHERE source_type = 'offerwall'
    AND source_event_id = v_transaction.id::text
    AND status = 'credited'
  RETURNING owner_id, owner_credit INTO v_commission;

  IF FOUND THEN
    IF v_commission.owner_credit > 0 THEN
      UPDATE public.profiles
      SET nexcoins = GREATEST(0, COALESCE(nexcoins, 0) - v_commission.owner_credit)
      WHERE id = v_commission.owner_id;

      INSERT INTO public.coin_transactions (
        contributor_id, amount, type, source, description
      ) VALUES (
        v_commission.owner_id,
        -v_commission.owner_credit,
        'reversed',
        'platform_commission',
        'Offerwall commission reversal (tx: ' || v_transaction.provider_transaction_id || ')'
      );
    END IF;
  END IF;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.credit_offerwall_conversion(UUID, UUID, TEXT, NUMERIC, NUMERIC, JSONB, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_offerwall_conversion(UUID, UUID, TEXT, NUMERIC, NUMERIC, JSONB, TEXT)
  TO service_role;

REVOKE ALL ON FUNCTION public.credit_task_with_platform_commission(UUID, TEXT, NUMERIC, NUMERIC, NUMERIC, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_task_with_platform_commission(UUID, TEXT, NUMERIC, NUMERIC, NUMERIC, TEXT)
  TO service_role;

REVOKE ALL ON FUNCTION public.reverse_offerwall_conversion(UUID, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reverse_offerwall_conversion(UUID, TEXT)
  TO service_role;

NOTIFY pgrst, 'reload schema';
