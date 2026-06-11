'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { IWallet, ITxn } from '@/types'

export function useWallet() {
  const [wallet, setWallet] = useState<IWallet | null>(null)
  const [txns, setTxns] = useState<ITxn[]>([])
  const [loading, setLoading] = useState(true)

  const fetchWallet = useCallback(async () => {
    const supabase = createClient()
    const { data: session } = await supabase.auth.getSession()
    if (!session.session?.user) { setLoading(false); return }

    const { data: w } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', session.session.user.id)
      .single()
    setWallet(w)

    const { data: t } = await supabase
      .from('txns')
      .select('*')
      .eq('wallet_id', w?.id ?? '')
      .order('created_at', { ascending: false })
      .limit(50)
    setTxns(t ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchWallet().then(() => {
      if (cancelled) return
    })
    return () => { cancelled = true }
  }, [fetchWallet])

  return { wallet, txns, loading, refetch: fetchWallet }
}
