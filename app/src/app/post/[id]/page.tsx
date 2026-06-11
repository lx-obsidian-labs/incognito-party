'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PostCard } from '@/components/feed/PostCard'
import CommentList from '@/components/comments/CommentList'
import CommentComposer from '@/components/comments/CommentComposer'
import type { IPost } from '@/types'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [post, setPost] = useState<IPost | null>(null)
  const [comments, setComments] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  function fetchPost() {
    setLoading(true)
    setError(false)
    const supabase = createClient()
    supabase
      .from('posts')
      .select(`
        *,
        author:author_id ( handle ),
        interactions ( type, user_id )
      `)
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) {
        setPost({
          id: data.id as string,
            channel_id: data.channel_id as string,
            author_id: data.author_id as string,
            content: data.content as string,
            media_url: data.media_url as string | null,
            created_at: data.created_at as string,
            is_flagged: data.is_flagged as boolean,
            is_removed: data.is_removed as boolean,
            views: data.views as number ?? 0,
            author_handle: ((data as Record<string, unknown>).author as { handle?: string } | undefined)?.handle ?? 'Unknown',
            like_count: (data.interactions as Array<{ type: string }>)
              ?.filter((i) => i.type === 'like').length ?? 0,
            super_like_count: (data.interactions as Array<{ type: string }>)
              ?.filter((i) => i.type === 'super_like').length ?? 0,
            tip_count: (data.interactions as Array<{ type: string }>)
              ?.filter((i) => i.type === 'tip').length ?? 0,
            mood: (data as Record<string, unknown>).mood as string | null ?? null,
            comments_count: (data as Record<string, unknown>).comments_count as number ?? 0,
          })
        }
        setLoading(false)
      }, () => { setError(true); setLoading(false) })
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchPost() }, [id])

  useEffect(() => {
    // load comments
    fetch(`/api/comments?post_id=${id}`)
      .then((r) => r.json())
      .then((j) => setComments(j.comments ?? []))
      .catch((e) => console.error(e))
  }, [id])

  useEffect(() => {
    if (post && !loading) {
      const supabase = createClient()
      supabase.from('posts').update({ views: (post.views ?? 0) + 1 }).eq('id', id)
    }
  }, [post, loading, id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-inc-accent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-inc-muted">Something hiccuped. Could not load this post.</p>
        <button
          onClick={fetchPost}
          aria-label="Try again"
          className="rounded-full border border-inc-border px-6 py-2 text-sm text-inc-muted hover:border-inc-accent hover:text-inc-accent transition-colors focus-visible:ring-2 focus-visible:ring-inc-accent focus-visible:outline-none"
        >
          Try again
        </button>
      </div>
    )
  }

  if (!post && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-inc-muted">Post not found or was removed.</p>
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="rounded-full border border-inc-border px-6 py-2 text-sm text-inc-muted hover:border-inc-accent hover:text-inc-accent transition-colors"
        >
          Go back
        </button>
      </div>
    )
  }

  if (!post) return null

  return (
    <div className="px-4 pt-4">
      <button
        onClick={() => router.back()}
        aria-label="Go back"
        className="flex items-center gap-1 text-inc-muted hover:text-inc-text mb-4 transition-colors focus-visible:ring-2 focus-visible:ring-inc-accent focus-visible:outline-none rounded-lg px-2 py-1"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <PostCard post={post} />
      <div className="max-w-2xl">
        <h3 className="mt-6 mb-2 text-sm font-semibold">Responses</h3>
        <CommentComposer postId={post.id} onCreated={(c) => { setComments((s) => [...s, c]); setPost((p) => p ? ({ ...p, comments_count: (p.comments_count ?? 0) + 1 }) : p) }} />
        <CommentList comments={comments} />
      </div>
    </div>
  )
}
