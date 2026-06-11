'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { isMockMode } from '@/lib/mock-data'
import { HandleDisplay } from '@/components/shared/HandleDisplay'

export default function HomePage() {
  const router = useRouter()
  const [handle, setHandle] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        if (isMockMode()) {
          setLoading(false)
          return
        }
        const retry = setInterval(async () => {
          const { data: { session: s } } = await supabase.auth.getSession()
          if (s?.user) {
            clearInterval(retry)
            await fetchUser(s.user.id)
          }
        }, 500)
        setTimeout(() => { clearInterval(retry); setLoading(false) }, 10000)
        return
      }
      await fetchUser(session.user.id)
    }

    async function fetchUser(userId: string) {
      const { data } = await supabase
        .from('anon_users')
        .select('handle')
        .eq('id', userId)
        .single()

      if (data) {
        setHandle(data.handle)
        setLoading(false)
        setTimeout(() => router.push('/feed'), 2000)
      } else {
        const retry = setInterval(async () => {
          const { data: d } = await supabase
            .from('anon_users')
            .select('handle')
            .eq('id', userId)
            .single()
          if (d) {
            clearInterval(retry)
            setHandle(d.handle)
            setLoading(false)
            setTimeout(() => router.push('/feed'), 2000)
          }
        }, 500)
        setTimeout(() => { clearInterval(retry); setLoading(false) }, 10000)
      }
    }

    checkSession()
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="text-6xl mb-6">🎭</div>
      <h1 className="text-4xl font-extrabold text-inc-text mb-3">
        Incognito Party
      </h1>
      <p className="text-inc-muted text-lg mb-8 max-w-sm">
        Speak freely. Be heard. Get tipped.
      </p>

      {handle && (
        <div className="animate-fade-in rounded-2xl border border-inc-border bg-inc-card px-6 py-4">
          <p className="text-inc-muted text-sm mb-1">You are now known as</p>
          <HandleDisplay handle={handle} size="lg" />
          <p className="text-inc-muted text-sm mt-3">Entering the party...</p>
        </div>
      )}

      {!handle && !loading && (
        <div className="animate-pulse text-inc-muted">Something hiccuped. Refresh to try again.</div>
      )}

      {!handle && loading && (
        <div className="animate-pulse text-inc-muted">Creating your identity...</div>
      )}
    </div>
  )
}
