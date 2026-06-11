'use client'

import { useEffect, useState } from 'react'
import { AvatarPlaceholder } from '@/components/shared/AvatarPlaceholder'

export default function FollowersList({ handle, type = 'followers' }: { handle: string; type?: 'followers' | 'following' }) {
  const [list, setList] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/users/follows?handle=${encodeURIComponent(handle)}&type=${type}`)
      .then((r) => r.json())
      .then((j: Record<string, unknown>) => setList((j.users ?? []) as Record<string, unknown>[]))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }, [handle, type])

  if (loading) return <div className="py-4 text-inc-muted">Loading…</div>
  if (list.length === 0) return <div className="py-4 text-inc-muted">No users yet</div>

  return (
    <div className="space-y-2">
      {list.map((u: Record<string, unknown>) => (
        <div key={u.id as string} className="flex items-center gap-3">
          <AvatarPlaceholder handle={u.handle as string} size="sm" color={u.avatar_color as string} />
          <div className="text-sm font-medium">@{u.handle as string}</div>
        </div>
      ))}
    </div>
  )
}
