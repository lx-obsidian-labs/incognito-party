'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'

interface Props {
  recipientId: string
  currentUserId: string
  onSent: () => void
  onTyping?: () => void
}

export function MessageComposer({ recipientId, currentUserId, onSent, onTyping }: Props) {
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const typingTimerRef = useRef<number | null>(null)

  async function handleSend() {
    const trimmed = content.trim()
    if (!trimmed) return

    setSending(true)
    const supabase = createClient()

    // If we don't have a currentUserId prop, attempt anonymous sign-in
    if (!currentUserId) {
      try {
        const { data: anonData, error: anonErr } = await supabase.auth.signInAnonymously()
        if (anonErr || !anonData?.user) {
          setSending(false)
          toast(anonErr?.message ?? 'Anonymous sign-in failed')
          return
        }
        // ensure server creates anon_users row
        await fetch('/api/auth/anon', { method: 'POST' })
      } catch (e) {
        setSending(false)
        toast('Anonymous sign-in failed')
        return
      }
    }

    // Optimistic UI: create a temporary message object and broadcast it to MessageThread
    const tempId = `temp-${uuidv4()}`
    const pendingMsg = {
      id: tempId,
      sender_id: currentUserId ?? 'me',
      recipient_id: recipientId,
      content: trimmed,
      created_at: new Date().toISOString(),
      is_read: false,
      temp_client_id: tempId,
    } as any
    // dispatch a custom event so MessageThread can append the pending message immediately
    window.dispatchEvent(new CustomEvent('dm:pending', { detail: pendingMsg }))

    // also dispatch a typing end event so other side clears typing quickly after send
    window.dispatchEvent(new CustomEvent('dm:typing', { detail: { fromId: currentUserId ?? 'me', toId: recipientId } }))

    try {
      // publish typing stop event through realtime so remote clears quickly (best-effort)
      try {
        const rs = createClient()
        rs.channel(`dm-typing:${recipientId}`).send({ type: 'broadcast', event: 'typing', payload: { fromId: currentUserId ?? 'me', toId: recipientId } })
      } catch {}

      const res = await fetch('/api/dm/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ recipient_id: recipientId, content: trimmed, temp_client_id: tempId }),
      })
      const json = await res.json()
      setSending(false)
      if (!res.ok) {
        // mark pending message as failed so UI can show retry
        window.dispatchEvent(new CustomEvent('dm:pending-failed', { detail: { temp_client_id: tempId } }))
        toast(json?.error ?? 'Something hiccuped. Try again?')
        return
      }
      setContent('')
      onSent()
    } catch (err) {
      setSending(false)
      // mark pending message as failed so UI can show retry
      window.dispatchEvent(new CustomEvent('dm:pending-failed', { detail: { temp_client_id: tempId } }))
      const message = err && typeof err === 'object' && 'message' in err ? (err as any).message : String(err)
      toast(message ?? 'Something hiccuped. Try again?')
      return
    }
  }

  return (
    <div className="flex items-center gap-2 border-t border-inc-border px-3 sm:px-4 py-2 sm:py-3">
      <input
        value={content}
        onChange={(e) => {
          setContent(e.target.value)
          onTyping?.()
          // dispatch local typing event with debounce so other thread shows typing indicator
          if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current)
          window.dispatchEvent(new CustomEvent('dm:typing', { detail: { fromId: currentUserId ?? 'me', toId: recipientId } }))
          typingTimerRef.current = window.setTimeout(() => {
            // stop typing after timeout by emitting an empty/stop event
            window.dispatchEvent(new CustomEvent('dm:typing', { detail: { fromId: currentUserId ?? 'me', toId: recipientId } }))
          }, 1500)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
          }
        }}
        placeholder="Type a message..."
        maxLength={2000}
        aria-label="Type a message"
        className="flex-1 rounded-full bg-inc-card border border-inc-border px-4 py-2.5 text-inc-text text-sm outline-none placeholder-inc-muted focus:border-inc-accent focus-visible:ring-2 focus-visible:ring-inc-accent"
      />
      <button
        onClick={handleSend}
        disabled={sending || !content.trim()}
        aria-label="Send message"
        className="rounded-full bg-inc-accent p-2.5 text-inc-dark hover:bg-inc-accent-hover transition-colors disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-inc-accent focus-visible:outline-none"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-11 20L9 15l-7-3z"/></svg>
      </button>
    </div>
  )
}
