-- ============================================================
-- NexGuild Universal Task System Migration
-- Run this in your Supabase SQL editor (Project > SQL Editor)
-- ============================================================

-- 1. Add new columns to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS steps                    JSONB    DEFAULT '[]';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS terms                    TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS validation_time          TEXT     DEFAULT '48 hours';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS payment_time             TEXT     DEFAULT '72 hours';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS required_language        TEXT     DEFAULT 'Any';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS required_skills          TEXT[]   DEFAULT '{}';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_private               BOOLEAN  DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_featured              BOOLEAN  DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignment_instructions  TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignment_questions     JSONB    DEFAULT '[]';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignment_passing_score INTEGER  DEFAULT 70;

-- 2. Add languages to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}';

-- 3. Create task_step_submissions table
CREATE TABLE IF NOT EXISTS task_step_submissions (
  id              UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id         UUID         NOT NULL REFERENCES tasks(id)    ON DELETE CASCADE,
  contributor_id  UUID         NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  step_index      INTEGER      NOT NULL,
  submission_type TEXT         NOT NULL DEFAULT 'none',
  text_value      TEXT,
  file_url        TEXT,
  submitted_at    TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE(task_id, contributor_id, step_index)
);

-- 4. RLS for task_step_submissions
ALTER TABLE task_step_submissions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'task_step_submissions'
      AND policyname = 'Users manage own step submissions'
  ) THEN
    CREATE POLICY "Users manage own step submissions"
      ON task_step_submissions FOR ALL
      TO authenticated
      USING (auth.uid() = contributor_id)
      WITH CHECK (auth.uid() = contributor_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'task_step_submissions'
      AND policyname = 'Service role manages step submissions'
  ) THEN
    CREATE POLICY "Service role manages step submissions"
      ON task_step_submissions FOR ALL
      TO service_role USING (true);
  END IF;
END $$;

GRANT ALL ON task_step_submissions TO authenticated, service_role;

-- 5. Storage buckets + RLS for file uploads
-- Create buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
  VALUES ('submissions', 'submissions', true)
  ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
  VALUES ('assignments', 'assignments', true)
  ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder (path starts with their user ID)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'Authenticated users can upload submissions'
  ) THEN
    CREATE POLICY "Authenticated users can upload submissions"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'submissions'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'Authenticated users can update submissions'
  ) THEN
    CREATE POLICY "Authenticated users can update submissions"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'submissions'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'Public can read submissions'
  ) THEN
    CREATE POLICY "Public can read submissions"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'submissions');
  END IF;
END $$;

-- Same policies for assignments bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'Authenticated users can upload assignments'
  ) THEN
    CREATE POLICY "Authenticated users can upload assignments"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'assignments'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'Authenticated users can update assignments'
  ) THEN
    CREATE POLICY "Authenticated users can update assignments"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'assignments'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'Public can read assignments'
  ) THEN
    CREATE POLICY "Public can read assignments"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'assignments');
  END IF;
END $$;
