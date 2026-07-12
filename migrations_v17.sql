ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS external_tool_url TEXT,
  ADD COLUMN IF NOT EXISTS external_tool_name TEXT,
  ADD COLUMN IF NOT EXISTS external_tool_instructions TEXT,
  ADD COLUMN IF NOT EXISTS external_proof_type TEXT;
  -- external_proof_type: 'screenshot' | 'code' | 'both'
