-- Create shared_checks table for shareable fact-check results
CREATE TABLE IF NOT EXISTS shared_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt TEXT NOT NULL,
  cached_result JSONB NOT NULL,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on created_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_shared_checks_created_at ON shared_checks(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE shared_checks ENABLE ROW LEVEL SECURITY;

-- Create policies for shared_checks (anyone can read, service role can insert)
CREATE POLICY "Anyone can read shared checks"
  ON shared_checks FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert shared checks"
  ON shared_checks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update shared checks"
  ON shared_checks FOR UPDATE
  USING (true);

-- Create function to increment view count atomically
CREATE OR REPLACE FUNCTION increment_share_view(share_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE shared_checks
  SET view_count = view_count + 1
  WHERE id = share_id
  RETURNING view_count INTO new_count;

  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
