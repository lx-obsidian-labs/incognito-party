-- Pay-to-Chat: Users can send tokens to start a conversation with someone
CREATE TABLE IF NOT EXISTS dm_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES anon_users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES anon_users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 500),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','expired')),
  hours INTEGER DEFAULT 24,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

ALTER TABLE dm_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own dm_intents"
  ON dm_intents FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Auth user can insert dm_intent"
  ON dm_intents FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recipient can update dm_intent"
  ON dm_intents FOR UPDATE
  USING (auth.uid() = recipient_id);

CREATE INDEX IF NOT EXISTS idx_dm_intents_recipient ON dm_intents(recipient_id, status);

-- Store blocked content patterns for anonymity guard
CREATE TABLE IF NOT EXISTS content_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern VARCHAR(100) NOT NULL UNIQUE,
  label VARCHAR(50) NOT NULL,
  action VARCHAR(20) DEFAULT 'flag' CHECK (action IN ('flag', 'block', 'warn')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed basic PII patterns
INSERT INTO content_flags (pattern, label, action) VALUES
  ('\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', 'phone_number', 'block'),
  ('\b[\w\.-]+@[\w\.-]+\.\w+\b', 'email', 'block'),
  ('\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b', 'credit_card', 'block'),
  ('\b\d{5}(-\d{4})?\b', 'zip_code', 'warn'),
  ('\b(?:https?://|www\.)\S+\b', 'url', 'warn')
ON CONFLICT (pattern) DO NOTHING;
