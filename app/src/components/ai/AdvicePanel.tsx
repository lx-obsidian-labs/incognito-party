'use client'

import { Card } from '@/components/shared/Card'

interface Props {
  advice: string
  onRefresh?: () => void
  loading?: boolean
}

export function AdvicePanel({ advice, onRefresh, loading }: Props) {
  return (
    <Card>
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-inc-text font-semibold">💡 Advice for You</h3>
        {onRefresh && (
          <button onClick={onRefresh} disabled={loading} className="text-inc-muted hover:text-inc-text transition-colors text-sm">
            {loading ? 'Thinking...' : 'New advice'}
          </button>
        )}
      </div>
      <p className="text-inc-text leading-relaxed">{advice}</p>
    </Card>
  )
}
