'use client'

import { useState } from 'react'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: (amount: number) => void
  balance: number
}

const amounts = [1, 5, 10, 25, 50, 100]

export function TipModal({ open, onClose, onConfirm, balance }: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const [custom, setCustom] = useState('')

  function handleConfirm() {
    const amount = selected ?? parseInt(custom, 10)
    if (!amount || amount < 1) return
    if (amount > balance) {
      toast('Not enough credits! Check your wallet.')
      onClose()
      return
    }
    onConfirm(amount)
    onClose()
    setSelected(null)
    setCustom('')
  }

  return (
    <ConfirmModal open={open} onClose={onClose} title="Send a Tip">
      <p className="text-inc-muted text-sm mb-4">
        Your balance: <span className="text-inc-accent font-bold">{balance} credits</span>
      </p>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {amounts.map((a) => (
          <button
            key={a}
            onClick={() => { setSelected(a); setCustom('') }}
            aria-label={`Tip ${a} credits`}
            className={`rounded-xl border py-3 text-sm font-semibold transition-all focus-visible:ring-2 focus-visible:ring-inc-accent focus-visible:outline-none ${
              selected === a
                ? 'border-inc-accent bg-inc-accent/10 text-inc-accent'
                : 'border-inc-border text-inc-muted hover:border-inc-accent/50'
            }`}
          >
            {a}
          </button>
        ))}
      </div>
      <div className="relative mb-4">
        <input
          type="number"
          min={1}
          max={balance}
          value={custom}
          onChange={(e) => { setCustom(e.target.value); setSelected(null) }}
          placeholder="Custom amount"
          aria-label="Custom tip amount"
          className="w-full rounded-xl border border-inc-border bg-inc-dark px-4 py-2.5 text-inc-text text-sm outline-none focus:border-inc-accent focus-visible:ring-2 focus-visible:ring-inc-accent"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={onClose}
          aria-label="Cancel tip"
          className="flex-1 rounded-xl border border-inc-border py-2.5 text-sm text-inc-muted hover:bg-inc-border transition-colors focus-visible:ring-2 focus-visible:ring-inc-accent focus-visible:outline-none"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={!selected && !custom}
          aria-label="Send tip"
          className="flex-1 rounded-xl bg-inc-tip py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-inc-tip focus-visible:outline-none"
        >
          Send Tip
        </button>
      </div>
    </ConfirmModal>
  )
}
