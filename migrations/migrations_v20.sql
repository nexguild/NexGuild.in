-- Feature 5: Daily Target Long-Term Projects
-- Run in Supabase SQL editor

-- 1. Add daily-target fields to projects
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS is_daily_target BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS daily_quota INTEGER,
  ADD COLUMN IF NOT EXISTS daily_unit_name TEXT,
  ADD COLUMN IF NOT EXISTS file_delivery_method TEXT; -- 'admin_upload' | 'pool'

-- 2. Create daily_work_items table
CREATE TABLE IF NOT EXISTS daily_work_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  contributor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  -- NULL contributor_id = item is in pool (unassigned), used for file_delivery_method = 'pool'
  assigned_date DATE NOT NULL,
  file_url TEXT,
  file_name TEXT,
  status TEXT DEFAULT 'pending',         -- pending | submitted | approved | rejected
  submission_content TEXT,               -- contributor's work output (transcription, annotation, etc.)
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  coins_awarded INTEGER,
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, contributor_id, assigned_date, file_url)
);

-- 3. RLS policies
ALTER TABLE daily_work_items ENABLE ROW LEVEL SECURITY;

-- Contributors see only their own items
CREATE POLICY "daily_items_contributor_select"
  ON daily_work_items FOR SELECT
  USING (
    auth.uid() = contributor_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'owner', 'reviewer')
    )
  );

-- Admins/reviewers can insert, update, delete
CREATE POLICY "daily_items_admin_all"
  ON daily_work_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'owner', 'reviewer')
    )
  );

-- Contributors can update their own items (to submit work)
CREATE POLICY "daily_items_contributor_update"
  ON daily_work_items FOR UPDATE
  USING (auth.uid() = contributor_id)
  WITH CHECK (auth.uid() = contributor_id);
