Vercel Deployment Checklist

1) Create a GitHub repository and push your code.

2) In Vercel, create a new project and link the GitHub repo.

3) Add the following Environment Variables in Vercel (Team/Project settings):
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY (server-only)
   - NEXT_PUBLIC_MOCK_MODE (set to "false" in production)

4) Set Build Command: `pnpm build` (or `npm run build`) and Output Directory: default for Next.js

5) Configure Protected Secrets: ensure SUPABASE_SERVICE_ROLE_KEY is set as an environment variable not exposed to client builds.

6) After deployment, verify health endpoint: `https://<your-deployment>/api/health` should return { ok: true }.

7) Optional: configure Sentry or other monitoring using environment variables.
