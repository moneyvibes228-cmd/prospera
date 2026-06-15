import { AlertTriangle } from 'lucide-react'
import type { Visit } from '@/types'
import { formatDate } from '@/lib/utils'

interface ProximityAlertProps {
  visits: Visit[]
}

export function ProximityAlert({ visits }: ProximityAlertProps) {
  if (!visits.length) return null

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle size={14} className="text-orange-600" />
        <span className="text-sm font-medium text-orange-700">
          {visits.length} adresse{visits.length > 1 ? 's' : ''} déjà visitée{visits.length > 1 ? 's' : ''} dans ce rayon
        </span>
      </div>
      <ul className="space-y-1">
        {visits.map(v => (
          <li key={v.id} className="text-xs text-orange-600 flex items-center gap-1">
            <span className="w-1 h-1 bg-orange-400 rounded-full flex-shrink-0" />
            <span>
              {v.borrowerNom} — {v.agentNom}
              {v.distance_metres && ` (${v.distance_metres}m)`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
