ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS required_task_ids UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS excluded_task_ids UUID[] DEFAULT '{}';
