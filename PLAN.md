# Incognito Party — Master Plan

## Project Elevator Pitch
A fully anonymous social platform where users get a **random two-word handle**, post to **topic-based channels** (Advice, Confessions, Wins, Rants, Daily), and can **tip/super-like** posts using credits. No accounts, no emails, no personal data.

---

## 1. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| **Framework** | Next.js 14+ (App Router) + TypeScript | SSR, PWA, best solo-dev DX |
| **UI Library** | Tailwind CSS + shadcn/ui | Rapid prototyping, accessible |
| **Database** | Supabase (PostgreSQL) | Built-in auth (anon), realtime, RLS, storage |
| **Auth** | Supabase Anonymous Auth | No email/phone — true anonymity |
| **ORM / Client** | Supabase JS Client + `supabase gen types` | Type-safe DB access |
| **Payments** | Placeholder (mock credits) | Real payments deferred to post-MVP |
| **Moderation** | OpenRouter free tier (buy $10 credits for 1000 req/day) | Deferred but planned |
| **Analytics** | TBD (clarify with product owner) | — |
| **Hosting** | Vercel (frontend) + Supabase (backend) | Free tier covers MVP |
| **Domain** | `incognitoparty.com` (suggested) | ~$10/yr |

---

## 2. System Architecture

```
                         ┌─────────────────┐
                         │   PWA (Next.js) │
                         │  - Feed (chan.) │
                         │  - Post Composer│
                         │  - DM Inbox     │
                         │  - Wallet       │
                         └────────┬────────┘
                                  │ HTTPS + WebSocket
        ┌─────────────────────────┼──────────────────────────┐
        │                         │                          │
   ┌────▼────┐            ┌──────▼──────┐           ┌───────▼───────┐
   │ Supabase│◄───────────│ Supabase    │──────────►│  Supabase     │
   │  Auth   │            │ PostgreSQL  │           │  Realtime     │
   │ (anon)  │            │ + RLS       │           │  (DMs, feed)  │
   └─────────┘            └──────┬──────┘           └───────────────┘
                                 │
                          ┌──────▼──────┐
                          │ Supabase    │
                          │ Storage     │
                          │ (images)    │
                          └─────────────┘
```

### Key Principles

| Principle | Implementation |
|---|---|
| **Zero PII** | No emails, no IPs stored, no cookies except session |
| **RLS everywhere** | Every DB query goes through Row Level Security |
| **Optimistic UI** | Posts appear instantly, sync in background |
| **Offline-first** | PWA caches feeds; graceful degradation |
| **Cost-aware** | Free tiers until traction justifies spend |

---

## 3. Database Schema

```sql
-- Seeds: channels
-- INSERT INTO channels (slug, name, description, icon)
-- VALUES
--   ('advice', 'Advice', 'Seek and give advice', '💡'),
--   ('confessions', 'Confessions', 'Get it off your chest', '🤫'),
--   ('wins', 'Wins', 'Share your victories', '🏆'),
--   ('rants', 'Rants', 'Vent about anything', '😤'),
--   ('daily', 'Daily', 'Your day, your way', '📆'),
--   ('offtopic', 'Off Topic', 'Everything else', '🌀');

CREATE TABLE channels (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        VARCHAR(30) UNIQUE NOT NULL,
  name        VARCHAR(60) NOT NULL,
  description TEXT,
  icon        VARCHAR(10)
);

CREATE TABLE anon_users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handle      VARCHAR(30) UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  last_seen   TIMESTAMPTZ DEFAULT NOW(),
  is_banned   BOOLEAN DEFAULT FALSE
);

-- Users subscribe to channels
CREATE TABLE channel_subs (
  user_id    UUID REFERENCES anon_users(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, channel_id)
);

CREATE TABLE posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id  UUID REFERENCES channels(id) ON DELETE CASCADE,
  author_id   UUID REFERENCES anon_users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  media_url   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  is_flagged  BOOLEAN DEFAULT FALSE,
  is_removed  BOOLEAN DEFAULT FALSE,
  removed_at  TIMESTAMPTZ
);

CREATE TABLE interactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES anon_users(id) ON DELETE CASCADE,
  type        VARCHAR(20) NOT NULL CHECK (type IN ('like','super_like','tip')),
  amount      INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id, type)
);

CREATE TABLE direct_messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id     UUID REFERENCES anon_users(id) ON DELETE CASCADE,
  recipient_id  UUID REFERENCES anon_users(id) ON DELETE CASCADE,
  content       TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  is_read       BOOLEAN DEFAULT FALSE
);

CREATE TABLE dm_relationships (
  user_id         UUID REFERENCES anon_users(id) ON DELETE CASCADE,
  allowed_user_id UUID REFERENCES anon_users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, allowed_user_id)
);

CREATE TABLE wallets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES anon_users(id) ON DELETE CASCADE UNIQUE,
  balance     INTEGER DEFAULT 0 NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Type of change: 'earn', 'purchase', 'tip_sent', 'tip_received'
CREATE TABLE txns (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id   UUID REFERENCES wallets(id) ON DELETE CASCADE,
  type        VARCHAR(20) NOT NULL,
  amount      INTEGER NOT NULL,
  ref_id      UUID,               -- optional: interaction_id for tip
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Reports (built now, moderation wired later)
CREATE TABLE reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES anon_users(id) ON DELETE CASCADE,
  post_id     UUID REFERENCES posts(id) ON DELETE CASCADE,
  reason      TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_posts_channel_created ON posts(channel_id, created_at DESC);
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_interactions_post ON interactions(post_id);
CREATE INDEX idx_dms_recipient ON direct_messages(recipient_id, is_read);
```

