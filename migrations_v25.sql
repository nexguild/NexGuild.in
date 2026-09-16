-- Align the offerwall default with the current contributor commission model.
-- Existing providers explicitly configured at the old 70% default are moved
-- to 66%; intentional provider-specific overrides remain unchanged.

ALTER TABLE offerwall_providers
  ALTER COLUMN contributor_share_pct SET DEFAULT 66;

UPDATE offerwall_providers
SET contributor_share_pct = 66
WHERE contributor_share_pct = 70;
