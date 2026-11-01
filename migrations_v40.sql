ALTER TABLE public.voucher_inventory
  ADD COLUMN IF NOT EXISTS country_codes TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.voucher_inventory.country_codes IS
  'ISO 3166-1 alpha-2 country codes where this reward is available; an empty array means worldwide.';

UPDATE public.voucher_inventory
SET country_codes = ARRAY['IN']::TEXT[]
WHERE cardinality(country_codes) = 0
  AND value_inr > 0
  AND (value_usd IS NULL OR value_usd <= 0);
