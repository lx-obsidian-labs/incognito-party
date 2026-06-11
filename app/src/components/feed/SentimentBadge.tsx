'use client'

import { useState } from 'react'
import { Tooltip } from '@/components/shared/Tooltip'

const emotionIcons: Record<string, string> = {
  happy: '😊', sad: '😢', angry: '😤', anxious: '😰', excited: '🎉',
  grateful: '🙏', frustrated: '😣', hopeful: '🌟', confused: '😕',
  tired: '😴', loved: '🥰', lonely: '💔', peaceful: '😌', neutral: '💬',
}

interface Props {
  content: string
}

export function SentimentBadge({ content }: Props) {
  const [analysis, setAnalysis] = useState<{
    sentiment: string
    emotion: string
    tone: string
    label: string
  } | null>(null)
  const [loading, setLoading] = useState(false)

  const analyze = async () => {
    if (analysis || loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/ai/sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content }),
      })
      const json = await res.json()
      if (json.sentiment) setAnalysis(json)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  if (!analysis) {
    return (
      <button
        onClick={analyze}
        disabled={loading}
        className="text-xs text-inc-muted hover:text-inc-accent transition-colors focus-visible:ring-2 focus-visible:ring-inc-accent focus-visible:outline-none rounded"
        aria-label="Analyze sentiment"
      >
        {loading ? (
          <span className="inline-block h-3 w-3 animate-spin rounded-full border border-inc-border border-t-inc-accent" />
        ) : (
          <Tooltip content="Understand how this might feel">
            <span>💭</span>
          </Tooltip>
        )}
      </button>
    )
  }

  return (
    <Tooltip content={`${analysis.sentiment} · ${analysis.tone} · ${analysis.label}`}>
      <span className="inline-flex items-center gap-1 text-xs text-inc-muted cursor-help">
        <span>{emotionIcons[analysis.emotion] || '💬'}</span>
        <span className="hidden sm:inline">{analysis.label}</span>
      </span>
    </Tooltip>
  )
}
