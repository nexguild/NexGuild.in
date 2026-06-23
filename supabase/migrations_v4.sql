-- migrations_v4.sql
-- Run in Supabase SQL editor.
-- Adds terms consent timestamp tracking.

-- 1. Add column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

-- 2. Rewrite handle_new_user() to also capture consent timestamp.
--    All existing logic (domain allowlist, signup_exceptions, referral
--    code generation) is preserved exactly.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_referral_code   TEXT;
  email_domain        TEXT;
  allowed_domains_raw TEXT;
  allowed_domains     JSONB;
BEGIN
  email_domain := lower(trim(split_part(NEW.email, '@', 2)));

  SELECT value INTO allowed_domains_raw
  FROM public.platform_settings
  WHERE key = 'allowed_signup_domains';

  allowed_domains := COALESCE(
    NULLIF(allowed_domains_raw, '')::jsonb,
    '["gmail.com","outlook.com"]'::jsonb
  );

  IF NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements_text(allowed_domains) AS d
    WHERE lower(trim(d)) = email_domain
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.signup_exceptions
      WHERE lower(trim(email)) = lower(trim(NEW.email))
    ) THEN
      RAISE EXCEPTION 'SIGNUP_DOMAIN_NOT_ALLOWED: This email domain is not accepted for registration.';
    END IF;
  END IF;

  LOOP
    new_referral_code := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE referral_code = new_referral_code
    );
  END LOOP;

  INSERT INTO public.profiles (id, email, full_name, country, role, referral_code, terms_accepted_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'country', 'India'),
    'contributor',
    new_referral_code,
    (NEW.raw_user_meta_data->>'terms_accepted_at')::TIMESTAMPTZ
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
