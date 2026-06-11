'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { usePostDraft } from '@/hooks/usePostDraft'

interface Props {
  channelId: string
  onPostCreated: () => void
}

export function PostComposer({ channelId, onPostCreated }: Props) {
  const { draft, hasDraft, saveDraft, clearDraft, setDraft } = usePostDraft(channelId)
  const [content, setContent] = useState(draft)
  const [media, setMedia] = useState<File[]>([])
  const [preview, setPreview] = useState<string[]>([])
  const [posting, setPosting] = useState(false)
  const [authUser, setAuthUser] = useState<{ id: string } | null>(null)
  const [scheduledDate, setScheduledDate] = useState<string>('')
  const [showScheduler, setShowScheduler] = useState(false)
  const [isMoment, setIsMoment] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (draft) {
      setContent(draft)
      toast('Draft restored', { duration: 2000 })
    }
  }, [draft])

  useEffect(() => {
    const supabase = createClient()
    // check current user for diagnostics
    supabase.auth.getUser().then(({ data }) => {
      setAuthUser(data?.user ?? null)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setAuthUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  // Revoke any created object URLs on unmount to avoid leaking
  useEffect(() => {
    return () => {
      for (const url of preview) {
        try { URL.revokeObjectURL(url) } catch { /* ignore */ }
      }
    }
  }, [preview])

  useEffect(() => {
    saveDraft(content)
  }, [content, saveDraft])

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    const validFiles = files.filter((f) => {
      if (f.size > 5 * 1024 * 1024) {
        toast(`${f.name} is over 5 MB`)
        return false
      }
      return true
    })
    if (validFiles.length === 0) return
    setMedia((prev) => [...prev, ...validFiles])
    const newPreviews = validFiles.map((f) => URL.createObjectURL(f))
    setPreview((prev) => [...prev, ...newPreviews])
  }

  function removeFile(index: number) {
    setMedia((prev) => prev.filter((_, i) => i !== index))
    setPreview((prev) => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  async function handleSubmit() {
    const trimmed = content.trim()
    if (!trimmed && media.length === 0) return
    if (trimmed.length > 500) {
      toast('Post must be 500 characters or fewer.')
      return
    }

    setPosting(true)
    const supabase = createClient()
    // If there's no auth user, attempt anonymous sign-in before posting.
    if (!authUser) {
      toast('Signing in anonymously...')
      try {
        const { data: anonData, error: anonErr } = await supabase.auth.signInAnonymously()
        if (anonErr || !anonData?.user) {
          setPosting(false)
          toast(anonErr?.message ?? 'Anonymous sign-in failed')
          return
        }
        // Let server create anon_users row for this new session
        await fetch('/api/auth/anon', { method: 'POST' })
        // update local authUser state
        setAuthUser({ id: anonData.user.id })
        toast('Signed in anonymously')
      } catch (e) {
        setPosting(false)
        toast('Anonymous sign-in failed')
        return
      }
    }
    let mediaUrls: string[] | null = null

    if (media.length > 0) {
      mediaUrls = []
      for (const file of media) {
        const ext = file.name.split('.').pop()
        const path = `post-images/${crypto.randomUUID()}.${ext}`
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('media')
          .upload(path, file)
        if (uploadErr) {
          toast(uploadErr.message ?? 'Upload failed. Try again?')
          setPosting(false)
          return
        }
        const { data: urlData } = supabase.storage
          .from('media')
          .getPublicUrl(uploadData.path)
        mediaUrls.push(urlData.publicUrl)
      }
    }

    const body: Record<string, unknown> = {
      channel_id: channelId,
      content: trimmed,
      media_url: mediaUrls ? JSON.stringify(mediaUrls) : null,
      scheduled_at: scheduledDate || null,
      is_moment: isMoment || null,
      expires_at: isMoment ? new Date(Date.now() + 86400000).toISOString() : null,
    }

    // Use the server-side API to create posts so the server can set author_id
    // (this avoids RLS issues when clients try to set author_id themselves).
    // First try a direct client-side insert using the session user as author_id.
    // Many RLS policies allow inserting when author_id === auth.uid(), so this
    // works in common setups. If there's no session available server-side,
    // fall back to the server API which will attempt to set the author.
    // Prefer getUser() which returns the authenticated user object when available.
    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user
      if (user) {
        // Client-side insert including author_id (should match auth.uid()).
        const insertBody = { ...body, author_id: user.id }
        const { error } = await supabase.from('posts').insert(insertBody)
        setPosting(false)
        if (error) {
          // show exact error to aid debugging (RLS, constraints, etc.)
          toast(error.message ?? 'Something hiccuped. Try again?')
          return
        }
      } else {
      try {
        const res = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ channel_id: channelId, content: trimmed, media_url: mediaUrls ? JSON.stringify(mediaUrls) : null, scheduled_at: scheduledDate || null, is_moment: isMoment || null, expires_at: isMoment ? new Date(Date.now() + 86400000).toISOString() : null }),
        })
        const json = await res.json()
        setPosting(false)
        if (!res.ok) {
          toast(json?.error ?? 'Something hiccuped. Try again?')
          return
        }
      } catch (err) {
        setPosting(false)
        // if err is Error-like, show message
        const message = err && typeof err === 'object' && 'message' in err ? (err as any).message : String(err)
        toast(message ?? 'Something hiccuped. Try again?')
        return
      }
    }
    clearDraft()
    setContent('')
    setMedia([])
    setPreview([])
    setScheduledDate('')
    setShowScheduler(false)
    setIsMoment(false)
    onPostCreated()
  }

    return (
      <div className="rounded-2xl border border-inc-border bg-inc-card p-4">
      {/* Auth diagnostic: shows whether a session user is present. Helpful for debugging RLS/auth issues. */}
      <div className="mb-2 text-xs text-inc-muted">
        Auth: {authUser ? `signed in (id ${String(authUser.id).slice(0, 8)}...)` : 'no active session — will use server fallback'}
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share what's on your mind..."
        maxLength={500}
        rows={3}
        aria-label="Post content"
        className="w-full resize-none bg-transparent text-inc-text placeholder-inc-muted outline-none text-sm leading-relaxed focus-visible:ring-0"
      />
      {preview.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {preview.map((url, i) => (
            <div key={i} className="relative shrink-0">
              <img src={url} alt="" className="h-20 w-20 rounded-lg object-cover" />
              <button
                onClick={() => removeFile(i)}
                aria-label="Remove image"
                className="absolute -top-2 -right-2 rounded-full bg-inc-dark p-0.5 focus-visible:ring-2 focus-visible:ring-inc-accent focus-visible:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-inc-text">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
      {showScheduler && (
        <div className="mt-3">
          <input
            type="datetime-local"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            className="w-full rounded-xl border border-inc-border bg-inc-dark px-4 py-2 text-sm text-inc-text focus:border-inc-accent focus:outline-none"
            aria-label="Schedule date and time"
          />
        </div>
      )}
      <div className="flex items-center justify-between pt-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            aria-label="Attach image"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-inc-muted hover:bg-inc-border transition-colors focus-visible:ring-2 focus-visible:ring-inc-accent focus-visible:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
            </svg>
            Image
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFile}
          />
          <button
            onClick={() => setShowScheduler(!showScheduler)}
            aria-label="Toggle schedule"
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-inc-accent focus-visible:outline-none ${
              showScheduler ? 'bg-inc-accent/10 text-inc-accent' : 'text-inc-muted hover:bg-inc-border'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Schedule
          </button>
          <button
            onClick={() => setIsMoment(!isMoment)}
            aria-label="Toggle moment (24h expiry)"
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-inc-accent focus-visible:outline-none ${
              isMoment ? 'bg-inc-accent/10 text-inc-accent' : 'text-inc-muted hover:bg-inc-border'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            Moment
          </button>
          <span className="text-xs text-inc-muted">{content.length}/500</span>
        </div>
        <button
          onClick={handleSubmit}
          disabled={posting || (!content.trim() && media.length === 0)}
          aria-label={posting ? 'Posting...' : 'Submit post'}
          className={cn(
            'rounded-full px-5 py-2 text-sm font-semibold transition-all focus-visible:ring-2 focus-visible:ring-inc-accent focus-visible:outline-none',
            posting || (!content.trim() && media.length === 0)
              ? 'bg-inc-border text-inc-muted cursor-not-allowed'
              : 'bg-inc-accent text-inc-dark hover:bg-inc-accent-hover',
          )}
        >
          {posting ? 'Posting...' : scheduledDate ? 'Schedule' : 'Post'}
        </button>
      </div>
    </div>
  )
}
