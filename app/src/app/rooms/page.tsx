'use client'

import { useEffect, useState } from 'react'
import { CHANNELS } from '@/lib/constants/channels'
import RoomCard from '@/components/rooms/RoomCard'

export default function RoomsPage() {
  const [channels, setChannels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/channels').then((r) => r.json()),
      fetch('/api/channels/stats').then((r) => r.json()).catch(() => ({ stats: [] })),
    ]).then(([chRes, statsRes]) => {
      const chs = (chRes.channels ?? []) as any[]
      const stats = (statsRes.stats ?? []) as any[]
      const merged = chs.map((c) => ({
        ...c,
        // fill in default badges by slug mapping
        badge: badgeForSlug(c.slug),
        subscribers: (stats.find((s) => s.channel_id === c.id)?.subscribers) ?? 0,
        talking: (stats.find((s) => s.channel_id === c.id)?.recent_posts) ?? 0,
      }))
      setChannels(merged)
    }).finally(() => setLoading(false))
  }, [])

  return (
    <main className="px-4 pt-6">
      <h1 className="text-2xl font-semibold mb-2">Chat Rooms</h1>
      <p className="text-inc-muted mb-6">Join a room and start a conversation</p>

      <div className="space-y-4">
        {loading && <div className="text-inc-muted">Loading rooms…</div>}
        {!loading && channels.map((c) => (
          <RoomCard key={c.id} channel={c} />
        ))}
      </div>
    </main>
  )
}

function badgeForSlug(slug: string) {
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
