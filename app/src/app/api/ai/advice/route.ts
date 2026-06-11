import { NextResponse } from 'next/server'
import { callAI } from '@/lib/ai/helper'

export async function POST(req: Request) {
  const { posts, question } = await req.json()
  if (!posts || !Array.isArray(posts) || posts.length === 0) {
    return NextResponse.json({ error: 'posts array required' }, { status: 400 })
  }

  const postText = posts.map((p: Record<string, unknown>) => `[${(p.mood as string) || 'general'}] ${p.content as string}`).join('\n')
  const questionText = question || 'What advice would help this person most right now?'
  const system = `You are a kind, empathetic advisor for an anonymous social platform. You read someone's posts and give thoughtful, personalized advice. Be warm, specific, and encouraging. Keep it under 150 words.`
  const user = `Here are their recent posts:\n${postText}\n\n---\n\n${questionText}`

  const result = await callAI(system, user, 0.6, 600)
  if (!result) return NextResponse.json({ error: 'AI unavailable' }, { status: 503 })

  return NextResponse.json({ advice: result })
}
