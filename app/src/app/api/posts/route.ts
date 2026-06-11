import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const supabase = await createServerSupabaseClient()
  const url = new URL(req.url)
  const channelSlug = url.searchParams.get('channel')
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '25'), 50)

  let query = supabase
    .from('posts')
    .select(`
      *,
      mood,
      author:author_id ( handle ),
      interactions ( type, user_id ),
      comments_count: (select count(*) from comments where comments.post_id = posts.id)
    `)
    .eq('is_removed', false)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (channelSlug) {
    const { data: channel } = await supabase
      .from('channels')
      .select('id')
      .eq('slug', channelSlug)
      .single()
    if (channel) query = query.eq('channel_id', channel.id)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ posts: data ?? [] })
}

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { channel_id, content, media_url, mood } = await req.json()
  if (!channel_id || !content?.trim()) {
    return NextResponse.json({ error: 'channel_id and content required' }, { status: 400 })
  }
  if (content.length > 500) {
    return NextResponse.json({ error: 'Content exceeds 500 characters' }, { status: 400 })
  }

  // Optional moderation via Pollination/Aggregated moderation API
  let is_flagged = false
  try {
    // Prefer NVIDIA integrated model if present (uses OpenAI-compatible chat completions endpoint)
    const nvidiaKey = process.env.NVIDIA_API_KEY
    const nvidiaBase = process.env.NVIDIA_API_URL
    if (nvidiaKey && nvidiaBase) {
      try {
        const resp = await fetch(`${nvidiaBase.replace(/\/$/, '')}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${nvidiaKey}`,
          },
          body: JSON.stringify({
            model: process.env.NVIDIA_MODEL || 'deepseek-ai/deepseek-v4-pro',
            messages: [
              { role: 'system', content: 'You are a content moderation assistant. Respond with valid JSON only: {"flagged": boolean, "reason": string|null}.' },
              { role: 'user', content: `Moderate the following text for abusive, sexual, hateful, or self-harm content. Return only JSON: {"flagged": boolean, "reason": string|null}. Text: "${content.replace(/"/g, '\\"')}"` },
            ],
            temperature: 0,
            max_tokens: 256,
          }),
        })
        if (resp.ok) {
          const j = await resp.json().catch(() => null)
          const txt = j?.choices?.[0]?.message?.content ?? j?.choices?.[0]?.delta?.content
          if (txt) {
            try {
              const parsed = JSON.parse(txt)
              if (typeof parsed.flagged === 'boolean') is_flagged = parsed.flagged
            } catch {
              // if model didn't return strict JSON, do a heuristic check
              const lowered = String(txt).toLowerCase()
              if (lowered.includes('true') && lowered.includes('flag')) is_flagged = true
            }
          }
        }
      } catch (e) {
        // fall through to Pollination below if NVIDIA call fails
        console.error('NVIDIA moderation error', e)
      }
    }
    // If not decided by NVIDIA, fallback to Pollination-style moderation
    if (!is_flagged) {
      const key = process.env.POLLINATION_API_KEY
      const url = process.env.POLLINATION_API_URL
      if (key && url) {
        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({ text: content }),
        })
        if (resp.ok) {
          const j = await resp.json().catch(() => null)
          // Interpret response: accept either { flagged: boolean } or { score: number }
          if (j) {
            if (typeof j.flagged === 'boolean') is_flagged = j.flagged
            else if (typeof j.score === 'number') is_flagged = j.score >= 0.7
            else if (j.labels && Array.isArray(j.labels) && j.labels.length > 0) is_flagged = true
          }
        }
      }
    }
  } catch (e) {
    // don't block posting on moderation API failure
    console.error('Moderation API error', e)
  }

  const { data, error } = await supabase.from('posts').insert({
    channel_id,
    author_id: user.id,
    content: content.trim(),
    media_url: media_url ?? null,
    mood: mood ?? null,
    is_flagged,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ post: data })
}
