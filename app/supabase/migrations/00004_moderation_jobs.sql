-- Table for asynchronous moderation jobs
CREATE TABLE IF NOT EXISTS moderation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','processing','done','failed')),
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

ALTER TABLE moderation_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth can insert job" ON moderation_jobs FOR INSERT WITH CHECK (true);
