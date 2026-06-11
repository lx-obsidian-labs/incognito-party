'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/shared/Tooltip'

interface Props {
  open: boolean
  original: string
  onClose: () => void
  onApply: (rewritten: string) => void
}

const actions = [
  { id: 'enhance', label: 'Enhance', icon: '✨', desc: 'Make it more engaging' },
  { id: 'friendly', label: 'Soften', icon: '💛', desc: 'Warmer and friendlier' },
  { id: 'concise', label: 'Trim', icon: '✂️', desc: 'More concise' },
  { id: 'supportive', label: 'Support', icon: '🤝', desc: 'More encouraging' },
]

export function AIEnhanceModal({ open, original, onClose, onApply }: Props) {
  const [loading, setLoading] = useState(false)
  const [rewritten, setRewritten] = useState<string | null>(null)
  const [selectedAction, setSelectedAction] = useState('enhance')

  if (!open) return null

  const handleEnhance = async (action: string) => {
    setSelectedAction(action)
    setRewritten(null)
    setLoading(true)
    try {
      const res = await fetch('/api/ai/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: original, action }),
      })
      const json = await res.json()
      if (json.rewritten) {
        setRewritten(json.rewritten)
      } else {
        toast(json.error || 'Could not enhance text')
      }
    } catch {
      toast('AI service unavailable')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label="AI Enhance">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-lg mx-auto bg-inc-card border border-inc-border rounded-t-2xl sm:rounded-2xl p-5 shadow-xl animate-slide-up max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-inc-text flex items-center gap-2">
            <span className="text-xl">✨</span> AI Rewrite
          </h2>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 hover:bg-inc-border transition-colors focus-visible:ring-2 focus-visible:ring-inc-accent focus-visible:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-inc-muted"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          {actions.map((action) => (
            <Tooltip key={action.id} content={action.desc}>
              <button
                onClick={() => handleEnhance(action.id)}
                disabled={loading}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition-all focus-visible:ring-2 focus-visible:ring-inc-accent focus-visible:outline-none',
                  selectedAction === action.id && !loading
                    ? 'bg-inc-accent text-inc-dark font-medium'
                    : 'bg-inc-dark text-inc-muted hover:text-inc-text',
                )}
              >
                <span>{action.icon}</span>
                {action.label}
              </button>
            </Tooltip>
          ))}
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-inc-muted uppercase tracking-wider mb-1.5 block">Original</label>
            <div className="rounded-xl bg-inc-dark border border-inc-border p-3.5 text-sm text-inc-text leading-relaxed">
              {original}
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-inc-border border-t-inc-accent" />
                <span className="text-sm text-inc-muted">Rewriting...</span>
              </div>
            </div>
          )}

          {rewritten && !loading && (
            <div>
              <label className="text-xs font-medium text-inc-muted uppercase tracking-wider mb-1.5 block flex items-center gap-1.5">
                <span>✨</span> Preview
              </label>
              <div className="rounded-xl bg-inc-dark/50 border border-inc-accent/30 p-3.5 text-sm text-inc-text leading-relaxed">
                {rewritten}
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => handleEnhance(selectedAction)}
                  className="rounded-full px-4 py-1.5 text-sm text-inc-muted border border-inc-border hover:bg-inc-border transition-colors focus-visible:ring-2 focus-visible:ring-inc-accent focus-visible:outline-none"
                >
                  Retry
                </button>
                <button
                  onClick={() => { onApply(rewritten); onClose() }}
                  className="rounded-full px-4 py-1.5 text-sm font-semibold bg-inc-accent text-inc-dark hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-inc-accent focus-visible:outline-none"
                >
                  Use this
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-inc-muted mt-4 text-center">
          AI suggestions are a starting point — you stay in control
        </p>
      </div>
    </div>
  )
}
