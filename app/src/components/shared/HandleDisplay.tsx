'use client'

import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  handle: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  online?: boolean
}

const colors = [
  '#00f0ff', '#ff00aa', '#ff6b35', '#00ff87', '#ffd700',
  '#ff69b4', '#7b68ee', '#00ced1', '#ff4500', '#32cd32',
]

function colorFromHandle(handle: string): string {
  let hash = 0
  for (let i = 0; i < handle.length; i++) {
    hash = handle.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function HandleDisplay({ handle, size = 'md', className, online }: Props) {
  const color = colorFromHandle(handle)
  const sizeClass = { sm: 'text-sm', md: 'text-base', lg: 'text-lg' }
  const [isFollowed, setIsFollowed] = useState(false)

  useEffect(() => {
    // check follow status when rendered inside client
    let mounted = true
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return
      // resolve handle -> user id first
      const { data: u } = await supabase.from('anon_users').select('id').eq('handle', handle).maybeSingle()
      if (!u || !mounted) return
      const uid = u.id as string
      const { data } = await supabase.from('follows').select('*').eq('follower_id', session.user.id).eq('followed_id', uid).maybeSingle()
      if (!mounted) return
      setIsFollowed(!!data)
    }).catch(() => {})
    return () => { mounted = false }
  }, [handle])

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      {online && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
        </span>
      )}
      <span className={cn('font-bold tracking-tight', sizeClass[size])} style={{ color }}>
        @{handle}
      </span>
      <button
      onClick={async () => {
          const supabase = createClient()
          const { data: { session } } = await supabase.auth.getSession()
          if (!session?.user) { alert('Sign in to follow'); return }
          // resolve handle -> id before calling follow APIs
          const { data: u } = await supabase.from('anon_users').select('id').eq('handle', handle).maybeSingle()
          if (!u) { alert('User not found'); return }
          const uid = u.id as string
          if (!isFollowed) {
            const res = await fetch('/api/users/follow', { method: 'POST', body: JSON.stringify({ followed_id: uid }), headers: { 'Content-Type': 'application/json' } })
            const j = await res.json()
            if (j.success) setIsFollowed(true)
            else alert(j.error || 'Could not follow')
          } else {
            const res = await fetch(`/api/users/follow?followed_id=${encodeURIComponent(uid)}`, { method: 'DELETE' })
            const j = await res.json()
            if (j.success) setIsFollowed(false)
            else alert(j.error || 'Could not unfollow')
          }
        }}
        className="ml-2 text-xs text-inc-muted hover:underline"
      >
        {isFollowed ? 'Following' : 'Follow'}
      </button>
    </span>
  )
}
