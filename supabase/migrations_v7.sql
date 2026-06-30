-- Google Drive integration: per-task folder, images subfolder, and submissions sheet
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS drive_folder_id        TEXT,
  ADD COLUMN IF NOT EXISTS drive_images_folder_id TEXT,
  ADD COLUMN IF NOT EXISTS drive_sheet_id         TEXT;