---

## 4. API Routes (Next.js App Router)

```
POST   /api/auth/anon        — Create anonymous session + handle
GET    /api/auth/me           — Get current session info

GET    /api/channels          — List all channels
POST   /api/channels/sub      — Subscribe to channel

GET    /api/posts?channel=X   — Get posts (paginated, realtime sub)
POST   /api/posts             — Create post
POST   /api/posts/report      — Report a post

POST   /api/interactions/like       — Like a post
POST   /api/interactions/superlike  — Super-like (costs credits)
POST   /api/interactions/tip        — Tip post (costs credits)

GET    /api/wallet            — Get wallet balance + txns

GET    /api/dm/relationships  — Who can DM you
POST   /api/dm/relationships  — Allow/block a user
GET    /api/dm/conversations  — List DM conversations
POST   /api/dm/send           — Send DM
POST   /api/dm/read           — Mark DM as read
```

---

## 5. Frontend Page / Component Tree

```
/app
  /page.tsx                     — Landing / channel picker
  /feed/page.tsx                — Channel feed (default)
  /feed/[channelSlug]/page.tsx  — Single channel feed
  /post/[id]/page.tsx           — Post detail view
  /dm/page.tsx                  — DM inbox
  /dm/[handle]/page.tsx         — DM conversation
  /wallet/page.tsx              — Wallet + mock purchase
  /settings/page.tsx            — Preferences

/components
  /layout
    Navbar.tsx                  — Bottom nav (mobile) / sidebar (desktop)
    ChannelTabs.tsx             — Horizontal channel switcher
  /feed
    PostCard.tsx                — Single post in feed
    PostComposer.tsx            — Create post (textarea + image)
    InteractionBar.tsx          — Like / Super-like / Tip buttons
    TipModal.tsx                — Select tip amount
  /dm
    ConversationList.tsx        — Left panel: DM threads
    MessageThread.tsx           — Message bubble list
    MessageComposer.tsx         — Send message input
  /wallet
    CreditBalance.tsx           — Current balance display
    CreditPackCard.tsx          — Buy credits pack
    TransactionList.tsx         — History
  /shared
    AvatarPlaceholder.tsx       — Generated avatar from handle
    HandleDisplay.tsx           — Styled handle with color
    ConfirmModal.tsx
    Toast.tsx
```

---

## 6. Phase Roadmap (8 Weeks)

### Sprint 1–2: Foundation
- [ ] Next.js + Supabase + Tailwind + shadcn/ui scaffold
- [ ] Supabase anonymous auth — no signup form
- [ ] Handle generation (`AdjectiveNoun` — unique, collision-checked)
- [ ] PWA manifest + service worker
- [ ] Seed `channels` table (6 channels)
- [ ] Dark theme shell + bottom nav

