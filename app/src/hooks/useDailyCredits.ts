'use client'

import { useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function useDailyCredits() {
  const claimDaily = useCallback(async () => {
    const supabase = createClient()
    const { data: session } = await supabase.auth.getSession()
    if (!session.session?.user) return

    const { data: wallet } = await supabase
      .from('wallets')
      .select('id, balance, last_daily_credits')
      .eq('user_id', session.session.user.id)
      .single()

    if (!wallet) return

    const lastClaim = wallet.last_daily_credits as string | undefined
    const today = new Date().toDateString()

    if (lastClaim && new Date(lastClaim).toDateString() === today) return

    await supabase
      .from('wallets')
      .update({
        balance: (wallet.balance as number) + 20,
        last_daily_credits: new Date().toISOString(),
      })
      .eq('id', wallet.id)

    await supabase.from('txns').insert({
      wallet_id: wallet.id,
      type: 'earn',
      amount: 20,
      note: 'Daily free credits',
    })

    toast('20 daily credits added!')
  }, [])

  return { claimDaily }
}
