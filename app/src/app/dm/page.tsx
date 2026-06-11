'use client'

import { useSession } from '@/hooks/useSession'
import { ConversationList } from '@/components/dm/ConversationList'
import { Loader2, MessageCircle } from 'lucide-react'

export default function DMInboxPage() {
  const { loading } = useSession()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-inc-accent" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-2 border-b border-inc-border px-4 py-3">
        <MessageCircle className="h-5 w-5 text-inc-accent" />
        <h1 className="text-lg font-bold text-inc-text">Messages</h1>
      </div>
      <ConversationList />
    </div>
  )
}
