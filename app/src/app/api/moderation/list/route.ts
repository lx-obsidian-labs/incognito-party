import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.from('moderation_jobs').select('id, post_id, created_at, result').eq('status', 'pending').order('created_at', { ascending: true }).limit(50)
  // include a short preview by fetching post content (trimmed)
  const jobs: Array<Record<string, unknown>> = []
  for (const j of (data ?? [])) {
    const { data: post } = await supabase.from('posts').select('content').eq('id', j.post_id).maybeSingle()
    jobs.push({ ...j, preview: post?.content ? (String(post.content).slice(0, 240)) : undefined })
  }
  return NextResponse.json({ jobs })
}
