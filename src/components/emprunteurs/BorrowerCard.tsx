import { formatFcfa, formatDate, getStatusLabel } from '@/lib/utils'
import type { Borrower } from '@/types'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { User, Phone, MapPin, Calendar } from 'lucide-react'

interface BorrowerCardProps {
  borrower: Borrower
}

export function BorrowerCard({ borrower }: BorrowerCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
          <User size={20} className="text-teal-600" />
        </div>
        <div>
          <div className="font-semibold text-slate-900">{borrower.nom}</div>
          <StatusBadge status={borrower.statut} className="mt-0.5" />
        </div>
      </div>

      <div className="space-y-2.5 text-sm">
        <div className="flex items-center gap-2 text-slate-600">
          <Phone size={14} className="text-slate-400 flex-shrink-0" />
          <span>{borrower.telephone}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <MapPin size={14} className="text-slate-400 flex-shrink-0" />
          <span>{borrower.zone}</span>
        </div>
        {borrower.derniere_visite && (
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar size={14} className="text-slate-400 flex-shrink-0" />
            <span>Dernière visite : {formatDate(borrower.derniere_visite)}</span>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-slate-100 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Montant crédit</span>
          <span className="font-medium text-slate-800">{formatFcfa(borrower.montant_credit)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Remboursé</span>
          <span className="font-medium text-green-600">{formatFcfa(borrower.montant_rembourse)}</span>
        </div>
        {borrower.retard_jours > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Retard</span>
            <span className="font-bold text-red-600">J+{borrower.retard_jours}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Agent</span>
          <span className="font-medium text-slate-700">{borrower.agent?.nom ?? '—'}</span>
        </div>
      </div>
    </div>
  )
}
