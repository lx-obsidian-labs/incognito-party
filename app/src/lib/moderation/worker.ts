import { createAdminClient } from '@/lib/supabase/admin'

async function runOnce() {
  const supabase = createAdminClient()
  // fetch one pending job
  const { data: jobs } = await supabase.from('moderation_jobs').select('*').eq('status', 'pending').limit(1)
  if (!jobs || jobs.length === 0) return
  const job = jobs[0]
  await supabase.from('moderation_jobs').update({ status: 'processing' }).eq('id', job.id)

  // load post
  const { data: post } = await supabase.from('posts').select('id, content').eq('id', job.post_id).maybeSingle()
  if (!post) {
    await supabase.from('moderation_jobs').update({ status: 'failed' }).eq('id', job.id)
    return
  }

  // call NVIDIA or Pollination using similar logic as API
  const nvidiaKey = process.env.NVIDIA_API_KEY
  const nvidiaBase = process.env.NVIDIA_API_URL
  let result: any = { flagged: false }
  try {
    if (nvidiaKey && nvidiaBase) {
      const resp = await fetch(`${nvidiaBase.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${nvidiaKey}` },
        body: JSON.stringify({ model: process.env.NVIDIA_MODEL || 'deepseek-ai/deepseek-v4-pro', messages: [{ role: 'system', content: 'You are a moderation assistant. Reply with JSON {"flagged": boolean, "reason": string|null}.' }, { role: 'user', content: `Please moderate: "${(post as any).content.replace(/"/g, '\\"')}"` }], temperature: 0, max_tokens: 256 }),
      })
      if (resp.ok) {
        const j = await resp.json().catch(() => null)
        const txt = j?.choices?.[0]?.message?.content
        if (txt) {
          try { result = JSON.parse(txt) } catch { result = { flagged: /offensive|abuse|hate|self.?harm/i.test(String(txt)) } }
        }
      }
    }
  } catch (e) {
    console.error('worker nvidia error', e)
  }

  // persist result and mark post
  await supabase.from('moderation_jobs').update({ status: 'done', result, processed_at: new Date().toISOString() }).eq('id', job.id)
  await supabase.from('posts').update({ is_flagged: !!result.flagged }).eq('id', job.post_id)
}

export async function runWorker() {
  // run in a loop for a short time (for serverless, run once per invocation)
  await runOnce()
}
