import { cn, getRiskColor } from '@/lib/utils'

interface ScoreBadgeProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
}

export function ScoreBadge({ score, size = 'md' }: ScoreBadgeProps) {
  const risk = getRiskColor(score)

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-1 font-semibold',
    lg: 'text-sm px-3 py-1 font-bold',
  }

  return (
    <span className={cn(
      'inline-flex items-center rounded-full',
      risk.bg, risk.text,
      `border ${risk.border}`,
      sizeClasses[size]
    )}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: risk.dot }} />
      {score}
    </span>
  )
}
