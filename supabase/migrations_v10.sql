-- ============================================================
-- NexGuild v10 Migrations
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- Add is_active to profiles for user self-deactivation.
-- (is_active in migrations_v2 was added to offerwall_providers, not profiles)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Any existing rows get true by default (already covered by DEFAULT true,
-- but explicit for clarity)
UPDATE public.profiles SET is_active = true WHERE is_active IS NULL;
