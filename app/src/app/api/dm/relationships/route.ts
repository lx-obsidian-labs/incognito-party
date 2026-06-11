import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('dm_relationships')
    .select('*, allowed_user:allowed_user_id ( handle )')
    .eq('user_id', user.id)

  return NextResponse.json({ relationships: data ?? [] })
}

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { allowed_user_id } = await req.json()
  if (!allowed_user_id) {
    return NextResponse.json({ error: 'allowed_user_id required' }, { status: 400 })
  }

  const { error } = await supabase.from('dm_relationships').upsert({
    user_id: user.id,
    allowed_user_id,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
