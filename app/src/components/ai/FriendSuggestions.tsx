'use client'

import { Card } from '@/components/shared/Card'
import type { IMatchSuggestion } from '@/types'

interface Props {
  suggestions: IMatchSuggestion[]
  onRefresh?: () => void
  loading?: boolean
  onSendMessage?: (handle: string) => void
}

export function FriendSuggestions({ suggestions, onRefresh, loading, onSendMessage }: Props) {
  if (suggestions.length === 0) return null

  return (
    <Card>
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-inc-text font-semibold">🤝 People Like You</h3>
        {onRefresh && (
          <button onClick={onRefresh} disabled={loading} className="text-inc-muted hover:text-inc-text transition-colors text-sm">
            {loading ? 'Finding...' : 'Refresh'}
          </button>
        )}
      </div>
      <div className="space-y-2">
        {suggestions.map((s) => (
          <div key={s.handle} className="flex items-center justify-between py-1.5 border-b border-inc-light last:border-0">
            <div>
              <p className="text-inc-text font-medium">@{s.handle}</p>
              <p className="text-inc-muted text-xs">{s.reason}</p>
            </div>
            {onSendMessage && (
              <button onClick={() => onSendMessage(s.handle)} className="text-xs px-2.5 py-1 rounded-full bg-inc-accent text-white hover:opacity-90 transition-opacity">
                Say hi
              </button>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}
