'use client'
import { formatDate } from '@/lib/utils'
import type { Visit } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  POSITIVE:     'bg-green-100 text-green-700',
  NEGATIVE:     'bg-red-100 text-red-700',
  SANS_REPONSE: 'bg-slate-100 text-slate-600',
}

const STATUS_LABELS: Record<string, string> = {
  POSITIVE:     'Positive',
  NEGATIVE:     'Négative',
  SANS_REPONSE: 'Sans réponse',
}

const METHODE_LABELS: Record<string, string> = {
  VISITE_TERRAIN: 'Visite terrain',
  PORTE_A_PORTE:  'Porte-à-porte',
  APPEL:          'Appel',
  BROCHURE:       'Brochure',
  LETTRE:         'Lettre',
}

interface VisitHistoryProps {
  visits: Visit[]
}

export function VisitHistory({ visits }: VisitHistoryProps) {
  if (!visits.length) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">
        Aucune visite trouvée.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Date</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Emprunteur</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Agent</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Méthode</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Statut</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Commentaire</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {visits.map(v => (
            <tr key={v.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 text-slate-600">{formatDate(v.date)}</td>
              <td className="px-4 py-3 font-medium text-slate-800">{v.borrowerNom}</td>
              <td className="px-4 py-3 text-slate-600">{v.agentNom}</td>
              <td className="px-4 py-3 text-slate-600">{METHODE_LABELS[v.methode] ?? v.methode}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[v.statut]}`}>
                  {STATUS_LABELS[v.statut] ?? v.statut}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-500 text-xs max-w-xs truncate">{v.commentaire}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
