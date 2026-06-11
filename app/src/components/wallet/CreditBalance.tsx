'use client'

import { Coins } from 'lucide-react'

interface Props {
  balance: number
}

export function CreditBalance({ balance }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-inc-border bg-inc-card p-8">
      <Coins className="h-12 w-12 text-yellow-400 mb-3" />
      <span className="text-4xl font-bold text-inc-text">{balance}</span>
      <span className="text-inc-muted text-sm mt-1">credits</span>
    </div>
  )
}
