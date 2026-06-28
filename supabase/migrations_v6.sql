-- postback_logs: permanent audit trail for every offerwall postback received
CREATE TABLE IF NOT EXISTS postback_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider      TEXT NOT NULL,
  raw_params    JSONB,
  hash_valid    BOOLEAN,
  action_taken  TEXT,
  error_message TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_postback_logs_provider   ON postback_logs (provider);
CREATE INDEX IF NOT EXISTS idx_postback_logs_action     ON postback_logs (action_taken);
CREATE INDEX IF NOT EXISTS idx_postback_logs_created_at ON postback_logs (created_at DESC);

ALTER TABLE postback_logs ENABLE ROW LEVEL SECURITY;

-- Admins and owners can read logs; service role bypasses RLS for inserts
CREATE POLICY "admins_read_postback_logs"
  ON postback_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id  = auth.uid()
        AND profiles.role IN ('owner', 'admin', 'finance')
    )
  );
