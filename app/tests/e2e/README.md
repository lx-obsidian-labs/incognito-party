Playwright E2E tests

Run locally:

- Start the dev server in one terminal: `npm run dev` (from app/)
- In another terminal run: `npx playwright test`

Notes:
- Tests expect the app to be available at http://localhost:3000 by default. You can override with PW_BASE_URL env var, e.g. `PW_BASE_URL=http://localhost:3000 npx playwright test`.
- For reliable local runs of the mock backend, start Next with NEXT_PUBLIC_MOCK_MODE=true so the client uses the in-browser mock DB: `NEXT_PUBLIC_MOCK_MODE=true npm run dev`.
- No secrets are required.
