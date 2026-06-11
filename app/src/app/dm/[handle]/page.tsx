'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSession } from '@/hooks/useSession'
import { HandleDisplay } from '@/components/shared/HandleDisplay'
import { MessageThread } from '@/components/dm/MessageThread'
import { MessageComposer } from '@/components/dm/MessageComposer'
import type { IAnonUser } from '@/types'

export default function DMConversationPage({
  params,
}: {
  params: Promise<{ handle: string }>
}) {
  const { handle } = use(params)
  const router = useRouter()
  const { user, loading: sessionLoading } = useSession()
  const [otherUser, setOtherUser] = useState<IAnonUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [canDM, setCanDM] = useState(false)
  const [blockState, setBlockState] = useState<'none' | 'blocked_by_me' | 'blocked_me'>('none')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('anon_users')
      .select('*')
      .eq('handle', handle)
      .single()
      .then(({ data }) => {
        setOtherUser(data)
        setLoading(false)
      })
  }, [handle])

  useEffect(() => {
    if (!user || !otherUser) return
    const supabase = createClient()

    const checkCanDM = async (uid: string, oid: string) => {
      // Check blocking first
      const { data: blockedByMe } = await supabase
        .from('blocked_users')
        .select('*')
        .eq('user_id', uid)
        .eq('blocked_user_id', oid)
        .single()

      if (blockedByMe) {
        setBlockState('blocked_by_me')
        setCanDM(false)
        return
      }

      const { data: blockedMe } = await supabase
        .from('blocked_users')
        .select('*')
        .eq('user_id', oid)
        .eq('blocked_user_id', uid)
        .single()

      if (blockedMe) {
        setBlockState('blocked_me')
        setCanDM(false)
        return
      }

      const privacy = (otherUser as unknown as Record<string, unknown>).dm_privacy as string | undefined

      if (privacy === 'anyone' || !privacy) {
        setCanDM(true)
        return
      }

      if (privacy === 'nobody') {
        setCanDM(false)
        return
      }

      if (privacy === 'tipped') {
        const { data: theirPosts } = await supabase
          .from('posts')
          .select('id')
          .eq('author_id', oid)

        if (theirPosts && theirPosts.length > 0) {
          const postIds = theirPosts.map((p) => (p as Record<string, unknown>).id)
          const { data: tips } = await supabase
            .from('interactions')
            .select('id')
            .eq('user_id', uid)
            .in('post_id', postIds)
            .eq('type', 'tip')

          if (tips && tips.length > 0) {
            setCanDM(true)
            return
          }
        }
      }

      const { data } = await supabase
        .from('dm_relationships')
        .select('*')
        .eq('user_id', oid)
        .eq('allowed_user_id', uid)
        .single()
      setCanDM(!!data)
    }

    checkCanDM(user.id, otherUser.id)
  }, [user, otherUser])

  // typing indicator is received via realtime/dm:typing events handled by MessageThread

  // Mark messages as read when conversation opens
  useEffect(() => {
    if (!user || !otherUser) return
    const supabase = createClient()
    ;(supabase
      .from('direct_messages')
      .update({ is_read: true })
      .eq('sender_id', otherUser.id)
      .eq('recipient_id', user.id)
      .eq('is_read', false) as unknown as Promise<unknown>).then(() => {})
  }, [user, otherUser])

  if (sessionLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="h-8 w-8 animate-spin text-inc-accent" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
      </div>
    )
  }

  if (!otherUser) {
    return (
      <div className="px-4 py-8">
        <p className="text-inc-muted">User not found</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center gap-3 border-b border-inc-border px-3 sm:px-4 py-2 sm:py-3 sticky top-0 bg-inc-dark z-10">
        <button
          onClick={() => router.back()}
          className="text-inc-muted hover:text-inc-text transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <HandleDisplay handle={otherUser.handle} size="md" />
      </div>

      {!canDM ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 px-6 text-center">
          {blockState === 'blocked_by_me' ? (
            <>
              <svg className="h-12 w-12 text-inc-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              <p className="text-inc-muted">
                You have blocked @{otherUser.handle}.
              </p>
              <p className="text-inc-muted text-sm">
                Unblock them in Settings to send messages again.
              </p>
            </>
          ) : blockState === 'blocked_me' ? (
            <>
              <svg className="h-12 w-12 text-inc-muted" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <p className="text-inc-muted">
                @{otherUser.handle} cannot be reached.
              </p>
              <p className="text-inc-muted text-sm">
                This user has restricted communication with you.
              </p>
            </>
          ) : (
            <>
              <svg className="h-12 w-12 text-inc-muted" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <p className="text-inc-muted">
                @{otherUser.handle} has not allowed DMs from you yet.
              </p>
              <p className="text-inc-muted text-sm">
                Interact with their posts to build trust, or send them a tip.
              </p>
            </>
          )}
        </div>
      ) : (
        <>
          <MessageThread
            otherHandle={otherUser.handle}
            otherId={otherUser.id}
            currentUserId={user!.id}
            
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
          <div className="border-t border-inc-border">
            <MessageComposer
              recipientId={otherUser.id}
              currentUserId={user!.id}
              onSent={() => {}}
            />
          </div>
        </>
      )}
    </div>
  )
}
