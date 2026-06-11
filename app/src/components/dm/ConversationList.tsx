'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AvatarPlaceholder } from '@/components/shared/AvatarPlaceholder'
import { formatRelativeTime } from '@/lib/utils'
import { ConversationListSkeleton } from '@/components/shared/Skeleton'

interface Conversation {
  user_id: string
  handle: string
  last_message: string
  last_time: string
  unread: boolean
}

export function ConversationList() {
  const [convs, setConvs] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const supabase = createClient()
      const { data: session } = await supabase.auth.getSession()
      if (!session.session?.user) { setLoading(false); return }

      const userId = session.session.user.id
      const { data: msgs } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: false })

      if (!msgs) { setLoading(false); return }

      // Fetch user handles for DM conversations
      const { data: users } = await supabase.from('anon_users').select() as { data: Record<string, unknown>[] | null }
      const userMap = new Map<string, string>()
      if (users) {
        for (const u of users) {
          userMap.set(u.id as string, u.handle as string)
        }
      }

      const map = new Map<string, Conversation>()
      for (const m of (msgs as Array<Record<string, unknown>>)) {
        const otherId = m.sender_id === userId
          ? m.recipient_id as string
          : m.sender_id as string

        const otherHandle = userMap.get(otherId) ?? null

        if (!map.has(otherId)) {
          map.set(otherId, {
            user_id: otherId,
            handle: otherHandle ?? 'Unknown',
            last_message: m.content as string,
            last_time: m.created_at as string,
            unread: (m.recipient_id as string) === userId && !m.is_read,
          })
        }
      }
      setConvs(Array.from(map.values()))
      setLoading(false)
    }
    fetch()
  }, [])

  if (loading) {
    return <ConversationListSkeleton />
  }

  if (convs.length === 0) {
    return (
      <p className="text-inc-muted text-sm text-center py-12">
        No conversations yet. Tip someone to start a DM!
      </p>
    )
  }

  return (
    <div className="divide-y divide-inc-border">
      {convs.map((c) => (
        <Link
          key={c.user_id}
          href={`/dm/${c.handle}`}
          className="flex items-center gap-3 px-4 py-3 hover:bg-inc-card transition-colors focus-visible:ring-2 focus-visible:ring-inc-accent focus-visible:outline-none focus-visible:bg-inc-card"
        >
          <AvatarPlaceholder handle={c.handle} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-medium text-inc-text text-sm">
                @{c.handle}
              </span>
              <span className="text-inc-muted text-xs">
                {formatRelativeTime(c.last_time)}
              </span>
            </div>
            <p className="text-inc-muted text-sm truncate">{c.last_message}</p>
          </div>
          {c.unread && (
            <span className="h-2 w-2 rounded-full bg-inc-accent shrink-0" />
          )}
        </Link>
      ))}
    </div>
  )
}
