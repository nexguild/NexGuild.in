-- Country identity and country-targeted task visibility.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS country_code TEXT;

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS target_countries TEXT[] NOT NULL DEFAULT '{}';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
    (NEW.raw_user_meta_data->>'terms_accepted_at')::TIMESTAMPTZ
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.prevent_profile_country_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.country_code IS NULL AND (
    NEW.country_code IS NOT NULL
    OR NEW.country IS DISTINCT FROM OLD.country
  ) THEN
    RAISE EXCEPTION 'Country is reserved for new accounts and cannot be changed on existing profiles.';
  END IF;

  IF OLD.country_code IS NOT NULL AND (
    NEW.country_code IS DISTINCT FROM OLD.country_code
    OR NEW.country IS DISTINCT FROM OLD.country
  ) THEN
    RAISE EXCEPTION 'Country is locked after it has been selected.';
  END IF;

  IF NEW.country_code IS NOT NULL AND NEW.country_code !~ '^[A-Z]{2}$' THEN
    RAISE EXCEPTION 'Country code must be a valid two-letter uppercase code.';
  END IF;

  IF NEW.country_code IS NOT NULL AND NULLIF(trim(NEW.country), '') IS NULL THEN
    RAISE EXCEPTION 'Country name is required when setting a country code.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_country_change ON public.profiles;
CREATE TRIGGER prevent_profile_country_change
  BEFORE UPDATE OF country, country_code ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_country_change();

CREATE OR REPLACE FUNCTION public.user_can_access_task(
  p_task_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tasks t
    JOIN public.profiles p ON p.id = p_user_id
    WHERE t.id = p_task_id
      AND (auth.uid() = p_user_id OR auth.role() = 'service_role')
      AND (
        p.country_code IS NULL
        OR
        cardinality(COALESCE(t.target_countries, '{}'::TEXT[])) = 0
        OR p.country_code = ANY(t.target_countries)
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.user_can_access_task(UUID, UUID) TO authenticated, service_role;

DROP POLICY IF EXISTS "Tasks are viewable by authenticated users" ON public.tasks;
CREATE POLICY "Tasks are viewable by eligible authenticated users"
  ON public.tasks FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND status = 'active'
    AND public.user_can_access_task(id, auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert own assignment" ON public.assignments;
CREATE POLICY "Users can insert own eligible assignment"
  ON public.assignments FOR INSERT
  WITH CHECK (
    auth.uid() = contributor_id
    AND public.user_can_access_task(task_id, contributor_id)
  );

DROP POLICY IF EXISTS "Users can update own assignment" ON public.assignments;
CREATE POLICY "Users can update own eligible assignment"
  ON public.assignments FOR UPDATE
  USING (
    auth.uid() = contributor_id
    AND public.user_can_access_task(task_id, contributor_id)
  )
  WITH CHECK (
    auth.uid() = contributor_id
    AND public.user_can_access_task(task_id, contributor_id)
  );

DROP POLICY IF EXISTS "Users can insert own submission" ON public.submissions;
CREATE POLICY "Users can insert own eligible submission"
  ON public.submissions FOR INSERT
  WITH CHECK (
    auth.uid() = contributor_id
    AND public.user_can_access_task(task_id, contributor_id)
  );

DROP POLICY IF EXISTS "Users can update own submission" ON public.submissions;
CREATE POLICY "Users can update own eligible submission"
  ON public.submissions FOR UPDATE
  USING (
    auth.uid() = contributor_id
    AND public.user_can_access_task(task_id, contributor_id)
  )
  WITH CHECK (
    auth.uid() = contributor_id
    AND public.user_can_access_task(task_id, contributor_id)
  );
