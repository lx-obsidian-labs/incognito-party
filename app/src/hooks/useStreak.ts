'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useStreak() {
  const [streak, setStreak] = useState(0)
  const [longestStreak, setLongestStreak] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (data) {
        const s = data as Record<string, unknown>
        const lastLogin = new Date(s.last_login as string)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        let currentStreak = s.current_streak as number
        const longest = s.longest_streak as number

        if (lastLogin < yesterday) {
          currentStreak = 0
        }

        if (lastLogin < today) {
          currentStreak++
          await supabase.from('streaks').update({
            current_streak: currentStreak,
            longest_streak: Math.max(currentStreak, longest),
            last_login: new Date().toISOString(),
          }).eq('user_id', session.user.id)

          if (currentStreak >= 3) {
            const bonus = currentStreak >= 7 ? 30 : currentStreak >= 5 ? 20 : 10
            const { data: wallet } = await supabase
              .from('wallets')
              .select('id, balance')
              .eq('user_id', session.user.id)
              .single()

            if (wallet) {
              await supabase.from('wallets').update({
                balance: (wallet.balance as number) + bonus,
              }).eq('user_id', session.user.id)

              await supabase.from('txns').insert({
                wallet_id: wallet.id,
                type: 'earn',
                amount: bonus,
                note: `${currentStreak}-day streak bonus!`,
              })
            }
          }
        }

        setStreak(currentStreak)
        setLongestStreak(Math.max(currentStreak, longest))
      } else {
        await supabase.from('streaks').insert({
          user_id: session.user.id,
          current_streak: 1,
          longest_streak: 1,
          last_login: new Date().toISOString(),
        })
        setStreak(1)
        setLongestStreak(1)
      }
      setLoading(false)
    })
  }, [])

  return { streak, longestStreak, loading }
}
