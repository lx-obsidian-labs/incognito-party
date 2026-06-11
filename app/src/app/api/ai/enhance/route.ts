import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { text, action } = await req.json()

  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'text is required' }, { status: 400 })
  }

  const nvidiaKey = process.env.NVIDIA_API_KEY
  const nvidiaBase = process.env.NVIDIA_API_URL

  if (!nvidiaKey || !nvidiaBase) {
    return NextResponse.json({ error: 'AI not configured' }, { status: 503 })
  }

  const prompts: Record<string, string> = {
    enhance: 'Rewrite the following text to be more engaging and well-written while keeping the same meaning and tone. Return only the rewritten text, nothing else:\n\n',
    friendly: 'Rewrite the following text to sound warmer and more friendly while keeping the same message. Return only the rewritten text, nothing else:\n\n',
    concise: 'Rewrite the following text to be more concise and clear. Remove unnecessary words. Return only the rewritten text, nothing else:\n\n',
    supportive: 'Rewrite the following text to be more supportive and encouraging while keeping the same message. Return only the rewritten text, nothing else:\n\n',
  }

  const prompt = prompts[action] || prompts.enhance

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
          { role: 'system', content: 'You are a helpful writing assistant. Rewrite text as requested. Return only the rewritten text, no explanations.' },
          { role: 'user', content: prompt + text },
        ],
        temperature: 0.7,
        max_tokens: 512,
      }),
    })

    if (!resp.ok) {
      return NextResponse.json({ error: 'AI service error' }, { status: 502 })
    }

    const json = await resp.json()
    const rewritten = json?.choices?.[0]?.message?.content?.trim()

    if (!rewritten) {
      return NextResponse.json({ error: 'Empty response from AI' }, { status: 502 })
    }

    return NextResponse.json({ rewritten })
  } catch (e) {
    console.error('AI enhance error', e)
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 502 })
  }
}
