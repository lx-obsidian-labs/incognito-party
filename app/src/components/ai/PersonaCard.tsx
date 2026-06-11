'use client'

import { Card } from '@/components/shared/Card'
import type { IPersona } from '@/types'

interface Props {
  persona: IPersona
  onRefresh?: () => void
  loading?: boolean
}

const vibeEmoji: Record<string, string> = {
  reflective: '💭',
  struggling: '🫂',
  thriving: '✨',
  curious: '🔍',
  creative: '🎨',
  lonely: '💜',
  hopeful: '🌅',
  celebrating: '🎉',
  venting: '💬',
}

export function PersonaCard({ persona, onRefresh, loading }: Props) {
  return (
    <Card>
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-inc-text font-semibold flex items-center gap-2">
          {vibeEmoji[persona.vibe] || '🌟'} Your Persona
        </h3>
        {onRefresh && (
          <button onClick={onRefresh} disabled={loading} className="text-inc-muted hover:text-inc-text transition-colors text-sm">
            {loading ? 'Analysing...' : 'Refresh'}
          </button>
        )}
      </div>
      <div className="space-y-2">
        <p className="text-inc-text text-lg font-medium">{persona.persona}</p>
        <div className="flex flex-wrap gap-1.5">
          {persona.interests.map((interest) => (
            <span key={interest} className="px-2 py-0.5 bg-inc-light rounded-full text-xs text-inc-muted">
              {interest}
            </span>
          ))}
        </div>
        <p className="text-inc-muted text-sm">{persona.needs}</p>
        <div className="border-t border-inc-light pt-2 mt-2">
          <p className="text-inc-text text-sm italic">&ldquo;{persona.advice}&rdquo;</p>
        </div>
      </div>
    </Card>
  )
}
