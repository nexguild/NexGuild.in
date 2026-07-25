-- Add description column to nexleader_commissions
-- So the Guild Activity feed can show which task/offerwall generated each commission

ALTER TABLE nexleader_commissions ADD COLUMN IF NOT EXISTS description TEXT;
