'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  BookOpen, MapPin, AlertTriangle, Users, Target, ArrowRight, Layers, Navigation,
} from 'lucide-react'
import { getZonesHub } from '@/lib/zones-hub'
import { RESEAU_CONSOLIDE } from '@/lib/agences'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { ExportButton } from '@/components/dashboard/ExportButton'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { ZonesTables } from '@/components/zones/ZonesTables'
import { cn, formatFcfa } from '@/lib/utils'

const ZonesDgMap = dynamic(() => import('@/components/zones/ZonesDgMap'), {
  ssr: false,
  loading: () => <div className="h-[380px] bg-slate-100 animate-pulse rounded-xl" />,
})

type Tab = 'zones' | 'agents' | 'expansion'
type MapFocus = 'lome' | 'kpalime'

export function ZonesDgView() {
  const hub = getZonesHub()
  const k = hub.kpis
  const [tab, setTab] = useState<Tab>('zones')
  const [mapFocus, setMapFocus] = useState<MapFocus>('lome')
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)

  const selectedZone = hub.micro_zones.find(z => z.id === selectedZoneId) ?? null
  const selectedAgent = hub.agents.find(a => a.id === selectedAgentId) ?? null

  return (
    <PageWrapper
      title="Couverture terrain réseau"
      subtitle={`${k.zones_actives} micro-zones · ${k.agents_terrain_actifs} agents terrain · ${k.clients_cartographie} clients géolocalisés`}
      actions={<ExportButton label="Exporter couverture" filename="couverture_terrain_dg" size="sm" />}
    >
      <Link
        href="/equipe"
        className="flex items-center gap-3 mb-5 p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-teal-300 hover:bg-teal-50/30 transition-colors cursor-pointer group"
      >
        <Users size={20} className="text-teal-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-900 group-hover:text-teal-800">
            Scores performance sur Équipe & Performance
          </div>
          <div className="text-xs text-slate-600 mt-0.5">
            Perf. moyenne {hub.reference_equipe.performance_moyenne_pct} % · {hub.reference_equipe.agents_degrades} agent(s) dégradé(s) — cette page couvre l&apos;affectation géographique et les lacunes de couverture.
          </div>
        </div>
        <ArrowRight size={16} className="text-slate-400 group-hover:text-teal-600 shrink-0" />
      </Link>

      <div className="bg-gradient-to-br from-teal-50 to-indigo-50 rounded-xl border border-teal-200 p-5 mb-5">
        <div className="flex items-center gap-2 mb-2">
          <Navigation size={18} className="text-teal-700" />
          <h2 className="text-sm font-bold text-slate-900">Memo couverture — lecture DG</h2>
          <AiBadge variant="small" label="Analyse territoriale" />
        </div>
        <p className="text-sm text-slate-800 leading-relaxed">{hub.synthese_memo}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Couverture micro-zones', value: `${k.couverture_micro_zones_pct} %`, sub: `${k.zones_actives} zones actives`, color: k.couverture_micro_zones_pct >= 75 ? 'text-emerald-600' : 'text-orange-600' },
          { label: 'Pénétration marché', value: `${k.penetration_marche_pct} %`, sub: `${RESEAU_CONSOLIDE.total_emprunteurs} / ~600 cibles`, color: 'text-slate-900' },
          { label: 'Zones vierges', value: String(k.zones_vierges), sub: 'Expansion identifiée IA', color: k.zones_vierges > 3 ? 'text-red-600' : 'text-amber-600' },
          { label: 'Anomalies GPS (7j)', value: String(k.anomalies_gps_7j), sub: `Rayon moy. ${k.rayon_couverture_km} km`, color: k.anomalies_gps_7j > 0 ? 'text-red-600' : 'text-emerald-600' },
        ].map(item => (
          <div key={item.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="text-[10px] uppercase font-bold text-slate-500">{item.label}</div>
            <div className={cn('text-2xl font-black mt-1', item.color)}>{item.value}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{item.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-4 mb-5">
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-teal-600" />
              <h3 className="text-sm font-semibold text-slate-900">Carte couverture réseau</h3>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setMapFocus('lome')}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer transition-colors',
                  mapFocus === 'lome' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                )}
              >
                Lomé (6 zones)
              </button>
              <button
                type="button"
                onClick={() => setMapFocus('kpalime')}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer transition-colors',
                  mapFocus === 'kpalime' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                )}
              >
                Kpalimé
              </button>
            </div>
          </div>
          <div className="h-[380px] relative">
            <ZonesDgMap
              hub={hub}
              selectedZoneId={selectedZoneId}
              selectedAgentId={selectedAgentId}
              onSelectZone={setSelectedZoneId}
              onSelectAgent={setSelectedAgentId}
              focus={mapFocus}
            />
          </div>
          <div className="px-4 py-2 border-t border-slate-100 flex flex-wrap gap-3 text-[10px] text-slate-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full border-2 border-emerald-500 bg-emerald-500/20" /> Zone OK</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-500" /> Client actif</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> Client retard</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Commercial</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-teal-600" /> GP</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-indigo-500" /> Resp. agence</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rotate-45 bg-teal-500" /> Agence</span>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm p-4 min-h-[420px]">
          {selectedZone ? (
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Micro-zone sélectionnée</div>
              <h3 className="text-lg font-bold text-slate-900">{selectedZone.nom}</h3>
              <div className="text-xs text-slate-500 mt-1">{selectedZone.agence} · {selectedZone.agents_assignes} agent(s)</div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Couverture</span>
                  <span className={cn('font-bold', selectedZone.couverture_pct < 65 ? 'text-red-600' : 'text-emerald-600')}>{selectedZone.couverture_pct} %</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full', selectedZone.couverture_pct < 65 ? 'bg-red-500' : 'bg-emerald-500')} style={{ width: `${selectedZone.couverture_pct}%` }} />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Collecte jour</span>
                  <span className="font-bold">{formatFcfa(selectedZone.collecte_jour)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Objectif</span>
                  <span>{formatFcfa(selectedZone.objectif_jour)}</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="text-[10px] uppercase font-bold text-slate-500 mb-2">Agents sur zone</div>
                {hub.agents.filter(a => a.micro_zone === selectedZone.nom).map(a => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelectedAgentId(a.id)}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors mb-1"
                  >
                    <div className="text-sm font-medium">{a.nom}</div>
                    <div className="text-[10px] text-slate-500">{a.visites_jour}/{a.visites_prevues} visites · GPS {a.gps_conformite_pct} %</div>
                  </button>
                ))}
                {hub.agents.filter(a => a.micro_zone === selectedZone.nom).length === 0 && (
                  <p className="text-xs text-slate-500">Aucun agent directement assigné — couverture partielle.</p>
                )}
              </div>
            </div>
          ) : selectedAgent ? (
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Agent sélectionné</div>
              <h3 className="text-lg font-bold text-slate-900">{selectedAgent.nom}</h3>
              <div className="text-xs text-slate-500 mt-1">{selectedAgent.role} · {selectedAgent.agence}</div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-600">Micro-zone</span><span className="font-bold">{selectedAgent.micro_zone}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Couverture</span><span className={cn('font-bold', selectedAgent.couverture_pct < 65 ? 'text-red-600' : 'text-emerald-600')}>{selectedAgent.couverture_pct} %</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Visites/j</span><span className="font-bold">{selectedAgent.visites_jour}/{selectedAgent.visites_prevues}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Clients</span><span className="font-bold">{selectedAgent.clients_portefeuille}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">GPS conforme</span><span className={cn('font-bold', selectedAgent.gps_conformite_pct < 80 ? 'text-red-600' : 'text-emerald-600')}>{selectedAgent.gps_conformite_pct} %</span></div>
              </div>
              {selectedAgent.gps_alerte && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 font-medium">
                  Alerte géofencing — audit terrain recommandé
                </div>
              )}
              <p className="mt-4 text-xs text-slate-600 leading-relaxed">{selectedAgent.ia_resume}</p>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 px-4">
              <Layers size={32} className="text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-700">Sélectionnez une zone ou un agent</p>
              <p className="text-xs mt-1">Cliquez sur la carte pour voir couverture, agents assignés et alertes GPS.</p>
            </div>
          )}
        </div>
      </div>

      {hub.lacunes.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-5 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <AlertTriangle size={16} className="text-orange-600" />
            <h3 className="text-sm font-semibold text-slate-900">Lacunes de couverture — zones sous 70 %</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {hub.lacunes.map(l => (
              <div key={l.zone} className={cn('px-5 py-3 flex gap-3', l.priorite === 1 && 'bg-red-50/30')}>
                <span className={cn('shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white', l.priorite === 1 ? 'bg-red-500' : l.priorite === 2 ? 'bg-orange-500' : 'bg-slate-400')}>
                  P{l.priorite}
                </span>
                <div>
                  <div className="text-sm font-bold text-slate-900">{l.zone} <span className="text-slate-500 font-normal">({l.agence})</span></div>
                  <div className="text-xs text-slate-600">Couverture {l.couverture_pct} % — {l.impact}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-5 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-900">Décisions DG — couverture & expansion</h3>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {hub.decisions_dg.map(d => (
            <div key={d.titre} className={cn('px-5 py-3 flex gap-3', d.priorite === 1 && 'bg-teal-50/30')}>
              <span className={cn('shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white', d.priorite === 1 ? 'bg-teal-600' : d.priorite === 2 ? 'bg-indigo-500' : 'bg-slate-400')}>
                P{d.priorite}
              </span>
              <div>
                <div className="text-sm font-bold text-slate-900">{d.titre}</div>
                <div className="text-xs text-slate-600 mt-0.5">{d.detail}</div>
                <div className="text-[10px] text-teal-700 mt-1">Impact : {d.impact} · Délai : {d.delai}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <details className="bg-slate-50 rounded-xl border border-slate-200 mb-5 group">
        <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer text-sm font-semibold text-slate-800 hover:bg-slate-100 rounded-xl transition-colors list-none">
          <BookOpen size={16} className="text-teal-600" />
          Comprendre la couverture terrain (guide DG)
        </summary>
        <div className="px-4 pb-4 grid md:grid-cols-2 gap-3">
          {hub.glossaire.map(g => (
            <div key={g.terme} className="bg-white rounded-lg border border-slate-200 p-3">
              <div className="text-xs font-bold text-teal-700">{g.terme}</div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{g.definition}</p>
              {g.seuil_dg && <p className="text-[10px] text-orange-700 font-medium mt-1.5">{g.seuil_dg}</p>}
            </div>
          ))}
        </div>
      </details>

      <div className="flex flex-wrap gap-2 mb-4">
        {([
          ['zones', 'Micro-zones', hub.micro_zones.length],
          ['agents', 'Agents terrain', hub.agents.length],
          ['expansion', 'Zones expansion', hub.zones_expansion.length],
        ] as const).map(([id, label, count]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer',
              tab === id ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100 bg-white border border-slate-200',
            )}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      <ZonesTables
        hub={hub}
        tab={tab}
        onSelectZone={id => { setSelectedZoneId(id); setSelectedAgentId(null); setMapFocus(hub.micro_zones.find(z => z.id === id)?.agence === 'Kpalimé' ? 'kpalime' : 'lome') }}
        onSelectAgent={id => { setSelectedAgentId(id); setSelectedZoneId(null) }}
      />
    </PageWrapper>
  )
}
