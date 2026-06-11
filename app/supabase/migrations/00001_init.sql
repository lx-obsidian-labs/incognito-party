-- Incognito Party — Complete Schema
-- Run this in Supabase SQL Editor

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Channels
CREATE TABLE IF NOT EXISTS channels (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        VARCHAR(30) UNIQUE NOT NULL,
  name        VARCHAR(60) NOT NULL,
  description TEXT,
  icon        VARCHAR(10)
);

ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read channels"
  ON channels FOR SELECT
  USING (true);

-- Seed channels
INSERT INTO channels (slug, name, description, icon) VALUES
  ('advice', 'Advice', 'Seek and give advice', '💡'),
  ('confessions', 'Confessions', 'Get it off your chest', '🤫'),
  ('wins', 'Wins', 'Share your victories', '🏆'),
  ('rants', 'Rants', 'Vent about anything', '😤'),
  ('daily', 'Daily', 'Your day, your way', '📆'),
  ('offtopic', 'Off Topic', 'Everything else', '🌀')
ON CONFLICT (slug) DO NOTHING;

-- 2. Anonymous Users
CREATE TABLE IF NOT EXISTS anon_users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handle      VARCHAR(30) UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  last_seen   TIMESTAMPTZ DEFAULT NOW(),
  is_banned   BOOLEAN DEFAULT FALSE,
  dm_privacy  VARCHAR(10) DEFAULT 'anyone' CHECK (dm_privacy IN ('nobody','tipped','anyone')),
  bio         TEXT DEFAULT '',
  avatar_color VARCHAR(7)
);

ALTER TABLE anon_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read handles"
  ON anon_users FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own row"
  ON anon_users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own row"
  ON anon_users FOR UPDATE
  USING (auth.uid() = id);

-- 3. Channel Subscriptions
CREATE TABLE IF NOT EXISTS channel_subs (
  user_id    UUID REFERENCES anon_users(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, channel_id)
);

ALTER TABLE channel_subs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own subs"
  ON channel_subs FOR ALL
  USING (auth.uid() = user_id);

-- 4. Posts
CREATE TABLE IF NOT EXISTS posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id  UUID REFERENCES channels(id) ON DELETE CASCADE,
  author_id   UUID REFERENCES anon_users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  media_url   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  is_flagged  BOOLEAN DEFAULT FALSE,
  is_removed  BOOLEAN DEFAULT FALSE,
  removed_at  TIMESTAMPTZ,
  views       INTEGER DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  is_moment   BOOLEAN DEFAULT FALSE,
  expires_at  TIMESTAMPTZ
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read non-removed posts"
  ON posts FOR SELECT
  USING (is_removed = false);

CREATE POLICY "Auth user can insert own post"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Author can update own post"
  ON posts FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Author can delete own post"
  ON posts FOR DELETE
  USING (auth.uid() = author_id);

CREATE INDEX IF NOT EXISTS idx_posts_channel_created ON posts(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_moments ON posts(is_moment, expires_at) WHERE is_moment = true;

-- 5. Interactions (likes, super_likes, tips)
CREATE TABLE IF NOT EXISTS interactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES anon_users(id) ON DELETE CASCADE,
  type        VARCHAR(20) NOT NULL CHECK (type IN ('like','super_like','tip')),
  amount      INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id, type)
);

ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read interactions"
  ON interactions FOR SELECT
  USING (true);

CREATE POLICY "Auth user can insert own interaction"
  ON interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_interactions_post ON interactions(post_id);
CREATE INDEX IF NOT EXISTS idx_interactions_user ON interactions(user_id);

-- 6. Direct Messages
CREATE TABLE IF NOT EXISTS direct_messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id     UUID REFERENCES anon_users(id) ON DELETE CASCADE,
  recipient_id  UUID REFERENCES anon_users(id) ON DELETE CASCADE,
  content       TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  is_read       BOOLEAN DEFAULT FALSE
);

ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see DMs they sent or received"
  ON direct_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Auth user can send DM"
  ON direct_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recipient can mark as read"
  ON direct_messages FOR UPDATE
  USING (auth.uid() = recipient_id);

