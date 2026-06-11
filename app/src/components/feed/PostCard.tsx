'use client'

import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { AvatarPlaceholder } from '@/components/shared/AvatarPlaceholder'
import { HandleDisplay } from '@/components/shared/HandleDisplay'
import Link from 'next/link'
import { InteractionBar } from './InteractionBar'
import { ReactionBar } from './ReactionBar'
import { MarkdownContent } from '@/components/shared/MarkdownContent'
import { formatRelativeTime } from '@/lib/utils'
import type { IPost } from '@/types'
import { toast } from 'sonner'

const TipModal = dynamic(() => import('./TipModal').then((m) => ({ default: m.TipModal })), { ssr: false })
const ConfirmModal = dynamic(() => import('@/components/shared/ConfirmModal').then((m) => ({ default: m.ConfirmModal })), { ssr: false })

interface Props {
  post: IPost
}

export function PostCard({ post }: Props) {
  const [localPost, setLocalPost] = useState(post)
  const [showTipModal, setShowTipModal] = useState(false)
  const [balance, setBalance] = useState(0)
  const [isSuperLikeAnimating, setIsSuperLikeAnimating] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reporting, setReporting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const [saving, setSaving] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setCurrentUserId(session.user.id)
    })
    supabase.from('wallets').select('balance').eq('user_id', post.author_id).single().then(({ data }) => {
      if (data) setBalance(data.balance as number)
    })
    supabase.from('anon_users').select('last_seen').eq('id', post.author_id).single().then(({ data }) => {
      if (data) {
        const lastSeen = new Date(data.last_seen as string)
        const now = new Date()
        setIsOnline((now.getTime() - lastSeen.getTime()) < 5 * 60 * 1000)
      }
    })
  }, [post.author_id])

  useEffect(() => {
    if (!currentUserId) return
    const supabase = createClient()
    supabase.from('saved_posts').select('id').eq('user_id', currentUserId).eq('post_id', localPost.id).single().then(({ data }) => {
      setBookmarked(!!data)
    })
  }, [currentUserId, localPost.id])

  async function sharePost() {
    const url = `${window.location.origin}/post/${localPost.id}`
    try {
      await navigator.clipboard.writeText(url)
      toast('Link copied to clipboard!')
    } catch {
      toast('Could not copy link.')
    }
  }

  async function deletePost() {
    setDeleting(true)
    const supabase = createClient()
    // Soft-delete to follow project rules: mark removed instead of hard delete
    const { error } = await supabase.from('posts').update({ is_removed: true, removed_at: new Date().toISOString() }).eq('id', localPost.id)
    setDeleting(false)
    setShowDeleteConfirm(false)
    if (error) {
      toast('Something hiccuped. Try again?')
      return
    }
    toast('Post deleted.')
    setLocalPost((p) => ({ ...p, is_removed: true }))
  }

  function startEditing() {
    setEditText(localPost.content)
    setEditing(true)
  }

  function cancelEditing() {
    setEditing(false)
    setEditText('')
  }

  async function saveEdit() {
    if (!editText.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('posts').update({ content: editText.trim() }).eq('id', localPost.id)
    setSaving(false)
    if (error) {
      toast('Something hiccuped. Try again?')
      return
    }
    setLocalPost((p) => ({ ...p, content: editText.trim() }))
    setEditing(false)
  }

  async function toggleBookmark() {
    if (!currentUserId) return
    const supabase = createClient()
    if (bookmarked) {
      const { error } = await supabase.from('saved_posts').delete().eq('user_id', currentUserId).eq('post_id', localPost.id)
      if (error) {
        toast('Something hiccuped. Try again?')
        return
      }
      setBookmarked(false)
      toast('Removed from saved.')
    } else {
      const { error } = await supabase.from('saved_posts').insert({ user_id: currentUserId, post_id: localPost.id })
      if (error) {
        toast('Something hiccuped. Try again?')
        return
      }
      setBookmarked(true)
      toast('Post saved!')
    }
  }

  async function handleInteraction(type: 'like' | 'super_like' | 'tip', amount = 0) {
    const supabase = createClient()
    const { data: session } = await supabase.auth.getSession()
    const userId = session.session?.user?.id ?? null

    const payload: Record<string, unknown> = {
      post_id: localPost.id,
      type,
      amount,
    }
    if (userId) payload.user_id = userId

    const { error } = await supabase.from('interactions').insert(payload)
    if (error) {
      // Handle unique-constraint / already-interacted in a looser way
      const msg = (error.message ?? '').toString().toLowerCase()
      if (msg.includes('unique') || msg.includes('duplicate') || msg.includes('23505')) {
        toast('Already interacted!')
        return
      }
      if (msg.includes('insufficient')) {
        toast('Not enough credits! Check your wallet.')
        return
      }
      toast('Something hiccuped. Try again?')
      return
    }
    if (type === 'like') {
      setLocalPost((p) => {
        const def = { liked: false, super_liked: false, tipped: false }
        return { ...p, like_count: (p.like_count ?? 0) + 1, user_interaction: { ...def, ...p.user_interaction, liked: true } }
      })
    } else if (type === 'super_like') {
      setIsSuperLikeAnimating(true)
      setTimeout(() => setIsSuperLikeAnimating(false), 500)
      setLocalPost((p) => {
        const def = { liked: false, super_liked: false, tipped: false }
        return { ...p, super_like_count: (p.super_like_count ?? 0) + 1, user_interaction: { ...def, ...p.user_interaction, super_liked: true } }
      })
      const { data: session } = await supabase.auth.getSession()
      if (session.session?.user) {
        const { data: postOwner } = await supabase
          .from('posts')
          .select('author_id')
          .eq('id', localPost.id)
          .single()
        if (postOwner && postOwner.author_id !== session.session.user.id) {
          await supabase.from('dm_relationships').upsert({
            user_id: postOwner.author_id,
            allowed_user_id: session.session.user.id,
          })
        }
      }
    } else if (type === 'tip') {
      setLocalPost((p) => {
        const def = { liked: false, super_liked: false, tipped: false }
        return { ...p, tip_count: (p.tip_count ?? 0) + 1, user_interaction: { ...def, ...p.user_interaction, tipped: true } }
      })
      setBalance((b) => b - amount)
      toast(`Tipped ${amount} credits!`)
      const { data: session } = await supabase.auth.getSession()
      if (session.session?.user) {
        const { data: postOwner } = await supabase
          .from('posts')
          .select('author_id')
          .eq('id', localPost.id)
          .single()
        if (postOwner && postOwner.author_id !== session.session.user.id) {
          await supabase.from('dm_relationships').upsert({
            user_id: postOwner.author_id,
            allowed_user_id: session.session.user.id,
          })
        }
      }
    }
  }

  async function submitReport() {
    if (!reportReason) return
    setReporting(true)
    const supabase = createClient()
    const { error } = await supabase.from('reports').insert({
      post_id: localPost.id,
      reason: reportReason,
    })
    setReporting(false)
    setShowReportModal(false)
    setReportReason('')
    if (error) {
      toast('Something hiccuped. Try again?')
      return
    }
    toast('Reported. We\'ll look into it.')
  }

  const reportReasons = [
    'Harassment or bullying',
    'Hate speech',
    'Spam',
    'NSFW or inappropriate',
    'Misinformation',
    'Other',
  ]

  if (localPost.is_removed) {
    return (
      <div className="rounded-2xl border border-inc-border bg-inc-card p-4 opacity-50">
        <p className="text-inc-muted text-sm italic">Post deleted.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-inc-border bg-inc-card p-4 transition-all duration-200 hover:border-inc-accent/30 hover:shadow-lg hover:shadow-inc-accent/5 hover:-translate-y-0.5">
      <div className="flex items-start gap-3">
        <AvatarPlaceholder handle={localPost.author_handle ?? '?'} size="sm" online={isOnline} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <Link href={`/user/${localPost.author_handle}`} className="hover:underline">
              <HandleDisplay handle={localPost.author_handle ?? 'Unknown'} size="sm" online={isOnline} />
            </Link>
            <span className="text-inc-muted text-xs">
              {formatRelativeTime(localPost.created_at)}
            </span>
          </div>
          {localPost.mood && (
            <div className="mt-2">
              <span className="inline-block text-xs px-2 py-1 rounded-full bg-inc-dark text-inc-muted">{localPost.mood}</span>
            </div>
          )}
          {editing ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full rounded-xl border border-inc-border bg-inc-dark p-3 text-sm text-inc-text resize-none focus:outline-none focus:ring-2 focus:ring-inc-accent"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={saveEdit}
                  disabled={saving || !editText.trim()}
                  className="rounded-lg bg-inc-accent px-4 py-1.5 text-xs font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={cancelEditing}
                  disabled={saving}
                  className="rounded-lg border border-inc-border px-4 py-1.5 text-xs font-bold text-inc-muted hover:text-inc-text transition-colors disabled:opacity-40"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <MarkdownContent content={localPost.content} />
          )}
          {(localPost.views ?? 0) > 0 && (
            <p className="mt-1 text-xs text-inc-muted">
              {localPost.views} {localPost.views === 1 ? 'view' : 'views'}
            </p>
          )}
          <MediaGallery mediaUrl={localPost.media_url} />
          <ReactionBar postId={localPost.id} currentUserId={currentUserId} />
          <InteractionBar
            likeCount={localPost.like_count ?? 0}
            superLikeCount={localPost.super_like_count ?? 0}
            tipCount={localPost.tip_count ?? 0}
            liked={localPost.user_interaction?.liked}
            superLiked={localPost.user_interaction?.super_liked}
            tipped={localPost.user_interaction?.tipped}
            superLikeAnimating={isSuperLikeAnimating}
            onLike={() => handleInteraction('like')}
            onSuperLike={() => {
              if (balance < 2) {
                toast('Not enough credits! Check your wallet.')
                return
              }
              handleInteraction('super_like')
            }}
            onTip={() => setShowTipModal(true)}
            onReport={() => setShowReportModal(true)}
            onShare={sharePost}
            onDelete={() => setShowDeleteConfirm(true)}
            onEdit={startEditing}
            bookmarked={bookmarked}
            onBookmark={toggleBookmark}
            isOwnPost={currentUserId === localPost.author_id}
          />
        </div>
      </div>
      {showTipModal && (
        <TipModal
          open={showTipModal}
          onClose={() => setShowTipModal(false)}
          onConfirm={(amount) => handleInteraction('tip', amount)}
          balance={balance}
        />
      )}
      {showReportModal && (
        <ConfirmModal
          open={showReportModal}
          onClose={() => { setShowReportModal(false); setReportReason('') }}
          title="Report Post"
        >
          <p className="text-inc-muted text-sm mb-4">Why are you reporting this post?</p>
          <div className="space-y-2 mb-4">
            {reportReasons.map((r) => (
              <button
                key={r}
                onClick={() => setReportReason(r)}
                aria-label={`Report as: ${r}`}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm text-left transition-all focus-visible:ring-2 focus-visible:ring-inc-accent focus-visible:outline-none ${
                  reportReason === r
                    ? 'border-inc-accent bg-inc-accent/10 text-inc-accent'
                    : 'border-inc-border text-inc-muted hover:border-inc-accent/50'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <button
            onClick={submitReport}
            disabled={!reportReason || reporting}
            aria-label="Submit report"
            className="w-full rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white hover:bg-red-600 transition-colors disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none"
          >
            {reporting ? 'Reporting...' : 'Submit Report'}
          </button>
        </ConfirmModal>
      )}
      {showDeleteConfirm && (
        <ConfirmModal
          open={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          title="Delete Post"
        >
          <p className="text-inc-muted text-sm mb-4">Are you sure you want to delete this post? This cannot be undone.</p>
          <button
            onClick={deletePost}
            disabled={deleting}
            aria-label="Confirm delete"
            className="w-full rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white hover:bg-red-600 transition-colors disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </ConfirmModal>
      )}
    </div>
  )
}

function MediaGallery({ mediaUrl }: { mediaUrl: string | string[] | null }) {
  const mediaUrls: string[] = useMemo(() => {
    if (!mediaUrl) return []
    if (Array.isArray(mediaUrl)) return mediaUrl
    try {
      const parsed = JSON.parse(mediaUrl)
      return Array.isArray(parsed) ? parsed : [mediaUrl]
    } catch {
      return [mediaUrl]
    }
  }, [mediaUrl])

  if (mediaUrls.length === 0) return null

  if (mediaUrls.length === 1) {
    return (
      <img
        src={mediaUrls[0]}
        alt=""
        className="mt-3 max-h-80 w-full rounded-xl object-cover"
        loading="lazy"
      />
    )
  }

  return (
    <div className={`mt-3 grid gap-2 ${
      mediaUrls.length === 2 ? 'grid-cols-2' :
      mediaUrls.length === 3 ? 'grid-cols-2' :
      'grid-cols-2'
    }`}>
      {mediaUrls.map((url, i) => (
        <img
          key={i}
          src={url}
          alt=""
          className={`rounded-xl object-cover w-full h-full ${
            mediaUrls.length === 3 && i === 0 ? 'row-span-2' : ''
          }`}
          style={{ maxHeight: 160 }}
          loading="lazy"
        />
      ))}
    </div>
  )
}
