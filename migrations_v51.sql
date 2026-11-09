CREATE INDEX IF NOT EXISTS coin_transactions_earned_contributor_created_at_idx
  ON public.coin_transactions (contributor_id, created_at)
  INCLUDE (amount)
  WHERE type = 'earned';
