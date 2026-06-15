'use client'
import { useState } from 'react'
import {
  MapPin, Navigation, Camera, Clock, CheckCircle2, XCircle, AlertCircle,
  User, Activity, Eye,
} from 'lucide-react'
import { TERRAIN_REALTIME, ANOMALIES_JOUR } from '@/lib/mockMicrofinance'
import { AiBadge } from '../AiBadge'
import { KpiCardWithSparkline } from '../KpiCardWithSparkline'
import { formatFcfa } from '@/lib/utils'

const STATUT_BADGE: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  EN_VISITE:       { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500',  label: 'En visite' },
  EN_DEPLACEMENT:  { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500',   label: 'En route' },
  AU_BUREAU:       { bg: 'bg-slate-100',  text: 'text-slate-700',  dot: 'bg-slate-500',  label: 'Au bureau' },
  EN_PAUSE:        { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500', label: 'En pause' },
  HORS_LIGNE:      { bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500',    label: 'Hors ligne' },
}

const PHOTO_STATUT: Record<string, string> = {
  VALIDEE:   'bg-green-100 text-green-700',
  A_VALIDER: 'bg-orange-100 text-orange-700',
  REJETEE:   'bg-red-100 text-red-700',
}

export function OngletTerrain() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const { agents_positions, responsables_agence, stats_terrain_jour, photos_recentes, checkin_checkout } = TERRAIN_REALTIME

  const agentDetail = selectedAgent ? agents_positions.find(a => a.agent_id === selectedAgent) : null
  const anomaliesTerrain = ANOMALIES_JOUR.filter(a => a.domaine === 'TERRAIN' || a.domaine === 'FRAUDE')

  return (
    <div className="space-y-5">

      {/* ── KPIs Terrain ── */}
      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <h2 className="text-sm font-bold text-slate-700">KPIs Terrain — Activité du jour</h2>
          <AiBadge variant="small" label="Temps réel" pulse />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCardWithSparkline
            title="Agents actifs"
            value={`${stats_terrain_jour.agents_actifs}/${stats_terrain_jour.agents_actifs + (stats_terrain_jour.agents_hors_ligne ?? 0)}`}
            unit={`${stats_terrain_jour.responsables_pilotage ?? 0} RA en pilotage`}
            variation={0}
            variationLabel="Conformité GPS 94%"
            sparkline={[5, 5, 4, 5, 5, 4, 5, 4, 4]}
            colorScheme="green"
            badge="Activité"
          />
          <KpiCardWithSparkline
            title="Visites du jour"
            value={`${stats_terrain_jour.visites_total_jour}/${stats_terrain_jour.visites_objectif}`}
            unit={`${stats_terrain_jour.taux_realisation_pct}% obj.`}
            variation={8.4}
            variationLabel="vs hier"
            sparkline={[14, 16, 17, 18, 19, 20, 20, 19, 20]}
            colorScheme="blue"
            badge="Visites"
          />
          <KpiCardWithSparkline
            title="Collecte du jour"
            value={stats_terrain_jour.collecte_jour}
            unit="FCFA"
            variation={-6.5}
            variationLabel={`obj. ${formatFcfa(stats_terrain_jour.collecte_objectif)}`}
            sparkline={[420, 445, 460, 478, 482, 471, 465, 462, 458].map(v => v * 1000)}
            colorScheme="teal"
            badge="Collecte"
            format="fcfa"
          />
          <KpiCardWithSparkline
            title="Photos uploadées"
            value={`${stats_terrain_jour.photos_validees}/${stats_terrain_jour.photos_uploadees}`}
            unit={`${stats_terrain_jour.photos_a_valider} à valider`}
            variation={12.5}
            variationLabel="Validation IA"
            sparkline={[12, 13, 14, 16, 17, 17, 18, 18, 18]}
            colorScheme="purple"
            badge="Preuves"
          />
        </div>
      </div>

      {/* Responsables agence — pilotage */}
      <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-4">
        <h3 className="text-sm font-bold text-indigo-900 mb-3">Responsables d&apos;agence — pilotage (0 visite terrain)</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {responsables_agence.map(ra => (
            <div key={ra.agent_id} className="bg-white rounded-lg border border-indigo-100 p-3 text-xs">
              <div className="font-bold text-slate-900">{ra.nom}</div>
              <div className="text-slate-500">{ra.agence} · {ra.clients_agence} clients</div>
              <div className="text-indigo-600 mt-1">{ra.derniere_action}</div>
              <div className="text-[10px] text-slate-400">{ra.equipe_terrain} agent(s) terrain · {ra.derniere_action_heure}</div>
            </div>
          ))}
        </div>
      </div>

      {/* AGENTS TERRAIN — Commerciaux & GP */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Navigation size={15} className="text-teal-600" />
            <h3 className="text-sm font-semibold text-slate-900">Équipe terrain — commerciaux & GP</h3>
            <AiBadge variant="small" label="GPS continu" pulse />
          </div>
          <span className="text-xs text-slate-400">62 clients Lomé Centre · mêmes dossiers, vues différentes</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-slate-500 uppercase border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 font-bold">Agent · Rôle · Zone</th>
                <th className="text-left px-3 py-3 font-bold">Statut</th>
                <th className="text-left px-3 py-3 font-bold">Position actuelle</th>
                <th className="text-left px-3 py-3 font-bold">Dernière action</th>
                <th className="text-center px-3 py-3 font-bold">Visites</th>
                <th className="text-right px-3 py-3 font-bold">Collecte</th>
                <th className="text-center px-3 py-3 font-bold">GPS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {agents_positions.map(a => {
                const statut = STATUT_BADGE[a.statut]
                const visitesPct = a.visites_objectif > 0 ? (a.visites_jour / a.visites_objectif) * 100 : 0
                const collectePct = a.collecte_objectif > 0 ? (a.collecte_jour / a.collecte_objectif) * 100 : 0
                const isSelected = selectedAgent === a.agent_id
                const ext = a as typeof a & { role?: string; zone?: string; clients_portefeuille?: number }
                return (
                  <tr key={a.agent_id}
                      onClick={() => setSelectedAgent(prev => prev === a.agent_id ? null : a.agent_id)}
                      className={`hover:bg-slate-50 cursor-pointer ${isSelected ? 'bg-teal-50' : ''}`}>
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${ext.role === 'GP' ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'}`}>
                            {a.nom.split(' ').map(p => p[0]).join('')}
                          </div>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${statut.dot}`} />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-800">{a.nom}</div>
                          <div className="text-[10px] text-slate-400">{ext.role ?? 'Agent'} · {a.agence}{ext.zone ? ` · ${ext.zone}` : ''}</div>
                          {ext.clients_portefeuille && <div className="text-[10px] text-teal-600">{ext.clients_portefeuille} clients portefeuille</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${statut.bg} ${statut.text}`}>
                        {statut.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        <MapPin size={11} className="text-slate-400" />
                        <span className="text-[11px] text-slate-700">{a.derniere_position.lieu}</span>
                      </div>
                      <div className="text-[9px] text-slate-400 font-mono">{a.derniere_position.lat.toFixed(4)}, {a.derniere_position.lng.toFixed(4)}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="text-[11px] text-slate-700">{a.derniere_action}</div>
                      <div className="text-[9px] text-slate-400 flex items-center gap-1"><Clock size={9} /> {a.derniere_action_heure}</div>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="text-xs font-bold text-slate-800">{a.visites_jour}/{a.visites_objectif}</div>
                      <div className="w-14 mx-auto bg-slate-100 rounded-full h-1 mt-0.5">
                        <div className={`h-full rounded-full ${visitesPct >= 100 ? 'bg-green-500' : visitesPct >= 70 ? 'bg-orange-500' : 'bg-red-500'}`}
                             style={{ width: `${Math.min(visitesPct, 100)}%` }} />
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="text-xs font-bold text-teal-700">{formatFcfa(a.collecte_jour)}</div>
                      <div className={`text-[9px] font-bold ${collectePct >= 100 ? 'text-green-600' : collectePct >= 70 ? 'text-orange-600' : 'text-red-600'}`}>
                        {Math.round(collectePct)}% obj.
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        a.conformite_gps_pct >= 95 ? 'bg-green-100 text-green-700' :
                        a.conformite_gps_pct >= 85 ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>{a.conformite_gps_pct}%</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Détail agent sélectionné */}
        {agentDetail && (
          <div className="border-t border-slate-100 bg-slate-50 p-5">
            <div className="flex items-center gap-2 mb-3">
              <User size={14} className="text-teal-600" />
              <h4 className="text-sm font-bold text-slate-800">Drill-down agent : {agentDetail.nom}</h4>
              <button onClick={() => setSelectedAgent(null)} className="text-xs text-teal-600 hover:underline ml-auto">Fermer</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-400 uppercase">Conformité GPS</div>
                <div className="text-xl font-black text-slate-800">{agentDetail.conformite_gps_pct}%</div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-400 uppercase">Visites jour</div>
                <div className="text-xl font-black text-slate-800">{agentDetail.visites_jour}</div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-400 uppercase">Collecte jour</div>
                <div className="text-lg font-black text-teal-700">{formatFcfa(agentDetail.collecte_jour)}</div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-400 uppercase">Position</div>
                <div className="text-sm font-bold text-slate-800">{agentDetail.derniere_position.lieu}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════
          CHECK-IN / CHECK-OUT + PHOTOS PREUVES
         ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-12 gap-4">

        <div className="col-span-12 lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Clock size={15} className="text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-900">Check-in / Check-out GPS du jour</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {checkin_checkout.map((c, i) => (
              <div key={i} className={`p-4 hover:bg-slate-50 ${c.anomalie ? 'bg-red-50/30' : ''}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800">{c.agent}</span>
                  <span className="text-[10px] text-slate-400">{c.agence_depart}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 size={11} className="text-green-600" />
                    <span className="text-slate-600">Check-in : <b>{c.checkin}</b></span>
                  </div>
                  {c.checkout ? (
                    <div className="flex items-center gap-1">
                      <XCircle size={11} className="text-slate-400" />
                      <span className="text-slate-600">Check-out : <b>{c.checkout}</b></span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded">EN COURS</span>
                  )}
                  <span className="text-[10px] text-slate-400 ml-auto">{c.km_estime} km</span>
                </div>
                {c.anomalie && (
                  <div className="mt-2 flex items-center gap-1 text-[11px] text-red-700 font-semibold">
                    <AlertCircle size={11} />
                    {c.anomalie}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera size={15} className="text-purple-600" />
              <h3 className="text-sm font-semibold text-slate-900">Photos preuves récentes</h3>
              <AiBadge variant="small" label={`${photos_recentes.length} aujourd'hui`} />
            </div>
            <span className="text-xs text-slate-400">{stats_terrain_jour.photos_a_valider} à valider</span>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {photos_recentes.map(p => (
              <div key={p.id} className={`p-3 rounded-lg border ${p.gps_ok ? 'border-slate-200 bg-white' : 'border-red-200 bg-red-50/50'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold text-slate-400">{p.id}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${PHOTO_STATUT[p.statut]}`}>
                    {p.statut.replaceAll('_', ' ')}
                  </span>
                </div>
                <div className="flex gap-2.5">
                  <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 border border-slate-200">
                    <Camera size={20} className="text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-800 truncate">{p.client}</div>
                    <div className="text-[11px] text-slate-500">{p.agent} · {p.heure}</div>
                    <div className="text-[10px] text-slate-400">{p.type}</div>
                    <div className="flex items-center gap-1 mt-1">
                      {p.gps_ok ? (
                        <><CheckCircle2 size={9} className="text-green-600" /><span className="text-[9px] text-green-600 font-bold">GPS OK</span></>
                      ) : (
                        <><XCircle size={9} className="text-red-600" /><span className="text-[9px] text-red-600 font-bold">GPS INCOHÉRENT</span></>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 italic mt-2 pt-2 border-t border-slate-100">"{p.notes}"</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════
          ANOMALIES TERRAIN
         ═══════════════════════════════════════════════════ */}
      {anomaliesTerrain.length > 0 && (
        <div className="bg-white rounded-xl border border-red-200 shadow-sm">
          <div className="px-5 py-4 border-b border-red-100 flex items-center gap-2 bg-red-50">
            <AlertCircle size={15} className="text-red-600" />
            <h3 className="text-sm font-semibold text-red-900">Anomalies terrain — Action immédiate</h3>
            <AiBadge variant="small" label={`${anomaliesTerrain.length} détectées`} />
          </div>
          <div className="divide-y divide-slate-50">
            {anomaliesTerrain.map(a => (
              <div key={a.id} className="p-4 hover:bg-slate-50">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    a.severite === 'CRITIQUE' ? 'bg-red-100 text-red-700' :
                    a.severite === 'HAUTE' ? 'bg-orange-100 text-orange-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{a.severite}</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{a.domaine}</span>
                  <span className="text-[10px] text-slate-400 ml-auto">il y a {a.detecte_il_y_a}</span>
                </div>
                <p className="text-sm font-bold text-slate-800">{a.titre}</p>
                <p className="text-[11px] text-slate-600 mt-0.5">{a.detail}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[11px] text-teal-700 font-semibold">→ {a.action_recommandee}</span>
                  <span className="text-[10px] text-slate-400">· {a.responsable} · {a.delai}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
