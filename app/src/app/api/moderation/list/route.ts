import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.from('moderation_jobs').select('id, post_id, created_at, result').eq('status', 'pending').order('created_at', { ascending: true }).limit(50)
  // include a short preview
  const jobs = (data ?? []).map((j: any) => ({ ...j, preview: undefined }))
  return NextResponse.json({ jobs })
}
