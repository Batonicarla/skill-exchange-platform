-- Add duration and location fields to sessions table
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '';

-- Update existing sessions to have default duration
UPDATE sessions 
SET duration = 60 
WHERE duration IS NULL;