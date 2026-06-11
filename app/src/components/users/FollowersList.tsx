'use client'

import { useEffect, useState } from 'react'
import { AvatarPlaceholder } from '@/components/shared/AvatarPlaceholder'

export default function FollowersList({ handle, type = 'followers' }: { handle: string; type?: 'followers' | 'following' }) {
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/users/follows?handle=${encodeURIComponent(handle)}&type=${type}`)
      .then((r) => r.json())
      .then((j) => setList(j.users ?? []))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }, [handle, type])

  if (loading) return <div className="py-4 text-inc-muted">Loading…</div>
  if (list.length === 0) return <div className="py-4 text-inc-muted">No users yet</div>

  return (
    <div className="space-y-2">
      {list.map((u) => (
        <div key={u.id} className="flex items-center gap-3">
          <AvatarPlaceholder handle={u.handle} size="sm" color={u.avatar_color} />
          <div className="text-sm font-medium">@{u.handle}</div>
        </div>
      ))}
    </div>
  )
}
