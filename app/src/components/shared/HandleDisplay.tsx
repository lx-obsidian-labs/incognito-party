'use client'

import { cn } from '@/lib/utils'

interface Props {
  handle: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  online?: boolean
}

const colors = [
  '#00f0ff', '#ff00aa', '#ff6b35', '#00ff87', '#ffd700',
  '#ff69b4', '#7b68ee', '#00ced1', '#ff4500', '#32cd32',
]

function colorFromHandle(handle: string): string {
  let hash = 0
  for (let i = 0; i < handle.length; i++) {
    hash = handle.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function HandleDisplay({ handle, size = 'md', className, online }: Props) {
  const color = colorFromHandle(handle)
  const sizeClass = { sm: 'text-sm', md: 'text-base', lg: 'text-lg' }

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      {online && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
        </span>
      )}
      <span className={cn('font-bold tracking-tight', sizeClass[size])} style={{ color }}>
        @{handle}
      </span>
    </span>
  )
}
