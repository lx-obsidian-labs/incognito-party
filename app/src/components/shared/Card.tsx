import { cn } from '@/lib/utils'

interface Props {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className }: Props) {
  return (
    <div className={cn('rounded-2xl border border-inc-border bg-inc-card p-4', className)}>
      {children}
    </div>
  )
}
