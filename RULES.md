# Incognito Party — Development Rules

> These rules must be followed by any agent or developer contributing to this project.
> They exist to maintain consistency, security, and quality.

---

## 1. Anonymity Rules (CRITICAL)

| Rule | Why |
|---|---|
| **Never store IP addresses** in any table, log, or analytics event | User anonymity is the product |
| **Never require email/phone** for any feature | Must be truly anonymous |
| **Never log raw request bodies** | Could contain post content with PII |
| **Session identity is ephemeral** — clearing browser storage = new identity | Users must accept this |
| **No cookies for tracking** — only Supabase's `sb-*` localStorage key for auth | Privacy-first |

---

## 2. TypeScript & React Conventions

### General
- **Strict mode** — `tsconfig.json` must have `"strict": true`
- **No `any`** — use `unknown` + type guards if type is uncertain
- **No `// @ts-ignore` or `// @ts-expect-error`** unless absolutely unavoidable
- **Prefer `const` over `let`** — only use `let` for loop counters

### Naming
| Thing | Convention | Example |
|---|---|---|
| Components | PascalCase | `PostCard.tsx` |
| Pages (App Router) | kebab-case | `feed/[channelSlug]/page.tsx` |
| Hooks | `use` + PascalCase | `useWallet.ts` |
| Utils | camelCase | `formatHandle.ts` |
| Types/Interfaces | PascalCase, prefixed with `I` for interfaces | `IPost`, `IUser` |
| Enums | PascalCase | `InteractionType` |
| Variables/functions | camelCase | `getHandle()` |
| Database columns | snake_case | `author_id` |
| Database tables | snake_case, plural | `anon_users`, `direct_messages` |

### React Patterns
- Components must be **Server Components by default** — only add `'use client'` when interactivity is needed
- **No prop drilling** beyond 2 levels — use context or composition
- **State colocation** — keep state as close to where it's used as possible
- **No `useEffect` for data fetching** — use Supabase's `createServerComponentClient` or React Query (SWR)
- **Form validation** — use `react-hook-form` + `zod` for any forms

### File Structure
```
/app
  /api             — Route handlers (server-side only)
  /(auth)          — Auth-required pages (layout groups)
  /(public)        — Public pages
/components
  /ui              — shadcn/ui generated components (do not edit manually)
  /layout          — Navbar, ChannelTabs, etc.
  /feed            — Feed-related components
  /dm              — DM components
  /wallet          — Wallet components
  /shared          — AvatarPlaceholder, HandleDisplay, etc.
/lib
  /supabase        — Supabase client instances (server + browser + admin)
  /utils           — Utility functions (cn(), formatHandle(), etc.)
  /constants       — Adjective/noun word lists, channel definitions
/hooks             — Custom React hooks (useWallet, useRealtimeFeed, etc.)
/types             — Shared TypeScript types
```

---

## 3. Database Rules

- **All tables must have RLS enabled** — no exceptions
- **Use `gen_random_uuid()`** for all primary keys
- **Timestamps must be `TIMESTAMPTZ`** (with timezone, defaults to `NOW()`)
- **Soft deletes preferred** — use `is_removed` / `removed_at` flags instead of `DELETE`
- **Foreign keys must have `ON DELETE CASCADE`** where child rows should vanish with parent
- **Index any column used in `WHERE`, `ORDER BY`, or `JOIN`** — especially `created_at DESC` on posts
- **No raw SQL in frontend code** — all queries via Supabase SDK or API routes

### Supabase RLS Policies
```sql
-- Example: posts table policy
CREATE POLICY "Anyone can read non-removed posts"
  ON posts FOR SELECT
  USING (is_removed = false);

CREATE POLICY "Authenticated anon can insert own posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);
```

---

## 4. Git Conventions

| Convention | Guideline |
|---|---|
| Branch naming | `feat/feature-name`, `fix/bug-name`, `chore/task-name` |
| Commits | Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:` |
| Commit scope | Optional: `feat(feed): add tip button`, `fix(dm): crash on empty` |
| PRs | Single concern per PR. Max 400 lines changed. |
| Commit frequency | Commit after each working logical unit (not once a day) |

---

## 5. Error Handling

```typescript
// ✅ DO: return structured errors from API routes
export async function POST(req: Request) {
  try {
    // ... logic
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('[POST /api/posts]', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}

// ✅ DO: use toast for user-facing errors
// ❌ DON'T: log errors to console in production builds
```

---

## 6. Performance Rules

- **Debounce search / expensive inputs** by 300ms minimum
- **Paginate all list queries** — never `select *` without limit
- **Realtime subscriptions** should use `LIMIT 25` + filters, not the entire table
- **Images** must be served via Supabase Storage transform (`?width=400&quality=80`)
- **Avoid client-side re-renders** — memoize with `useMemo`/`useCallback` where proven necessary (not preemptively)

---

## 7. Accessibility Rules

- All interactive elements need `aria-label` or visible text
- Color contrast must meet WCAG AA (4.5:1 for normal text)
- Keyboard navigation: all features must work with Tab + Enter
- Focus indicators must be visible (never `outline: none` without replacement)

---

## 8. Testing Rules (When Added)

- Unit tests: `vitest` for utilities and hooks
- Component tests: `@testing-library/react`
- E2E: `Playwright` for critical flows (auth, post creation, tipping)
- Every API route must have at least a happy-path test

---

## 9. Security Rules

- **Supabase Service Role key** must never be exposed to the client
- All third-party API calls (OpenRouter, etc.) go through **Next.js API routes** or **Supabase Edge Functions** — never from `'use client'`
- Validate all inputs with `zod` before writing to DB
- `content` fields must strip HTML tags (use `stripHtml()` utility)
- Image uploads: validate MIME type + file size (max 5 MB) + scan with virus scanner (deferred)

---

## 10. Design Tokens (Tailwind)

```css
/* Use these custom colors via tailwind.config.ts */
colors: {
  'inc-dark': '#0f0f23',       /* Background */
  'inc-card': '#1a1a3e',       /* Card surface */
  'inc-border': '#2a2a5e',     /* Borders */
  'inc-accent': '#00f0ff',     /* Neon cyan — primary accent */
  'inc-accent-hover': '#00d0e0',
  'inc-tip': '#ff00aa',        /* Magenta — tipping highlights */
  'inc-text': '#e8e8f0',       /* Primary text */
  'inc-muted': '#8888aa',      /* Secondary/muted text */
}
```

---

## 11. What NOT To Do

- ❌ Don't add email/password auth or OAuth — anonymous only
- ❌ Don't build a real payment integration — mock credits only
- ❌ Don't add moderation (post-MVP item)
- ❌ Don't add user profiles, bios, or any PII fields
- ❌ Don't use `localStorage` for anything except Supabase session persistence
- ❌ Don't install unnecessary dependencies — keep bundle lean
- ❌ Don't write code comments — let the code speak
- ❌ Don't create `.md` documentation files unless explicitly asked
- ❌ Don't add emojis unless user asks

---

## 12. Rule Enforcement

If you find yourself wanting to break a rule, **ask**:
1. "Does this compromise user anonymity?"
2. "Does this make the code harder to maintain?"
3. "Does this slow down the MVP timeline?"

If yes to any — find another approach.
