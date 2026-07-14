import { cn } from '@/lib/utils'

type Props = { size?: 'sm' | 'md' | 'lg'; className?: string }

const SIZES = {
  sm: { box: 'w-8 h-8', text: 'text-sm' },
  md: { box: 'w-10 h-10', text: 'text-lg' },
  lg: { box: 'w-14 h-14', text: 'text-2xl' },
}

export function ProsperaLogoMark({ size = 'md', className }: Props) {
  const s = SIZES[size]
  return (
    <div className={cn('inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-amber-600 to-amber-400 shadow-md flex-shrink-0', s.box, className)} aria-hidden>
      <span className={cn('font-bold text-white leading-none', s.text)}>P</span>
    </div>
  )
}
