'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Home, Search, MessageCircle, Bell, Wallet, Bookmark, Settings, Sparkles } from 'lucide-react'
import { Tooltip } from '@/components/shared/Tooltip'


const tabConfig = [
  { href: '/feed', label: 'Feed', icon: Home },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/dm', label: 'DMs', icon: MessageCircle },
  { href: '/notifications', label: 'Alerts', icon: Bell },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
  { href: '/saved', label: 'Saved', icon: Bookmark },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [unreadCount, setUnreadCount] = useState<number>(0)

  useEffect(() => {
    const supabase = createClient()
    let mounted = true
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user || !mounted) return

      const walletRes = await (supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', session.user.id)
        .single() as unknown as Promise<{ data: { balance: number } | null; error: null }>)
      if (walletRes.data && mounted) setWalletBalance(walletRes.data.balance)

      const notifRes = await (supabase
        .from('notifications')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('read', false) as unknown as Promise<{ data: unknown[]; error: null }>)
      if (mounted) setUnreadCount((notifRes.data as unknown[])?.length ?? 0)

      // Subscribe to wallet changes
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ch = supabase.channel as any
      const walletSub = ch('navbar-wallet')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets', filter: `user_id=eq.${session.user.id}` }, (payload: Record<string, unknown>) => {
          if (payload.new && mounted) setWalletBalance((payload.new as Record<string, unknown>).balance as number)
        })
        .subscribe()

      const notifSub = ch('navbar-notif')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${session.user.id}` }, () => {
          if (!mounted) return
          void (supabase.from('notifications').select('id').eq('user_id', session.user.id).eq('read', false) as unknown as Promise<{ data: unknown[] | null }>)
          .then(({ data }) => {
            if (mounted) setUnreadCount((data ?? []).length)
          })
        })
        .subscribe()

      return () => {
        supabase.removeChannel(walletSub)
        supabase.removeChannel(notifSub)
      }
    })()
    return () => { mounted = false }
  }, [])

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-inc-border bg-inc-dark/95 backdrop-blur-lg">
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {tabConfig.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Tooltip key={href} content={label}>
              <Link
                href={href}
                aria-label={label}
                className={cn(
                  'relative flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-inc-accent focus-visible:outline-none rounded-lg',
                  active ? 'text-inc-accent' : 'text-inc-muted hover:text-inc-text',
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 1.5} />
                <span className="text-[10px]">{label}</span>
                {href === '/wallet' && walletBalance !== null && (
                  <span className="absolute -top-0.5 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-inc-tip px-1 text-[9px] font-bold text-white leading-none">
                    {walletBalance}
                  </span>
                )}
                {href === '/notifications' && unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-1 text-[9px] font-bold text-white leading-none">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            </Tooltip>
          )
        })}
        {/* Floating create button centered */}
        <Tooltip content="Create Post">
          <button
            aria-label="Create Post"
            onClick={() => router.push('/feed')}
            className="absolute -top-6 left-1/2 -translate-x-1/2 rounded-full bg-inc-accent p-3 shadow-lg text-inc-dark hover:bg-inc-accent/90 transition-all focus-visible:ring-2 focus-visible:ring-inc-accent"
          >
            <Sparkles className="h-5 w-5" />
          </button>
        </Tooltip>
      </div>
    </nav>
  )
}
