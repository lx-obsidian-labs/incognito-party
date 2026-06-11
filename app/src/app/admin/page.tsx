'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { HandleDisplay } from '@/components/shared/HandleDisplay'
import { formatRelativeTime } from '@/lib/utils'
import { Loader2, Shield } from 'lucide-react'
import { toast } from 'sonner'

interface ReportWithPost {
  id: string
  reason: string
  created_at: string
  post: {
    id: string
    content: string
    author_id: string
    author_handle?: string
    is_removed: boolean
    created_at: string
  }
}

export default function AdminPage() {
  const [reports, setReports] = useState<ReportWithPost[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchReports() {
    setLoading(true)
    const supabase = createClient()
    const { data: rawReports } = await supabase.from('reports').select().order('created_at', { ascending: false })
    const { data: users } = await supabase.from('anon_users').select()
    const userMap = new Map((users ?? []).map((u: Record<string, unknown>) => [u.id as string, u.handle as string]))

    const enriched: ReportWithPost[] = []
    for (const r of (rawReports ?? []) as Array<Record<string, unknown>>) {
      const { data: post } = await supabase.from('posts').select().eq('id', r.post_id as string).single()
      if (post) {
        enriched.push({
          id: r.id as string,
          reason: r.reason as string,
          created_at: r.created_at as string,
          post: {
            id: post.id as string,
            content: post.content as string,
            author_id: post.author_id as string,
            author_handle: userMap.get(post.author_id as string) ?? 'Unknown',
            is_removed: !!post.is_removed,
            created_at: post.created_at as string,
          },
        })
      }
    }
    setReports(enriched)
    setLoading(false)
  }

  useEffect(() => { fetchReports() }, [])

  async function handleRemovePost(postId: string) {
    const supabase = createClient()
    await supabase.from('posts').update({ is_removed: true, removed_at: new Date().toISOString() }).eq('id', postId)
    toast('Post removed')
    fetchReports()
  }

  async function handleDismissReport(reportId: string) {
    const supabase = createClient()
    await supabase.from('reports').delete().eq('id', reportId)
    toast('Report dismissed')
    fetchReports()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-inc-accent" />
      </div>
    )
  }

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-inc-accent" />
        <h1 className="text-lg font-bold text-inc-text">Admin — Reports</h1>
      </div>

      {reports.length === 0 && (
        <p className="text-inc-muted text-sm text-center py-12">No reports yet.</p>
      )}

      {reports.map((report) => (
        <div key={report.id} className="rounded-2xl border border-inc-border bg-inc-card p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-inc-text text-sm leading-relaxed whitespace-pre-wrap break-words">
                {report.post.content}
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-inc-muted">
                <HandleDisplay handle={report.post.author_handle ?? '?'} size="sm" />
                <span>{formatRelativeTime(report.post.created_at)}</span>
                {report.post.is_removed && (
                  <span className="text-red-400 font-medium">[Removed]</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-inc-border pt-3">
            <span className="text-xs text-inc-accent bg-inc-accent/10 rounded-full px-2.5 py-1">
              {report.reason}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleDismissReport(report.id)}
                aria-label="Dismiss report"
                className="flex items-center gap-1 rounded-lg border border-inc-border px-3 py-1.5 text-xs text-inc-muted hover:border-inc-accent hover:text-inc-accent transition-colors focus-visible:ring-2 focus-visible:ring-inc-accent focus-visible:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Dismiss
              </button>
              <button
                onClick={() => handleRemovePost(report.post.id)}
                disabled={report.post.is_removed}
                aria-label="Remove post"
                className="flex items-center gap-1 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Remove
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
