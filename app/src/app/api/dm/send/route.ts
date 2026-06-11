import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const recipient_id = body.recipient_id
  const content = body.content
  const temp_client_id = body.temp_client_id
  if (!recipient_id || !content?.trim()) {
    return NextResponse.json({ error: 'recipient_id and content required' }, { status: 400 })
  }
  if (content.length > 2000) {
    return NextResponse.json({ error: 'Content exceeds 2000 characters' }, { status: 400 })
  }

  const { data: rel } = await supabase
    .from('dm_relationships')
    .select('*')
    .eq('user_id', recipient_id)
    .eq('allowed_user_id', user.id)
    .single()

  if (!rel) {
    return NextResponse.json({ error: 'User has not allowed DMs from you' }, { status: 403 })
  }

  const insertObj: Record<string, unknown> = {
    sender_id: user.id,
    recipient_id,
    content: content.trim(),
  }
  if (temp_client_id) insertObj.temp_client_id = temp_client_id

  const { data, error } = await supabase.from('direct_messages').insert(insertObj).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: data })
}
