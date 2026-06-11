'use client'

export default function JoinButton({ channelId, joined, onJoin }: { channelId: string; joined: boolean; onJoin: (id: string) => void }) {
  return (
    <div>
      {!joined ? (
        <button onClick={() => onJoin(channelId)} className="rounded-full bg-gradient-to-br from-purple-500 to-pink-400 px-4 py-2 text-sm font-medium">Join</button>
      ) : (
        <button className="rounded-full border border-inc-border px-4 py-2 text-sm font-medium">Joined ✓</button>
      )}
    </div>
  )
}
