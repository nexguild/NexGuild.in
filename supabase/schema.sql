-- ============================================================
-- NexGuild Database Schema
-- Run this in the Supabase SQL Editor (Project → SQL Editor)
-- ============================================================

-- ── 1. Tables ────────────────────────────────────────────────

CREATE TABLE profiles (
  id             UUID REFERENCES auth.users ON DELETE CASCADE,
  full_name      TEXT,
  email          TEXT,
  phone          TEXT,
  country        TEXT DEFAULT 'India',
  role           TEXT DEFAULT 'contributor',   -- 'contributor' | 'admin'
  status         TEXT DEFAULT 'active',        -- 'active' | 'suspended' | 'banned'
  kyc_status     TEXT DEFAULT 'pending',       -- 'pending' | 'verified' | 'rejected'
  referral_code  TEXT UNIQUE,
  referred_by    UUID,
  wallet_balance DECIMAL DEFAULT 0,
  total_earned   DECIMAL DEFAULT 0,
  joined_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

CREATE TABLE tasks (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title               TEXT NOT NULL,
  description         TEXT,
  task_type           TEXT,
  requirements        TEXT,
  pay_per_task        DECIMAL,
  total_slots         INTEGER,
  filled_slots        INTEGER DEFAULT 0,
  deadline            TIMESTAMPTZ,
  status              TEXT DEFAULT 'active',   -- 'active' | 'paused' | 'draft' | 'archived'
  assignment_required BOOLEAN DEFAULT false,
  assignment_type     TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE earnings (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contributor_id UUID REFERENCES profiles(id),
  source_type    TEXT,   -- 'task' | 'offerwall' | 'referral'
  source_label   TEXT,
  amount         DECIMAL,
  status         TEXT DEFAULT 'pending',       -- 'pending' | 'confirmed' | 'rejected'
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE withdrawals (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contributor_id  UUID REFERENCES profiles(id),
  amount          DECIMAL,
  method          TEXT,   -- 'UPI' | 'Bank Transfer' | 'PayPal'
  payment_details JSONB,
  status          TEXT DEFAULT 'pending',      -- 'pending' | 'processing' | 'completed' | 'rejected'
  requested_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. Table-level grants ─────────────────────────────────────
-- Raw SQL creates skip the auto-grants the Supabase dashboard adds.
-- service_role bypasses RLS but still needs GRANT at the table level.

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON public.profiles    TO authenticated, service_role;
GRANT INSERT, UPDATE ON public.profiles TO authenticated, service_role;
GRANT SELECT ON public.tasks       TO anon, authenticated, service_role;
GRANT ALL    ON public.tasks       TO service_role;
GRANT ALL    ON public.earnings    TO authenticated, service_role;
GRANT ALL    ON public.withdrawals TO authenticated, service_role;

-- ── 3. Row Level Security ─────────────────────────────────────

ALTER TABLE profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- tasks (active tasks readable by any logged-in user)
CREATE POLICY "Tasks are viewable by authenticated users"
  ON tasks FOR SELECT
  USING (auth.role() = 'authenticated' AND status = 'active');

CREATE POLICY "Admins can manage tasks"
  ON tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- earnings
CREATE POLICY "Users can view own earnings"
  ON earnings FOR SELECT
  USING (auth.uid() = contributor_id);

CREATE POLICY "Admins can view all earnings"
  ON earnings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- withdrawals
CREATE POLICY "Users can view own withdrawals"
  ON withdrawals FOR SELECT
  USING (auth.uid() = contributor_id);

CREATE POLICY "Users can insert own withdrawal"
  ON withdrawals FOR INSERT
  WITH CHECK (auth.uid() = contributor_id);

CREATE POLICY "Admins can manage withdrawals"
  ON withdrawals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ── 4. Auto-create profile on signup ─────────────────────────
-- This trigger fires when a new user is created in auth.users.
-- It reads full_name and country from the signup metadata and
-- generates a unique referral code automatically.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_referral_code TEXT;
BEGIN
  -- Generate a short unique referral code
  new_referral_code := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    country,
    role,
    referral_code
  ) VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'country', 'India'),
    'contributor',
    new_referral_code
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ── 5. NexCoins system ────────────────────────────────────────
-- Run these in Supabase SQL Editor to add the NexCoins system.

-- Add nexcoins balance to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nexcoins INTEGER DEFAULT 0;

-- Coin transaction ledger
CREATE TABLE IF NOT EXISTS coin_transactions (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contributor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount         INTEGER NOT NULL,
  type           TEXT NOT NULL,   -- 'earned' | 'redeemed'
  source         TEXT,            -- 'task' | 'offerwall' | 'bonus'
  description    TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Voucher redemption requests
CREATE TABLE IF NOT EXISTS voucher_requests (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contributor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  voucher_type   TEXT NOT NULL,
  voucher_value  INTEGER,
  coins_spent    INTEGER NOT NULL,
  status         TEXT DEFAULT 'pending',  -- 'pending' | 'processing' | 'delivered'
  voucher_code   TEXT,
  requested_at   TIMESTAMPTZ DEFAULT NOW(),
  delivered_at   TIMESTAMPTZ
);

-- RLS
ALTER TABLE coin_transactions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_requests   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own coin transactions"
  ON coin_transactions FOR SELECT USING (auth.uid() = contributor_id);

CREATE POLICY "Admins can manage coin transactions"
  ON coin_transactions FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "Users can view own voucher requests"
  ON voucher_requests FOR SELECT USING (auth.uid() = contributor_id);

CREATE POLICY "Users can insert own voucher request"
  ON voucher_requests FOR INSERT WITH CHECK (auth.uid() = contributor_id);

CREATE POLICY "Admins can manage voucher requests"
  ON voucher_requests FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Grants
GRANT ALL ON public.coin_transactions TO authenticated, service_role;
GRANT ALL ON public.voucher_requests  TO authenticated, service_role;

-- ── 6. Grant admin role (run manually after creating the user) ─
-- UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
