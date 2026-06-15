import { cn, getStatusLabel, getStatusColor } from '@/lib/utils'
import type { BorrowerStatus } from '@/types'

interface StatusBadgeProps {
  status: BorrowerStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
      getStatusColor(status),
      className
    )}>
      {getStatusLabel(status)}
    </span>
  )
}
