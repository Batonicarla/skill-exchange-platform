-- Fix ratings table foreign key references
-- This script ensures the ratings table has proper foreign key constraints

-- First, check if the ratings table exists and recreate it with proper constraints
DROP TABLE IF EXISTS ratings CASCADE;

CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  rater_id UUID REFERENCES users(uid) ON DELETE CASCADE,
  rated_user_id UUID REFERENCES users(uid) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  review TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_ratings_session_id ON ratings(session_id);
CREATE INDEX idx_ratings_rater_id ON ratings(rater_id);
CREATE INDEX idx_ratings_rated_user_id ON ratings(rated_user_id);

-- Enable RLS
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all ratings" ON ratings FOR SELECT USING (true);
CREATE POLICY "Users can create ratings for their sessions" ON ratings FOR INSERT 
  WITH CHECK (
    auth.uid() = rater_id AND
    EXISTS (
      SELECT 1 FROM sessions 
      WHERE id = session_id 
      AND (proposer_id = auth.uid() OR partner_id = auth.uid())
      AND status = 'completed'
    )
  );

-- Grant necessary permissions
GRANT ALL ON ratings TO authenticated;
GRANT ALL ON ratings TO service_role;