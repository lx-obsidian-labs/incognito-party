'use client'

export default function CommentList({ comments }: { comments: any[] }) {
  if (!comments) return null
  if (comments.length === 0) return <div className="py-4 text-inc-muted">No responses yet — be the first to help.</div>

  return (
    <div className="mt-4 space-y-3">
      {comments.map((c) => (
        <div key={c.id} className="rounded-md border border-inc-border p-3 bg-inc-darker">
          <div className="flex items-center justify-between text-xs text-inc-muted mb-1">
            <div>{(c as any).author?.handle ?? 'Anon'}</div>
            <div>{new Date((c as any).created_at).toLocaleString()}</div>
          </div>
          <div className="text-sm text-inc-text">{(c as any).content}</div>
        </div>
      ))}
    </div>
  )
}
