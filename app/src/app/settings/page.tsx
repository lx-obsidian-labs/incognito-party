'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/hooks/useSession'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { HandleDisplay } from '@/components/shared/HandleDisplay'
import { AvatarPlaceholder } from '@/components/shared/AvatarPlaceholder'
import { createClient } from '@/lib/supabase/client'
import { SettingsSkeleton } from '@/components/shared/Skeleton'
import { toast } from 'sonner'

type DmPrivacy = 'nobody' | 'tipped' | 'anyone'

const AVATAR_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#ef4444', '#84cc16']

const dmOptions: { value: DmPrivacy; label: string; desc: string }[] = [
  { value: 'anyone', label: 'Anyone', desc: 'All users can DM you' },
  { value: 'tipped', label: 'People I tipped', desc: 'Only users you have tipped can DM you' },
  { value: 'nobody', label: 'Nobody', desc: 'No one can DM you' },
]

interface ChannelWithSub {
  id: string
  slug: string
  name: string
  description: string
  icon: string
  subscribed: boolean
}

export default function SettingsPage() {
  const { user, loading } = useSession()
  const [dmPrivacy, setDmPrivacy] = useState<DmPrivacy>('anyone')
  const [bio, setBio] = useState('')
  const [avatarColor, setAvatarColor] = useState('')
  const [channels, setChannels] = useState<ChannelWithSub[]>([])
  const push = usePushNotifications()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return
      const uid = session.user.id
      Promise.all([
        supabase.from('channels').select('*'),
        supabase.from('channel_subs').select('channel_id').eq('user_id', uid),
      ]).then(([channelsRes, subsRes]) => {
        const allChannels = (channelsRes.data ?? []) as Array<Record<string, unknown>>
        const subChannelIds = new Set(((subsRes.data ?? []) as Array<Record<string, unknown>>).map((s) => s.channel_id as string))
        setChannels(
          allChannels.map((ch) => ({
            id: ch.id as string,
            slug: ch.slug as string,
            name: ch.name as string,
            description: ch.description as string,
            icon: ch.icon as string,
            subscribed: subChannelIds.has(ch.id as string),
          }))
        )
      })
    })
  }, [])

  async function toggleChannel(channelId: string, currentlySubscribed: boolean) {
    const supabase = createClient()
    const { data: session } = await supabase.auth.getSession()
    if (!session.session?.user) return
    const uid = session.session.user.id
    if (currentlySubscribed) {
      const { error } = await supabase.from('channel_subs').delete().eq('user_id', uid).eq('channel_id', channelId)
      if (error) {
        toast('Something hiccuped. Try again?')
        return
      }
    } else {
      const { error } = await supabase.from('channel_subs').insert({ user_id: uid, channel_id: channelId })
      if (error) {
        toast('Something hiccuped. Try again?')
        return
      }
    }
    setChannels((prev) =>
      prev.map((ch) => (ch.id === channelId ? { ...ch, subscribed: !currentlySubscribed } : ch))
    )
    toast(currentlySubscribed ? 'Unsubscribed.' : 'Subscribed!')
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (user?.dm_privacy) setDmPrivacy(user.dm_privacy)
    if (user?.bio !== undefined) setBio(user.bio ?? '')
    if (user?.avatar_color) setAvatarColor(user.avatar_color)
  }, [user])

  async function handleDmChange(value: DmPrivacy) {
    setDmPrivacy(value)
    const supabase = createClient()
    const { data: session } = await supabase.auth.getSession()
    if (!session.session?.user) return
    const { error } = await supabase
      .from('anon_users')
      .update({ dm_privacy: value })
      .eq('id', session.session.user.id)
    if (error) {
      toast('Something hiccuped. Try again?')
      return
    }
    toast(`DMs set to: ${dmOptions.find((o) => o.value === value)?.label}`)
  }

  async function saveBio(text: string) {
    const supabase = createClient()
    const { data: session } = await supabase.auth.getSession()
    if (!session.session?.user) return
    const { error } = await supabase.from('anon_users').update({ bio: text }).eq('id', session.session.user.id)
    if (error) toast('Something hiccuped. Try again?')
  }

  async function saveAvatarColor(color: string) {
    const supabase = createClient()
    const { data: session } = await supabase.auth.getSession()
    if (!session.session?.user) return
    const { error } = await supabase.from('anon_users').update({ avatar_color: color }).eq('id', session.session.user.id)
    if (error) toast('Something hiccuped. Try again?')
  }

  if (loading) {
    return <SettingsSkeleton />
  }

  return (
    <div className="px-4 py-4 space-y-6">
      <div className="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-inc-accent">
          <circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
        <h1 className="text-lg font-bold text-inc-text">Settings</h1>
      </div>

      {user && (
        <div className="flex items-center gap-3 rounded-2xl border border-inc-border bg-inc-card p-4">
          <AvatarPlaceholder handle={user.handle} size="md" color={avatarColor || undefined} />
          <div>
            <HandleDisplay handle={user.handle} size="md" />
            <p className="text-inc-muted text-xs mt-0.5">
              Joined {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="rounded-2xl border border-inc-border bg-inc-card p-4">
          <div className="flex items-start gap-3 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-inc-accent shrink-0 mt-0.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <div>
              <h3 className="font-semibold text-inc-text text-sm">Profile</h3>
              <p className="text-inc-muted text-xs mt-1 leading-relaxed">Customize your public profile.</p>
            </div>
          </div>
          <textarea
            value={bio}
            onChange={(e) => { setBio(e.target.value); saveBio(e.target.value) }}
            placeholder="Write a short bio..."
            maxLength={200}
            rows={3}
            className="w-full resize-none rounded-xl border border-inc-border bg-inc-dark px-4 py-2.5 text-sm text-inc-text placeholder-inc-muted focus:border-inc-accent focus:outline-none"
          />
          <p className="text-xs text-inc-muted mt-1">{bio.length}/200</p>
          <div className="flex gap-2 mt-3">
            {AVATAR_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => { setAvatarColor(color); saveAvatarColor(color) }}
                aria-label={`Avatar color ${color}`}
                className={`h-8 w-8 rounded-full transition-all ${avatarColor === color ? 'ring-2 ring-white scale-110' : ''}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-inc-border bg-inc-card p-4">
          <div className="flex items-start gap-3 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-inc-accent shrink-0 mt-0.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <div>
              <h3 className="font-semibold text-inc-text text-sm">Direct Messages</h3>
              <p className="text-inc-muted text-xs mt-1 leading-relaxed">
                Control who can send you direct messages.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {dmOptions.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${
                  dmPrivacy === opt.value
                    ? 'border-inc-accent bg-inc-accent/5'
                    : 'border-inc-border hover:border-inc-accent/50'
                }`}
              >
                <input
                  type="radio"
                  name="dm_privacy"
                  value={opt.value}
                  checked={dmPrivacy === opt.value}
                  onChange={() => handleDmChange(opt.value)}
                  className="accent-inc-accent"
                  aria-label={opt.label}
                />
                <div>
                  <span className="text-inc-text text-sm font-medium">{opt.label}</span>
                  <p className="text-inc-muted text-xs">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-inc-border bg-inc-card p-4">
          <div className="flex items-start gap-3 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-inc-accent shrink-0 mt-0.5"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            <div>
              <h3 className="font-semibold text-inc-text text-sm">Channels</h3>
              <p className="text-inc-muted text-xs mt-1 leading-relaxed">
                Choose which channels appear in your feed.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {channels.map((ch) => (
              <label key={ch.id} className="flex items-center justify-between rounded-xl border border-inc-border px-4 py-3 cursor-pointer hover:border-inc-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{ch.icon}</span>
                  <div>
                    <span className="text-inc-text text-sm font-medium">{ch.name}</span>
                    <p className="text-inc-muted text-xs">{ch.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleChannel(ch.id, ch.subscribed)}
                  aria-label={ch.subscribed ? `Unsubscribe from ${ch.name}` : `Subscribe to ${ch.name}`}
                  className={`rounded-lg border px-3 py-1 text-xs font-medium transition-all ${
                    ch.subscribed
                      ? 'border-inc-accent bg-inc-accent/10 text-inc-accent'
                      : 'border-inc-border text-inc-muted hover:text-inc-text'
                  }`}
                >
                  {ch.subscribed ? 'Subscribed' : 'Subscribe'}
                </button>
              </label>
            ))}
          </div>
        </div>

        <a
          href="/achievements"
          className="flex items-center gap-3 rounded-2xl border border-inc-border bg-inc-card p-4 transition-colors hover:border-inc-accent/50 focus-visible:ring-2 focus-visible:ring-inc-accent focus-visible:outline-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-inc-accent shrink-0 mt-0.5">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C6 4 6 6 6 9" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C18 4 18 6 18 9" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
          </svg>
          <div>
            <h3 className="font-semibold text-inc-text text-sm">Achievements</h3>
            <p className="text-inc-muted text-xs mt-0.5">View your badges and unlocked milestones</p>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-inc-muted ml-auto shrink-0">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </a>

        <div className="rounded-2xl border border-inc-border bg-inc-card p-4">
          <div className="flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-inc-accent shrink-0 mt-0.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <div>
              <h3 className="font-semibold text-inc-text text-sm">Privacy</h3>
              <p className="text-inc-muted text-xs mt-1 leading-relaxed">
                Incognito Party is fully anonymous. Your identity is tied only
                to your current device. Clearing your browser data will create a
                new identity.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-inc-border bg-inc-card p-4">
          <div className="flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-inc-accent shrink-0 mt-0.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <div className="flex-1">
              <h3 className="font-semibold text-inc-text text-sm">Push Notifications</h3>
              <p className="text-inc-muted text-xs mt-1 leading-relaxed">
                Get notified when someone interacts with your posts.
              </p>
              <button
                onClick={() => {
                  if (push.enabled) {
                    push.unsubscribe().catch(() => {})
                  } else {
                    push.subscribe().catch(() => {})
                  }
                }}
                disabled={push.loading}
                aria-label={push.enabled ? 'Disable push notifications' : 'Enable push notifications'}
                className={`mt-3 rounded-xl border px-4 py-2 text-sm transition-all focus-visible:ring-2 focus-visible:ring-inc-accent focus-visible:outline-none ${
                  push.enabled
                    ? 'border-inc-accent bg-inc-accent/10 text-inc-accent'
                    : 'border-inc-border text-inc-muted hover:border-inc-accent/50'
                }`}
              >
                {push.loading ? '...' : push.enabled ? 'Enabled' : 'Enable'}
              </button>
            </div>
          </div>
        </div>

        <a
          href="/settings/blocked"
          className="flex items-center gap-3 rounded-2xl border border-inc-border bg-inc-card p-4 hover:border-inc-accent/50 transition-colors"
        >
          <svg className="h-5 w-5 text-inc-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          <div>
            <h3 className="font-semibold text-inc-text text-sm">Blocked Users</h3>
            <p className="text-inc-muted text-xs mt-1 leading-relaxed">
              Manage users you have blocked
            </p>
          </div>
        </a>

        <div className="rounded-2xl border border-inc-border bg-inc-card p-4">
          <div className="flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-inc-accent shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <div>
              <h3 className="font-semibold text-inc-text text-sm">About</h3>
              <p className="text-inc-muted text-xs mt-1 leading-relaxed">
                Incognito Party v0.1.0 — MVP. Built for honest, anonymous
                expression with a tipping economy to reward quality content.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 text-sm text-inc-muted pt-4">
        <a href="/legal/tos" className="hover:text-inc-accent transition-colors focus-visible:ring-2 focus-visible:ring-inc-accent focus-visible:outline-none rounded-lg px-1">
          Terms of Service
        </a>
        <a href="/legal/privacy" className="hover:text-inc-accent transition-colors focus-visible:ring-2 focus-visible:ring-inc-accent focus-visible:outline-none rounded-lg px-1">
          Privacy Policy
        </a>
      </div>
    </div>
  )
}
