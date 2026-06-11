import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { channel_id } = await req.json()
  if (!channel_id) return NextResponse.json({ error: 'channel_id required' }, { status: 400 })

  const { error } = await supabase.from('channel_subs').upsert({
    user_id: user.id,
    channel_id,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
