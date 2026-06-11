import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { post_id, reason } = await req.json()
  if (!post_id || !reason) {
    return NextResponse.json({ error: 'post_id and reason required' }, { status: 400 })
  }

  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    post_id,
    reason,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
