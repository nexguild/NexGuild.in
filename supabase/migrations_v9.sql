-- Migration v9: Referral system
-- Run this in Supabase SQL editor

-- ── 1. Extend profiles table ─────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referred_by             UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS referral_code           TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referral_bonus_paid     BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS total_referrals         INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_referral_earnings INTEGER DEFAULT 0;

-- ── 2. Populate referral codes for existing users ────────────────────────────
-- First 8 chars of UUID, uppercase: e.g. 6c95c54a-... → "6C95C54A"
UPDATE profiles
SET referral_code = upper(left(id::text, 8))
WHERE referral_code IS NULL;

-- ── 3. Trigger to auto-set referral code on new profile inserts ──────────────
CREATE OR REPLACE FUNCTION set_referral_code()
RETURNS TRIGGER AS $$
DECLARE
  base_code  TEXT;
  final_code TEXT;
  counter    INTEGER := 0;
BEGIN
  IF NEW.referral_code IS NULL THEN
    base_code  := upper(left(NEW.id::text, 8));
    final_code := base_code;
    -- Handle extremely unlikely collision (16^8 = 4.3B combinations)
    WHILE EXISTS (SELECT 1 FROM profiles WHERE referral_code = final_code) LOOP
      counter    := counter + 1;
      final_code := base_code || counter::TEXT;
    END LOOP;
    NEW.referral_code := final_code;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_referral_code ON profiles;
CREATE TRIGGER trigger_set_referral_code
  BEFORE INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_referral_code();

-- ── 4. Referral events audit trail ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS referral_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id      UUID REFERENCES profiles(id),
  referred_id      UUID REFERENCES profiles(id),
  event_type       TEXT NOT NULL,       -- 'signup_bonus' | 'milestone_bonus'
  nexcoins_awarded INTEGER NOT NULL,
  flagged          BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_referral_events_referrer ON referral_events(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_events_referred ON referral_events(referred_id);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by     ON profiles(referred_by);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code   ON profiles(referral_code);
