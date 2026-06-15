'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  MapPin, Users, Footprints, Layers, AlertTriangle, Navigation, ChevronRight,
} from 'lucide-react'
import { getRaTerrainZonesHub } from '@/lib/ra-terrain-zones-hub'
import { formatFcfa, cn } from '@/lib/utils'
import { AGENCE_RA, getRaHubData } from '@/lib/ra-agence-hub'

const TerrainRaZonesMap = dynamic(() => import('@/components/ra/TerrainRaZonesMap'), {
  ssr: false,
  loading: () => <div className="h-full min-h-[420px] bg-slate-100 animate-pulse rounded-xl" />,
})

type Tab = 'carte' | 'visites' | 'zones'

export function TerrainRaBlock() {
  const hub = getRaTerrainZonesHub(AGENCE_RA.id)
  const [tab, setTab] = useState<Tab>('carte')
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [selectedVisiteId, setSelectedVisiteId] = useState<string | null>(null)

  const selectedZone = hub.micro_zones.find(z => z.id === selectedZoneId) ?? null
  const selectedAgent = hub.agents.find(a => a.id === selectedAgentId) ?? null
  const selectedVisite = hub.visites_jour.find(v => v.id === selectedVisiteId) ?? null

  const raHub = getRaHubData(AGENCE_RA.id)
  const collecteJour = raHub.agents_terrain.reduce((s, a) => s + a.collecte_jour, 0)

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-indigo-50 to-teal-50 rounded-xl border border-indigo-200 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Navigation size={16} className="text-indigo-700" />
          <h2 className="text-sm font-bold text-slate-900">Couverture terrain — {hub.agence.nom}</h2>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">{hub.synthese}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {[
          { label: 'Micro-zones', value: String(hub.kpis.micro_zones), sub: `Couv. moy. ${hub.kpis.couverture_moy_pct} %` },
          { label: 'Visites jour', value: `${hub.kpis.visites_realisees}/${hub.kpis.visites_prevues}`, sub: 'Réalisées / prévues' },
          { label: 'Agents terrain', value: `${hub.kpis.agents_actifs}`, sub: 'Commerciaux actifs' },
          { label: 'Clients carte', value: String(hub.kpis.clients_cartographies), sub: 'Géolocalisés' },
          { label: 'Lacunes', value: String(hub.lacunes.length), sub: hub.lacunes.length ? 'Zones < 70 %' : 'Aucune' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-3">
            <div className="text-[9px] font-bold text-slate-500 uppercase">{k.label}</div>
            <div className="text-lg font-black text-slate-900 mt-0.5">{k.value}</div>
            <div className="text-[9px] text-slate-500">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-slate-200">
        {([
          { id: 'carte' as const, label: 'Carte & zones' },
          { id: 'visites' as const, label: `Visites (${hub.visites_jour.length})` },
          { id: 'zones' as const, label: 'Micro-zones' },
        ]).map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer',
              tab === t.id ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-800',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'carte' && (
        <div className="grid lg:grid-cols-12 gap-4 min-h-[520px]">
          <div className="lg:col-span-3 space-y-3 overflow-y-auto max-h-[560px]">
            <SidebarKpis hub={hub} collecteJour={collecteJour} />
            <AgentsList agents={hub.agents} onSelect={id => { setSelectedAgentId(id); setSelectedZoneId(null); setSelectedVisiteId(null) }} />
            <VisitesList
              visites={hub.visites_jour.slice(0, 8)}
              selectedId={selectedVisiteId}
              onSelect={id => { setSelectedVisiteId(id); setSelectedZoneId(null); setSelectedAgentId(null) }}
              compact
            />
          </div>

          <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[420px]">
            <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-2 text-xs text-slate-600">
              <MapPin size={12} className="text-teal-600" />
              Carte agence — zones, clients, visites du jour
            </div>
            <div className="flex-1 min-h-[380px] relative">
              <TerrainRaZonesMap
                hub={hub}
                selectedZoneId={selectedZoneId}
                selectedAgentId={selectedAgentId}
                selectedVisiteId={selectedVisiteId}
                onSelectZone={setSelectedZoneId}
                onSelectAgent={setSelectedAgentId}
                onSelectVisite={setSelectedVisiteId}
              />
            </div>
            <MapLegend />
          </div>

          <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-4 min-h-[320px]">
            <DetailPanel
              selectedZone={selectedZone}
              selectedAgent={selectedAgent}
              selectedVisite={selectedVisite}
              hub={hub}
            />
          </div>
        </div>
      )}

      {tab === 'visites' && (
        <div className="grid lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7">
            <VisitesList
              visites={hub.visites_jour}
              selectedId={selectedVisiteId}
              onSelect={setSelectedVisiteId}
            />
          </div>
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-4">
            {selectedVisite ? (
              <VisiteDetail v={selectedVisite} />
            ) : (
              <p className="text-sm text-slate-500 text-center py-12">Sélectionnez une visite pour le détail.</p>
            )}
          </div>
        </div>
      )}

      {tab === 'zones' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase text-slate-500 bg-slate-50 border-b">
                <th className="text-left px-4 py-2 font-bold">Zone</th>
                <th className="text-center px-2 py-2 font-bold">Couverture</th>
                <th className="text-right px-2 py-2 font-bold">Collecte j</th>
                <th className="text-center px-2 py-2 font-bold">Agents</th>
                <th className="text-center px-4 py-2 font-bold">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {hub.micro_zones.map(z => (
                <tr
                  key={z.id}
                  className="hover:bg-slate-50 cursor-pointer"
                  onClick={() => { setSelectedZoneId(z.id); setTab('carte') }}
                >
                  <td className="px-4 py-2.5 font-medium text-slate-800">{z.nom}</td>
                  <td className="px-2 py-2.5 text-center font-bold">{z.couverture_pct} %</td>
                  <td className="px-2 py-2.5 text-right">{formatFcfa(z.collecte_jour)}</td>
                  <td className="px-2 py-2.5 text-center">{z.agents_assignes}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded-full',
                      z.statut === 'BON' ? 'bg-green-100 text-green-800' :
                      z.statut === 'DEGRADE' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800',
                    )}>
                      {z.statut}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {hub.lacunes.length > 0 && (
        <div className="bg-white rounded-xl border border-orange-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-orange-100 flex items-center gap-2 bg-orange-50/50">
            <AlertTriangle size={14} className="text-orange-600" />
            <h3 className="text-sm font-bold text-slate-900">Zones à renforcer (&lt; 70 % couverture)</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {hub.lacunes.map(l => (
              <div key={l.zone} className="px-4 py-3 text-sm">
                <span className="font-bold text-slate-900">{l.zone}</span>
                <span className="text-red-600 font-bold ml-2">{l.couverture_pct} %</span>
                <p className="text-xs text-slate-600 mt-1">{l.impact}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SidebarKpis({ hub, collecteJour }: { hub: ReturnType<typeof getRaTerrainZonesHub>; collecteJour: number }) {
  const couv = hub.kpis.couverture_moy_pct
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 text-sm space-y-2">
      <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide">Résultats du jour</h3>
      <Row label="Visites" value={`${hub.kpis.visites_realisees}/${hub.kpis.visites_prevues}`} />
      <Row label="Couverture moy." value={`${couv} %`} boldClass="text-indigo-700" />
      <Row label="Collecte jour" value={formatFcfa(collecteJour)} boldClass="text-teal-700" />
    </div>
  )
}

function Row({ label, value, boldClass = 'text-slate-900' }: { label: string; value: string; boldClass?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-600">{label}</span>
      <span className={cn('font-bold', boldClass)}>{value}</span>
    </div>
  )
}

function AgentsList({
  agents,
  onSelect,
}: {
  agents: ReturnType<typeof getRaTerrainZonesHub>['agents']
  onSelect: (id: string) => void
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Users size={14} className="text-indigo-600" />
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide">Périmètres commerciaux</h3>
      </div>
      <div className="space-y-2">
        {agents.map(a => (
          <button
            key={a.id}
            type="button"
            onClick={() => onSelect(a.id)}
            className="w-full text-left p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer transition-colors"
          >
            <div className="flex justify-between items-start gap-2">
              <div>
                <div className="text-xs font-bold text-slate-800">{a.nom.split(' ')[0]}</div>
                <div className="text-[10px] text-slate-500">{a.micro_zone}</div>
              </div>
              <span className={cn('text-xs font-black', a.couverture_pct < 70 ? 'text-red-600' : 'text-green-700')}>
                {a.couverture_pct} %
              </span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {a.visites_jour}/{a.visites_prevues} visites · {a.clients_portefeuille} clients
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function VisitesList({
  visites,
  selectedId,
  onSelect,
  compact,
}: {
  visites: ReturnType<typeof getRaTerrainZonesHub>['visites_jour']
  selectedId: string | null
  onSelect: (id: string) => void
  compact?: boolean
}) {
  return (
    <div className={cn('bg-white rounded-xl border border-slate-200', compact ? 'p-3' : 'overflow-hidden')}>
      <div className={cn('flex items-center gap-2', compact ? 'mb-2' : 'px-4 py-3 border-b border-slate-100')}>
        <Footprints size={14} className="text-teal-600" />
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          Visites effectuées aujourd&apos;hui
        </h3>
      </div>
      <div className={cn(compact ? 'space-y-1 max-h-48 overflow-y-auto' : 'divide-y divide-slate-50 max-h-[480px] overflow-y-auto')}>
        {visites.map(v => (
          <button
            key={v.id}
            type="button"
            onClick={() => onSelect(v.id)}
            className={cn(
              'w-full text-left cursor-pointer transition-colors',
              compact ? 'p-2 rounded-lg text-xs' : 'px-4 py-3 hover:bg-slate-50',
              selectedId === v.id && 'bg-teal-50 border-l-2 border-teal-500',
              v.statut === 'NEGATIVE' && selectedId !== v.id && 'bg-red-50/40',
            )}
          >
            <div className="flex justify-between gap-2">
              <span className="font-bold text-slate-800 truncate">{v.client_nom}</span>
              <span className="text-slate-500 shrink-0">{v.heure}</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {v.agent_nom.split(' ')[0]} · {v.zone} · {v.methode === 'APPEL' ? 'Appel' : 'Terrain'}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function VisiteDetail({ v }: { v: ReturnType<typeof getRaTerrainZonesHub>['visites_jour'][0] }) {
  return (
    <div>
      <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Visite sélectionnée</div>
      <h3 className="text-lg font-bold text-slate-900">{v.client_nom}</h3>
      <div className="text-xs text-slate-500 mt-1">{v.heure} · {v.agent_nom}</div>
      <div className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-slate-600">Zone</span><span className="font-bold">{v.zone}</span></div>
        <div className="flex justify-between"><span className="text-slate-600">Méthode</span><span className="font-bold">{v.methode.replace('_', ' ')}</span></div>
        <div className="flex justify-between"><span className="text-slate-600">Résultat</span><span className={cn('font-bold', v.statut === 'POSITIVE' ? 'text-green-700' : 'text-red-600')}>{v.statut}</span></div>
      </div>
      <p className="mt-4 text-xs text-slate-600 leading-relaxed">{v.commentaire}</p>
      <Link
        href={`/emprunteurs/${v.client_id}`}
        className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900"
      >
        Fiche client <ChevronRight size={12} />
      </Link>
    </div>
  )
}

function DetailPanel({
  selectedZone,
  selectedAgent,
  selectedVisite,
  hub,
}: {
  selectedZone: ReturnType<typeof getRaTerrainZonesHub>['micro_zones'][0] | null
  selectedAgent: ReturnType<typeof getRaTerrainZonesHub>['agents'][0] | null
  selectedVisite: ReturnType<typeof getRaTerrainZonesHub>['visites_jour'][0] | null
  hub: ReturnType<typeof getRaTerrainZonesHub>
}) {
  if (selectedVisite) return <VisiteDetail v={selectedVisite} />
  if (selectedZone) {
    const zoneVisits = hub.visites_jour.filter(v => v.zone === selectedZone.nom || selectedZone.nom.includes(v.zone))
    return (
      <div>
        <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Micro-zone</div>
        <h3 className="text-lg font-bold text-slate-900">{selectedZone.nom}</h3>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between"><span>Couverture</span><span className="font-bold">{selectedZone.couverture_pct} %</span></div>
          <div className="flex justify-between"><span>Collecte jour</span><span className="font-bold">{formatFcfa(selectedZone.collecte_jour)}</span></div>
        </div>
        <p className="text-xs text-slate-600 mt-4">{zoneVisits.length} visite(s) enregistrée(s) aujourd&apos;hui dans cette zone.</p>
      </div>
    )
  }
  if (selectedAgent) {
    const agentVisits = hub.visites_jour.filter(v => v.agent_nom === selectedAgent.nom)
    return (
      <div>
        <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Commercial</div>
        <h3 className="text-lg font-bold text-slate-900">{selectedAgent.nom}</h3>
        <div className="text-xs text-slate-500">{selectedAgent.micro_zone}</div>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between"><span>Couverture zone</span><span className="font-bold">{selectedAgent.couverture_pct} %</span></div>
          <div className="flex justify-between"><span>Visites jour</span><span className="font-bold">{selectedAgent.visites_jour}/{selectedAgent.visites_prevues}</span></div>
          <div className="flex justify-between"><span>Portefeuille</span><span className="font-bold">{selectedAgent.clients_portefeuille} clients</span></div>
        </div>
        <p className="text-xs text-slate-600 mt-4 leading-relaxed">{selectedAgent.ia_resume}</p>
        <p className="text-xs font-medium text-teal-800 mt-2">{agentVisits.length} visites du jour listées</p>
      </div>
    )
  }
  return (
    <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 px-2">
      <Layers size={28} className="text-slate-300 mb-2" />
      <p className="text-sm font-medium text-slate-700">Sélectionnez une zone, un agent ou une visite</p>
      <p className="text-xs mt-1">Cercles = micro-zones · points = clients · carrés = visites du jour</p>
    </div>
  )
}

function MapLegend() {
  return (
    <div className="px-4 py-2 border-t border-slate-100 flex flex-wrap gap-3 text-[10px] text-slate-500">
      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full border-2 border-emerald-500 bg-emerald-500/20" /> Zone</span>
      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-500" /> Client</span>
      <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-600 rounded-sm" /> Visite OK</span>
      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Commercial</span>
    </div>
  )
}
