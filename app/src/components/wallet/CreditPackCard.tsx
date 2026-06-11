'use client'

import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Pack {
  credits: number
  label: string
  badge?: string
  price: string
}

const packs: Pack[] = [
  { credits: 50, label: 'Small', price: '$1.99' },
  { credits: 150, label: 'Medium', badge: '⭐ Best value', price: '$4.99' },
  { credits: 500, label: 'Large', badge: '🔥 Popular', price: '$14.99' },
]

interface Props {
  onPurchased: () => void
}

export function CreditPackCard({ onPurchased }: Props) {
  async function handleBuy(credits: number) {
    const supabase = createClient()
    const { data: session } = await supabase.auth.getSession()
    if (!session.session?.user) {
      toast('Something hiccuped. Try again?')
      return
    }

    const { data: wallet } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', session.session.user.id)
      .single()

    if (!wallet) {
      toast('Something hiccuped. Try again?')
      return
    }

    const { error: updateErr } = await supabase
      .from('wallets')
      .update({ balance: wallet.balance + credits })
      .eq('id', wallet.id)

    if (updateErr) {
      toast('Something hiccuped. Try again?')
      return
    }

    await supabase.from('txns').insert({
      wallet_id: wallet.id,
      type: 'purchase',
      amount: credits,
      note: `Mock purchase — ${credits} credits`,
    })

    toast(`🎉 ${credits} credits added! (Mock purchase)`)
    onPurchased()
  }

  return (
    <div className="grid gap-3">
      {packs.map((p) => (
        <button
          key={p.credits}
          onClick={() => handleBuy(p.credits)}
          aria-label={`Buy ${p.credits} credits — ${p.price}`}
          className={cn(
            'flex items-center justify-between rounded-2xl border border-inc-border bg-inc-card p-4 transition-all hover:border-inc-accent/50 text-left focus-visible:ring-2 focus-visible:ring-inc-accent focus-visible:outline-none',
          )}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="text-inc-text font-bold">{p.label}</span>
              {p.badge && (
                <span className="rounded-full bg-inc-accent/20 px-2 py-0.5 text-xs text-inc-accent font-medium">
                  {p.badge}
                </span>
              )}
            </div>
            <span className="text-inc-muted text-sm">{p.credits} credits</span>
          </div>
          <span className="text-inc-accent font-bold">{p.price}</span>
        </button>
      ))}
      <p className="text-inc-muted text-xs text-center mt-1">
        Mock purchases — no real payment processed
      </p>
    </div>
  )
}
