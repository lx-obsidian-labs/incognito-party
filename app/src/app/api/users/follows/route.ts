import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// GET /api/users/follows?handle=someone&type=followers|following
export async function GET(req: Request) {
  const url = new URL(req.url)
  const handle = url.searchParams.get('handle')
  const type = url.searchParams.get('type') || 'followers'
  if (!handle) return NextResponse.json({ error: 'handle required' }, { status: 400 })

  const supabase = await createServerSupabaseClient()
  // find user id
  const { data: user } = await supabase.from('anon_users').select('id, handle, avatar_color').eq('handle', handle).maybeSingle()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  if (type === 'followers') {
    // followers: rows where followed_id = user.id, return follower handle and avatar
    const { data } = await supabase.from('follows').select('follower_id').eq('followed_id', user.id)
    const ids = (data ?? []).map((r: any) => r.follower_id)
    if (ids.length === 0) return NextResponse.json({ count: 0, users: [] })
    const { data: users } = await supabase.from('anon_users').select('id, handle, avatar_color').in('id', ids)
    return NextResponse.json({ count: users?.length ?? 0, users: users ?? [] })
  }

  // following: rows where follower_id = user.id
  const { data } = await supabase.from('follows').select('followed_id').eq('follower_id', user.id)
  const ids = (data ?? []).map((r: any) => r.followed_id)
  if (ids.length === 0) return NextResponse.json({ count: 0, users: [] })
  const { data: users } = await supabase.from('anon_users').select('id, handle, avatar_color').in('id', ids)
  return NextResponse.json({ count: users?.length ?? 0, users: users ?? [] })
}
