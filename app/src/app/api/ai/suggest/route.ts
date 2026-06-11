import { NextResponse } from 'next/server'
import { callAI } from '@/lib/ai/helper'

export async function POST(req: Request) {
  const { mode, context } = await req.json()

  const modes: Record<string, { system: string; prompt: string }> = {
    'daily-summary': {
      system: 'You write warm, friendly daily summaries based on someone\'s posts. Make it feel like a caring friend reflecting on their day. Keep it under 100 words.',
      prompt: 'Write a warm summary of this person\'s day based on their posts:\n\n',
    },
    'food-suggestion': {
      system: 'You are a friendly local food expert. Give specific, exciting food suggestions. If a location is mentioned, suggest real local spots. Keep it under 120 words.',
      prompt: 'Suggest something amazing to eat or cook:\n\n',
    },
    'activity-suggestion': {
      system: 'You suggest fun, creative activities and things to do. Be specific and encouraging. Keep it under 100 words.',
      prompt: 'Suggest something fun to do:\n\n',
    },
    'life-suggestion': {
      system: 'You give warm, practical life suggestions. Be kind and specific. Keep it under 100 words.',
      prompt: 'Give a gentle life suggestion:\n\n',
    },
    'encouragement': {
      system: 'You are a warm friend sending encouragement. Be genuine and uplifting. Keep it under 80 words.',
      prompt: 'Write an encouraging message:\n\n',
    },
  }

  const modeConfig = modes[mode] || modes['daily-summary']
  const input = context || ''
  const user = modeConfig.prompt + input

  const result = await callAI(modeConfig.system, user, 0.6, 400)
  if (!result) return NextResponse.json({ error: 'AI unavailable' }, { status: 503 })

  return NextResponse.json({ message: result })
}
