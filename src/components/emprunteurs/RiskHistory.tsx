'use client'
import { formatDate, formatFcfa } from '@/lib/utils'
import type { Payment } from '@/types'
import { cn } from '@/lib/utils'

const TYPE_COLORS: Record<string, string> = {
  REMBOURSEMENT:  'bg-green-50 border-green-100 text-green-700',
  PARTIEL:        'bg-orange-50 border-orange-100 text-orange-700',
  DEFAUT:         'bg-red-50 border-red-100 text-red-700',
  REGULARISATION: 'bg-blue-50 border-blue-100 text-blue-700',
}

const TYPE_LABELS: Record<string, string> = {
  REMBOURSEMENT:  'Remboursement',
  PARTIEL:        'Partiel',
  DEFAUT:         'Défaut',
  REGULARISATION: 'Régularisation',
}

const CANAL_LABELS: Record<string, string> = {
  MOBILE_MONEY: 'Mobile Money',
  ESPECES:      'Espèces',
  VIREMENT:     'Virement',
}

interface RiskHistoryProps {
  payments?: Payment[]
}

export function RiskHistory({ payments }: RiskHistoryProps) {
  if (!payments || payments.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">
        Aucun historique de paiement disponible.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left px-3 py-2 text-xs font-medium text-slate-500 uppercase">Date</th>
            <th className="text-left px-3 py-2 text-xs font-medium text-slate-500 uppercase">Montant</th>
            <th className="text-left px-3 py-2 text-xs font-medium text-slate-500 uppercase">Type</th>
            <th className="text-left px-3 py-2 text-xs font-medium text-slate-500 uppercase">Canal</th>
            <th className="text-left px-3 py-2 text-xs font-medium text-slate-500 uppercase">Agent</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {payments.map(p => (
            <tr key={p.id} className={cn('border-l-2', TYPE_COLORS[p.type]?.split(' ')[2] ? '' : '')}>
              <td className="px-3 py-2.5 text-slate-600">{formatDate(p.date)}</td>
              <td className="px-3 py-2.5 font-medium text-slate-800">{formatFcfa(p.montant)}</td>
              <td className="px-3 py-2.5">
                <span className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                  TYPE_COLORS[p.type]
                )}>
                  {TYPE_LABELS[p.type] ?? p.type}
                </span>
              </td>
              <td className="px-3 py-2.5 text-slate-600">{CANAL_LABELS[p.canal] ?? p.canal}</td>
              <td className="px-3 py-2.5 text-slate-600">{p.agent}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
