-- Create actions_tracking table to store status of AI recommended contacts
CREATE TABLE IF NOT EXISTS actions_tracking (
  id TIMESTAMP DEFAULT NOW() PRIMARY KEY,
  record_id TEXT NOT NULL,                     -- Reference to customer_interactions.airtable_id
  user_id UUID REFERENCES auth.users(id),       -- Reference to Supabase Auth User
  status TEXT DEFAULT 'unprocessed',           -- 'processed' or 'unprocessed'
  feedback_rating INT,                         -- 1-5 or simple thumbs up/down
  comments TEXT,                               -- User notes on the action
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster lookup of specific record status
CREATE INDEX IF NOT EXISTS idx_actions_record_id ON actions_tracking(record_id);
CREATE INDEX IF NOT EXISTS idx_actions_user_id ON actions_tracking(user_id);
