'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AvatarPlaceholder } from '@/components/shared/AvatarPlaceholder'
import { HandleDisplay } from '@/components/shared/HandleDisplay'
import { formatRelativeTime } from '@/lib/utils'

export default function SearchPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [posts, setPosts] = useState<Record<string, unknown>[]>([])
  const [users, setUsers] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    if (!query.trim()) {
      setPosts([])
      setUsers([])
      setSearched(false)
      setLoading(false)
      return
    }

    setLoading(true)
    timerRef.current = setTimeout(async () => {
      const supabase = createClient()
      const q = query.toLowerCase()

      const [{ data: postsData }, { data: usersData }] = await Promise.all([
        supabase.from('posts').select('*').ilike('content', `%${q}%`).limit(20),
        supabase.from('anon_users').select('*').ilike('handle', `%${q}%`).limit(20),
      ])

      const postResults = (postsData ?? []) as Record<string, unknown>[]
      const userResults = (usersData ?? []) as Record<string, unknown>[]

      if (postResults.length > 0) {
        const authorIds = [...new Set(postResults.map((p) => p.author_id as string))]
        const { data: authors } = await supabase.from('anon_users').select('id, handle').in('id', authorIds)
        const userMap = new Map((authors ?? []).map((u: Record<string, unknown>) => [u.id, u.handle as string]))
        for (const p of postResults) {
          p.author_handle = userMap.get(p.author_id as string) ?? 'Unknown'
        }
      }

      setPosts(postResults)
      setUsers(userResults)
      setSearched(true)
      setLoading(false)
    }, 300)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query])

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-inc-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search posts and users..."
          className="w-full rounded-xl border border-inc-border bg-inc-card py-3 pl-10 pr-4 text-inc-text placeholder-inc-muted focus:border-inc-accent focus:outline-none focus:ring-1 focus:ring-inc-accent"
        />
      </div>

      {!query.trim() && !searched && (
        <p className="text-center text-inc-muted py-12">Search posts and users...</p>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-inc-border border-t-inc-accent" />
        </div>
      )}

      {!loading && searched && posts.length === 0 && users.length === 0 && (
        <p className="text-center text-inc-muted py-12">
          No results found for &lsquo;{query}&rsquo;
        </p>
      )}

      {!loading && users.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-inc-muted uppercase tracking-wider mb-2">Users</h2>
          <div className="space-y-1">
            {users.map((u) => (
              <button
                key={u.id as string}
                onClick={() => router.push(`/dm/${u.handle as string}`)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 hover:bg-inc-card transition-colors text-left"
              >
                <AvatarPlaceholder handle={u.handle as string} size="sm" />
                <HandleDisplay handle={u.handle as string} size="sm" />
              </button>
            ))}
          </div>
        </section>
      )}

      {!loading && posts.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-inc-muted uppercase tracking-wider mb-2">Posts</h2>
          <div className="space-y-2">
            {posts.map((p) => {
              const content = p.content as string
              const preview = content.length > 100 ? content.slice(0, 100) + '...' : content
              return (
                <button
                  key={p.id as string}
                  onClick={() => router.push(`/post/${p.id as string}`)}
                  className="flex w-full items-start gap-3 rounded-xl border border-inc-border p-3 hover:bg-inc-card transition-colors text-left"
                >
                  <AvatarPlaceholder handle={p.author_handle as string} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <HandleDisplay handle={p.author_handle as string} size="sm" />
                      <span className="text-inc-muted text-xs shrink-0">
                        {formatRelativeTime(p.created_at as string)}
                      </span>
                    </div>
                    <p className="text-inc-text text-sm mt-1 break-words">{preview}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
