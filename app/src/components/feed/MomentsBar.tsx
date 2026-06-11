'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AvatarPlaceholder } from '@/components/shared/AvatarPlaceholder'
import Link from 'next/link'
import type { IPost } from '@/types'

function formatTimeRemaining(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m remaining`
}

export function MomentsBar() {
  const [moments, setMoments] = useState<IPost[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async () => {
      const { data: users } = await supabase.from('anon_users').select()
      const { data: allPosts } = await supabase
        .from('posts')
        .select()
        .order('created_at', { ascending: false })
      const now = new Date().toISOString()
      const momentPosts = ((allPosts ?? []) as Record<string, unknown>[])
        .filter((p) => p.is_moment && p.expires_at && (p.expires_at as string) > now)
      const userMap = new Map((users ?? []).map((u: Record<string, unknown>) => [u.id, u]))
      const mapped = momentPosts.map((p) => ({
        id: p.id as string,
        channel_id: p.channel_id as string,
        author_id: p.author_id as string,
        content: p.content as string,
        media_url: null,
        created_at: p.created_at as string,
        is_flagged: false,
        is_removed: false,
        is_moment: true,
        expires_at: p.expires_at as string,
        author_handle: (userMap.get(p.author_id as string) as Record<string, unknown> | undefined)?.handle as string ?? 'Unknown',
      }))
      setMoments(mapped)
    })
  }, [])

  if (moments.length === 0) return null

  return (
    <div className="px-4 pt-4">
      <div className="flex items-center gap-2 mb-3">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-inc-accent"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <h2 className="text-sm font-semibold text-inc-accent">Moments — expiring soon</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {moments.map((moment) => {
          const remaining = moment.expires_at ? formatTimeRemaining(moment.expires_at) : ''
          return (
            <Link
              key={moment.id}
              href={`/post/${moment.id}`}
              className="shrink-0 w-56 rounded-2xl border border-inc-border bg-inc-card p-4 hover:border-inc-accent/40 transition-all hover:-translate-y-0.5 space-y-2 focus-visible:ring-2 focus-visible:ring-inc-accent focus-visible:outline-none"
            >
              <div className="flex items-center gap-2">
                <AvatarPlaceholder handle={moment.author_handle ?? '?'} size="xs" />
                <span className="text-xs text-inc-muted truncate">{moment.author_handle}</span>
              </div>
              <p className="text-sm text-inc-text line-clamp-3">{moment.content}</p>
              <div className="flex items-center gap-1 text-xs text-inc-muted">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span>{remaining}</span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
