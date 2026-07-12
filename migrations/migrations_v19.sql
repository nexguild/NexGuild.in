-- Feature 4: Import Client Validation
-- Run in Supabase SQL editor

ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS client_validation_status TEXT,        -- 'valid' | 'invalid' | 'pending_client'
  ADD COLUMN IF NOT EXISTS client_validation_reason TEXT,
  ADD COLUMN IF NOT EXISTS client_validated_at TIMESTAMPTZ;
