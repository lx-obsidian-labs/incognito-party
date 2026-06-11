import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ user: null })
  }

  const { data } = await supabase
    .from('anon_users')
    .select('*')
    .eq('id', user.id)
    .single()

  return NextResponse.json({ user: data })
}
