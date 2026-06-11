import { NextResponse } from 'next/server'
import { runWorker } from '@/lib/moderation/worker'

// POST /api/moderation/run
// Protected by a secret header: x-moderation-secret must match process.env.MODERATION_WORKER_SECRET
export async function POST(req: Request) {
  const secret = req.headers.get('x-moderation-secret') || ''
  if (!process.env.MODERATION_WORKER_SECRET || secret !== process.env.MODERATION_WORKER_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runWorker()
    return NextResponse.json({ ok: true, processed: Array.isArray(result) ? result.length : 0, result })
  } catch (e) {
    console.error('runWorker error', e)
    return NextResponse.json({ error: 'worker_error', detail: String(e) }, { status: 500 })
  }
}
