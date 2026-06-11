-- Add mood to posts and create comments table

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS mood VARCHAR(50);

-- Comments table for post discussions
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES anon_users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read comments"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Auth user can insert comment"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