CREATE INDEX IF NOT EXISTS idx_dms_recipient ON direct_messages(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_dms_sender ON direct_messages(sender_id);

-- 7. DM Relationships (privacy allowlist)
CREATE TABLE IF NOT EXISTS dm_relationships (
  user_id         UUID REFERENCES anon_users(id) ON DELETE CASCADE,
  allowed_user_id UUID REFERENCES anon_users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, allowed_user_id)
);

ALTER TABLE dm_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own DM relationships"
  ON dm_relationships FOR ALL
  USING (auth.uid() = user_id);

-- 8. Wallets
CREATE TABLE IF NOT EXISTS wallets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES anon_users(id) ON DELETE CASCADE UNIQUE,
  balance     INTEGER DEFAULT 0 NOT NULL,
  last_daily_credits TIMESTAMPTZ DEFAULT NOW(),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own wallet"
  ON wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can update wallet"
  ON wallets FOR UPDATE
  USING (auth.uid() = user_id);

-- 9. Transactions
CREATE TABLE IF NOT EXISTS txns (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id   UUID REFERENCES wallets(id) ON DELETE CASCADE,
  type        VARCHAR(20) NOT NULL,
  amount      INTEGER NOT NULL,
  ref_id      UUID,
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE txns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own txns"
  ON txns FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM wallets WHERE wallets.id = txns.wallet_id
  ));

CREATE POLICY "System can insert txns"
  ON txns FOR INSERT
  WITH CHECK (true);

-- 10. Reports
CREATE TABLE IF NOT EXISTS reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES anon_users(id) ON DELETE CASCADE,
  post_id     UUID REFERENCES posts(id) ON DELETE CASCADE,
  reason      TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth user can insert report"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can read reports"
  ON reports FOR SELECT
  USING (true);

-- 11. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES anon_users(id) ON DELETE CASCADE,
  type        VARCHAR(20) NOT NULL CHECK (type IN ('like','super_like','tip','dm','achievement')),
  actor_id    UUID REFERENCES anon_users(id) ON DELETE CASCADE,
  post_id     UUID REFERENCES posts(id) ON DELETE CASCADE,
  read        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read, created_at DESC);

-- 12. Reactions (emoji reactions)
CREATE TABLE IF NOT EXISTS reactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES anon_users(id) ON DELETE CASCADE,
  emoji       VARCHAR(10) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id, emoji)
);

ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reactions"
  ON reactions FOR SELECT
  USING (true);

CREATE POLICY "Auth user can manage own reactions"
  ON reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Auth user can delete own reactions"
  ON reactions FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_reactions_post ON reactions(post_id);

-- 13. Achievements / Badges
CREATE TABLE IF NOT EXISTS achievements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES anon_users(id) ON DELETE CASCADE,
  slug        VARCHAR(30) NOT NULL,
  title       VARCHAR(60) NOT NULL,
  description TEXT,
  icon        VARCHAR(10),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read achievements"
  ON achievements FOR SELECT
  USING (true);

CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);

-- 14. Saved Posts (bookmarks)
CREATE TABLE IF NOT EXISTS saved_posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES anon_users(id) ON DELETE CASCADE,
  post_id     UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own saved posts"
  ON saved_posts FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_saved_posts_user ON saved_posts(user_id);

-- 15. Blocked Users
CREATE TABLE IF NOT EXISTS blocked_users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES anon_users(id) ON DELETE CASCADE,
  blocked_user_id UUID REFERENCES anon_users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, blocked_user_id)
);

ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own blocked list"
  ON blocked_users FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_blocked_users_user ON blocked_users(user_id);

-- 16. Login Streaks
CREATE TABLE IF NOT EXISTS streaks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES anon_users(id) ON DELETE CASCADE UNIQUE,
  current_streak  INTEGER DEFAULT 1,
  longest_streak  INTEGER DEFAULT 1,
  last_login      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own streak"
  ON streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own streak"
  ON streaks FOR UPDATE
  USING (auth.uid() = user_id);

-- 17. Push Notification Subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES anon_users(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL UNIQUE,
  keys        JSONB NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own push subs"
  ON push_subscriptions FOR ALL
  USING (auth.uid() = user_id);

-- Enable anonymous auth
-- This is enabled by default in Supabase, but just in case:
-- Go to Authentication → Settings → allow anonymous sign-ins
