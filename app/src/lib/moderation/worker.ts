import { createAdminClient } from '@/lib/supabase/admin'

async function runOnce() {
  const supabase = createAdminClient()
  // fetch up to 10 pending jobs and process them sequentially
  const { data: jobs } = await supabase.from('moderation_jobs').select('*').eq('status', 'pending').limit(10)
  if (!jobs || jobs.length === 0) return []
  const results: Array<any> = []
  for (const job of jobs) {
    // processJob will mark status => processing/done/failed
    const r = await processJob(job.id)
    results.push({ jobId: job.id, result: r })
  }
  return results
}

export async function runWorker() {
  return await runOnce()
}

export async function processJob(jobId: string) {
  const supabase = createAdminClient()
  const { data: job } = await supabase.from('moderation_jobs').select('*').eq('id', jobId).maybeSingle()
  if (!job) return null
  await supabase.from('moderation_jobs').update({ status: 'processing' }).eq('id', jobId)

  const { data: post } = await supabase.from('posts').select('id, content').eq('id', job.post_id).maybeSingle()
  if (!post) {
    await supabase.from('moderation_jobs').update({ status: 'failed' }).eq('id', jobId)
    return null
  }

  // call NVIDIA moderation
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

  await supabase.from('moderation_jobs').update({ status: 'done', result, processed_at: new Date().toISOString() }).eq('id', jobId)
  await supabase.from('posts').update({ is_flagged: !!result.flagged }).eq('id', job.post_id)
  return result
}
