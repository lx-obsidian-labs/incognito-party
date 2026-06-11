'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

const EMOJIS = [
  { emoji: '❤️', label: 'Support' },
  { emoji: '💡', label: 'Helpful' },
  { emoji: '👏', label: 'Encouraging' },
  { emoji: '🎯', label: 'Insightful' },
  { emoji: '🤝', label: 'Relatable' },
]

interface Props {
  postId: string
  currentUserId: string | null
}

export function ReactionBar({ postId, currentUserId }: Props) {
  const [reactions, setReactions] = useState<Array<{ emoji: string; user_id: string }>>([])
  const fetched = useRef(false)

  useEffect(() => {
    if (fetched.current) return
    fetched.current = true
    ;(async () => {
      const supabase = createClient()
      const res = await (supabase.from('reactions').select('*').eq('post_id', postId) as unknown as Promise<{ data: Array<{ emoji: string; user_id: string }> | null }>)
      if (res.data) setReactions(res.data)
    })()
  }, [postId])

  const { reactionCounts, userReactions } = useMemo(() => {
    const counts: Record<string, number> = {}
    const userSet = new Set<string>()
    for (const r of reactions) {
      counts[r.emoji] = (counts[r.emoji] ?? 0) + 1
      if (r.user_id === currentUserId) userSet.add(r.emoji)
    }
    return { reactionCounts: counts, userReactions: userSet }
  }, [reactions, currentUserId])

  const toggleReaction = useCallback(async (emoji: string) => {
    if (!currentUserId) return
    const hasReacted = reactions.some((r) => r.user_id === currentUserId && r.emoji === emoji)
    const supabase = createClient()
    if (hasReacted) {
      const res = await (supabase
        .from('reactions')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', currentUserId)
        .eq('emoji', emoji) as unknown as Promise<{ error: unknown }>)
      if (!res.error) {
        setReactions((prev) => prev.filter((r) => !(r.user_id === currentUserId && r.emoji === emoji)))
      }
    } else {
      const res = await (supabase
        .from('reactions')
        .insert({ post_id: postId, user_id: currentUserId, emoji }) as unknown as Promise<{ error: unknown; data: Array<{ emoji: string; user_id: string }> | null }>)
      if (!res.error && res.data) {
        setReactions((prev) => [...prev, ...res.data!])
      }
    }
  }, [postId, currentUserId, reactions])

  return (
    <div className="mt-2 flex items-center gap-1.5">
      {EMOJIS.map(({ emoji, label }) => {
        const count = reactionCounts[emoji] ?? 0
        const reacted = userReactions.has(emoji)
        return (
          <button
            key={emoji}
            onClick={() => toggleReaction(emoji)}
            aria-label={`React with ${label}`}
            title={label}
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm transition-all ${
              reacted ? 'bg-inc-accent/20 ring-1 ring-inc-accent/50 scale-110' : 'hover:bg-inc-border/50'
            }`}
          >
            <span className="text-base">{emoji}</span>
            <span className="text-xs text-inc-muted">{count}</span>
          </button>
        )
      })}
    </div>
  )
}
