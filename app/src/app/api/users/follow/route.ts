import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const followed_id = body.followed_id
  if (!followed_id) return NextResponse.json({ error: 'followed_id required' }, { status: 400 })

  const { error } = await supabase.from('follows').insert({ follower_id: user.id, followed_id })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const followed_id = url.searchParams.get('followed_id')
  if (!followed_id) return NextResponse.json({ error: 'followed_id required' }, { status: 400 })

  const { error } = await supabase.from('follows').delete().eq('follower_id', user.id).eq('followed_id', followed_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
