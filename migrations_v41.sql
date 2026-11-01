ALTER TABLE public.voucher_inventory
  ADD COLUMN IF NOT EXISTS country_codes_verified BOOLEAN NOT NULL DEFAULT false;

UPDATE public.voucher_inventory
SET country_codes_verified = true
WHERE cardinality(country_codes) > 0;

COMMENT ON COLUMN public.voucher_inventory.country_codes_verified IS
  'True only after an administrator confirms eligible countries; an empty country_codes array is worldwide only when this flag is true.';
