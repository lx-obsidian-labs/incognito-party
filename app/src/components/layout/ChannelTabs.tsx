'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { CHANNELS } from '@/lib/constants/channels'

export function ChannelTabs() {
  const params = useParams()
  const activeSlug = (params?.channelSlug as string) ?? 'advice'

  return (
    <div className="flex gap-1 overflow-x-auto px-4 py-3 scrollbar-hide">
      {CHANNELS.map((ch) => {
        const active = ch.slug === activeSlug
        return (
          <Link
            key={ch.slug}
            href={`/feed/${ch.slug}`}
            aria-label={`${ch.name} channel`}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-inc-accent focus-visible:outline-none',
              active
                ? 'bg-inc-accent text-inc-dark'
                : 'bg-inc-card text-inc-muted hover:bg-inc-border hover:text-inc-text',
            )}
          >
            <span>{ch.icon}</span>
            {ch.name}
          </Link>
        )
      })}
    </div>
  )
}
