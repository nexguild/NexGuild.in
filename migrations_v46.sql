-- Add optional per-denomination discounts to the voucher catalog.
ALTER TABLE public.voucher_inventory
  ADD COLUMN IF NOT EXISTS discount_percent SMALLINT NOT NULL DEFAULT 0;

ALTER TABLE public.voucher_inventory
  DROP CONSTRAINT IF EXISTS voucher_inventory_discount_percent_check;

ALTER TABLE public.voucher_inventory
  ADD CONSTRAINT voucher_inventory_discount_percent_check
  CHECK (discount_percent BETWEEN 0 AND 99);