### Sprint 3–4: Feed Core
- [ ] Channel tabs/switcher
- [ ] Post composer (500 char, optional image)
- [ ] Channel feed with realtime subscription
- [ ] Like / Super-like buttons (UI only, no credit cost yet)
- [ ] Post reporting

### Sprint 5–6: Tipping & DMs
- [ ] Wallet table + credit balance display
- [ ] Mock credit packs (buy with fake "pay" button — no real payment)
- [ ] Free daily credits (20 credits/day refresh)
- [ ] Tip button on posts — deduct credits, show badge
- [ ] Transaction history
- [ ] DM consent toggle
- [ ] DM messaging interface (realtime)

### Sprint 7–8: Polish & Launch
- [ ] All loading, empty, error states
- [ ] Push notifications (Web Push API)
- [ ] Analytics integration
- [ ] Responsive audit (mobile-first at every breakpoint)
- [ ] Terms of Service + Privacy Policy
- [ ] Admin page (simple: handle lookup, flag review)
- [ ] Vercel deployment + custom domain

---

## 7. Credit System (Placeholder)

| Feature | Cost |
|---|---|
| New user daily allowance | 20 credits (regenerates daily) |
| Like | Free |
| Super-like | 2 credits |
| Tip | 1–100 credits (sender chooses) |
| Mock credit pack: Small | 50 credits |
| Mock credit pack: Medium | 150 credits |
| Mock credit pack: Large | 500 credits |

At MVP: all credit purchases are placeholders. No real money changes hands. The flow is: tap "Buy" → credits are added with a simulated "purchase successful" toast.

---

## 8. Moderation (Deferred)

Moderation is **entirely skipped in MVP**. The schema has `reports` and `is_flagged` columns ready, but no automated enforcement yet.

**Future plan (post-MVP):**
- Purchase $10 OpenRouter credits → unlocks 1000 free-tier requests/day
- Build a Supabase Edge Function or cron job:
  - Query unreviewed reports periodically
  - Send post content through OpenRouter with a moderation prompt
  - Auto-flag/remove if violating
- Threshold: 3 violations in 24h → temp ban, 10 → permanent handle suspension

---

## 9. Handle Generation Strategy

```typescript
// Adjectives pool (~200 words)
const adjectives = [
  'Misty', 'Silent', 'Neon', 'Crimson', 'Frozen', 'Velvet', 'Electric',
  'Cosmic', 'Shadow', 'Solar', 'Lunar', 'Crystal', 'Ember', 'Phantom',
  'Savage', 'Wild', 'Bold', 'Quiet', 'Swift', 'Brave', 'Calm', 'Deep',
  // ... 180 more
];

// Nouns pool (~200 words)
const nouns = [
  'Wolf', 'Phoenix', 'Storm', 'Vortex', 'Tiger', 'Falcon', 'Dragon',
  'Hawk', 'Lynx', 'Raven', 'Fox', 'Bear', 'Lion', 'Eagle', 'Otter',
  'Whale', 'Crow', 'Owl', 'Puma', 'Viper', 'Elk', 'Ram',
  // ... 180 more
];

// Generates e.g. "MistyWolf", "NeonPhoenix", "CrimsonVortex"
// Total combinations: ~200 * 200 = 40,000 handles
// On collision, iterate by appending a digit suffix
```

---

## 10. Auth Flow

```
1. User lands on app
2. Check localStorage for existing session_id
   ├── Found → validate with Supabase, load handle + wallet
   └── Not found → create Supabase anonymous session
                   → generate unique handle → INSERT anon_users
                   → create wallet with 0 balance
                   → redirect to feed
3. No login/signup screen ever
```

---

## 11. Cost Estimate (MVP Monthly)

| Service | Cost | Notes |
|---|---|---|
| Vercel Hobby | $0 | 100 GB bandwidth, 6000 build mins |
| Supabase Free | $0 | 500 MB DB, 2 GB storage, 50k MAU |
| Domain | ~$0.83/mo ($10/yr) | — |
| OpenRouter | $0 (deferred) | $10 one-time when moderation is built |
| **Total** | **~$0.83/mo** | — |
