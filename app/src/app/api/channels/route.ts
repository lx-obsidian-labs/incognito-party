import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.from('channels').select('*').order('slug')
  return NextResponse.json({ channels: data ?? [] })
}
