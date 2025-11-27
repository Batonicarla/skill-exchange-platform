-- Add completed_at field to sessions table
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Update the status check constraint to include 'completed'
-- First drop the existing constraint if it exists
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_status_check;

-- Add new constraint with completed status
ALTER TABLE sessions ADD CONSTRAINT sessions_status_check 
CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled', 'completed'));