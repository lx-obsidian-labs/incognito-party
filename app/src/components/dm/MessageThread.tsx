'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { AvatarPlaceholder } from '@/components/shared/AvatarPlaceholder'
import { formatRelativeTime } from '@/lib/utils'
import type { IDirectMessage } from '@/types'

interface Props {
  otherHandle: string
  otherId: string
  currentUserId: string
  typing?: boolean
  searchQuery?: string
  onSearchChange?: (q: string) => void
}

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function highlightText(text: string, query: string) {
  if (!query) return text
  const escaped = escapeRegex(query)
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <span key={i} className="bg-yellow-500/30 rounded">{part}</span>
      : part,
  )
}

export function MessageThread({ otherHandle, otherId, currentUserId, typing, searchQuery = '', onSearchChange }: Props) {
  const [messages, setMessages] = useState<IDirectMessage[]>([])
  const pendingMapRef = useRef<Map<string, IDirectMessage>>(new Map())
  const filteredMessages = searchQuery
    ? messages.filter((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages
  const bottomRef = useRef<HTMLDivElement>(null)
  const [otherTyping, setOtherTyping] = useState(false)
  const typingTimerRef = useRef<number | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function fetchMessages() {
      const { data } = await supabase
        .from('direct_messages')
        .select('*')
        .or(
          `and(sender_id.eq.${currentUserId},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${currentUserId})`,
        )
        .order('created_at', { ascending: true })
        .limit(100)

      if (data) {
        // reconcile any pending messages that have been fulfilled by the server
        const server = data as IDirectMessage[]
        // remove pending items that match by temp_client_id
        const newPending = Array.from(pendingMapRef.current.values()).filter((p) => !server.some((s) => s.temp_client_id === p.temp_client_id))
        pendingMapRef.current.clear()
        for (const p of newPending) pendingMapRef.current.set(p.id, p)
        setMessages([...server, ...newPending])
      }
    }

    fetchMessages()

    // listen for optimistic pending messages dispatched from MessageComposer
    function onPending(e: Event) {
      const detail = (e as CustomEvent).detail as IDirectMessage
      if (!detail) return
      // store in pending map so fetchMessages can reconcile server results with pending
      if (detail.temp_client_id) pendingMapRef.current.set(detail.temp_client_id, detail)
      setMessages((prev) => [...prev, { ...detail, is_pending: true } as IDirectMessage])
    }
    window.addEventListener('dm:pending', onPending)

    // listen for typing events from MessageComposer (local dispatch or future remote events)
    function onTypingEvent(e: Event) {
      const detail = (e as CustomEvent).detail as { fromId: string; toId: string }
      if (!detail) return
      // if the typing event is from the other user to current user, show indicator
      if (detail.fromId === otherId && detail.toId === currentUserId) {
        setOtherTyping(true)
        if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current)
        typingTimerRef.current = window.setTimeout(() => setOtherTyping(false), 2000)
      }
    }
    window.addEventListener('dm:typing', onTypingEvent)
    function onPendingFailed(e: Event) {
      const detail = (e as CustomEvent).detail as { temp_client_id: string }
      if (!detail?.temp_client_id) return
      setMessages((prev) => prev.map((m) => (m.temp_client_id === detail.temp_client_id ? { ...m, is_failed: true, is_pending: false } : m)))
    }
    window.addEventListener('dm:pending-failed', onPendingFailed)

    const s = supabase as unknown as {
      channel: (name: string) => {
        on: (event: string, config: Record<string, unknown>, callback: (payload: Record<string, unknown>) => void) => {
          on: (event: string, config: Record<string, unknown>, callback: (payload: Record<string, unknown>) => void) => {
            subscribe: () => { unsubscribe: () => void }
          }
          subscribe: () => { unsubscribe: () => void }
        }
        subscribe: () => { unsubscribe: () => void }
      }
      removeChannel: (ch: unknown) => void
    }

    const channel = s
      .channel('dm-thread')
      .on(
        'postgres_changes',
        {
          event: 'INSERT' as const,
          schema: 'public' as const,
          table: 'direct_messages',
          filter: `sender_id=eq.${currentUserId},recipient_id=eq.${otherId}`,
        },
          (payload: Record<string, unknown>) => {
           const newMsg = payload.new as IDirectMessage
           // reconcile pending by temp_client_id if present
           if ((newMsg as any).temp_client_id) {
             setMessages((prev) => {
               // remove any pending item with same temp_client_id
               const filtered = prev.filter((m) => (m as any).temp_client_id !== (newMsg as any).temp_client_id)
               return [...filtered, newMsg]
             })
           } else {
             setMessages((prev) => [...prev, newMsg])
           }
          },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT' as const,
          schema: 'public' as const,
          table: 'direct_messages',
          filter: `sender_id=eq.${otherId},recipient_id=eq.${currentUserId}`,
        },
          (payload: Record<string, unknown>) => {
           const msg = payload.new as IDirectMessage
           // Mark as read immediately
           ;(supabase
             .from('direct_messages')
             .update({ is_read: true })
             .eq('id', msg.id) as unknown as Promise<unknown>).then(() => {})
           // reconcile pending if applicable
           if ((msg as any).temp_client_id) {
             setMessages((prev) => prev.filter((m) => (m as any).temp_client_id !== (msg as any).temp_client_id).concat([{ ...msg, is_read: true }]))
           } else {
             setMessages((prev) => [...prev, { ...msg, is_read: true }])
           }
          },
      )
      .subscribe()

    // subscribe to typing broadcasts for this thread
    try {
      s.channel(`dm-typing:${otherId}`).on('broadcast', { event: 'typing' }, (payload: Record<string, unknown>) => {
        const p = payload as any
        if (p?.payload?.fromId === otherId && p?.payload?.toId === currentUserId) {
          setOtherTyping(true)
          if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current)
          typingTimerRef.current = window.setTimeout(() => setOtherTyping(false), 2000)
        }
      }).subscribe()
    } catch {
      // best effort — if realtime not available, local window events still handle typing
    }

    return () => {
      window.removeEventListener('dm:pending', onPending)
      window.removeEventListener('dm:typing', onTypingEvent)
      window.removeEventListener('dm:pending-failed', onPendingFailed)
      ;(supabase as unknown as { removeChannel: (ch: unknown) => void }).removeChannel(channel)
    }
  }, [currentUserId, otherId])

  async function retryMessage(temp_client_id?: string, content?: string) {
    if (!temp_client_id || !content) return
    // mark pending and clear failed
    setMessages((prev) => prev.map((m) => (m.temp_client_id === temp_client_id ? { ...m, is_pending: true, is_failed: false } : m)))
    try {
      const res = await fetch('/api/dm/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ recipient_id: otherId, content, temp_client_id }),
      })
      const json = await res.json()
      if (!res.ok) {
        setMessages((prev) => prev.map((m) => (m.temp_client_id === temp_client_id ? { ...m, is_pending: false, is_failed: true } : m)))
        toast(json?.error ?? 'Retry failed')
      }
      // on success, realtime will reconcile
    } catch (err) {
      setMessages((prev) => prev.map((m) => (m.temp_client_id === temp_client_id ? { ...m, is_pending: false, is_failed: true } : m)))
      const message = err && typeof err === 'object' && 'message' in err ? (err as any).message : String(err)
      toast(message ?? 'Retry failed')
    }
  }

  // Mark all unread messages from other user as read on mount
  useEffect(() => {
    if (!currentUserId || !otherId) return
    const supabase = createClient()
    ;(supabase
      .from('direct_messages')
      .update({ is_read: true })
      .eq('sender_id', otherId)
      .eq('recipient_id', currentUserId)
      .eq('is_read', false) as unknown as Promise<unknown>).then(() => {
        setMessages((prev) =>
          prev.map((m) =>
            m.sender_id === otherId && m.recipient_id === currentUserId && !m.is_read
              ? { ...m, is_read: true }
              : m,
          ),
        )
      })
  }, [currentUserId, otherId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 sm:py-4 space-y-3">
      {onSearchChange && (
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-inc-muted"
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search messages..."
            className="w-full rounded-xl border border-inc-border bg-inc-dark py-2 pl-9 pr-8 text-sm text-inc-text placeholder-inc-muted focus:outline-none focus:ring-2 focus:ring-inc-accent"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-inc-muted hover:text-inc-text transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          )}
        </div>
      )}
      {filteredMessages.map((msg) => {
        const isMe = msg.sender_id === currentUserId
        return (
      <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
            {!isMe && <AvatarPlaceholder handle={otherHandle} size="sm" />}
            <div className={`max-w-[85%] sm:max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}
            >
              <div
                className={`rounded-2xl px-4 py-2 text-sm leading-relaxed transition-all duration-200 ease-out transform ${
                  isMe
                    ? 'bg-inc-accent text-inc-dark rounded-br-md'
                    : 'bg-inc-card text-inc-text rounded-bl-md border border-inc-border'
                } ${msg.is_pending ? 'opacity-60 -translate-y-0.5 italic' : ''}`}
              >
                {searchQuery ? highlightText(msg.content, searchQuery) : msg.content}
              </div>
              <span className="text-inc-muted text-xs mt-0.5 px-1 flex items-center gap-1">
                {formatRelativeTime(msg.created_at)}
                {msg.is_pending && <span className="text-inc-muted"> · Sending…</span>}
                {msg.is_failed && <span className="text-red-400"> · Failed. Retry?</span>}
                {!msg.is_pending && !msg.is_failed && isMe && !msg.is_read && <span className="text-inc-muted"> · Sent</span>}
                {!msg.is_pending && !msg.is_failed && isMe && msg.is_read && <span className="text-green-500 font-medium">Read</span>}
                {msg.is_failed && msg.temp_client_id && msg.sender_id === currentUserId && (
                  <button
                    onClick={() => retryMessage(msg.temp_client_id, msg.content)}
                    aria-label="Retry sending message"
                    className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded text-inc-muted hover:text-inc-text focus:outline-none focus-visible:ring-2 focus-visible:ring-inc-accent"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/><polyline points="21 3 21 10 14 10"/></svg>
                  </button>
                )}
              </span>
            </div>
          </div>
        )
      })}
      {(otherTyping || typing) && (
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-inc-card border border-inc-border px-4 py-2.5">
            <span className="text-inc-muted text-sm">typing</span>
            <span className="flex gap-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-inc-muted animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-inc-muted animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-inc-muted animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
