BEGIN;

ALTER TABLE public.voucher_inventory
  ADD COLUMN IF NOT EXISTS how_to_use TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE public.voucher_inventory
SET how_to_use = ARRAY[
      'Submit your voucher request from the Cashout page.',
      'Track the request in My Vouchers.',
      'Use the delivered code according to the issuer''s instructions.'
    ]::TEXT[]
WHERE cardinality(how_to_use) = 0;

UPDATE public.voucher_inventory
SET terms_and_conditions = ARRAY[
      'Voucher availability and processing times may vary.',
      'The issuer''s terms, validity period, and usage rules apply.',
      'Check the voucher details before submitting your request.'
    ]::TEXT[]
WHERE cardinality(terms_and_conditions) = 0;

COMMENT ON COLUMN public.voucher_inventory.how_to_use IS
  'Editable, ordered instructions shown in the voucher details modal.';

COMMENT ON COLUMN public.voucher_inventory.terms_and_conditions IS
  'Editable, ordered voucher terms shown in the voucher details modal.';

COMMIT;
