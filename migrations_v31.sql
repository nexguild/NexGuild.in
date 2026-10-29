-- Add TapRain's personalized offer feed and callback field mapping.
-- After applying:
-- 1. Set postback_secret to the TapRain API key (also used as the callback key).
-- 2. In TapRain -> API -> Postback URL, set the Global Postback URL to:
--    https://nexguild.in/api/offerwall/postback/taprain?key=YOUR_TAPRAIN_API_KEY&external_identifier={s1}&amount={amount}&offer_name={offer_name}&offer_id={offer_id}&transaction_id={conversion_id}
--    Replace the key placeholder. TapRain documents status=1/2, but its global
--    macro list does not show a status macro. Test that status is included in
--    the callback and that a reversal arrives as status=2 before enabling.
-- 3. Enable TapRain only after a test callback is logged as credited.
-- NexGuild passes its contributor ID as s1 on each feed request. The callback
-- uses external_identifier={s1} to map conversions back to that contributor.

INSERT INTO public.offerwall_providers (
  name,
  slug,
  is_ad_network,
  integration_type,
  postback_param_map,
  contributor_share_pct,
  custom_config,
  is_active,
  display_order,
  description
) VALUES (
  'TapRain',
  'taprain',
  false,
  'api',
  '{"user_id":"external_identifier","trans_id":"transaction_id","secret":"key"}'::jsonb,
  66,
  '{
    "offerwall_id": "6adf3ac69b2899a193cbdf49",
    "currency_conversion_rate": 1000,
    "feature_tags": ["Offers", "App Installs", "Sign-ups"],
    "available_countries": []
  }'::jsonb,
  false,
  11,
  'Browse personalized TapRain offers and earn NexCoins after confirmed conversions.'
)
ON CONFLICT (slug) DO UPDATE SET
  name                  = EXCLUDED.name,
  is_ad_network         = false,
  integration_type      = EXCLUDED.integration_type,
  postback_param_map    = EXCLUDED.postback_param_map,
  contributor_share_pct = EXCLUDED.contributor_share_pct,
  custom_config         = EXCLUDED.custom_config || COALESCE(offerwall_providers.custom_config, '{}'::jsonb),
  display_order         = EXCLUDED.display_order,
  description           = EXCLUDED.description;

-- Apply the conversion record, contributor balance, ledger entries, and
-- NexLeader commission in one transaction. A duplicate provider transaction
-- returns false without applying any wallet changes.
CREATE OR REPLACE FUNCTION public.credit_offerwall_conversion(
  p_provider_id UUID,
  p_contributor_id UUID,
  p_provider_transaction_id TEXT,
  p_gross_amount INTEGER,
  p_nexcoins_awarded INTEGER,
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
  v_implied_gross INTEGER;
  v_nexleader_credit INTEGER;
  v_platform_cut INTEGER;
BEGIN
  IF p_provider_id IS NULL OR p_contributor_id IS NULL
    OR NULLIF(trim(p_provider_transaction_id), '') IS NULL
    OR p_gross_amount <= 0 OR p_nexcoins_awarded <= 0 THEN
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
  v_implied_gross := CEIL(p_nexcoins_awarded::numeric * 100 / 66)::integer;
  v_nexleader_credit := FLOOR(v_implied_gross::numeric * 10 / 100)::integer;
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

-- Make reversal idempotent as well: status transition and balance/ledger
-- reversal happen together, and repeated chargebacks cannot subtract twice.
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
BEGIN
  UPDATE public.offerwall_transactions
  SET status = 'reversed'
  WHERE provider_id = p_provider_id
    AND provider_transaction_id = p_provider_transaction_id
    AND status <> 'reversed'
  RETURNING contributor_id, nexcoins_awarded, provider_transaction_id
  INTO v_transaction;

  IF NOT FOUND THEN
    RETURN FALSE;
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

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.credit_offerwall_conversion(UUID, UUID, TEXT, INTEGER, INTEGER, JSONB, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reverse_offerwall_conversion(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_offerwall_conversion(UUID, UUID, TEXT, INTEGER, INTEGER, JSONB, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.reverse_offerwall_conversion(UUID, TEXT) TO service_role;
