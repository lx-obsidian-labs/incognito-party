'use client'

import { createBrowserClient } from '@supabase/ssr'
import { createMockClient, ensureSeedData, isMockMode } from '@/lib/mock-data'

export function createClient() {
  if (isMockMode()) {
    ensureSeedData()
    return createMockClient()
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) {
    // Dev-time warning to catch missing envs when not in mock mode
    // Keep behavior defensive: still attempt to call createBrowserClient with possibly undefined values
    // so runtime errors surface clearly during development.
    // eslint-disable-next-line no-console
    console.warn('[supabase] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY missing. Running without Supabase will fail. Consider enabling mock mode for local dev.')
  }

  return createBrowserClient(url!, anon!)
}
