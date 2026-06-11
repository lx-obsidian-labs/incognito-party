-- Adds follows table for user-to-user following
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES anon_users(id) ON DELETE CASCADE,
  followed_id UUID REFERENCES anon_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, followed_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth user can follow/unfollow"
  ON follows FOR ALL
  USING (auth.uid() = follower_id)
  WITH CHECK (auth.uid() = follower_id);
