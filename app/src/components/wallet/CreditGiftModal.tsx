'use client'

import { useState } from 'react'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onClose: () => void
  onGiftComplete: () => void
}

export function CreditGiftModal({ open, onClose, onGiftComplete }: Props) {
  const [handle, setHandle] = useState('')
  const [amount, setAmount] = useState(10)
  const [sending, setSending] = useState(false)

  async function handleGift() {
    if (!handle.trim() || amount <= 0) return
    setSending(true)
    const supabase = createClient()

    const { data: recipientData } = await supabase
      .from('anon_users')
      .select('id')
      .eq('handle', handle.trim())
      .single()

    if (!recipientData) {
      toast('User not found')
      setSending(false)
      return
    }

    const recipientId = recipientData.id as string

    const { data: session } = await supabase.auth.getSession()
    if (!session.session?.user) {
      toast('Something hiccuped. Try again?')
      setSending(false)
      return
    }

    const { data: walletData } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', session.session.user.id)
      .single()

    if (!walletData || (walletData.balance as number) < amount) {
      toast('Not enough credits!')
      setSending(false)
      return
    }

    await supabase
      .from('wallets')
      .update({ balance: (walletData.balance as number) - amount })
      .eq('user_id', session.session.user.id)

    const { data: recipientWallet } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', recipientId)
      .single()

    if (recipientWallet) {
      await supabase
        .from('wallets')
        .update({ balance: (recipientWallet.balance as number) + amount })
        .eq('user_id', recipientId)
    }

    await supabase.from('txns').insert({
      wallet_id: walletData.id,
      type: 'tip_sent',
      amount: -amount,
      note: `Gift to ${handle.trim()}`,
    })

    if (recipientWallet) {
      await supabase.from('txns').insert({
        wallet_id: recipientWallet.id,
        type: 'tip_received',
        amount,
        note: `Gift from ${handle.trim()}`,
      })
    }

    setSending(false)
    onClose()
    setHandle('')
    setAmount(10)
    toast(`Sent ${amount} credits to ${handle.trim()}!`)
    onGiftComplete()
  }

  const presetAmounts = [10, 25, 50, 100]

  return (
    <ConfirmModal open={open} onClose={onClose} title="Gift Credits">
      <p className="text-inc-muted text-sm mb-4">Send credits to another user.</p>
      <input
        type="text"
        value={handle}
        onChange={(e) => setHandle(e.target.value)}
        placeholder="Enter handle (e.g. MistyWolf)"
        className="w-full rounded-xl border border-inc-border bg-inc-card px-4 py-2.5 text-sm text-inc-text placeholder-inc-muted mb-3 focus:border-inc-accent focus:outline-none"
        aria-label="Recipient handle"
      />
      <div className="flex gap-2 mb-3">
        {presetAmounts.map((a) => (
          <button
            key={a}
            onClick={() => setAmount(a)}
            className={`rounded-lg border px-3 py-1.5 text-sm transition-all ${
              amount === a
                ? 'border-inc-accent bg-inc-accent/10 text-inc-accent'
                : 'border-inc-border text-inc-muted hover:border-inc-accent/50'
            }`}
            aria-label={`${a} credits`}
          >
            {a}
          </button>
        ))}
      </div>
      <button
        onClick={handleGift}
        disabled={sending || !handle.trim() || amount <= 0}
        className="w-full rounded-xl bg-inc-accent py-2.5 text-sm font-bold text-inc-dark hover:bg-inc-accent-hover transition-colors disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-inc-accent focus-visible:outline-none"
      >
        {sending ? 'Sending...' : `Send ${amount} credits`}
      </button>
    </ConfirmModal>
  )
}
