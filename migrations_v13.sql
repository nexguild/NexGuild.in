-- ── migrations_v13.sql ────────────────────────────────────────────
-- Fix duplicate in-progress rows caused by multiple visits to the work page.
--
-- Run this in Supabase SQL Editor in order:
--   STEP 1 first (cleanup), then STEP 2 (constraint).
-- Running STEP 2 before STEP 1 will fail if duplicates still exist.

-- ── STEP 1: Remove duplicate submissions ─────────────────────────
-- Keeps the oldest row (lowest id) per (contributor_id, task_id) pair.
-- All newer duplicates are deleted.
DELETE FROM submissions a
USING submissions b
WHERE a.id > b.id
  AND a.contributor_id = b.contributor_id
  AND a.task_id = b.task_id;

-- ── STEP 2: Add unique index to submissions ───────────────────────
-- A unique index enforces uniqueness identically to ADD CONSTRAINT UNIQUE.
-- Using CREATE UNIQUE INDEX because it supports IF NOT EXISTS; ALTER TABLE
-- ADD CONSTRAINT does not support IF NOT EXISTS in any Postgres version.
CREATE UNIQUE INDEX IF NOT EXISTS unique_submission_per_contributor_task
  ON submissions (contributor_id, task_id);

-- ── STEP 3: Remove duplicate assignments ─────────────────────────
-- Same cleanup for the assignments table (assignment-required tasks).
DELETE FROM assignments a
USING assignments b
WHERE a.id > b.id
  AND a.contributor_id = b.contributor_id
  AND a.task_id = b.task_id;

-- ── STEP 4: Add unique index to assignments ───────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS unique_assignment_per_contributor_task
  ON assignments (contributor_id, task_id);
