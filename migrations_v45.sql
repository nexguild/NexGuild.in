BEGIN;

LOCK TABLE public.profiles IN SHARE ROW EXCLUSIVE MODE;

DROP TRIGGER IF EXISTS prevent_profile_country_change ON public.profiles;

UPDATE public.profiles
SET country_code = CASE lower(trim(country))
  WHEN 'india' THEN 'IN'
  WHEN 'united states' THEN 'US'
  WHEN 'united state' THEN 'US'
  WHEN 'united kingdom' THEN 'GB'
  WHEN 'nigeria' THEN 'NG'
  WHEN 'pakistan' THEN 'PK'
  WHEN 'philippines' THEN 'PH'
  WHEN 'south africa' THEN 'ZA'
  WHEN 'bangladesh' THEN 'BD'
  WHEN 'brazil' THEN 'BR'
  ELSE country_code
END
WHERE NULLIF(upper(trim(country_code)), '') IS NULL
  AND lower(trim(country)) IN (
    'india',
    'united states',
    'united state',
    'united kingdom',
    'nigeria',
    'pakistan',
    'philippines',
    'south africa',
    'bangladesh',
    'brazil'
  );

CREATE TRIGGER prevent_profile_country_change
  BEFORE UPDATE OF country, country_code ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_country_change();

COMMIT;
