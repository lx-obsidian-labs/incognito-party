'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@/hooks/useWallet'
import { useDailyCredits } from '@/hooks/useDailyCredits'
import { useStreak } from '@/hooks/useStreak'
import { CreditBalance } from '@/components/wallet/CreditBalance'
import { CreditPackCard } from '@/components/wallet/CreditPackCard'
import { TransactionList } from '@/components/wallet/TransactionList'
import { CreditGiftModal } from '@/components/wallet/CreditGiftModal'
import { WalletSkeleton } from '@/components/shared/Skeleton'

export default function WalletPage() {
  const { wallet, txns, loading, refetch } = useWallet()
  const { claimDaily } = useDailyCredits()
  const { streak, loading: streakLoading } = useStreak()
  const [giftOpen, setGiftOpen] = useState(false)

  useEffect(() => {
    if (!loading && wallet) {
      claimDaily().then(() => refetch())
    }
  }, [loading, wallet, claimDaily, refetch])

  if (loading) {
    return <WalletSkeleton />
  }

  return (
    <div className="px-4 py-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-inc-accent"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
          <h1 className="text-lg font-bold text-inc-text">Wallet</h1>
        </div>
        <div className="flex items-center gap-2">
          {!streakLoading && streak > 0 && (
            <span className="text-sm text-inc-muted flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
              {streak}-day streak
            </span>
          )}
          <button
            onClick={() => setGiftOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-inc-accent px-3 py-1.5 text-xs font-bold text-inc-dark hover:bg-inc-accent-hover transition-colors focus-visible:ring-2 focus-visible:ring-inc-accent focus-visible:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0-2 2c0 .7.2 1.4.6 2"/></svg>
            Gift
          </button>
        </div>
      </div>

      <CreditBalance balance={wallet?.balance ?? 0} />

      <div>
        <h2 className="text-sm font-semibold text-inc-text mb-3">Get Credits</h2>
        <CreditPackCard onPurchased={refetch} />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-inc-text mb-3">
          Transaction History
        </h2>
        <TransactionList txns={txns} />
      </div>

      <CreditGiftModal
        open={giftOpen}
        onClose={() => setGiftOpen(false)}
        onGiftComplete={refetch}
      />
    </div>
  )
}
