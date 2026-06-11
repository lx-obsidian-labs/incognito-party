import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()

  // subscribers count from channel_subs and recent posts count in last 24h
  const sql = `
    SELECT
      c.id as channel_id,
      COUNT(distinct cs.user_id) as subscribers,
      COUNT(p.id) FILTER (WHERE p.created_at >= now() - interval '24 hours') as recent_posts
    FROM channels c
    LEFT JOIN channel_subs cs ON cs.channel_id = c.id
    LEFT JOIN posts p ON p.channel_id = c.id
    GROUP BY c.id
  `

  const { data, error } = await supabase.rpc('sql', { q: sql } as any).catch(() => ({ data: null, error: null }))

  // Fallback: if RPC not allowed, return empty stats
  if (error || !data) return NextResponse.json({ stats: [] })

  return NextResponse.json({ stats: data })
}
