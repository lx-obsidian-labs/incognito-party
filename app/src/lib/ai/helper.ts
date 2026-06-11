const NVIDIA_BASE = process.env.NVIDIA_API_URL?.replace(/\/$/, '') || ''
const NVIDIA_KEY = process.env.NVIDIA_API_KEY || ''
const MODEL = process.env.NVIDIA_MODEL || 'deepseek-ai/deepseek-v4-pro'

export async function callAI(system: string, user: string, temperature = 0.3, maxTokens = 512) {
  if (!NVIDIA_KEY || !NVIDIA_BASE) return null

  try {
    const resp = await fetch(`${NVIDIA_BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${NVIDIA_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        temperature,
        max_tokens: maxTokens,
      }),
    })
    if (!resp.ok) return null
    const json = await resp.json()
    return json?.choices?.[0]?.message?.content?.trim() || null
  } catch {
    return null
  }
}
