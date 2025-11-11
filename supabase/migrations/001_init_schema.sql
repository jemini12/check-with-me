-- Create trending_prompts table
CREATE TABLE IF NOT EXISTS trending_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt TEXT NOT NULL,
  cached_result JSONB NOT NULL,
  upvote_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on upvote_count for trending queries
CREATE INDEX IF NOT EXISTS idx_trending_prompts_upvote_count ON trending_prompts(upvote_count DESC, created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE trending_prompts ENABLE ROW LEVEL SECURITY;

-- Create policies for trending_prompts (anyone can read, service role can insert/update)
CREATE POLICY "Anyone can read trending prompts"
  ON trending_prompts FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert trending prompts"
  ON trending_prompts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update trending prompts"
  ON trending_prompts FOR UPDATE
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_trending_prompts_updated_at
  BEFORE UPDATE ON trending_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create RPC function for atomic upvote increment
CREATE OR REPLACE FUNCTION increment_upvote(prompt_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE trending_prompts
  SET upvote_count = upvote_count + 1
  WHERE id = prompt_id
  RETURNING upvote_count INTO new_count;

  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create fact_check_history table for logging all fact-check requests
CREATE TABLE IF NOT EXISTS fact_check_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_text TEXT NOT NULL,
  text_hash TEXT NOT NULL,
  result JSONB NOT NULL,
  is_error BOOLEAN DEFAULT false,
  error_message TEXT,
  response_time_ms INTEGER,
  session_id TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fact_check_history
CREATE INDEX IF NOT EXISTS idx_fact_check_history_text_hash ON fact_check_history(text_hash);
CREATE INDEX IF NOT EXISTS idx_fact_check_history_created_at ON fact_check_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fact_check_history_session_id ON fact_check_history(session_id);
CREATE INDEX IF NOT EXISTS idx_fact_check_history_is_error ON fact_check_history(is_error);

-- Enable RLS for fact_check_history
ALTER TABLE fact_check_history ENABLE ROW LEVEL SECURITY;

-- Create policy for fact_check_history (service role only)
CREATE POLICY "Service role can read fact check history"
  ON fact_check_history FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert fact check history"
  ON fact_check_history FOR INSERT
  WITH CHECK (true);
