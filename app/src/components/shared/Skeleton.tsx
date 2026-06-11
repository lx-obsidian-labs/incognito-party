import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-inc-border/50', className)}
    />
  )
}

export function PostCardSkeleton() {
  return (
    <div className="rounded-2xl border border-inc-border bg-inc-card p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="mt-3 flex items-center gap-4">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function WalletSkeleton() {
  return (
    <div className="px-4 py-4 space-y-6">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-6 w-28" />
      <Skeleton className="h-20 w-full rounded-2xl" />
      <Skeleton className="h-20 w-full rounded-2xl" />
      <Skeleton className="h-20 w-full rounded-2xl" />
    </div>
  )
}

export function ConversationListSkeleton() {
  return (
    <div className="divide-y divide-inc-border">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SettingsSkeleton() {
  return (
    <div className="px-4 py-4 space-y-6">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-16 w-full rounded-2xl" />
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
    </div>
  )
}
