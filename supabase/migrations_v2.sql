-- ============================================================
-- NexGuild v2 Migrations
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- ── 1. Signup domain whitelist (Fix A + Part 3) ──────────────
-- Seeds allowed_signup_domains so the updated trigger can read it.
INSERT INTO public.platform_settings (key, value)
VALUES ('allowed_signup_domains', '["gmail.com","outlook.com"]')
ON CONFLICT (key) DO NOTHING;

-- Fix the handle_new_user trigger to:
--   a) read allowed domains from platform_settings (not hardcoded)
--   b) trim+lowercase both the stored exception email and incoming email
--      (fixes potential case/whitespace mismatch in signup_exceptions)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_referral_code   TEXT;
  email_domain        TEXT;
  allowed_domains_raw TEXT;
  allowed_domains     JSONB;
BEGIN
  email_domain := lower(trim(split_part(NEW.email, '@', 2)));

  -- Read allowed domains from platform_settings; fallback to gmail+outlook
  SELECT value INTO allowed_domains_raw
  FROM public.platform_settings
  WHERE key = 'allowed_signup_domains';

  allowed_domains := COALESCE(
    NULLIF(allowed_domains_raw, '')::jsonb,
    '["gmail.com","outlook.com"]'::jsonb
  );

  -- Check domain allowlist
  IF NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements_text(allowed_domains) AS d
    WHERE lower(trim(d)) = email_domain
  ) THEN
    -- Not in domain list — check individual email exceptions (trim+lowercase for robustness)
    IF NOT EXISTS (
      SELECT 1 FROM public.signup_exceptions
      WHERE lower(trim(email)) = lower(trim(NEW.email))
    ) THEN
      RAISE EXCEPTION 'SIGNUP_DOMAIN_NOT_ALLOWED: This email domain is not accepted for registration.';
    END IF;
  END IF;

  -- Generate unique referral code
  LOOP
    new_referral_code := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE referral_code = new_referral_code
    );
  END LOOP;

  INSERT INTO public.profiles (id, email, full_name, country, role, referral_code)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'country', 'India'),
    'contributor',
    new_referral_code
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 2. NexStore exchange rates (Part 2) ──────────────────────
-- 1 INR = 12.5 NexCoins, 1 USD = 1000 NexCoins (base reference rates)
INSERT INTO public.platform_settings (key, value)
VALUES
  ('nexcoin_per_inr', '12.5'),
  ('nexcoin_per_usd', '1000')
ON CONFLICT (key) DO NOTHING;

-- ── 3. Offerwall providers: new flexible columns (Part 1) ────
ALTER TABLE public.offerwall_providers
  ADD COLUMN IF NOT EXISTS integration_type TEXT    DEFAULT 'iframe',
  ADD COLUMN IF NOT EXISTS postback_param_map JSONB  DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS hash_format        TEXT,
  ADD COLUMN IF NOT EXISTS custom_config      JSONB  DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_active          BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS display_order      INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS logo_url           TEXT,
  ADD COLUMN IF NOT EXISTS description        TEXT;

-- Fix C: Set CPX Research to 100% share (margin already in Currency Factor 700)
-- and wire up generic postback param map so the [slug] handler can process it
-- if CPX-specific route ever becomes the generic path.
UPDATE public.offerwall_providers
SET
  integration_type      = 'script_tag',
  contributor_share_pct = 100,
  postback_param_map    = '{
    "user_id":    "user_id",
    "trans_id":   "trans_id",
    "amount":     "amount_local",
    "status":     "status",
    "type":       "type",
    "hash":       "hash",
    "subid_1":    "subid_1",
    "subid_2":    "subid_2",
    "ip_click":   "ip_click",
    "offer_id":   "offer_id"
  }'::jsonb,
  hash_format           = '{trans_id}-{secret}',
  custom_config         = '{
    "script_url": "https://cdn.cpx-research.com/assets/js/script_tag_v2.0.js",
    "app_id_env": "NEXT_PUBLIC_CPX_APP_ID",
    "widget_configs": [
      {"div_id": "fullscreen",    "theme_style": 1, "order_by": 2, "limit_surveys": 7},
      {"div_id": "notification",  "theme_style": 4, "position": 4, "text": "", "link": "", "newtab": true}
    ],
    "style_config": {
      "text_color": "#0F172A",
      "survey_box": {
        "topbar_background_color": "#02b491",
        "box_background_color":    "#FFFFFF",
        "rounded_borders":         true,
        "stars_filled":            "#0F172A"
      }
    },
    "use_iframe":      true,
    "iframe_position": 1
  }'::jsonb
WHERE slug = 'cpx_research';

-- ── 4. coin_transactions: ensure 'reversed' type is storable ─
-- If coin_transactions.type has a CHECK constraint or enum, add 'reversed'.
-- Run this only if your DB has such a constraint; otherwise it's a no-op:
-- ALTER TABLE public.coin_transactions
--   DROP CONSTRAINT IF EXISTS coin_transactions_type_check;
-- ALTER TABLE public.coin_transactions
--   ADD CONSTRAINT coin_transactions_type_check
--     CHECK (type IN ('earned','redeemed','reversed','bonus','adjustment'));

-- ── Done ─────────────────────────────────────────────────────
-- After running:
-- 1. Visit /admin/offerwalls → Configure CPX Research
--    → verify contributor_share_pct shows 100%
--    → set postback_secret = your CPX App Secure Hash (same value as CPX_APP_SECURE_HASH env var)
-- 2. Visit /admin/settings → Signup Domains
--    → confirm gmail.com and outlook.com are listed
-- 3. Visit /admin/settings → Exchange Rates
--    → confirm nexcoin_per_inr = 12.5, nexcoin_per_usd = 1000
