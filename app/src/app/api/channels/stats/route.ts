import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// Simple in-memory cache to avoid repeated DB counts on high traffic.
// Note: serverless functions are ephemeral; cache helps per-instance only.
let _statsCache: { ts: number; stats: any[] } | null = null
const CACHE_TTL = 30_000 // 30 seconds

export async function GET() {
  // Return cached result when fresh
  if (_statsCache && Date.now() - _statsCache.ts < CACHE_TTL) {
    return NextResponse.json({ stats: _statsCache.stats })
  }

  const supabase = await createServerSupabaseClient()

  const { data: channels } = await supabase.from('channels').select('id')
  if (!channels) return NextResponse.json({ stats: [] })

  // For each channel compute subscribers and recent_posts (last 24h).
  const stats = await Promise.all((channels as any[]).map(async (c) => {
    const channelId = c.id as string
    const subsRes = await supabase.from('channel_subs').select('user_id', { count: 'exact' }).eq('channel_id', channelId)
    const postsRes = await supabase.from('posts').select('id', { count: 'exact' }).eq('channel_id', channelId).gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    return {
      channel_id: channelId,
      subscribers: subsRes.count ?? 0,
      recent_posts: postsRes.count ?? 0,
    }
  }))

  // Update cache
  _statsCache = { ts: Date.now(), stats }

  return NextResponse.json({ stats })
}
