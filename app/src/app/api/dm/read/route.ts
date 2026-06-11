import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { other_id } = await req.json()
  if (!other_id) return NextResponse.json({ error: 'other_id required' }, { status: 400 })

  const { error } = await supabase
    .from('direct_messages')
    .update({ is_read: true })
    .eq('sender_id', other_id)
    .eq('recipient_id', user.id)
    .eq('is_read', false)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
