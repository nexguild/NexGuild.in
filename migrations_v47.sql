CREATE TABLE IF NOT EXISTS public.premium_task_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_slug TEXT NOT NULL CHECK (partner_slug IN ('gemiad', 'notik')),
  partner_offer_id TEXT NOT NULL,
  advertiser_name TEXT NOT NULL,
  offer_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('CPI', 'CPR', 'CPE', 'General Survey')),
  description TEXT NOT NULL,
  terms TEXT,
  confirmation_time TEXT,
  image_url TEXT,
  countries TEXT[] NOT NULL DEFAULT '{}',
  devices TEXT[] NOT NULL DEFAULT '{}',
  os TEXT,
  reward_nexcoins NUMERIC(20, 6) NOT NULL CHECK (reward_nexcoins > 0),
  events JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(events) = 'array'),
  tracking_url_template TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (partner_slug, partner_offer_id)
);

CREATE INDEX IF NOT EXISTS premium_task_offers_active_idx
  ON public.premium_task_offers (created_at DESC)
  WHERE is_active;

CREATE INDEX IF NOT EXISTS premium_task_offers_countries_idx
  ON public.premium_task_offers USING GIN (countries);

CREATE TABLE IF NOT EXISTS public.premium_task_clicks (
  click_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES public.premium_task_offers(id) ON DELETE RESTRICT,
  contributor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  partner_slug TEXT NOT NULL CHECK (partner_slug IN ('gemiad', 'notik')),
  partner_offer_id TEXT NOT NULL,
  advertiser_name TEXT NOT NULL,
  offer_name TEXT NOT NULL,
  reward_nexcoins NUMERIC(20, 6) NOT NULL CHECK (reward_nexcoins > 0),
  events JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(events) = 'array'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS premium_task_clicks_contributor_idx
  ON public.premium_task_clicks (contributor_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.premium_task_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_slug TEXT NOT NULL CHECK (partner_slug IN ('gemiad', 'notik')),
  partner_transaction_id TEXT NOT NULL,
  click_id UUID NOT NULL REFERENCES public.premium_task_clicks(click_id) ON DELETE RESTRICT,
  offer_id UUID NOT NULL REFERENCES public.premium_task_offers(id) ON DELETE RESTRICT,
  contributor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  event_id TEXT,
  nexcoins_awarded NUMERIC(20, 6) NOT NULL CHECK (nexcoins_awarded > 0),
  gross_amount NUMERIC(20, 6) NOT NULL CHECK (gross_amount > 0),
  owner_credit NUMERIC(20, 6) NOT NULL CHECK (owner_credit >= 0),
  status TEXT NOT NULL DEFAULT 'credited' CHECK (status IN ('credited', 'reversed')),
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reversed_at TIMESTAMPTZ,
  UNIQUE (partner_slug, partner_transaction_id)
);

ALTER TABLE public.premium_task_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_task_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_task_conversions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.premium_task_offers FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.premium_task_clicks FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.premium_task_conversions FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.premium_task_offers TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.premium_task_clicks TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.premium_task_conversions TO service_role;

ALTER TABLE public.platform_commissions
  DROP CONSTRAINT IF EXISTS platform_commissions_source_type_check;

ALTER TABLE public.platform_commissions
  ADD CONSTRAINT platform_commissions_source_type_check
  CHECK (source_type IN ('task', 'offerwall', 'premium_task'));

CREATE OR REPLACE FUNCTION public.credit_premium_task_conversion(
  p_partner_slug TEXT,
  p_partner_transaction_id TEXT,
  p_click_id UUID,
  p_partner_offer_id TEXT,
  p_event_id TEXT,
  p_raw_payload JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_click public.premium_task_clicks%ROWTYPE;
  v_conversion_id UUID;
  v_reward NUMERIC(20, 6);
  v_event_name TEXT;
  v_gross NUMERIC(20, 6);
  v_owner_credit NUMERIC(20, 6);
  v_owner_id CONSTANT UUID := '6c95c54a-33e6-489b-9175-3626c774635e';
  v_description TEXT;
BEGIN
  IF p_partner_slug NOT IN ('gemiad', 'notik')
    OR NULLIF(trim(p_partner_transaction_id), '') IS NULL
    OR p_click_id IS NULL
    OR NULLIF(trim(p_partner_offer_id), '') IS NULL THEN
    RAISE EXCEPTION 'Invalid premium task conversion input';
  END IF;

  SELECT *
  INTO v_click
  FROM public.premium_task_clicks
  WHERE click_id = p_click_id
    AND partner_slug = p_partner_slug
    AND partner_offer_id = p_partner_offer_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Premium task click reference not found';
  END IF;

  IF jsonb_array_length(v_click.events) > 0 THEN
    SELECT
      NULLIF(event->>'name', ''),
      NULLIF(event->>'reward_nexcoins', '')::NUMERIC
    INTO v_event_name, v_reward
    FROM jsonb_array_elements(v_click.events) AS event
    WHERE event->>'partner_event_id' = NULLIF(trim(p_event_id), '')
    LIMIT 1;

    IF v_reward IS NULL OR v_reward <= 0 THEN
      RAISE EXCEPTION 'Premium task event does not match the recorded offer';
    END IF;
  ELSE
    v_reward := v_click.reward_nexcoins;
  END IF;

  IF v_reward > 2147483647 THEN
    RAISE EXCEPTION 'Premium task reward exceeds the supported range';
  END IF;

  INSERT INTO public.premium_task_conversions (
    partner_slug,
    partner_transaction_id,
    click_id,
    offer_id,
    contributor_id,
    event_id,
    nexcoins_awarded,
    gross_amount,
    owner_credit,
    raw_payload
  ) VALUES (
    p_partner_slug,
    trim(p_partner_transaction_id),
    p_click_id,
    v_click.offer_id,
    v_click.contributor_id,
    NULLIF(trim(p_event_id), ''),
    v_reward,
    ROUND(v_reward * 100 / 66, 6),
    ROUND(v_reward * 100 / 66, 6) - v_reward,
    COALESCE(p_raw_payload, '{}'::jsonb)
  )
  ON CONFLICT (partner_slug, partner_transaction_id) DO NOTHING
  RETURNING id INTO v_conversion_id;

  IF v_conversion_id IS NULL THEN
    RETURN FALSE;
  END IF;

  PERFORM 1 FROM public.profiles WHERE id = v_owner_id AND role = 'owner' FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Platform owner profile not found';
  END IF;

  PERFORM 1 FROM public.profiles WHERE id = v_click.contributor_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Premium task contributor profile not found';
  END IF;

  v_gross := ROUND(v_reward * 100 / 66, 6);
  v_owner_credit := v_gross - v_reward;
  v_description := v_click.advertiser_name || ' — ' || v_click.offer_name
    || CASE WHEN v_event_name IS NOT NULL THEN ' — ' || v_event_name ELSE '' END;

  UPDATE public.profiles
  SET nexcoins = COALESCE(nexcoins, 0) + v_reward
  WHERE id = v_click.contributor_id;

  INSERT INTO public.coin_transactions (
    contributor_id, amount, type, source, description
  ) VALUES (
    v_click.contributor_id, v_reward, 'earned', 'premium_task', v_description
  );

  INSERT INTO public.platform_commissions (
    owner_id, contributor_id, source_type, source_event_id,
    gross_amount, contributor_credit, owner_credit, description
  ) VALUES (
    v_owner_id, v_click.contributor_id, 'premium_task', v_conversion_id::TEXT,
    v_gross, v_reward, v_owner_credit, v_description
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
    'Platform commission: ' || v_description
  );

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.reverse_premium_task_conversion(
  p_partner_slug TEXT,
  p_partner_transaction_id TEXT,
  p_click_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_conversion public.premium_task_conversions%ROWTYPE;
  v_owner_credit NUMERIC(20, 6);
  v_owner_id CONSTANT UUID := '6c95c54a-33e6-489b-9175-3626c774635e';
BEGIN
  UPDATE public.premium_task_conversions
  SET status = 'reversed', reversed_at = NOW()
  WHERE partner_slug = p_partner_slug
    AND partner_transaction_id = p_partner_transaction_id
    AND status = 'credited'
    AND (p_click_id IS NULL OR click_id = p_click_id)
  RETURNING * INTO v_conversion;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  PERFORM 1 FROM public.profiles WHERE id = v_owner_id AND role = 'owner' FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Platform owner profile not found';
  END IF;

  PERFORM 1 FROM public.profiles WHERE id = v_conversion.contributor_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Premium task contributor profile not found';
  END IF;

  UPDATE public.profiles
  SET nexcoins = GREATEST(0, COALESCE(nexcoins, 0) - v_conversion.nexcoins_awarded)
  WHERE id = v_conversion.contributor_id;

  INSERT INTO public.coin_transactions (
    contributor_id, amount, type, source, description
  ) VALUES (
    v_conversion.contributor_id,
    -v_conversion.nexcoins_awarded,
    'reversed',
    'premium_task',
    'Premium task reversal (tx: ' || v_conversion.partner_transaction_id || ')'
  );

  UPDATE public.platform_commissions
  SET status = 'reversed'
  WHERE source_type = 'premium_task'
    AND source_event_id = v_conversion.id::TEXT
    AND status = 'credited'
  RETURNING owner_credit INTO v_owner_credit;

  IF v_owner_credit IS NOT NULL AND v_owner_credit > 0 THEN
    UPDATE public.profiles
    SET nexcoins = GREATEST(0, COALESCE(nexcoins, 0) - v_owner_credit)
    WHERE id = v_owner_id;

    INSERT INTO public.coin_transactions (
      contributor_id, amount, type, source, description
    ) VALUES (
      v_owner_id,
      -v_owner_credit,
      'reversed',
      'platform_commission',
      'Premium task commission reversal (tx: ' || v_conversion.partner_transaction_id || ')'
    );
  END IF;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.credit_premium_task_conversion(TEXT, TEXT, UUID, TEXT, TEXT, JSONB)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reverse_premium_task_conversion(TEXT, TEXT, UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_premium_task_conversion(TEXT, TEXT, UUID, TEXT, TEXT, JSONB)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.reverse_premium_task_conversion(TEXT, TEXT, UUID)
  TO service_role;

NOTIFY pgrst, 'reload schema';
