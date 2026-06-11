'use client'

import { useAchievements } from '@/hooks/useAchievements'
import { cn } from '@/lib/utils'

export default function AchievementsPage() {
  const { achievements, loading } = useAchievements()

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-inc-accent">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C6 4 6 6 6 9" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C18 4 18 6 18 9" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
        <h1 className="text-lg font-bold text-inc-text">Achievements</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-inc-muted">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {achievements.map((ach) => (
            <div
              key={ach.slug}
              className={cn(
                'rounded-2xl border p-4 flex flex-col items-center gap-2 text-center transition-colors',
                ach.unlocked
                  ? 'border-inc-accent bg-inc-accent/5'
                  : 'border-inc-border bg-inc-card opacity-50',
              )}
            >
              <span className="text-3xl">{ach.icon}</span>
              <div>
                <p className={cn(
                  'text-sm font-bold',
                  ach.unlocked ? 'text-inc-text' : 'text-inc-muted',
                )}>
                  {ach.title}
                </p>
                <p className="text-inc-muted text-xs mt-0.5">{ach.description}</p>
              </div>
              {ach.unlocked ? (
                <div className="flex items-center gap-1 text-xs text-green-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  Unlocked
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs text-inc-muted">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Locked
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
