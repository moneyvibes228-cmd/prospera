'use client'
import Link from 'next/link'
import { ChevronUp, ChevronDown, ArrowRight } from 'lucide-react'
import { cn, formatFcfa, getRiskColor } from '@/lib/utils'
import { ScoreBadge } from './ScoreBadge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import type { Borrower } from '@/types'

interface BorrowerTableProps {
  data: Borrower[]
  sortKey: string
  sortDir: 'asc' | 'desc'
  onSort: (key: string) => void
}

const columns = [
  { key: 'nom',           label: 'Nom',          width: 'auto' },
  { key: 'score_ia',      label: 'Score IA',      width: 'w-24' },
  { key: 'montant_credit', label: 'Montant',      width: 'w-36' },
  { key: 'statut',        label: 'Statut',         width: 'w-36' },
  { key: 'retard_jours',  label: 'Retard',         width: 'w-20' },
  { key: 'agent',         label: 'Agent',          width: 'w-36' },
  { key: 'actions',       label: '',               width: 'w-24' },
]

export function BorrowerTable({ data, sortKey, sortDir, onSort }: BorrowerTableProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <p className="text-slate-500 text-sm">Aucun emprunteur trouvé avec ces filtres.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            {columns.map(col => (
              <th
                key={col.key}
                className={cn(
                  'text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide',
                  col.width !== 'auto' && col.width,
                  col.key !== 'actions' && 'cursor-pointer select-none hover:text-slate-700'
                )}
                onClick={() => col.key !== 'actions' && onSort(col.key)}
              >
                <span className="flex items-center gap-1">
                  {col.label}
                  {col.key !== 'actions' && col.key === sortKey && (
                    sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.map(borrower => {
            const risk = getRiskColor(borrower.score_ia)
            return (
              <tr
                key={borrower.id}
                className={cn(
                  'hover:bg-slate-50 transition-colors',
                  risk.bg
                )}
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{borrower.nom}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{borrower.zone}</div>
                </td>
                <td className="px-4 py-3">
                  <ScoreBadge score={borrower.score_ia} />
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {formatFcfa(borrower.montant_credit)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={borrower.statut} />
                </td>
                <td className="px-4 py-3">
                  {borrower.retard_jours > 0 ? (
                    <span className="text-red-600 font-medium">J+{borrower.retard_jours}</span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {borrower.agent?.nom ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/emprunteurs/${borrower.id}`}
                    className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-800 font-medium bg-teal-50 hover:bg-teal-100 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    Fiche client
                    <ArrowRight size={12} />
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
