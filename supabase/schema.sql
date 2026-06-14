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

-- ── 6. Profile extensions ─────────────────────────────────────
-- Run these to add skills, notification prefs, and phone columns.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skills            TEXT[]  DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_prefs JSONB  DEFAULT '{"task_approved":true,"voucher_delivered":true,"new_opportunities":true}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone             TEXT;

GRANT ALL ON public.profiles TO authenticated, service_role;

-- ── 7. Grant admin role (run manually after creating the user) ─
-- UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';

-- ── 8. Assignments table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assignments (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id         UUID REFERENCES tasks(id)    ON DELETE CASCADE,
  contributor_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  submission_type TEXT,            -- 'quiz' | 'file'
  answers         JSONB,           -- { "answer": "..." }
  file_url        TEXT,
  status          TEXT DEFAULT 'pending',  -- 'pending' | 'approved' | 'rejected'
  feedback        TEXT,
  reviewed_by     UUID REFERENCES profiles(id),
  submitted_at    TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at     TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS assignments_unique_contributor_task
  ON assignments(task_id, contributor_id);

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assignments"
  ON assignments FOR SELECT USING (auth.uid() = contributor_id);
CREATE POLICY "Users can insert own assignment"
  ON assignments FOR INSERT WITH CHECK (auth.uid() = contributor_id);
CREATE POLICY "Users can update own assignment"
  ON assignments FOR UPDATE USING (auth.uid() = contributor_id);
CREATE POLICY "Admins can manage all assignments"
  ON assignments FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

GRANT ALL ON public.assignments TO authenticated, service_role;

-- ── 9. Submissions table (full version) ──────────────────────────
CREATE TABLE IF NOT EXISTS submissions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id         UUID REFERENCES tasks(id)    ON DELETE CASCADE,
  contributor_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  files           JSONB,
  notes           TEXT,
  status          TEXT DEFAULT 'in_progress',  -- 'in_progress' | 'submitted' | 'approved' | 'rejected'
  coins_awarded   INTEGER,
  feedback        TEXT,
  reviewed_by     UUID REFERENCES profiles(id),
  submitted_at    TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at     TIMESTAMPTZ
);

-- Add columns if table already exists with minimal schema
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS files          JSONB;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS notes          TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS coins_awarded  INTEGER;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS feedback       TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS reviewed_by    UUID REFERENCES profiles(id);
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS submitted_at   TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS reviewed_at    TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS submissions_unique_contributor_task
  ON submissions(task_id, contributor_id);

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own submissions"
  ON submissions FOR SELECT USING (auth.uid() = contributor_id);
CREATE POLICY "Users can insert own submission"
  ON submissions FOR INSERT WITH CHECK (auth.uid() = contributor_id);
CREATE POLICY "Users can update own submission"
  ON submissions FOR UPDATE USING (auth.uid() = contributor_id);
CREATE POLICY "Admins can manage all submissions"
  ON submissions FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

GRANT ALL ON public.submissions TO authenticated, service_role;

-- ── 10. Notifications table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT,
  type        TEXT,   -- 'assignment_approved' | 'assignment_rejected' | 'submission_approved' | 'submission_rejected' | 'voucher_delivered' | 'new_task' | 'announcement'
  is_read     BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- UPDATE policy needs both USING (row filter) and WITH CHECK (post-update check).
-- Without WITH CHECK some Postgres versions silently reject the write.
-- If upgrading from an older schema, run:
--   DROP POLICY "Users can update own notifications" ON notifications;
-- then recreate with the block below.
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can insert notifications"
  ON notifications FOR INSERT WITH CHECK (true);

GRANT ALL ON public.notifications TO authenticated, service_role;

-- ── 11. Announcements table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  target      TEXT DEFAULT 'all',   -- 'all' | 'active' | 'new'
  created_by  UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view announcements"
  ON announcements FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage announcements"
  ON announcements FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

GRANT ALL ON public.announcements TO authenticated, service_role;

