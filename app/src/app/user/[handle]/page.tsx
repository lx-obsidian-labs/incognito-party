'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AvatarPlaceholder } from '@/components/shared/AvatarPlaceholder'
import { HandleDisplay } from '@/components/shared/HandleDisplay'
import FollowersList from '@/components/users/FollowersList'
import { PostCard } from '@/components/feed/PostCard'
import { formatRelativeTime } from '@/lib/utils'
import type { IAnonUser, IPost } from '@/types'

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>
}) {
  const { handle } = use(params)
  const router = useRouter()
  const [user, setUser] = useState<IAnonUser | null>(null)
  const [posts, setPosts] = useState<IPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [tipCount, setTipCount] = useState(0)
  const [likeCount, setLikeCount] = useState(0)
  const [superLikeCount, setSuperLikeCount] = useState(0)
  const [showFollowers, setShowFollowers] = useState(false)
  const [showFollowing, setShowFollowing] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data: userData, error: userErr } = await supabase
        .from('anon_users')
        .select('*')
        .eq('handle', handle)
        .single()

      if (userErr || !userData) {
        setError(true)
        setLoading(false)
        return
      }

      const u = userData as IAnonUser
      setUser(u)

      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .eq('author_id', u.id)
        .order('created_at', { ascending: false })
        .limit(50)

      const p = (postsData ?? []) as unknown as IPost[]
      setPosts(p)

      if (p.length > 0) {
        const postIds = p.map((post) => post.id)
        const { data: interactions } = await supabase
          .from('interactions')
          .select('type, amount')
          .in('post_id', postIds)

        const items = (interactions ?? []) as Array<{ type: string; amount: number }>
        setTipCount(items.filter((i) => i.type === 'tip').reduce((s, i) => s + i.amount, 0))
        setLikeCount(items.filter((i) => i.type === 'like').length)
        setSuperLikeCount(items.filter((i) => i.type === 'super_like').length)
      }

      setLoading(false)
    }

    load()
  }, [handle])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="h-8 w-8 animate-spin text-inc-accent" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-20">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-inc-muted">
          <circle cx="12" cy="12" r="10" />
          <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
        <p className="text-inc-muted text-lg">User not found</p>
        <button
          onClick={() => router.back()}
          className="rounded-xl border border-inc-border px-4 py-2 text-sm text-inc-muted hover:text-inc-text transition-colors"
        >
          Go back
        </button>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 space-y-6">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-inc-border bg-inc-card p-6">
        <AvatarPlaceholder handle={user.handle} size="lg" color={user.avatar_color} />
        <HandleDisplay handle={user.handle} size="lg" />
        {user.bio && (
          <p className="text-inc-muted text-sm text-center max-w-xs">{user.bio}</p>
        )}
        <p className="text-inc-muted text-xs">
          Joined {new Date(user.created_at).toLocaleDateString()}
        </p>
        <div className="flex gap-6 text-sm">
          <div className="text-center">
            <p className="font-bold text-inc-text">{posts.length}</p>
            <p className="text-inc-muted text-xs">{posts.length === 1 ? 'post' : 'posts'}</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-inc-text">{tipCount}</p>
            <p className="text-inc-muted text-xs">{tipCount === 1 ? 'tip' : 'tips'} received</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-inc-text">{likeCount + superLikeCount}</p>
            <p className="text-inc-muted text-xs">likes</p>
          </div>
        </div>
        <div className="flex gap-4 mt-3 text-sm">
          <button onClick={() => setShowFollowers(true)} className="text-inc-muted">Followers</button>
          <button onClick={() => setShowFollowing(true)} className="text-inc-muted">Following</button>
        </div>
        <button
          onClick={() => router.push(`/dm/${user.handle}`)}
          className="flex items-center gap-2 rounded-xl border border-inc-accent bg-inc-accent/10 px-5 py-2 text-sm font-medium text-inc-accent hover:bg-inc-accent/20 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Send DM
        </button>
      </div>

      <div className="space-y-3">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-inc-muted">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
            <p className="text-inc-muted">No posts yet</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>
      {/* Modals for followers/following */}
      {showFollowers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-inc-card rounded-xl p-6 w-96">
            <h3 className="text-lg font-semibold mb-3">Followers</h3>
            <FollowersList handle={user.handle} type="followers" />
            <div className="mt-4 text-right">
              <button onClick={() => setShowFollowers(false)} className="px-4 py-2 rounded-full border">Close</button>
            </div>
          </div>
        </div>
      )}
      {showFollowing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-inc-card rounded-xl p-6 w-96">
            <h3 className="text-lg font-semibold mb-3">Following</h3>
            <FollowersList handle={user.handle} type="following" />
            <div className="mt-4 text-right">
              <button onClick={() => setShowFollowing(false)} className="px-4 py-2 rounded-full border">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
