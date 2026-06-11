'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
}

export function ConfirmModal({ open, onClose, title, children, className }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={title}>
      <div
        ref={ref}
        className={cn(
          'bg-inc-card border border-inc-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl animate-scale-in focus-visible:ring-2 focus-visible:ring-inc-accent focus-visible:outline-none',
          className,
        )}
      >
        <h2 className="text-xl font-bold text-inc-text mb-4">{title}</h2>
        {children}
      </div>
    </div>
  )
}
