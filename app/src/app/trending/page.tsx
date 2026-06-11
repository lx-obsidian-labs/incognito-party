'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useSession } from '@/hooks/useSession'
import { AvatarPlaceholder } from '@/components/shared/AvatarPlaceholder'
import { HandleDisplay } from '@/components/shared/HandleDisplay'
import { cn, formatRelativeTime } from '@/lib/utils'

interface TopPost {
  id: string
  channel_id: string
  author_id: string
  author_handle: string
  content: string
  created_at: string
  tip_count: number
}

interface TopEarner {
  author_id: string
  handle: string
  total_credits: number
}

export default function TrendingPage() {
  const { loading: sessionLoading } = useSession()
  const [tab, setTab] = useState<'posts' | 'earners'>('posts')
  const [topPosts, setTopPosts] = useState<TopPost[]>([])
  const [topEarners, setTopEarner] = useState<TopEarner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (sessionLoading) return
    setLoading(true)

    const supabase = createClient()

    Promise.all([
      fetchTopPosts(supabase),
      fetchTopEarners(supabase),
    ]).then(([posts, earners]) => {
      setTopPosts(posts)
      setTopEarner(earners)
      setLoading(false)
    })
  }, [sessionLoading])

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-inc-accent">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </svg>
        <h1 className="text-lg font-bold text-inc-text">Trending</h1>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setTab('posts')}
          aria-label="Top Posts tab"
          className={cn(
            'rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-inc-accent focus-visible:outline-none',
            tab === 'posts'
              ? 'bg-inc-accent text-white'
              : 'bg-inc-card text-inc-muted border border-inc-border hover:text-inc-text',
          )}
        >
          Posts
        </button>
        <button
          onClick={() => setTab('earners')}
          aria-label="Top Earners tab"
          className={cn(
            'rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-inc-accent focus-visible:outline-none',
            tab === 'earners'
              ? 'bg-inc-accent text-white'
              : 'bg-inc-card text-inc-muted border border-inc-border hover:text-inc-text',
          )}
        >
          Earners
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-inc-muted">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>
      ) : tab === 'posts' ? (
        topPosts.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2">
            {topPosts.map((post, i) => (
              <Link
                key={post.id}
                href={`/post/${post.id}`}
                className="flex items-center gap-3 rounded-xl border border-inc-border bg-inc-card p-3 transition-colors hover:border-inc-accent/50 focus-visible:ring-2 focus-visible:ring-inc-accent focus-visible:outline-none"
              >
                <span className="w-6 text-center text-sm font-bold text-inc-muted shrink-0">
                  {i + 1}
                </span>
                <AvatarPlaceholder handle={post.author_handle} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <HandleDisplay handle={post.author_handle} size="sm" />
                    <span className="text-inc-muted text-xs">
                      {formatRelativeTime(post.created_at)}
                    </span>
                  </div>
                  <p className="text-inc-text text-sm truncate mt-0.5">
                    {post.content}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-inc-accent">
                    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                  </svg>
                  <span className="text-sm font-bold text-inc-accent">{post.tip_count}</span>
                </div>
              </Link>
            ))}
          </div>
        )
      ) : (
        topEarners.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2">
            {topEarners.map((earner, i) => (
              <div
                key={earner.author_id}
                className="flex items-center gap-3 rounded-xl border border-inc-border bg-inc-card p-3"
              >
                <span className="w-6 text-center text-sm font-bold text-inc-muted shrink-0">
                  {i + 1}
                </span>
                <AvatarPlaceholder handle={earner.handle} size="sm" />
                <div className="flex-1">
                  <HandleDisplay handle={earner.handle} size="sm" />
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-inc-tip">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
                    <path d="M12 18V6" />
                  </svg>
                  <span className="text-sm font-bold text-inc-tip">{earner.total_credits}</span>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <p className="text-inc-muted text-lg mb-1">Not enough activity yet.</p>
      <p className="text-inc-muted text-sm">Start tipping!</p>
    </div>
  )
}

async function fetchTopPosts(supabase: ReturnType<typeof createClient>): Promise<TopPost[]> {
  const { data: tipData } = await supabase.from('interactions').select().eq('type', 'tip')
  const tips = (tipData ?? []) as Record<string, unknown>[]
  if (tips.length === 0) return []

  const tipCounts: Record<string, number> = {}
  for (const tip of tips) {
    const pid = tip.post_id as string
    tipCounts[pid] = (tipCounts[pid] || 0) + 1
  }

  const topIds = Object.entries(tipCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([id]) => id)

  const { data: postsData } = await supabase.from('posts').select().in('id', topIds)
  const posts = (postsData ?? []) as Record<string, unknown>[]

  const authorIds = [...new Set(posts.map((p) => p.author_id as string))]
  const { data: usersData } = await supabase.from('anon_users').select().in('id', authorIds)
  const users = (usersData ?? []) as Record<string, unknown>[]
  const userMap = new Map(users.map((u) => [u.id as string, u.handle as string]))

  return posts
    .map((p) => ({
      id: p.id as string,
      channel_id: p.channel_id as string,
      author_id: p.author_id as string,
      author_handle: userMap.get(p.author_id as string) ?? 'Unknown',
      content: p.content as string,
      created_at: p.created_at as string,
      tip_count: tipCounts[p.id as string] ?? 0,
    }))
    .sort((a, b) => b.tip_count - a.tip_count)
}

async function fetchTopEarners(supabase: ReturnType<typeof createClient>): Promise<TopEarner[]> {
  const { data: tipData } = await supabase.from('interactions').select().eq('type', 'tip')
  const tips = (tipData ?? []) as Record<string, unknown>[]
  if (tips.length === 0) return []

  const { data: postsData } = await supabase.from('posts').select('id, author_id')
  const allPosts = (postsData ?? []) as Record<string, unknown>[]
  const postAuthorMap = new Map(allPosts.map((p) => [p.id as string, p.author_id as string]))

  const earnings: Record<string, number> = {}
  for (const tip of tips) {
    const authorId = postAuthorMap.get(tip.post_id as string)
    if (authorId) {
      earnings[authorId] = (earnings[authorId] || 0) + ((tip.amount as number) || 0)
    }
  }

  const topAuthorIds = Object.entries(earnings)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([id]) => id)

  const { data: usersData } = await supabase.from('anon_users').select().in('id', topAuthorIds)
  const users = (usersData ?? []) as Record<string, unknown>[]
  const userMap = new Map(users.map((u) => [u.id as string, u.handle as string]))

  return Object.entries(earnings)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([authorId, totalCredits]) => ({
      author_id: authorId,
      handle: userMap.get(authorId) ?? 'Unknown',
      total_credits: totalCredits,
    }))
}
