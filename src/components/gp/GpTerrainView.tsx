'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { MapPin, Bell, AlertTriangle, Users, ChevronRight } from 'lucide-react'
import { getGpAllClients, getGpMauvaisPayeurs } from '@/lib/gp-portefeuille-hub'
import { GP_AGENCE_NOM } from '@/lib/gp-lome-centre-stats'
import { formatFcfa } from '@/lib/utils'
import { cn } from '@/lib/utils'

const MapGpClients = dynamic(() => import('@/components/gp/MapGpClients'), { ssr: false })

type TerrainTab = 'carte' | 'relances'

export function GpTerrainView() {
  const allClients = useMemo(() => getGpAllClients(), [])
  const mauvaisPayeurs = useMemo(() => getGpMauvaisPayeurs(), [])
  const [tab, setTab] = useState<TerrainTab>('carte')
  const [filterRetard, setFilterRetard] = useState(false)

  const mapClients = useMemo(
    () => (filterRetard ? mauvaisPayeurs : allClients).filter(c => c.lat != null && c.lng != null),
    [allClients, mauvaisPayeurs, filterRetard],
  )

  const relancesPrioritaires = useMemo(
    () => [...mauvaisPayeurs].sort((a, b) => b.retard_j - a.retard_j).slice(0, 12),
    [mauvaisPayeurs],
  )

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Clients cartographiés</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{allClients.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">{GP_AGENCE_NOM}</div>
        </div>
        <div className="bg-white rounded-xl border border-red-200 p-4">
          <div className="text-[10px] font-bold text-red-500 uppercase">À relancer</div>
          <div className="text-2xl font-black text-red-700 mt-1">{mauvaisPayeurs.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">Retard &gt; 0 j</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 col-span-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Actions rapides</div>
          <div className="flex flex-wrap gap-2 mt-2">
            <Link
              href="/relances"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Bell size={12} />
              Ouvrir relances
            </Link>
            <button
              type="button"
              onClick={() => setFilterRetard(v => !v)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer',
                filterRetard
                  ? 'bg-red-100 text-red-800 border-red-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-red-300',
              )}
            >
              <AlertTriangle size={12} />
              {filterRetard ? 'Tous les clients' : 'Mauvais payeurs seulement'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setTab('carte')}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors',
            tab === 'carte' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100',
          )}
        >
          <MapPin size={16} />
          Carte clients ({mapClients.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('relances')}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors',
            tab === 'relances' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100',
          )}
        >
          <Bell size={16} />
          Relances terrain ({relancesPrioritaires.length})
        </button>
      </div>

      {tab === 'carte' && (
        <div className="rounded-xl overflow-hidden border border-slate-200 h-[calc(100vh-340px)] min-h-[420px]">
          <MapGpClients clients={mapClients} />
        </div>
      )}

      {tab === 'relances' && (
        <div className="grid md:grid-cols-2 gap-3">
          {relancesPrioritaires.map(client => (
            <Link
              key={client.borrowerId}
              href={`/emprunteurs/${client.borrowerId}`}
              className="flex items-center gap-3 bg-white border border-red-100 rounded-xl p-4 hover:border-red-300 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900 truncate group-hover:text-red-800">{client.nom}</div>
                <div className="text-xs text-red-600 font-semibold mt-0.5">Retard {client.retard_j} j · {formatFcfa(client.encours)}</div>
                <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{client.suggestion_ia}</div>
              </div>
              <ChevronRight size={16} className="text-slate-400 group-hover:text-red-600 flex-shrink-0" />
            </Link>
          ))}
          <Link
            href="/relances"
            className="md:col-span-2 flex items-center justify-center gap-2 py-3 text-sm font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded-xl hover:bg-teal-100 transition-colors"
          >
            <Users size={16} />
            Voir toutes les relances ({mauvaisPayeurs.length} clients en retard)
            <ChevronRight size={16} />
          </Link>
        </div>
      )}
    </div>
  )
}
