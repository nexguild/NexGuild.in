-- Repair new-user profile creation without changing existing profiles.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS country_code TEXT;

CREATE TABLE IF NOT EXISTS public.signup_exceptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  approved_by UUID REFERENCES public.profiles(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.signup_exceptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admin tier can manage signup exceptions"
  ON public.signup_exceptions;
CREATE POLICY "Only admin tier can manage signup exceptions"
  ON public.signup_exceptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_referral_code TEXT;
  email_domain TEXT;
  allowed_domains_raw TEXT;
  allowed_domains JSONB;
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
  ) AND NOT EXISTS (
    SELECT 1 FROM public.signup_exceptions
    WHERE lower(trim(email)) = lower(trim(NEW.email))
  ) THEN
    RAISE EXCEPTION 'SIGNUP_DOMAIN_NOT_ALLOWED: This email domain is not accepted for registration.';
  END IF;

  LOOP
    new_referral_code := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE referral_code = new_referral_code
    );
  END LOOP;

  INSERT INTO public.profiles (
    id, email, full_name, country, country_code, role, referral_code, terms_accepted_at
  ) VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'country', 'India'),
    NULLIF(upper(NEW.raw_user_meta_data->>'country_code'), ''),
    'contributor',
    new_referral_code,
    NULLIF(NEW.raw_user_meta_data->>'terms_accepted_at', '')::TIMESTAMPTZ
  );

  RETURN NEW;
END;
$$;
