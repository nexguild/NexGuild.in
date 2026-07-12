-- ============================================================
-- migrations_v14.sql  — Admin Projects: full rebuild
-- Run this in Supabase SQL Editor
-- ============================================================

-- ── Extend projects table ────────────────────────────────────
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS start_date                  DATE,
  ADD COLUMN IF NOT EXISTS payment_timeline            TEXT,
  ADD COLUMN IF NOT EXISTS total_budget_nc             INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS client_payment_amount       TEXT,
  ADD COLUMN IF NOT EXISTS client_payment_received     BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS client_payment_received_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS internal_notes              TEXT,
  ADD COLUMN IF NOT EXISTS updated_at                  TIMESTAMPTZ DEFAULT NOW();

-- ── Link tasks to projects ───────────────────────────────────
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS tasks_project_id_idx ON tasks(project_id);

-- ── RLS on projects ──────────────────────────────────────────
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_full_projects" ON projects;
CREATE POLICY "admin_full_projects" ON projects
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── Auto-update updated_at trigger ──────────────────────────
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS projects_updated_at_trigger ON projects;
CREATE TRIGGER projects_updated_at_trigger
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_projects_updated_at();
