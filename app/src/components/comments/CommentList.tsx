'use client'

import { useEffect, useState } from 'react'

export default function CommentList({ postId }: { postId: string }) {
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/comments?post_id=${postId}`)
      .then((r) => r.json())
      .then((j) => setComments(j.comments ?? []))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false))
  }, [postId])

  if (loading) return <div className="py-4 text-center text-inc-muted">Loading responses…</div>
  if (comments.length === 0) return <div className="py-4 text-inc-muted">No responses yet — be the first to help.</div>

  return (
    <div className="mt-4 space-y-3">
      {comments.map((c) => (
        <div key={c.id} className="rounded-md border border-inc-border p-3 bg-inc-darker">
          <div className="flex items-center justify-between text-xs text-inc-muted mb-1">
            <div>{c.author?.handle ?? 'Anon'}</div>
            <div>{new Date(c.created_at).toLocaleString()}</div>
          </div>
          <div className="text-sm text-inc-text">{c.content}</div>
        </div>
      ))}
    </div>
  )
}