-- ── 12. Admin policies for cross-user operations ──────────────────
-- Allows admins to update any profile (for crediting coins on approval)
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Allows admins to insert coin transactions on behalf of contributors
CREATE POLICY "Admins can insert coin transactions"
  ON coin_transactions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ── 13. Helper functions ─────────────────────────────────────────
-- Atomic nexcoins increment — avoids race conditions on concurrent approvals.
-- SECURITY DEFINER lets service_role call it even without direct UPDATE grants.
CREATE OR REPLACE FUNCTION increment_nexcoins(p_contributor_id UUID, p_coins INTEGER)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE profiles
  SET nexcoins = COALESCE(nexcoins, 0) + p_coins
  WHERE id = p_contributor_id;
$$;

GRANT EXECUTE ON FUNCTION increment_nexcoins(UUID, INTEGER) TO service_role;

-- Atomic nexcoins decrement — called from contributor store redemption.
-- WHERE nexcoins >= p_coins prevents going negative (double-spend guard).
CREATE OR REPLACE FUNCTION decrement_nexcoins(p_contributor_id UUID, p_coins INTEGER)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE profiles
  SET nexcoins = COALESCE(nexcoins, 0) - p_coins
  WHERE id = p_contributor_id
    AND COALESCE(nexcoins, 0) >= p_coins;
$$;

GRANT EXECUTE ON FUNCTION decrement_nexcoins(UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION decrement_nexcoins(UUID, INTEGER) TO authenticated;

-- ── 14. Support tickets ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS support_tickets (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contributor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subject        TEXT NOT NULL,
  message        TEXT NOT NULL,
  category       TEXT DEFAULT 'general',
  status         TEXT DEFAULT 'open',     -- 'open' | 'replied' | 'closed'
  priority       TEXT DEFAULT 'normal',   -- 'normal' | 'high' | 'urgent'
  admin_reply    TEXT,
  replied_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tickets"
  ON support_tickets FOR ALL TO authenticated
  USING (auth.uid() = contributor_id)
  WITH CHECK (auth.uid() = contributor_id);

CREATE POLICY "Service role manages tickets"
  ON support_tickets FOR ALL TO service_role
  USING (true) WITH CHECK (true);

GRANT ALL ON support_tickets TO authenticated;
GRANT ALL ON support_tickets TO service_role;

-- Admin access to all support tickets (add after support_tickets table was created)
CREATE POLICY "Admins manage all tickets"
  ON support_tickets FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── 16. Ticket messages (conversation thread) ───────────────────────
CREATE TABLE IF NOT EXISTS ticket_messages (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id   UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id   UUID REFERENCES profiles(id),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('contributor', 'admin')),
  message     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own ticket messages"
  ON ticket_messages FOR SELECT TO authenticated
  USING (ticket_id IN (SELECT id FROM support_tickets WHERE contributor_id = auth.uid()));

CREATE POLICY "Users insert own messages"
  ON ticket_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Admins manage all messages"
  ON ticket_messages FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Service role manages messages"
  ON ticket_messages FOR ALL TO service_role
  USING (true) WITH CHECK (true);

GRANT ALL ON ticket_messages TO authenticated;
GRANT ALL ON ticket_messages TO service_role;

-- ── 18. Enable Realtime for notifications + ticket_messages ─────────
-- REPLICA IDENTITY FULL makes Supabase send the full row (old + new) in
-- change events — required for UPDATE and DELETE subscriptions with filters.
-- Adding to supabase_realtime publication is what actually enables the feed;
-- the client-side eventsPerSecond option only controls rate-limiting.

ALTER TABLE notifications    REPLICA IDENTITY FULL;
ALTER TABLE ticket_messages  REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE ticket_messages;

-- ── 19. Storage buckets (run in Supabase Dashboard → Storage) ────
-- Create bucket "submissions" — public read, authenticated write
-- Create bucket "assignments" — public read, authenticated write
-- Or run via SQL:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('submissions', 'submissions', true) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('assignments', 'assignments', true) ON CONFLICT DO NOTHING;
