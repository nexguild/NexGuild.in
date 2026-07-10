-- NexLeader System — Migration v11
-- Run in Supabase SQL Editor

-- ── Part 1: New columns on profiles ─────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS nexleader_id          UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS is_nexleader          BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS nexleader_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS guild_total_members   INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS guild_total_earned    INTEGER DEFAULT 0;

-- Set Somen as the platform NexLeader
UPDATE profiles
SET is_nexleader          = TRUE,
    nexleader_approved_at = NOW()
WHERE id = '6c95c54a-33e6-489b-9175-3626c774635e';

-- Assign all existing users to Somen as their NexLeader
UPDATE profiles
SET nexleader_id = '6c95c54a-33e6-489b-9175-3626c774635e'
WHERE id != '6c95c54a-33e6-489b-9175-3626c774635e'
  AND nexleader_id IS NULL;

-- Compute Somen's initial guild_total_members from existing users
UPDATE profiles
SET guild_total_members = (
  SELECT COUNT(*) FROM profiles WHERE id != '6c95c54a-33e6-489b-9175-3626c774635e'
)
WHERE id = '6c95c54a-33e6-489b-9175-3626c774635e';

-- ── New tables ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nexleader_applications (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contributor_id        UUID REFERENCES profiles(id),
  reason                TEXT NOT NULL,
  community_description TEXT NOT NULL,
  estimated_recruits    INTEGER,
  status                TEXT DEFAULT 'pending',
  rejection_reason      TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at           TIMESTAMPTZ,
  reviewed_by           UUID REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS nexleader_commissions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nexleader_id       UUID REFERENCES profiles(id),
  member_id          UUID REFERENCES profiles(id),
  event_type         TEXT NOT NULL, -- 'offerwall' | 'task' | 'promotion_bonus'
  gross_amount       INTEGER NOT NULL,
  contributor_credit INTEGER NOT NULL, -- 66%
  nexleader_credit   INTEGER NOT NULL, -- 8%
  platform_cut       INTEGER NOT NULL, -- 26%
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE nexleader_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexleader_commissions  ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'nexleader_applications' AND policyname = 'contributor_read_own_applications'
  ) THEN
    CREATE POLICY "contributor_read_own_applications" ON nexleader_applications
      FOR SELECT TO authenticated
      USING (contributor_id = auth.uid());
  END IF;
END $$;

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

-- ── Part 2: Platform settings ────────────────────────────────────────────────
INSERT INTO platform_settings (key, value) VALUES
  ('platform_cut_pct',      '26'),
  ('contributor_share_pct', '66'),
  ('nexleader_share_pct',   '8')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ── Helper RPC functions for atomic integer increments ───────────────────────
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

-- ── NOTE FOR SOMEN ───────────────────────────────────────────────────────────
-- After running this migration:
-- 1. CPX Research Currency Factor: 700 → 660 (CPX dashboard → My Apps → NexGuild → Reward Settings)
-- 2. TheoremReach Exchange Rate: 700 → 660 (TheoremReach dashboard → App Details)
-- 3. Update Apps Script write_submission_row to add nexleader_name and nexleader_id columns
