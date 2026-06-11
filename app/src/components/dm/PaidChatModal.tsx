'use client'

import { useState } from 'react'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { toast } from 'react-hot-toast'

interface Props {
  open: boolean
  onClose: () => void
  recipientId: string
  recipientHandle?: string
  onSuccess?: () => void
}

export function PaidChatModal({ open, onClose, recipientId, recipientHandle, onSuccess }: Props) {
  const [amount, setAmount] = useState(10)
  const [hours, setHours] = useState(24)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Add a short message so they know why you want to chat')
      return
    }
    setLoading(true)
    try {
      const resp = await fetch('/api/dm/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient_id: recipientId, amount, hours, message: message.trim() }),
      })
      const data = await resp.json()
      if (data.success) {
        toast.success('Chat request sent!')
        onSuccess?.()
        onClose()
      } else {
        toast.error(data.error || 'Could not send request')
      }
    } catch {
      toast.error('Something hiccuped')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ConfirmModal open={open} onClose={onClose} title={`Chat with ${recipientHandle ? `@${recipientHandle}` : 'this user'}`}>
      <p className="text-inc-muted text-sm mb-4">
        Send credits to open a temporary chat. They have to accept first.
      </p>

      <div className="space-y-3">
        <div>
          <label className="text-inc-muted text-xs block mb-1">Credits to send</label>
          <div className="flex gap-2">
            {[5, 10, 25, 50].map((val) => (
              <button
                key={val}
                onClick={() => setAmount(val)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  amount === val ? 'bg-inc-accent text-white' : 'bg-inc-light text-inc-muted hover:text-inc-text'
                }`}
              >
                {val}
              </button>
            ))}
            <input
              type="number"
              min={5}
              value={amount}
              onChange={(e) => setAmount(Math.max(5, parseInt(e.target.value) || 5))}
              className="w-16 bg-inc-light text-inc-text rounded-lg px-2 text-sm text-center border border-inc-light focus:border-inc-accent outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-inc-muted text-xs block mb-1">Chat duration (hours)</label>
          <select
            value={hours}
            onChange={(e) => setHours(parseInt(e.target.value))}
            className="w-full bg-inc-light text-inc-text rounded-lg p-2 text-sm border border-inc-light focus:border-inc-accent outline-none"
          >
            <option value={1}>1 hour</option>
            <option value={6}>6 hours</option>
            <option value={24}>24 hours</option>
            <option value={72}>3 days</option>
            <option value={168}>1 week</option>
          </select>
        </div>

        <div>
          <label className="text-inc-muted text-xs block mb-1">Your message to them</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Hey, I saw your post about... and I'd love to chat!"
            maxLength={500}
            className="w-full bg-inc-light text-inc-text rounded-lg p-2.5 text-sm resize-none h-20 border border-inc-light focus:border-inc-accent outline-none"
          />
          <p className="text-inc-muted text-xs mt-1 text-right">{message.length}/500</p>
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-inc-light text-inc-muted hover:text-inc-text transition-colors text-sm">
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={loading || !message.trim()}
            className="flex-1 py-2 rounded-lg bg-inc-accent text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? 'Sending...' : `Send ${amount} credits`}
          </button>
        </div>
      </div>
    </ConfirmModal>
  )
}
