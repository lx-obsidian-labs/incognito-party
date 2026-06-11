'use client'

import { use, useMemo } from 'react'
import { ChannelTabs } from '@/components/layout/ChannelTabs'
import { PostComposer } from '@/components/feed/PostComposer'
import { PostCard } from '@/components/feed/PostCard'
import { SortBar } from '@/components/feed/SortBar'
import { MomentsBar } from '@/components/feed/MomentsBar'
import type { SortMode } from '@/components/feed/SortBar'
import { useRealtimeFeed } from '@/hooks/useRealtimeFeed'
import { createClient } from '@/lib/supabase/client'
import { CHANNELS } from '@/lib/constants/channels'
import { useEffect, useState } from 'react'
import type { IChannel } from '@/types'
import { PostCardSkeleton } from '@/components/shared/Skeleton'

export default function ChannelFeedPage({
  params,
}: {
  params: Promise<{ channelSlug: string }>
}) {
  const { channelSlug } = use(params)
  const { posts, loading: feedLoading, loadingMore, hasMore, refetch, loadMore } = useRealtimeFeed(channelSlug)
  const [channel, setChannel] = useState<IChannel | null>(null)
  const [sortBy, setSortBy] = useState<SortMode>('new')

  const sortedPosts = useMemo(() => {
    const sorted = [...posts]
    if (sortBy === 'new') {
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } else if (sortBy === 'hot') {
      sorted.sort((a, b) => {
        const scoreA = (a.like_count ?? 0) + (a.super_like_count ?? 0) * 2 + (a.tip_count ?? 0) * 3
        const scoreB = (b.like_count ?? 0) + (b.super_like_count ?? 0) * 2 + (b.tip_count ?? 0) * 3
        if (scoreA !== scoreB) return scoreB - scoreA
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
    } else if (sortBy === 'top') {
      sorted.sort((a, b) => {
        const scoreA = a.tip_count ?? 0
        const scoreB = b.tip_count ?? 0
        if (scoreA !== scoreB) return scoreB - scoreA
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
    }
    return sorted
  }, [posts, sortBy])

  useEffect(() => {
    const supabase = createClient()
    supabase.from('channels').select('*').eq('slug', channelSlug).single().then(
      ({ data }) => setChannel(data)
    )
  }, [channelSlug])

  const channelDef = CHANNELS.find((c) => c.slug === channelSlug)

  if (feedLoading) {
    return (
      <div>
        <div className="sticky top-0 z-30 bg-inc-dark/95 backdrop-blur-lg border-b border-inc-border">
          <div className="px-4 py-3">
            <h1 className="text-lg font-bold text-inc-text">
              {channelDef?.icon} {channelDef?.name ?? channelSlug}
            </h1>
            <p className="text-inc-muted text-xs">{channelDef?.description}</p>
          </div>
          <ChannelTabs />
        </div>
        <div className="px-4 pt-4 pb-4 space-y-3">
          <PostCardSkeleton />
          <PostCardSkeleton />
          <PostCardSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="sticky top-0 z-30 bg-inc-dark/95 backdrop-blur-lg border-b border-inc-border">
        <div className="px-4 py-3">
          <h1 className="text-lg font-bold text-inc-text">
            {channelDef?.icon} {channelDef?.name ?? channelSlug}
          </h1>
          <p className="text-inc-muted text-xs">{channelDef?.description}</p>
        </div>
        <ChannelTabs />
        <SortBar sortBy={sortBy} onSortChange={setSortBy} />
      </div>

      <div className="px-4 pt-4 pb-4">
        {channel && (
          <PostComposer channelId={channel.id} onPostCreated={refetch} />
        )}
      </div>

      <MomentsBar />

      <div className="px-4 pb-4 space-y-3 animate-stagger">
        {sortedPosts.length === 0 && !feedLoading && (
          <div className="text-center py-12">
            <p className="text-inc-muted text-lg mb-1">Nothing here yet</p>
            <p className="text-inc-muted text-sm">Be the first to post?</p>
          </div>
        )}
        {sortedPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        {hasMore && (
          <div className="flex justify-center py-4">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              aria-label="Load more posts"
              className="rounded-full border border-inc-border px-6 py-2.5 text-sm text-inc-muted hover:border-inc-accent hover:text-inc-accent transition-colors focus-visible:ring-2 focus-visible:ring-inc-accent focus-visible:outline-none disabled:opacity-40"
            >
              {loadingMore ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 animate-spin mx-auto"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              ) : (
                'Load more'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
