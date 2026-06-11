'use client'

import { ConfirmModal } from '@/components/shared/ConfirmModal'

interface Props {
  open: boolean
  onClose: () => void
}

export function CommunityGuidelines({ open, onClose }: Props) {
  return (
    <ConfirmModal open={open} onClose={onClose} title="Community Guidelines">
      <div className="space-y-3 text-sm text-inc-text leading-relaxed">
        <section>
          <h3 className="font-medium text-inc-accent mb-1">🔒 Stay Anonymous</h3>
          <p className="text-inc-muted">
            Never share personal info — no phone numbers, emails, addresses, or social media handles.
            Our system blocks these automatically. If you see someone trying to break anonymity, report them.
          </p>
        </section>

        <section>
          <h3 className="font-medium text-inc-accent mb-1">💜 Be Kind</h3>
          <p className="text-inc-muted">
            Everyone here is sharing honestly. No harassment, hate speech, threats, or bullying.
            Disagree respectfully or scroll past.
          </p>
        </section>

        <section>
          <h3 className="font-medium text-inc-accent mb-1">🚫 No NSFW Content</h3>
          <p className="text-inc-muted">
            No explicit, sexual, or violent content. This is a safe space for genuine connection.
          </p>
        </section>

        <section>
          <h3 className="font-medium text-inc-accent mb-1">💬 Chat Requests</h3>
          <p className="text-inc-muted">
            You can send credits to start a private chat with someone. They have to accept first.
            Chats auto-expire after the set duration. Keep conversations respectful — reports lead to bans.
          </p>
        </section>

        <section>
          <h3 className="font-medium text-inc-accent mb-1">📋 Be Authentic</h3>
          <p className="text-inc-muted">
            No spamming, self-promotion, or impersonation. Share what&apos;s real to you.
          </p>
        </section>

        <section>
          <h3 className="font-medium text-inc-accent mb-1">👮 Moderation</h3>
          <p className="text-inc-muted">
            Posts and messages are monitored. Violations may result in warnings, content removal, or bans.
            You can appeal by contacting support.
          </p>
        </section>
      </div>

      <button
        onClick={onClose}
        className="w-full mt-4 py-2.5 rounded-lg bg-inc-accent text-white font-medium hover:opacity-90 transition-opacity"
      >
        Got it
      </button>
    </ConfirmModal>
  )
}
