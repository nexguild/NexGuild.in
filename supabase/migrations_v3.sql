-- Support USD-priced vouchers
-- value_inr becomes optional (nullable) when a USD price is used instead
ALTER TABLE public.voucher_inventory
  ADD COLUMN IF NOT EXISTS value_usd numeric(10,2),
  ALTER COLUMN value_inr DROP NOT NULL;
