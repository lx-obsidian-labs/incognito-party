# Incognito Party

**Anonymous social PWA | Next.js / Supabase | LX Obsidian Labs**

**Source visibility:** Public repository. **Product stage:** MVP/prototype; production security and release status not verified. The term “private MVP” in older project descriptions refers to a proposed product stage, **not** to this repository's visibility.

## Project structure

- `app/` — Next.js application and application-specific README
- `PLAN.md`, `CONTEXT.md`, `RULES.md` — project planning and operating context
- `DEPLOYMENT.md`, `README-DEPLOY.md` — deployment notes (validate before use)

## Local development

```bash
cd app
npm ci
npm run dev
```

Available manifest scripts include `npm run build`, `npm run lint` and `npm run test:e2e` (Playwright). Their existence is not proof of passing checks.

## Security and privacy gates

Anonymous social products require particular care with moderation, abuse prevention, data retention and account/session security. Verify Supabase row-level security, permissions, tipping/payment-related workflows if implemented, user reporting, rate limiting and privacy disclosures before release. Do not expose real user content or credentials in public fixtures.

## Release evidence

Record the reviewed commit, build and Playwright results, browser/device coverage, deployment smoke tests, known limitations and moderation operations. Do not claim that tipping or payment functionality is live without an end-to-end test.

**Maintainer:** [LX Obsidian Labs](https://github.com/lx-obsidian-labs)
