'use client'

import { cn } from '@/lib/utils'

interface Props {
  handle: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
  online?: boolean
  color?: string
}

const bgColors = [
  'from-cyan-500 to-blue-600',
  'from-pink-500 to-rose-600',
  'from-purple-500 to-indigo-600',
  'from-orange-500 to-red-600',
  'from-green-500 to-emerald-600',
  'from-yellow-500 to-amber-600',
]

function bgFromHandle(handle: string): string {
  let hash = 0
  for (let i = 0; i < handle.length; i++) {
    hash = handle.charCodeAt(i) + ((hash << 5) - hash)
  }
  return bgColors[Math.abs(hash) % bgColors.length]
}

export function AvatarPlaceholder({ handle, size = 'md', className, online, color }: Props) {
  const bg = bgFromHandle(handle)
  const initial = handle.charAt(0).toUpperCase()
  const sizeClass = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-xl',
  }

  return (
    <div className={cn('relative shrink-0', className)}>
      <div
        className={cn(
          'flex items-center justify-center rounded-full font-bold text-white',
          !color && 'bg-gradient-to-br',
          !color && bg,
          sizeClass[size],
        )}
        style={color ? { backgroundColor: color } : undefined}
        aria-hidden="true"
      >
        {initial}
      </div>
      {online && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500 ring-2 ring-inc-dark" />
        </span>
      )}
    </div>
  )
}
