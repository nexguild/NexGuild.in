-- NexLeader safety migration — safe to re-run
-- Creates nexleader_commissions + RPC functions if missing in production

CREATE TABLE IF NOT EXISTS nexleader_commissions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nexleader_id       UUID REFERENCES profiles(id),
  member_id          UUID REFERENCES profiles(id),
  event_type         TEXT NOT NULL,
  gross_amount       INTEGER NOT NULL,
  contributor_credit INTEGER NOT NULL,
  nexleader_credit   INTEGER NOT NULL,
  platform_cut       INTEGER NOT NULL,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE nexleader_commissions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'nexleader_commissions' AND policyname = 'nexleader_read_own_commissions'
  ) THEN
    CREATE POLICY "nexleader_read_own_commissions" ON nexleader_commissions
      FOR SELECT TO authenticated
      USING (nexleader_id = auth.uid());
  END IF;
END $$;

CREATE OR REPLACE FUNCTION increment_guild_earned(p_nexleader_id UUID, p_amount INTEGER)
RETURNS void LANGUAGE SQL SECURITY DEFINER AS $$
  UPDATE profiles
  SET guild_total_earned = guild_total_earned + p_amount
  WHERE id = p_nexleader_id;
$$;

CREATE OR REPLACE FUNCTION increment_guild_members(p_nexleader_id UUID, p_amount INTEGER)
RETURNS void LANGUAGE SQL SECURITY DEFINER AS $$
  UPDATE profiles
  SET guild_total_members = guild_total_members + p_amount
  WHERE id = p_nexleader_id;
$$;

-- Grant table access to all Supabase roles (service_role bypasses RLS but still needs object privileges)
GRANT ALL ON nexleader_commissions TO service_role, authenticated, anon;
GRANT ALL ON nexleader_applications TO service_role, authenticated, anon;
