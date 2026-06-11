'use client'

import { cn } from '@/lib/utils'

type SortMode = 'new' | 'hot' | 'top'

interface Props {
  sortBy: SortMode
  onSortChange: (mode: SortMode) => void
}

const sortOptions: { value: SortMode; label: string; icon: string }[] = [
  {
    value: 'hot',
    label: 'Hot',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
  },
  {
    value: 'new',
    label: 'New',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  },
  {
    value: 'top',
    label: 'Top',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
  },
]

export function SortBar({ sortBy, onSortChange }: Props) {
  return (
    <div className="flex gap-1.5 px-4 pb-3">
      {sortOptions.map((opt) => {
        const active = sortBy === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => onSortChange(opt.value)}
            aria-label={`Sort by ${opt.label}`}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-inc-accent focus-visible:outline-none',
              active
                ? 'bg-inc-accent text-white'
                : 'border border-inc-border text-inc-muted hover:border-inc-accent/50 hover:text-inc-text',
            )}
          >
            <span dangerouslySetInnerHTML={{ __html: opt.icon }} />
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export type { SortMode }
