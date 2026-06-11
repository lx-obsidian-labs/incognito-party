'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { IPost } from '@/types'

export function useRealtimeFeed(channelSlug?: string) {
  const [posts, setPosts] = useState<IPost[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const PAGE_SIZE = 25

  // fetchPosts now accepts an optional cursor (lastCreatedAt) to avoid
  // relying on a stale `posts` closure when paginating.
  const fetchPosts = useCallback(async (append = false, lastCreatedAt?: string) => {
    const supabase = createClient()
    const { data: session } = await supabase.auth.getSession()
    const currentUserId = session.session?.user?.id ?? null

    let query = supabase.from('posts').select()
    query = query.eq('is_removed', false).order('created_at', { ascending: false }).limit(PAGE_SIZE)

    if (append && lastCreatedAt) {
      query = query.lt('created_at', lastCreatedAt)
    }

    if (channelSlug) {
      const { data: channel } = await supabase
        .from('channels').select().eq('slug', channelSlug).single() as { data: Record<string, unknown> | null }
      if (channel) query = query.eq('channel_id', channel.id as string)
    }

    const { data: raw } = await query as { data: Record<string, unknown>[] | null }
    const data = (raw ?? []).filter((p) => {
      if (p.scheduled_at && (p.scheduled_at as string) > new Date().toISOString()) return false
      return true
    })

    setHasMore(data.length === PAGE_SIZE)

    const { data: users } = await supabase.from('anon_users').select() as { data: Record<string, unknown>[] | null }
    const userMap = new Map((users ?? []).map((u: Record<string, unknown>) => [u.id, u]))

    const { data: allInteractions } = await supabase.from('interactions').select() as { data: Record<string, unknown>[] | null }
    const interactions = allInteractions ?? []

    const getUserInteraction = (postId: string) => ({
      liked: interactions.some((i) => i.post_id === postId && i.type === 'like' && i.user_id === currentUserId),
      super_liked: interactions.some((i) => i.post_id === postId && i.type === 'super_like' && i.user_id === currentUserId),
      tipped: interactions.some((i) => i.post_id === postId && i.type === 'tip' && i.user_id === currentUserId),
    })

    const mapped: IPost[] = data.map((p) => {
      const author = userMap.get(p.author_id as string)
      return {
        id: p.id as string,
        channel_id: p.channel_id as string,
        author_id: p.author_id as string,
        content: p.content as string,
        media_url: p.media_url as string | null,
        created_at: p.created_at as string,
        is_flagged: p.is_flagged as boolean,
        is_removed: p.is_removed as boolean,
        is_moment: (p.is_moment as boolean) ?? false,
        expires_at: (p.expires_at as string) ?? null,
        views: p.views as number ?? 0,
        scheduled_at: p.scheduled_at as string | null ?? null,
        author_handle: (author?.handle as string) ?? 'Unknown',
        like_count: interactions.filter((i) => i.post_id === p.id && i.type === 'like').length,
        super_like_count: interactions.filter((i) => i.post_id === p.id && i.type === 'super_like').length,
        tip_count: interactions.filter((i) => i.post_id === p.id && i.type === 'tip').length,
        user_interaction: currentUserId ? getUserInteraction(p.id as string) : undefined,
      }
    })

    if (append) {
      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id))
        const newPosts = mapped.filter((p) => !existingIds.has(p.id))
        return [...prev, ...newPosts]
      })
    } else {
      setPosts(mapped)
    }

    if (append) setLoadingMore(false)
    else setLoading(false)
  }, [channelSlug])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const lastPost = posts[posts.length - 1]
    const lastCreatedAt = lastPost?.created_at
    await fetchPosts(true, lastCreatedAt)
  }, [fetchPosts, loadingMore, hasMore, posts])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    fetchPosts()
    const supabase = createClient()

    const s = supabase as {
      channel: (name: string) => {
        on: (event: string, config: Record<string, unknown>, callback: (payload: unknown) => void) => {
          subscribe: () => { unsubscribe: () => void }
        }
      }
    }

    const channel = s
      .channel('realtime-posts')
      .on(
        'postgres_changes',
        { event: 'INSERT' as const, schema: 'public' as const, table: 'posts' },
        () => { fetchPosts() },
      )
      .subscribe()

    return () => {
      (supabase as { removeChannel: (ch: unknown) => void }).removeChannel(channel)
    }
  }, [fetchPosts])

  return { posts, loading, loadingMore, hasMore, refetch: fetchPosts, loadMore }
}
