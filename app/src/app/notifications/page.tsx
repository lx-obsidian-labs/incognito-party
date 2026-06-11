'use client'

import { useSession } from '@/hooks/useSession'
import { createClient } from '@/lib/supabase/client'
import { AvatarPlaceholder } from '@/components/shared/AvatarPlaceholder'
import { HandleDisplay } from '@/components/shared/HandleDisplay'
import { formatRelativeTime, cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import type { INotification } from '@/types'

const typeConfig: Record<INotification['type'], { label: string; icon: string }> = {
  like: {
    label: 'liked your post',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="text-rose-500"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
  },
  super_like: {
    label: 'super-liked your post',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="text-yellow-400"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
  },
  tip: {
    label: 'tipped you',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="text-inc-tip"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>',
  },
  dm: {
    label: 'sent you a message',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="text-blue-400"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  },
  achievement: {
    label: 'earned an achievement',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="text-yellow-500"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 6 9 6 9"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 18 9 18 9"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>',
  },
}

function NotificationSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="h-10 w-10 animate-pulse rounded-full bg-inc-border/50" />
      <div className="flex-1 space-y-1.5">
        <div className="h-4 w-32 animate-pulse rounded bg-inc-border/50" />
        <div className="h-3 w-48 animate-pulse rounded bg-inc-border/50" />
      </div>
      <div className="h-3 w-10 animate-pulse rounded bg-inc-border/50" />
    </div>
  )
}

export default function NotificationsPage() {
  const { user, loading: userLoading } = useSession()
  const [notifications, setNotifications] = useState<INotification[]>([])
  const [actors, setActors] = useState<Record<string, { handle: string }>>({})
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }
    setLoading(true)

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    const items = (data ?? []) as unknown as INotification[]
    setNotifications(items)

    const actorIds = [...new Set(items.map((n) => n.actor_id))]
    if (actorIds.length > 0) {
      const { data: actorsData } = await supabase
        .from('anon_users')
        .select('id, handle')
        .in('id', actorIds)

      const actorMap: Record<string, { handle: string }> = {}
      for (const a of (actorsData ?? []) as Array<Record<string, unknown>>) {
        actorMap[a.id as string] = { handle: a.handle as string }
      }
      setActors(actorMap)
    }

    setLoading(false)
  }, [user, supabase])

  useEffect(() => {
    if (!userLoading) {
      fetchNotifications()
    }
  }, [user, userLoading, fetchNotifications])

  async function markRead(notif: INotification) {
    if (!notif.read) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notif.id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)),
      )
    }
    if (notif.post_id) {
      router.push(`/post/${notif.post_id}`)
    }
  }

  if (userLoading || loading) {
    return (
      <div>
        <div className="flex items-center gap-2 border-b border-inc-border px-4 py-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-inc-accent"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <h1 className="text-lg font-bold text-inc-text">Notifications</h1>
        </div>
        <div className="divide-y divide-inc-border">
          {[1, 2, 3, 4, 5].map((i) => (
            <NotificationSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20 text-inc-muted">
        Sign in to see notifications
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-2 border-b border-inc-border px-4 py-3">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-inc-accent"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        <h1 className="text-lg font-bold text-inc-text">Notifications</h1>
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-inc-muted">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 opacity-40"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <p className="text-sm">No notifications yet</p>
          <p className="text-xs mt-1 opacity-60">When someone interacts with your posts, you will see it here</p>
        </div>
      ) : (
        <div className="divide-y divide-inc-border">
          {notifications.map((notif) => {
            const actor = actors[notif.actor_id]
            const config = typeConfig[notif.type]
            return (
              <button
                key={notif.id}
                onClick={() => markRead(notif)}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-inc-card/50 focus-visible:ring-2 focus-visible:ring-inc-accent focus-visible:outline-none',
                  !notif.read && 'bg-inc-accent/5',
                )}
              >
                <div className="relative shrink-0">
                  {actor ? (
                    <AvatarPlaceholder handle={actor.handle} size="sm" />
                  ) : (
                    <div className="h-8 w-8 animate-pulse rounded-full bg-inc-border/50" />
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-inc-dark">
                    <span
                      className="h-3 w-3"
                      dangerouslySetInnerHTML={{ __html: config.icon }}
                    />
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm text-inc-text truncate">
                    {actor ? (
                      <HandleDisplay handle={actor.handle} size="sm" className="inline" />
                    ) : (
                      <span className="font-bold text-inc-muted">someone</span>
                    )}{' '}
                    <span className="text-inc-muted">{config.label}</span>
                  </p>
                  <p className="text-xs text-inc-muted mt-0.5">
                    {formatRelativeTime(notif.created_at)}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-inc-muted">
                    {formatRelativeTime(notif.created_at)}
                  </span>
                  {!notif.read && (
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
