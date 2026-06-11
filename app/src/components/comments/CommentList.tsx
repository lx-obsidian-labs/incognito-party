'use client'

import { useState } from 'react'
import { useSession } from '@/hooks/useSession'

function relTime(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return `${sec}s`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h`
  const day = Math.floor(hr / 24)
  return `${day}d`
}

export default function CommentList({ comments: initial }: { comments: any[] }) {
  const { user } = useSession()
  const [comments, setComments] = useState(initial ?? [])

  async function remove(id: string) {
    if (!confirm('Delete this response?')) return
    const res = await fetch(`/api/comments?id=${id}`, { method: 'DELETE' })
    const j = await res.json()
    if (j.success) setComments((s) => s.filter((c: any) => c.id !== id))
    else alert(j.error || 'Could not delete')
  }

  async function edit(id: string, current: string) {
    const next = prompt('Edit your response', current)
    if (next === null) return
    const res = await fetch('/api/comments', { method: 'PATCH', body: JSON.stringify({ id, content: next }), headers: { 'Content-Type': 'application/json' } })
    const j = await res.json()
    if (j.comment) setComments((s) => s.map((c: any) => c.id === id ? j.comment : c))
    else alert(j.error || 'Could not update')
  }

  if (!comments) return null
  if (comments.length === 0) return <div className="py-4 text-inc-muted">No responses yet — be the first to help.</div>

  return (
    <div className="mt-4 space-y-3">
      {comments.map((c: any) => (
        <div key={c.id} className="rounded-md border border-inc-border p-3 bg-inc-darker">
          <div className="flex items-center justify-between text-xs text-inc-muted mb-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-inc-secondary flex items-center justify-center text-sm font-medium">{(c.author?.handle ?? 'A').slice(0,2)}</div>
              <div>{c.author?.handle ?? 'Anon'}</div>
            </div>
            <div>{relTime(c.created_at)} ago</div>
          </div>
          <div className="text-sm text-inc-text">{c.content}</div>
          {user?.id === c.author_id && (
            <div className="mt-2 flex gap-2">
              <button onClick={() => edit(c.id, c.content)} className="text-xs text-inc-muted hover:underline">Edit</button>
              <button onClick={() => remove(c.id)} className="text-xs text-inc-muted hover:underline">Delete</button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
