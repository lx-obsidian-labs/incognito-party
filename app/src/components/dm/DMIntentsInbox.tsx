'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/shared/Card'
import { toast } from 'react-hot-toast'
import type { IDMIntent } from '@/types'

interface Props {
  userId: string
}

export function DMIntentsInbox({ userId }: Props) {
  const [intents, setIntents] = useState<IDMIntent[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  const fetchIntents = async () => {
    setLoading(true)
    try {
      const resp = await fetch('/api/dm/intents?type=received')
      const data = await resp.json()
      setIntents(data.intents ?? [])
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchIntents() }, [])

  const handleResponse = async (intentId: string, status: 'accepted' | 'declined') => {
    setProcessing(intentId)
    try {
      const resp = await fetch('/api/dm/intents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent_id: intentId, status }),
      })
      const data = await resp.json()
      if (data.success) {
        toast.success(status === 'accepted' ? 'Chat opened!' : 'Declined')
        fetchIntents()
      } else {
        toast.error(data.error || 'Failed to respond')
      }
    } catch {
      toast.error('Something hiccuped')
    } finally {
      setProcessing(null)
    }
  }

  const pending = intents.filter((i) => i.status === 'pending')
  const history = intents.filter((i) => i.status !== 'pending')

  if (loading) {
    return (
      <Card>
        <h3 className="text-inc-text font-semibold mb-2">💬 Chat Requests</h3>
        <p className="text-inc-muted text-sm">Loading...</p>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-inc-text font-semibold">💬 Chat Requests</h3>
        <button onClick={fetchIntents} className="text-inc-muted hover:text-inc-text text-xs transition-colors">
          Refresh
        </button>
      </div>

      {pending.length === 0 && history.length === 0 && (
        <p className="text-inc-muted text-sm">No requests yet. Someone has to send you credits to chat.</p>
      )}

      {pending.length > 0 && (
        <div className="mb-3">
          <p className="text-inc-muted text-xs mb-2 uppercase tracking-wide">Pending</p>
          <div className="space-y-2">
            {pending.map((intent) => (
              <div key={intent.id} className="p-2.5 bg-inc-light rounded-lg">
                <p className="text-inc-text text-sm font-medium">
                  {intent.sender_handle ? `@${intent.sender_handle}` : 'Someone'} wants to chat
                </p>
                <p className="text-inc-muted text-xs mt-0.5">{intent.message}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-inc-accent text-xs font-medium">{intent.amount} credits ({(intent.hours || 24)}h)</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleResponse(intent.id, 'declined')}
                      disabled={processing === intent.id}
                      className="px-2.5 py-1 rounded-lg bg-inc-light text-inc-muted hover:text-inc-text text-xs transition-colors"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleResponse(intent.id, 'accepted')}
                      disabled={processing === intent.id}
                      className="px-2.5 py-1 rounded-lg bg-inc-accent text-white text-xs hover:opacity-90 transition-opacity"
                    >
                      {processing === intent.id ? '...' : 'Accept'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <p className="text-inc-muted text-xs mb-2 uppercase tracking-wide">History</p>
          <div className="space-y-1">
            {history.map((intent) => (
              <div key={intent.id} className="flex items-center justify-between py-1.5 text-sm">
                <span className="text-inc-text">
                  {intent.sender_handle ? `@${intent.sender_handle}` : 'Someone'} — {intent.amount} credits
                </span>
                <span className={`text-xs ${intent.status === 'accepted' ? 'text-green-400' : 'text-inc-muted'}`}>
                  {intent.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
