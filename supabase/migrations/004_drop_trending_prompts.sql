-- Drop trending_prompts table and all related objects
-- This table is no longer used after removing the trending feature

-- Drop function first (dependent on table)
DROP FUNCTION IF EXISTS increment_upvote(UUID);

-- Drop policies
DROP POLICY IF EXISTS "Anyone can read trending prompts" ON trending_prompts;
DROP POLICY IF EXISTS "Service role can insert trending prompts" ON trending_prompts;
DROP POLICY IF EXISTS "Service role can update trending prompts" ON trending_prompts;

-- Drop trigger
DROP TRIGGER IF EXISTS update_trending_prompts_updated_at ON trending_prompts;

-- Drop indexes
DROP INDEX IF EXISTS idx_trending_prompts_upvote_count;

-- Drop table
DROP TABLE IF EXISTS trending_prompts;
