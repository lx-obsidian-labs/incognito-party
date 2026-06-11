'use client'

import { Card } from '@/components/shared/Card'

interface Props {
  message: string
  onRefresh?: () => void
  loading?: boolean
}

export function DailySummary({ message, onRefresh, loading }: Props) {
  return (
    <Card>
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-inc-text font-semibold">📋 Your Day in Words</h3>
        {onRefresh && (
          <button onClick={onRefresh} disabled={loading} className="text-inc-muted hover:text-inc-text transition-colors text-sm">
            {loading ? 'Writing...' : 'Refresh'}
          </button>
        )}
      </div>
      <p className="text-inc-text leading-relaxed">{message}</p>
    </Card>
  )
}
