import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const supabase = await createServerSupabaseClient()
  const url = new URL(req.url)
  const channelSlug = url.searchParams.get('channel')
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '25'), 50)

  let query = supabase
    .from('posts')
    .select(`
      *,
      mood,
      author:author_id ( handle ),
      interactions ( type, user_id ),
      comments_count: (select count(*) from comments where comments.post_id = posts.id)
    `)
    .eq('is_removed', false)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (channelSlug) {
    const { data: channel } = await supabase
      .from('channels')
      .select('id')
      .eq('slug', channelSlug)
      .single()
    if (channel) query = query.eq('channel_id', channel.id)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ posts: data ?? [] })
}

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { channel_id, content, media_url, mood } = await req.json()
  if (!channel_id || !content?.trim()) {
    return NextResponse.json({ error: 'channel_id and content required' }, { status: 400 })
  }
  if (content.length > 500) {
    return NextResponse.json({ error: 'Content exceeds 500 characters' }, { status: 400 })
  }

  const { data, error } = await supabase.from('posts').insert({
    channel_id,
    author_id: user.id,
    content: content.trim(),
    media_url: media_url ?? null,
    mood: mood ?? null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ post: data })
}
