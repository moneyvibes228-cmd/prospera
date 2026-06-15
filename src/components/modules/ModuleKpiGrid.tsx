import { cn } from '@/lib/utils'

export interface KpiItem {
  label: string
  value: string
  sub?: string
  highlight?: 'teal' | 'red' | 'orange' | 'blue' | 'default'
}

export function ModuleKpiGrid({ items, cols = 4 }: { items: KpiItem[]; cols?: 2 | 3 | 4 | 5 | 6 }) {
  const colClass =
    cols === 6 ? 'lg:grid-cols-6' :
    cols === 5 ? 'lg:grid-cols-5' :
    cols === 3 ? 'lg:grid-cols-3' :
    cols === 2 ? 'lg:grid-cols-2' :
    'lg:grid-cols-4'

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-3 gap-3 mb-6', colClass)}>
      {items.map((k) => (
        <div
          key={k.label}
          className={cn(
            'bg-white rounded-xl border border-slate-200 p-4 cursor-default transition-colors hover:border-slate-300',
            k.highlight === 'red' && 'border-red-200 bg-red-50/30',
            k.highlight === 'orange' && 'border-orange-200 bg-orange-50/30',
          )}
        >
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{k.label}</div>
          <div
            className={cn(
              'text-xl font-black mt-1',
              k.highlight === 'teal' && 'text-teal-700',
              k.highlight === 'red' && 'text-red-600',
              k.highlight === 'orange' && 'text-orange-700',
              k.highlight === 'blue' && 'text-blue-700',
              !k.highlight && 'text-slate-900',
            )}
          >
            {k.value}
          </div>
          {k.sub && <div className="text-[10px] text-slate-500 mt-0.5">{k.sub}</div>}
        </div>
      ))}
    </div>
  )
}
