# Incognito Party — Project Context

---

## Why This Project Exists

Anonymous social platforms have a proven market (Yik Yak peaked at $400M valuation, Whisper had 30M+ MAU, Fizz is on 240+ campuses). The gap: most anonymous platforms lack a **positive reinforcement economy**. Incognito Party adds tipping/super-likes to incentivize quality, helpful, and authentic content — not just gossip and trolling.

The core insight: people want to share honestly without identity baggage, and they want to be appreciated for it. Tipping bridges anonymity with meaningful recognition.

---

## Decision Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-06-10 | **PWA first** (no native mobile) | Faster iteration, lower cost, installable via browser. Native comes after product-market fit. |
| 2026-06-10 | **Supabase anonymous auth** | No emails or signup — true anonymity. Supabase handles session management out of the box. |
| 2026-06-10 | **Two-word handles** (AdjectiveNoun) | More fun and memorable than UUIDs, more brandable than numbers, less creepy than real names. |
| 2026-06-10 | **Topic channels** (not global feed) | Reduces noise, gives users clear reason to browse, increases time-on-site. |
| 2026-06-10 | **Mock payments / placeholder credits** | Validate tipping behavior before building real payment infra. Stripe onboarding + compliance can wait. |
| 2026-06-10 | **AI moderation deferred** | MVP needs to ship. Reports table is ready; moderation via OpenRouter $10 tier is post-MVP. |
| 2026-06-10 | **Free credits daily (20/day)** | Gives every user the ability to tip without paying — seeds the economy and proves the loop. |
| 2026-06-10 | **Dark theme only** | Anonymous apps perform better with dark mode. Less strain, feels more private. |

---

## What Was Discussed & Rejected (for now)

| Idea | Why Rejected |
|---|---|
| Real-name verified badges | Contradicts full anonymity — would fragment the user base |
| Email/password recovery | No accounts = no password to recover. Users accept ephemerality. |
| Location-based feeds (Yik Yak model) | Adds complexity, privacy risk, and moderation surface area |
| Image recognition moderation | Overkill for MVP; text-only moderation via OpenRouter is sufficient |
| Live streaming / voice notes | Feature creep. Text + images only for MVP. |
| In-app purchases / Stripe | Deferred until tipping behavior is validated with mock credits |

---

## Competitor Landscape

| Platform | Key Trait | Their Weakness | Our Advantage |
|---|---|---|---|
| **Yik Yak** | Location-based, college focus | Toxicity, moderation failures, requires phone number | Full anonymity, no PII, positivity economy |
| **Whisper** | Image + text confessions | Dead platform, dated UX | Modern PWA, real-time, tipping |
| **Fizz** | College-specific, upvote/downvote | Requires .edu email, exclusive | Open to everyone, inclusive |
| **NGL** | Q&A link sharing | One-directional, limited interaction | Full bidirectional feed + DMs |
| **Reddit** | Pseudonymous communities | Account-based, karma gaming | No accounts, ephemeral handles |

---

## Target User

**Primary**: Gen Z / young Millennials (18–30) who:
- Want to share thoughts without judgment
- Are tired of curated Instagram/TikTok personas
- Enjoy giving/receiving encouragement from strangers
- Are comfortable with digital tipping (creator economy native)

**Secondary**: Anyone seeking anonymous advice or venting space.

---

## Technical Debt / Known Future Work

| Item | Priority | When |
|---|---|---|
| Real payment integration (Stripe/LemonSqueezy) | High | Post-MVP, after tipping validation |
| OpenRouter moderation | High | Post-MVP |
| Image moderation | Medium | Post-MVP |
| Admin panel (full-featured) | Medium | Post-MVP |
| Device fingerprinting for ban enforcement | Medium | Post-MVP |
| Native mobile apps (React Native) | Low | After PMF |
| Email-based handle recovery | Low | TBD — may be against product ethos |

---

## Key Numbers to Track

| Metric | Target (MVP) |
|---|---|
| DAU/MAU ratio | > 30% |
| Posts per DAU | > 3 |
| Tipping rate (% of users who tip) | > 15% |
| DM adoption (% of users who DM) | > 10% |
| Credit spend rate (% of daily allowance used) | > 40% |
| Report rate (% of posts reported) | < 5% |

---

## Brand & Tone

- **Voice**: Empathetic, encouraging, playful
- **Tagline (draft)**: "Speak freely. Be heard. Get tipped."
- **No gendered language** in UI copy — use "they/them" or avoid pronouns
- **Error messages** should be kind, never technical:  
  ❌ "500 Internal Server Error"  
  ✅ "Something hiccuped. Try again?"

---

## File Reference

| File | Purpose |
|---|---|
| `PLAN.md` | Master plan, architecture, schema, roadmap |
| `RULES.md` | Coding conventions, security, style guide |
| `CONTEXT.md` | (this file) — project history, decisions, context |
| `SUCCESS.md` | Definition of done, acceptance criteria, milestones |
