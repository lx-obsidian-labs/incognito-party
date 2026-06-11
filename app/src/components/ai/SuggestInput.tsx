'use client'

import { useState } from 'react'
import { Card } from '@/components/shared/Card'
import { toast } from 'sonner'

type SuggestionMode = 'food-suggestion' | 'activity-suggestion' | 'life-suggestion' | 'encouragement'

const modeLabels: Record<SuggestionMode, string> = {
  'food-suggestion': '🍕 Food',
  'activity-suggestion': '🎯 Activity',
  'life-suggestion': '🌱 Life',
  'encouragement': '💪 Encouragement',
}

interface Props {
  mode?: SuggestionMode
}

export function SuggestInput({ mode = 'food-suggestion' }: Props) {
  const [context, setContext] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [selectedMode, setSelectedMode] = useState<SuggestionMode>(mode)
  const [loading, setLoading] = useState(false)

  const handleSuggest = async () => {
    setLoading(true)
    setResult(null)
    try {
      const resp = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: selectedMode, context }),
      })
      const data = await resp.json()
      if (data.message) setResult(data.message)
      else toast.error('Could not get suggestion')
    } catch {
      toast.error('Something hiccuped')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <h3 className="text-inc-text font-semibold mb-2">✨ Get a Suggestion</h3>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {(Object.entries(modeLabels) as [SuggestionMode, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSelectedMode(key)}
            className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
              selectedMode === key ? 'bg-inc-accent text-white' : 'bg-inc-light text-inc-muted hover:text-inc-text'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <textarea
        value={context}
        onChange={(e) => setContext(e.target.value)}
        placeholder="Any context? (optional)"
        className="w-full bg-inc-light text-inc-text rounded-lg p-2.5 text-sm resize-none h-20 border border-inc-light focus:border-inc-accent outline-none"
      />
      <button
        onClick={handleSuggest}
        disabled={loading}
        className="mt-2 w-full py-2 bg-inc-accent text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {loading ? 'Thinking...' : 'Suggest'}
      </button>
      {result && (
        <div className="mt-3 p-3 bg-inc-light rounded-lg">
          <p className="text-inc-text text-sm leading-relaxed">{result}</p>
        </div>
      )}
    </Card>
  )
}
