'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isMockMode, ensureSeedData } from '@/lib/mock-data'

export default function InitSession() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
    }

    if (isMockMode()) {
      ensureSeedData()
      return
    }

    const supabase = createClient()

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: existing } = await supabase
          .from('anon_users')
          .select('handle')
          .eq('id', session.user.id)
          .single()

        if (!existing) {
          await fetch('/api/auth/anon', { method: 'POST' })
        }
      } else {
        const { data: anonData } = await supabase.auth.signInAnonymously()
        if (anonData?.user) {
          await fetch('/api/auth/anon', { method: 'POST' })
        }
      }
    })
  }, [])

  return null
}
