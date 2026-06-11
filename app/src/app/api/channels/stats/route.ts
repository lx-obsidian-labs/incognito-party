import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
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

  return NextResponse.json({ stats })
}
