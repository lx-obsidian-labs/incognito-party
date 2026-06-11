'use client'

import { useState } from 'react'
import { toast } from 'sonner'
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
    else toast(j.error || 'Could not delete')
  }

  async function edit(id: string, current: string) {
    // kept for backward compatibility but not used; inline editor preferred
    return
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
            <div className="mt-2">
              {!c._editing ? (
                <div className="flex gap-2">
                  <button onClick={() => setComments((s: any[]) => s.map((x: any) => x.id === c.id ? { ...x, _editing: true, _editContent: x.content } : x))} className="text-xs text-inc-muted hover:underline">Edit</button>
                  <button onClick={() => remove(c.id)} className="text-xs text-inc-muted hover:underline">Delete</button>
                </div>
              ) : (
                <div className="mt-2">
                  <textarea value={c._editContent} onChange={(e) => setComments((s: any[]) => s.map((x: any) => x.id === c.id ? { ...x, _editContent: e.target.value } : x))} className="w-full rounded-md bg-inc-dark border border-inc-border p-2 text-sm text-inc-text" rows={3} />
                  <div className="mt-2 flex gap-2 justify-end">
                    <button onClick={async () => {
                      const content = (c._editContent ?? '').trim()
                      if (!content) { toast('Content required'); return }
                      const res = await fetch('/api/comments', { method: 'PATCH', body: JSON.stringify({ id: c.id, content }), headers: { 'Content-Type': 'application/json' } })
                      const j = await res.json()
                      if (j.comment) setComments((s: any[]) => s.map((x: any) => x.id === c.id ? j.comment : x))
                      else toast(j.error || 'Could not update')
                    }} className="rounded-full bg-inc-accent px-3 py-1 text-xs font-medium text-black">Save</button>
                    <button onClick={() => setComments((s: any[]) => s.map((x: any) => x.id === c.id ? { ...x, _editing: false, _editContent: undefined } : x))} className="rounded-full border border-inc-border px-3 py-1 text-xs">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
