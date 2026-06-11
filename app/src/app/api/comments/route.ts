import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const supabase = await createServerSupabaseClient()
  const url = new URL(req.url)
  const postId = url.searchParams.get('post_id')
  if (!postId) return NextResponse.json({ error: 'post_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('comments')
    .select('*, author:author_id ( handle )')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comments: data ?? [] })
}

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const post_id = body.post_id
  const content = body.content?.trim()
  if (!post_id || !content) return NextResponse.json({ error: 'post_id and content required' }, { status: 400 })
  if (content.length > 1000) return NextResponse.json({ error: 'Content too long' }, { status: 400 })

  const { data, error } = await supabase.from('comments').insert({ post_id, author_id: user.id, content }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Optionally, could increment posts.comments_count here if we maintained a counter.
  return NextResponse.json({ comment: data })
}

export async function DELETE(req: Request) {
  const supabase = await createServerSupabaseClient()
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Ensure author owns the comment
  const { data: existing, error: fetchErr } = await supabase.from('comments').select('author_id, post_id').eq('id', id).single()
  if (fetchErr || !existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if ((existing as any).author_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabase.from('comments').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

export async function PATCH(req: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const id = body.id
  const content = body.content?.trim()
  if (!id || !content) return NextResponse.json({ error: 'id and content required' }, { status: 400 })
  if (content.length > 1000) return NextResponse.json({ error: 'Content too long' }, { status: 400 })

  const { data: existing, error: fetchErr } = await supabase.from('comments').select('author_id').eq('id', id).single()
  if (fetchErr || !existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if ((existing as any).author_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase.from('comments').update({ content }).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comment: data })
}
