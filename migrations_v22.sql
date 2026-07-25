-- Backfill nexleader_commissions from coin_transactions
-- Run AFTER migrations_v21.sql (table must exist first)
-- Safe to re-run — skips rows that already exist

INSERT INTO nexleader_commissions (
  nexleader_id,
  member_id,
  event_type,
  gross_amount,
  contributor_credit,
  nexleader_credit,
  platform_cut,
  created_at
)
SELECT
  ct.contributor_id AS nexleader_id,
  p.id              AS member_id,
  -- Best-effort event_type from description keywords
  CASE
    WHEN ct.description ~* '(survey|cpx|theorem|mylead|clixwall|offerwall|monlix)'
    THEN 'offerwall'
    ELSE 'task'
  END AS event_type,
  -- nexleader_credit = 10% of gross, so gross = credit * 10
  ct.amount * 10                                              AS gross_amount,
  ROUND(ct.amount * 6.6)::INTEGER                            AS contributor_credit,
  ct.amount                                                   AS nexleader_credit,
  (ct.amount * 10 - ROUND(ct.amount * 6.6)::INTEGER - ct.amount) AS platform_cut,
  ct.created_at
FROM coin_transactions ct
-- Extract first-8-chars of member UUID from description "Commission: Name (xxxxxxxx) · ..."
JOIN profiles p
  ON p.id::TEXT LIKE (
    COALESCE(SUBSTRING(ct.description FROM '\(([0-9a-f]{8})'), 'NO_MATCH') || '%'
  )
WHERE ct.source = 'nexleader_commission'
  AND ct.type   = 'earned'
  AND ct.amount > 0
  -- Skip duplicates
  AND NOT EXISTS (
    SELECT 1 FROM nexleader_commissions nc
    WHERE nc.nexleader_id    = ct.contributor_id
      AND nc.nexleader_credit = ct.amount
      AND nc.created_at       = ct.created_at
  );

-- NOTE: Do NOT auto-update guild_total_earned here.
-- guild_total_earned is maintained by increment_guild_earned RPC calls
-- and may be higher than SUM(nexleader_commissions) if some rows failed to insert.

-- Optional diagnostic — uncomment to verify before/after
-- SELECT COUNT(*) AS commission_rows FROM nexleader_commissions;
-- SELECT id, guild_total_earned FROM profiles WHERE is_nexleader = TRUE;
