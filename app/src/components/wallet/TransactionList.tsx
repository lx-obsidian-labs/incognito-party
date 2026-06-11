'use client'

import { ArrowUpRight, ArrowDownLeft, ShoppingCart, Gift } from 'lucide-react'
import type { ITxn } from '@/types'
import { formatRelativeTime } from '@/lib/utils'

const iconMap: Record<string, React.ElementType> = {
  earn: Gift,
  purchase: ShoppingCart,
  tip_sent: ArrowUpRight,
  tip_received: ArrowDownLeft,
}

const colorMap: Record<string, string> = {
  earn: 'text-green-400',
  purchase: 'text-inc-accent',
  tip_sent: 'text-inc-tip',
  tip_received: 'text-green-400',
}

const labelMap: Record<string, string> = {
  earn: 'Earned',
  purchase: 'Purchased',
  tip_sent: 'Sent tip',
  tip_received: 'Received tip',
}

interface Props {
  txns: ITxn[]
}

export function TransactionList({ txns }: Props) {
  if (txns.length === 0) {
    return (
      <p className="text-inc-muted text-sm text-center py-8">
        No transactions yet.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {txns.map((txn) => {
        const Icon = iconMap[txn.type] ?? Gift
        const colorClass = colorMap[txn.type] ?? 'text-inc-text'
        const label = labelMap[txn.type] ?? txn.type

        return (
          <div
            key={txn.id}
            className="flex items-center gap-3 rounded-xl border border-inc-border bg-inc-card p-3"
          >
            <div className={`${colorClass}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-inc-text text-sm font-medium">{label}</span>
              {txn.note && (
                <p className="text-inc-muted text-xs truncate">{txn.note}</p>
              )}
            </div>
            <div className="text-right">
              <span className={`text-sm font-bold ${colorClass}`}>
                {txn.type === 'tip_sent' ? '-' : '+'}{txn.amount}
              </span>
              <p className="text-inc-muted text-xs">
                {formatRelativeTime(txn.created_at)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
