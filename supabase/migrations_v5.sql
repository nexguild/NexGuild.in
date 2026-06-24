-- migrations_v5.sql
-- Proof code submission tracking table

CREATE TABLE IF NOT EXISTS proof_code_submissions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contributor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  site_slug      TEXT NOT NULL,
  task_id        UUID REFERENCES tasks(id) ON DELETE SET NULL,
  code           TEXT NOT NULL,
  submitted_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contributor_id, site_slug, code)  -- prevent reuse per user per site
);

-- Index for quick lookups by contributor
CREATE INDEX IF NOT EXISTS idx_proof_code_submissions_contributor
  ON proof_code_submissions(contributor_id);
