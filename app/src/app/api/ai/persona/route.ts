import { NextResponse } from 'next/server'
import { callAI } from '@/lib/ai/helper'

export async function POST(req: Request) {
  const { posts } = await req.json()
  if (!posts || !Array.isArray(posts) || posts.length === 0) {
    return NextResponse.json({ error: 'posts array required' }, { status: 400 })
  }

  const postText = posts.map((p: any) => `[${p.mood || 'general'}] ${p.content}`).join('\n')
  const system = `Analyze these anonymous posts and return ONLY a JSON object:
{
  "persona": "A short 2-3 word label describing this person's current life persona",
  "vibe": "overall emotional vibe based on posts (e.g. reflective, struggling, thriving, curious, creative, lonely, hopeful)",
  "interests": ["interest1", "interest2", "interest3"],
  "needs": "What this person might need right now (e.g. encouragement, advice, connection, distraction, inspiration)",
  "topics": ["topic1", "topic2"],
  "advice": "A short piece of personalized advice based on what they've shared"
}`
  const result = await callAI(system, postText, 0.2, 512)
  if (!result) return NextResponse.json({ error: 'AI unavailable' }, { status: 503 })

  try {
    return NextResponse.json(JSON.parse(result))
  } catch {
    return NextResponse.json({
      persona: 'thoughtful soul',
      vibe: 'reflective',
      interests: ['life', 'connections', 'growth'],
      needs: 'a listening ear',
      topics: ['general'],
      advice: 'Keep sharing — your voice matters.',
    })
  }
}
