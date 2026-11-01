BEGIN;

DELETE FROM public.voucher_inventory;

ALTER TABLE public.voucher_inventory
  DROP CONSTRAINT IF EXISTS voucher_inventory_india_inr_only;

ALTER TABLE public.voucher_inventory
  DROP CONSTRAINT IF EXISTS voucher_inventory_category_supported;

ALTER TABLE public.voucher_inventory
  ADD CONSTRAINT voucher_inventory_india_inr_only
  CHECK (
    value_inr IS NOT NULL
    AND value_inr > 0
    AND value_usd IS NULL
    AND country_codes = ARRAY['IN']::TEXT[]
    AND country_codes_verified IS TRUE
  );

ALTER TABLE public.voucher_inventory
  ADD CONSTRAINT voucher_inventory_category_supported
  CHECK (
    category IS NOT NULL
    AND category IN (
      'shopping',
      'food_groceries',
      'movies_ott',
      'travel_hospitality',
      'electronics',
      'jewellery_wearables',
      'beauty_wellness',
      'others'
    )
  );

ALTER TABLE public.voucher_inventory
  ALTER COLUMN country_codes SET DEFAULT ARRAY['IN']::TEXT[],
  ALTER COLUMN country_codes_verified SET DEFAULT TRUE;

COMMENT ON CONSTRAINT voucher_inventory_india_inr_only ON public.voucher_inventory IS
  'Voucher inventory is limited to verified Indian INR rewards.';

COMMIT;
