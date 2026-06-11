'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const icons: Record<string, string> = {
  home: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  search: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>',
  message: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  bell: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  wallet: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>',
  saved: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
  settings: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
}

const tabs = [
  { href: '/feed', label: 'Feed', icon: 'home' },
  { href: '/search', label: 'Search', icon: 'search' },
  { href: '/dm', label: 'DMs', icon: 'message' },
  { href: '/notifications', label: 'Alerts', icon: 'bell' },
  { href: '/wallet', label: 'Wallet', icon: 'wallet' },
  { href: '/saved', label: 'Saved', icon: 'saved' },
  { href: '/settings', label: 'Settings', icon: 'settings' },
]

export function Navbar() {
  const pathname = usePathname()
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [unreadCount, setUnreadCount] = useState<number>(0)

  useEffect(() => {
    const supabase = createClient()
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      const walletRes = await (supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', session.user.id)
        .single() as unknown as Promise<{ data: { balance: number } | null; error: null }>)
      if (walletRes.data) setWalletBalance(walletRes.data.balance)

      const notifRes = await (supabase
        .from('notifications')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('read', false) as unknown as Promise<{ data: unknown[]; error: null }>)
      setUnreadCount((notifRes.data as unknown[])?.length ?? 0)
    })()
  }, [])

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-inc-border bg-inc-dark/95 backdrop-blur-lg">
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {tabs.map(({ href, label, icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={cn(
                'relative flex flex-col items-center gap-0.5 px-4 py-1 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-inc-accent focus-visible:outline-none rounded-lg',
                active ? 'text-inc-accent' : 'text-inc-muted hover:text-inc-text',
              )}
            >
              <span
                className="h-5 w-5"
                dangerouslySetInnerHTML={{ __html: icons[icon as keyof typeof icons] }}
              />
              {label}
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
          )
        })}
      </div>
    </nav>
  )
}
