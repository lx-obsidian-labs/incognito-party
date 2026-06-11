'use client'

import { useState } from 'react'
import { toast } from 'sonner'

export default function CommentComposer({ postId, onCreated }: { postId: string; onCreated?: (c: Record<string, unknown>) => void }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!content.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/comments', { method: 'POST', body: JSON.stringify({ post_id: postId, content }), headers: { 'Content-Type': 'application/json' } })
      const json = await res.json()
      if (json.comment) {
        setContent('')
        onCreated?.(json.comment)
      } else {
        toast(json.error || 'Could not post comment')
      }
    } catch (err) {
      console.error(err)
      toast('Network error')
    } finally { setLoading(false) }
  }

  return (
    <div className="mt-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a helpful, kind response..."
        className="w-full rounded-md bg-inc-dark border border-inc-border p-3 text-sm text-inc-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inc-accent"
        rows={3}
      />
      <div className="mt-2 flex justify-end">
        <button onClick={submit} disabled={loading} className="rounded-full bg-inc-accent px-4 py-1 text-sm font-medium text-black disabled:opacity-50">
          {loading ? 'Posting...' : 'Post'}
        </button>
      </div>
    </div>
  )
}
