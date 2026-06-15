'use client'
import dynamic from 'next/dynamic'
import { MapPin } from 'lucide-react'
import { useMaZone } from '@/hooks/usePhase1'

const ZonesAgentsMap = dynamic(
  () => import('@/components/phase1/ZonesAgentsMap').then(m => ({ default: m.ZonesAgentsMap })),
  { ssr: false, loading: () => <div className="h-40 bg-slate-100 animate-pulse rounded-xl" /> },
)

export function MaZoneCard() {
  const { data, isLoading } = useMaZone()

  if (isLoading) {
    return <div className="h-24 bg-slate-100 animate-pulse rounded-xl mb-4" />
  }

  const zone = data?.zone
  if (!zone) return null

  const agentMock = [
    {
      id: 'me',
      nom: '',
      prenom: 'Ma',
      agence: { id: '', nom: 'Zone assignée' },
      zone_affectee: zone,
      stats: undefined,
    },
  ]

  return (
    <div className="mb-6 bg-white border border-teal-200 rounded-xl overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
        <MapPin size={16} className="text-teal-600" />
        <div>
          <h3 className="text-sm font-bold text-slate-900">{zone.libelle}</h3>
          <p className="text-xs text-slate-500">
            {zone.description ?? 'Zone assignée'}
          </p>
        </div>
      </div>
      <ZonesAgentsMap agents={agentMock} height="200px" />
    </div>
  )
}
