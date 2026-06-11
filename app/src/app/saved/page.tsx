'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PostCard } from '@/components/feed/PostCard'
import { useSession } from '@/hooks/useSession'
import type { IPost } from '@/types'

export default function SavedPage() {
  const { user, loading: userLoading } = useSession()
  const [posts, setPosts] = useState<IPost[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (userLoading) return
    if (!user) {
      setLoading(false)
      return
    }

    ;(async () => {
      setLoading(true)
      const { data: savedPosts } = await supabase
        .from('saved_posts')
        .select('post_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      const postIds = ((savedPosts ?? []) as Array<Record<string, unknown>>).map((sp) => sp.post_id as string)

      if (postIds.length === 0) {
        setPosts([])
        setLoading(false)
        return
      }

      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .in('id', postIds)

      const postsList = (postsData ?? []) as unknown as IPost[]

      const authorIds = [...new Set(postsList.map((p) => p.author_id))]
      if (authorIds.length > 0) {
        const { data: authors } = await supabase
          .from('anon_users')
          .select('id, handle')
          .in('id', authorIds)
        const handleMap: Record<string, string> = {}
        for (const a of (authors ?? []) as Array<Record<string, unknown>>) {
          handleMap[a.id as string] = a.handle as string
        }
        for (const p of postsList) {
          p.author_handle = handleMap[p.author_id]
        }
      }

      const ordered = postIds.map((id: string) => postsList.find((p) => p.id === id)).filter(Boolean) as IPost[]
      setPosts(ordered)
      setLoading(false)
    })()
  }, [user, userLoading, supabase])

  if (userLoading || loading) {
    return (
      <div>
        <div className="flex items-center gap-2 border-b border-inc-border px-4 py-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-inc-accent"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          <h1 className="text-lg font-bold text-inc-text">Saved Posts</h1>
        </div>
        <div className="space-y-4 p-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-inc-border bg-inc-card p-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 animate-pulse rounded-full bg-inc-border/50" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 animate-pulse rounded bg-inc-border/50" />
                  <div className="h-4 w-full animate-pulse rounded bg-inc-border/50" />
                  <div className="h-4 w-3/4 animate-pulse rounded bg-inc-border/50" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20 text-inc-muted">
        Sign in to see saved posts.
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-2 border-b border-inc-border px-4 py-3">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-inc-accent"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        <h1 className="text-lg font-bold text-inc-text">Saved Posts</h1>
      </div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-inc-muted">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 opacity-40"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          <p className="text-sm">No saved posts yet.</p>
          <p className="text-xs mt-1 opacity-60">Tap the bookmark icon on any post to save it.</p>
        </div>
      ) : (
        <div className="space-y-4 p-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
