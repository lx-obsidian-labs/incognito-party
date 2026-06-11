'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSession } from './useSession'
import type { IAchievement } from '@/types'

const ALL_ACHIEVEMENTS: { slug: string; title: string; description: string; icon: string }[] = [
  { slug: 'first_post', title: 'First Post', description: 'Posted for the first time', icon: '📝' },
  { slug: 'first_tip', title: 'First Tipper', description: 'Sent your first tip', icon: '💰' },
  { slug: 'ten_likes', title: 'Getting Popular', description: 'Received 10 likes', icon: '⭐' },
  { slug: 'chatty', title: 'Chatty', description: 'Sent 5 DMs', icon: '💬' },
  { slug: 'super_liker', title: 'Super Liker', description: 'Super-liked 3 posts', icon: '⚡' },
  { slug: 'helper', title: 'Helpful', description: 'Got tipped 5 times', icon: '🏆' },
]

export function useAchievements() {
  const { user, loading: sessionLoading } = useSession()
  const [achievements, setAchievements] = useState<IAchievement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (sessionLoading) return
    if (!user) {
      setLoading(false)
      return
    }

    const supabase = createClient()
    ;(async () => {
      const res = await (supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id) as unknown as Promise<{ data: unknown[]; error: null }>)
      setAchievements((res.data ?? []) as IAchievement[])
      setLoading(false)
    })()
  }, [user, sessionLoading])

  const unlockedSlugs = new Set(achievements.map((a) => a.slug))

  const all = ALL_ACHIEVEMENTS.map((def) => ({
    ...def,
    unlocked: unlockedSlugs.has(def.slug),
    unlocked_at: achievements.find((a) => a.slug === def.slug)?.unlocked_at ?? null,
  }))

  return { achievements: all, raw: achievements, loading }
}
