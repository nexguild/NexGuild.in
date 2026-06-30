-- Migration v8: soft-delete support for tasks
-- Run this in Supabase SQL editor

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Index so filtering deleted tasks is fast
CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at ON tasks (deleted_at)
  WHERE deleted_at IS NULL;
