import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { post_id } = await req.json()
  if (!post_id) return NextResponse.json({ error: 'post_id required' }, { status: 400 })

  const { error } = await supabase.from('interactions').upsert({
    post_id,
    user_id: user.id,
    type: 'like',
    amount: 0,
  }, { onConflict: 'post_id, user_id, type' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
