# Incognito Party — Definition of Success

> This document defines what "done" means for each phase and for the overall MVP.
> A feature is only "done" when it meets ALL criteria listed.

---

## Overall MVP Success Criteria

The MVP is **ready to ship** when all of these are true:

- [ ] User can land on the app, get a handle, and start browsing within **5 seconds** (no signup)
- [ ] User can create a text post (with optional image) in any of the 6 channels
- [ ] User can see a real-time feed of posts in their selected channel
- [ ] User can like, super-like, and tip posts using their credit balance
- [ ] User receives 20 free credits daily (regenerates)
- [ ] User can buy mock credit packs (placeholder — no real payment)
- [ ] User can see their wallet balance and transaction history
- [ ] User can opt-in to DMs with specific users and send/receive messages in real-time
- [ ] User can report a post
- [ ] App is installable as a PWA (manifest + service worker)
- [ ] App works fully on mobile (responsive, touch-friendly)
- [ ] All error states show friendly, non-technical messages
- [ ] App loads in < 2s on a 4G connection (Lighthouse performance score > 80)

---

## Phase Success Gates

### Sprint 1–2: Foundation
**Done when:**
- [ ] `npm run dev` boots with no errors
- [ ] Supabase project is live with all tables created and RLS enabled
- [ ] Anonymous auth flow works end-to-end (fresh visitor → handle assigned → DB row created → wallet created → redirect to feed)
- [ ] Handle generation produces unique, readable AdjectiveNoun handles (no collisions in testing with 1000 concurrent requests)
- [ ] PWA manifest loads; Chrome shows "Install" prompt
- [ ] Dark theme shell renders with bottom nav (channels, DM, wallet tabs)
- [ ] 6 channels are seeded in the database

### Sprint 3–4: Feed Core
**Done when:**
- [ ] Channel tabs render, switching channels updates the feed instantly
- [ ] User can type up to 500 characters and submit a post
- [ ] Post appears in the feed in real-time (Supabase Realtime subscription)
- [ ] Image upload works (max 5 MB, show preview before submit)
- [ ] Like button toggles correctly (highlighted when liked, dimmed when unliked)
- [ ] Super-like button triggers a visual animation and records interaction
- [ ] Report flow: tap flag → select reason → success toast → report saved to DB
- [ ] Feed paginates — shows 25 posts, then "Load more" button
- [ ] Optimistic UI: post appears instantly, syncs in background
- [ ] Empty channel shows friendly message: "Nothing here yet. Be the first?"

### Sprint 5–6: Tipping & DMs
**Done when:**
- [ ] Wallet balance visible in bottom nav badge
- [ ] User starts with 0 credits; first interaction of the day grants 20 welcome credits
- [ ] Mock credit packs render with prices; tapping "Buy" immediately credits the wallet with a toast
- [ ] Tip button on posts opens a modal with amount picker (1, 5, 10, 25, 50, 100)
- [ ] Tipping deducts from sender's wallet and adds to... (nowhere for MVP — just deducts)
- [ ] Super-like costs 2 credits; insufficient balance shows "Need more credits" toast with link to wallet
- [ ] Transaction history shows all +/– with type icons
- [ ] DM settings: toggle "Allow DMs from: Nobody / People I tipped / Anyone"
- [ ] DM thread list shows conversations with latest message preview + unread count
- [ ] DM conversation opens in real-time; messages appear without refresh
- [ ] "You" vs "them" styling on message bubbles

### Sprint 7–8: Polish & Launch
**Done when:**
- [ ] Lighthouse scores: Performance ≥ 80, Accessibility ≥ 90, Best Practices ≥ 90, SEO ≥ 90
- [ ] Manual walkthrough of ALL features on iPhone 12 (Safari) and Pixel 7 (Chrome) shows no layout issues
- [ ] All loading states display skeleton loaders
- [ ] All empty states display helpful illustrations/messages
- [ ] All error states display friendly messages + retry button where applicable
- [ ] Push notification prompt appears on first visit (or deferred)
- [ ] Terms of Service and Privacy Policy pages exist at `/legal/tos` and `/legal/privacy`
- [ ] Custom domain DNS is configured and SSL works
- [ ] Vercel deployment is linked to the repo and auto-deploys on `main`

---

## Quality Gates (per PR / commit)

Before every commit or PR, verify:

| Check | Command / Method |
|---|---|
| TypeScript compiles | `npx tsc --noEmit` — zero errors |
| Lint passes | `npx next lint` — zero errors, zero warnings |
| Build succeeds | `npm run build` — zero errors |
| No `console.log` left | Search project for `console.log` — none in committed code |
| No `any` types | Search project for `: any` — none |
| No hardcoded secrets | Check for API keys, `sb-*` tokens in code |
| RLS enabled | Every new table must have RLS policies |
| Mobile tested | Resize browser to 375px width — no overflow, all tappable |

---

## Performance Budget

| Asset | Budget |
|---|---|
| Initial JS bundle | < 150 KB gzipped |
| Largest Contentful Paint (LCP) | < 2.5s |
| First Input Delay (FID) | < 100ms |
| Cumulative Layout Shift (CLS) | < 0.1 |
| Time to Interactive (TTI) | < 3.5s on 4G |
| Service worker cache hit rate | > 60% |

---

## Launch Checklist

- [ ] All MVP success criteria met
- [ ] All quality gates pass
- [ ] No known crashes or blocking bugs
- [ ] Analytics is capturing: page views, post creation, likes, tips, DMs sent, reports
- [ ] Error monitoring set up (Sentry or Vercel Analytics)
- [ ] At least 10 test posts exist across channels (to avoid empty state on launch)
- [ ] Team member has tested the full flow on a real phone
- [ ] Custom domain resolves with HTTPS
- [ ] `robots.txt` and `sitemap.xml` are live

---

## Post-MVP Success Signals (not required to ship, but tracked)

Within 2 weeks of launch, look for:
- [ ] At least 100 DAU
- [ ] Tipping rate ≥ 15%
- [ ] Average session duration > 4 minutes
- [ ] Report rate < 5%
- [ ] Churn rate < 60% D1 → D7

If these hold for 2 weeks → proceed with real payment integration and moderation.
If they don't → analyze analytics and iterate on the core loop before adding features.
