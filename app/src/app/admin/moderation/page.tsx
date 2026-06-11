'use client'

import { useEffect, useState } from 'react'

export default function AdminModerationPage() {
  const [jobs, setJobs] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)

  function fetchJobs() {
    setLoading(true)
    fetch('/api/moderation/list').then((r) => r.json()).then((j: Record<string, unknown>) => setJobs((j.jobs ?? []) as Record<string, unknown>[])).finally(() => setLoading(false))
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchJobs() }, [])

  async function process(jobId: string) {
    setLoading(true)
    await fetch(`/api/moderation/process?id=${jobId}`, { method: 'POST' }).then(() => fetchJobs()).finally(() => setLoading(false))
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Moderation Queue</h2>
      {loading && <div>Loading…</div>}
      {!loading && jobs.length === 0 && <div>No pending jobs</div>}
      <div className="space-y-3">
        {jobs.map((j: Record<string, unknown>) => (
          <div key={j.id as string} className="p-3 rounded-md border bg-inc-card">
            <div className="text-sm text-inc-muted">Post: {j.post_id as string}</div>
            <div className="mt-2 text-sm">{(j.preview as string) ?? 'No preview'}</div>
            <div className="mt-3 text-right">
              <button onClick={() => process(j.id as string)} className="rounded-full bg-inc-accent px-3 py-1 text-black">Process</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
