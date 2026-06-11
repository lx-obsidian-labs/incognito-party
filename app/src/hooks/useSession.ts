'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { IAnonUser } from '@/types'

export function useSession() {
  const [user, setUser] = useState<IAnonUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        setLoading(false)
        return
      }
      const { data } = await supabase
        .from('anon_users')
        .select('*')
        .eq('id', session.user.id)
        .single()
      setUser(data)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session?.user) {
          setUser(null)
          setLoading(false)
          return
        }
        const { data } = await supabase
          .from('anon_users')
          .select('*')
          .eq('id', session.user.id)
          .single()
        setUser(data)
      },
    )

    return () => listener.subscription.unsubscribe()
  }, [])

  return { user, loading }
}
