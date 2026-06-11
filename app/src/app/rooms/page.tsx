'use client'

import { useEffect, useState } from 'react'
import RoomCard from '@/components/rooms/RoomCard'

export default function RoomsPage() {
  const [channels, setChannels] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [joined, setJoined] = useState<Record<string, boolean>>({})

  useEffect(() => {
    Promise.all([
      fetch('/api/channels').then((r) => r.json()),
      fetch('/api/channels/stats').then((r) => r.json()).catch(() => ({ stats: [] })),
    ]).then(([chRes, statsRes]) => {
      const chs = (chRes.channels ?? []) as Record<string, unknown>[]
      const stats = (statsRes.stats ?? []) as { channel_id: string; subscribers: number; recent_posts: number }[]
      const merged = chs.map((c) => {
        const s = stats.find((st) => st.channel_id === c.id) ?? { channel_id: '', subscribers: 0, recent_posts: 0 }
        const badge = computeBadge(s.subscribers, s.recent_posts, c.slug as string)
        return {
          ...c,
          badge,
          subscribers: s.subscribers ?? 0,
          talking: s.recent_posts ?? 0,
        }
      })
      setChannels(merged)
    }).finally(() => setLoading(false))
  }, [])

  function handleJoin(channelId: string) {
    setJoined((prev) => ({ ...prev, [channelId]: true }))
    setChannels((prev) => prev.map((c) => c.id === channelId ? ({ ...c, subscribers: ((c.subscribers as number) ?? 0) + 1 }) : c))
    fetch('/api/channels/sub', { method: 'POST', body: JSON.stringify({ channel_id: channelId }), headers: { 'Content-Type': 'application/json' } }).then((r) => r.json()).then((j: Record<string, unknown>) => {
      if (!j.success) {
        setJoined((prev) => ({ ...prev, [channelId]: false }))
        setChannels((prev) => prev.map((c) => c.id === channelId ? ({ ...c, subscribers: Math.max(0, ((c.subscribers as number) ?? 1) - 1) }) : c))
      }
    }).catch(() => {
      setJoined((prev) => ({ ...prev, [channelId]: false }))
    })
  }

  useEffect(() => {
    function onJoin(e: Event) {
      handleJoin((e as CustomEvent).detail.id)
    }
    window.addEventListener('room-join', onJoin)
    return () => window.removeEventListener('room-join', onJoin)
  }, [])

  return (
    <main className="px-4 pt-6">
      <h1 className="text-2xl font-semibold mb-2">Chat Rooms</h1>
      <p className="text-inc-muted mb-6">Join a room and start a conversation</p>

      <div className="space-y-4">
        {loading && <div className="text-inc-muted">Loading rooms…</div>}
        {!loading && channels.map((c: Record<string, unknown>) => (
          <RoomCard key={c.id as string} channel={{ ...c, joined: joined[c.id as string] }} />
        ))}
      </div>
    </main>
  )
}

function badgeForSlug(_slug: string) {
  switch (_slug) {
    case 'advice': return { label: 'Popular', tone: 'pink' }
    case 'confessions': return { label: 'Active', tone: 'green' }
    case 'wins': return { label: 'Popular', tone: 'pink' }
    case 'rants': return { label: 'Trending', tone: 'orange' }
    case 'daily': return { label: 'New', tone: 'blue' }
    case 'offtopic': return { label: 'Chill', tone: 'purple' }
    default: return null
  }
}

function computeBadge(subscribers: number, recent_posts: number, slug: string) {
  // thresholds (simple heuristics)
  if (recent_posts >= 20) return { label: 'Trending', tone: 'orange' }
  if (subscribers >= 500) return { label: 'Popular', tone: 'pink' }
  if (subscribers >= 50 && recent_posts >= 2) return { label: 'Active', tone: 'green' }
  if (subscribers < 50 && recent_posts > 0) return { label: 'New', tone: 'blue' }
  // fallback by slug
  switch (slug) {
    case 'advice': return { label: 'Popular', tone: 'pink' }
    case 'confessions': return { label: 'Active', tone: 'green' }
    case 'wins': return { label: 'Popular', tone: 'pink' }
    case 'rants': return { label: 'Trending', tone: 'orange' }
    case 'daily': return { label: 'New', tone: 'blue' }
    case 'offtopic': return { label: 'Chill', tone: 'purple' }
    default: return null
  }
}
