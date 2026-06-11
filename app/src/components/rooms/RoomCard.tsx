'use client'

import Link from 'next/link'
import JoinButton from './JoinButton'

export default function RoomCard({ channel }: { channel: any }) {
  return (
    <div className="rounded-xl border border-inc-border p-4 bg-inc-card flex items-center justify-between">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-2xl">{channel.icon ?? '💬'}</div>
        <div>
          <div className="flex items-center gap-3">
            <div className="text-lg font-semibold">{channel.name}</div>
            {channel.badge && (
              <span className={`text-xs px-2 py-1 rounded-full bg-inc-secondary text-inc-muted`}>{channel.badge.label}</span>
            )}
          </div>
          <p className="text-inc-muted text-sm mt-1">{channel.description}</p>
          <div className="text-sm text-inc-muted mt-2 flex items-center gap-3">
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-400"/> {channel.subscribers} online</div>
            <div className="flex items-center gap-2">· {channel.talking} talking</div>
          </div>
        </div>
      </div>
      <div>
        <JoinButton channelId={channel.id} joined={channel.joined} onJoin={() => { const ev = new CustomEvent('room-join', { detail: { id: channel.id } }); window.dispatchEvent(ev) }} />
      </div>
    </div>
  )
}
