'use client'

import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  handle: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
  online?: boolean
  color?: string
}

const bgColors = [
  'from-cyan-500 to-blue-600',
  'from-pink-500 to-rose-600',
  'from-purple-500 to-indigo-600',
  'from-orange-500 to-red-600',
  'from-green-500 to-emerald-600',
  'from-yellow-500 to-amber-600',
]

function bgFromHandle(handle: string): string {
  let hash = 0
  for (let i = 0; i < handle.length; i++) {
    hash = handle.charCodeAt(i) + ((hash << 5) - hash)
  }
  return bgColors[Math.abs(hash) % bgColors.length]
}

export function AvatarPlaceholder({ handle, size = 'md', className, online, color }: Props) {
  const bg = bgFromHandle(handle)
  const initial = handle.charAt(0).toUpperCase()
  const sizeClass = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-xl',
  }

  const [isFollowed, setIsFollowed] = useState(false)

  useEffect(() => {
    let mounted = true
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return
      // check if current user follows this handle (handle is the user's handle string)
      const { data } = await supabase.from('anon_users').select('id').eq('handle', handle).maybeSingle()
      if (!data || !mounted) return
      const uid = data.id as string
      const { data: f } = await supabase.from('follows').select('*').eq('follower_id', session.user.id).eq('followed_id', uid).maybeSingle()
      if (!mounted) return
      setIsFollowed(!!f)
    }).catch(() => {})
    return () => { mounted = false }
  }, [handle])

  async function toggleFollow() {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { alert('Sign in to follow'); return }
    const { data } = await supabase.from('anon_users').select('id').eq('handle', handle).maybeSingle()
    if (!data) return
    const uid = data.id as string
    if (!isFollowed) {
      const res = await fetch('/api/users/follow', { method: 'POST', body: JSON.stringify({ followed_id: uid }), headers: { 'Content-Type': 'application/json' } })
      const j = await res.json()
      if (j.success) setIsFollowed(true)
    } else {
      const res = await fetch(`/api/users/follow?followed_id=${encodeURIComponent(uid)}`, { method: 'DELETE' })
      const j = await res.json()
      if (j.success) setIsFollowed(false)
    }
  }

  return (
    <div className={cn('relative shrink-0', className)}>
      <div
        className={cn(
          'flex items-center justify-center rounded-full font-bold text-white',
          !color && 'bg-gradient-to-br',
          !color && bg,
          sizeClass[size],
        )}
        style={color ? { backgroundColor: color } : undefined}
        aria-hidden="true"
      >
        {initial}
      </div>
      {online && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500 ring-2 ring-inc-dark" />
        </span>
      )}
      <button onClick={toggleFollow} aria-label={isFollowed ? 'Unfollow' : 'Follow'} className="absolute -bottom-1 -right-1 text-xs">
        <span className="rounded-full bg-inc-accent px-2 py-0.5 text-black">{isFollowed ? '✓' : '+'}</span>
      </button>
    </div>
  )
}
