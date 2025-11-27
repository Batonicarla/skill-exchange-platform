-- Fix ratings table to properly link to sessions
-- Drop existing table and recreate with proper structure

DROP TABLE IF EXISTS ratings;

CREATE TABLE ratings (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL,
  rater_id TEXT NOT NULL,
  rated_user_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, rater_id) -- One rating per session per rater
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_ratings_session ON ratings(session_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rated_user ON ratings(rated_user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rater ON ratings(rater_id);

-- Add foreign key constraint to sessions table
ALTER TABLE ratings 
ADD CONSTRAINT fk_ratings_session 
FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE;