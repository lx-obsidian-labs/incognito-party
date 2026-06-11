'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/hooks/useSession'
import { createClient } from '@/lib/supabase/client'
import { AvatarPlaceholder } from '@/components/shared/AvatarPlaceholder'
import { HandleDisplay } from '@/components/shared/HandleDisplay'
import { toast } from 'sonner'

export default function BlockedUsersPage() {
  const { user, loading: sessionLoading } = useSession()
  const [blockedList, setBlockedList] = useState<
    Array<{ id: string; blocked_user_id: string; blocked_handle: string }>
  >([])
  const [loading, setLoading] = useState(true)
  const [blockHandle, setBlockHandle] = useState('')
  const [blocking, setBlocking] = useState(false)

  async function fetchBlocked() {
    const supabase = createClient()
    const { data: session } = await supabase.auth.getSession()
    if (!session.session?.user) return

    const { data: blockedRows } = await supabase
      .from('blocked_users')
      .select('*')
      .eq('user_id', session.session.user.id)

    const rows = (blockedRows ?? []) as Array<Record<string, unknown>>
    if (rows.length === 0) {
      setBlockedList([])
      setLoading(false)
      return
    }

    const { data: allUsers } = await supabase.from('anon_users').select('*')
    const userMap = new Map(
      (allUsers ?? []).map((u: Record<string, unknown>) => [u.id, u]),
    )

    setBlockedList(
      rows.map((r) => ({
        id: r.id as string,
        blocked_user_id: r.blocked_user_id as string,
        blocked_handle: (userMap.get(r.blocked_user_id as string) as Record<string, unknown> | undefined)
          ?.handle as string ?? 'Unknown',
      })),
    )
    setLoading(false)
  }

  useEffect(() => {
    if (!sessionLoading && user) fetchBlocked()
  }, [sessionLoading, user])

  async function handleBlock() {
    const handle = blockHandle.trim()
    if (!handle) return

    const supabase = createClient()
    const { data: session } = await supabase.auth.getSession()
    if (!session.session?.user) return

    setBlocking(true)

    const { data: targetUser } = await supabase
      .from('anon_users')
      .select('*')
      .eq('handle', handle)
      .single()

    if (!targetUser) {
      toast('User not found')
      setBlocking(false)
      return
    }

    const t = targetUser as Record<string, unknown>

    if (t.id === session.session.user.id) {
      toast('You cannot block yourself')
      setBlocking(false)
      return
    }

    const { data: existing } = await supabase
      .from('blocked_users')
      .select('*')
      .eq('user_id', session.session.user.id)
      .eq('blocked_user_id', t.id)
      .single()

    if (existing) {
      toast('User is already blocked')
      setBlocking(false)
      return
    }

    await supabase.from('blocked_users').insert({
      user_id: session.session.user.id,
      blocked_user_id: t.id,
    })

    setBlockHandle('')
    setBlocking(false)
    fetchBlocked()
    toast(`Blocked @${handle}`)
  }

  async function handleUnblock(blockedUserId: string) {
    const supabase = createClient()
    const { data: session } = await supabase.auth.getSession()
    if (!session.session?.user) return

    await supabase
      .from('blocked_users')
      .delete()
      .eq('user_id', session.session.user.id)
      .eq('blocked_user_id', blockedUserId)

    fetchBlocked()
    toast('User unblocked')
  }

  if (sessionLoading || loading) {
    return (
      <div className="px-4 py-4 space-y-4">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-inc-text">Blocked Users</h1>
        </div>
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-inc-border border-t-inc-accent" />
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 space-y-6">
      <h1 className="text-lg font-bold text-inc-text">Blocked Users</h1>

      <div className="flex gap-2">
        <input
          type="text"
          value={blockHandle}
          onChange={(e) => setBlockHandle(e.target.value)}
          placeholder="Enter handle to block..."
          className="flex-1 rounded-xl border border-inc-border bg-inc-card px-4 py-2.5 text-inc-text placeholder-inc-muted focus:border-inc-accent focus:outline-none focus:ring-1 focus:ring-inc-accent"
          onKeyDown={(e) => { if (e.key === 'Enter') handleBlock() }}
        />
        <button
          onClick={handleBlock}
          disabled={blocking || !blockHandle.trim()}
          className="shrink-0 rounded-xl bg-inc-accent px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {blocking ? 'Blocking...' : 'Block'}
        </button>
      </div>

      {blockedList.length === 0 ? (
        <p className="text-center text-inc-muted py-12">No blocked users</p>
      ) : (
        <div className="space-y-2">
          {blockedList.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between rounded-xl border border-inc-border bg-inc-card p-3"
            >
              <div className="flex items-center gap-3">
                <AvatarPlaceholder handle={b.blocked_handle} size="sm" />
                <HandleDisplay handle={b.blocked_handle} size="sm" />
              </div>
              <button
                onClick={() => handleUnblock(b.blocked_user_id)}
                className="rounded-lg border border-inc-border px-3 py-1.5 text-sm text-inc-text hover:bg-inc-accent hover:text-white transition-colors"
              >
                Unblock
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
