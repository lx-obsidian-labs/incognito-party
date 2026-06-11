import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { text } = await req.json()

  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'text is required' }, { status: 400 })
  }

  const nvidiaKey = process.env.NVIDIA_API_KEY
  const nvidiaBase = process.env.NVIDIA_API_URL

  if (!nvidiaKey || !nvidiaBase) {
    return NextResponse.json({ error: 'AI not configured' }, { status: 503 })
  }

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
          {
            role: 'system',
            content: `Analyze the sentiment of the given text and return ONLY a JSON object with these fields:
{
  "sentiment": "positive" | "negative" | "neutral" | "mixed",
  "emotion": "happy" | "sad" | "angry" | "anxious" | "excited" | "grateful" | "frustrated" | "hopeful" | "confused" | "tired" | "loved" | "lonely" | "peaceful",
  "tone": "supportive" | "venting" | "joking" | "serious" | "sarcastic" | "curious" | "encouraging",
  "label": "A short empathetic label (2-4 words) that captures how the person might be feeling"
}`,
          },
          { role: 'user', content: text },
        ],
        temperature: 0.1,
        max_tokens: 256,
      }),
    })

    if (!resp.ok) {
      return NextResponse.json({ error: 'AI service error' }, { status: 502 })
    }

    const json = await resp.json()
    const resultText = json?.choices?.[0]?.message?.content
    if (!resultText) {
      return NextResponse.json({ error: 'Empty response' }, { status: 502 })
    }

    let result
    try {
      result = JSON.parse(resultText)
    } catch {
      result = { sentiment: 'neutral', emotion: 'neutral', tone: 'serious', label: 'sharing thoughts' }
    }

    return NextResponse.json(result)
  } catch (e) {
    console.error('AI sentiment error', e)
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 502 })
  }
}
