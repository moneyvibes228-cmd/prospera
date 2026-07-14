'use client'

import { useState, useMemo } from 'react'
import {
  Trophy, Sparkles, Filter,
  AlertTriangle, Award, Target, Zap, Star,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { MatricePostesPanel } from './MatricePostesPanel'
import { useAuth } from '@/contexts/AuthContext'
import { formatFcfa } from '@/lib/utils'
import {
  buildEquipePerformanceDG, buildSyntheseEquipeDG, buildAnalysesEquipeIA,
  buildDecisionsEquipeDG, getPerformancePct,
  STATUT_PERF_STYLE, BADGE_STYLE,
  type CommercialPerformanceDG, type VueEquipeDG,
} from '@/lib/equipe-dg-builder'
import { POSTES_PERIMETRE_COMMERCIAL } from '@/lib/kpi-postes-registry'

const VUE_TABS: { id: VueEquipeDG; label: string }[] = [
  { id: 'classement', label: 'Classement & fiches' },
  { id: 'comparatif', label: 'Tableau comparatif' },
  { id: 'coaching', label: 'Coaching & retours IA' },
]

const ANALYSE_STYLE = {
  CRITIQUE: 'border-red-200 bg-red-50',
  HAUTE: 'border-orange-200 bg-orange-50',
  MODEREE: 'border-sky-200 bg-sky-50',
}

function Sparkline6m({ data }: { data: number[] }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  return (
    <div className="flex items-end gap-0.5 h-6">
      {data.map((v, i) => (
        <div
          key={i}
          className={`flex-1 rounded-sm min-w-[4px] ${i === data.length - 1 && v < data[0] ? 'bg-red-400' : 'bg-emerald-400'}`}
          style={{ height: `${Math.max(25, ((v - min) / range) * 100)}%` }}
        />
      ))}
    </div>
  )
}

function MembreCard({ m, selected, onClick }: {
  m: CommercialPerformanceDG
  selected: boolean
  onClick: () => void
}) {
  const perf = STATUT_PERF_STYLE[m.statut_perf]
  const perfPct = getPerformancePct(m)

  return (
    <button type="button" onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all hover:shadow-md ${selected ? 'border-amber-400 bg-amber-50/40 shadow-md' : m.statut_perf === 'DEGRADE' ? 'border-red-200' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${m.rang === 1 ? 'bg-amber-400 text-white' : m.rang === 2 ? 'bg-slate-300 text-slate-700' : m.rang === 3 ? 'bg-orange-300 text-orange-900' : 'bg-slate-100 text-slate-600'}`}>
          {m.rang}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-bold text-sm">{m.nom}</span>
            {m.rang === 1 && <Trophy size={14} className="text-amber-500" />}
            {m.badge && <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ${BADGE_STYLE[m.badge]}`}>{m.badge}</span>}
            {m.type === 'FREELANCE' && <span className="text-[8px] px-1.5 py-0.5 rounded bg-lime-100 text-lime-700 font-bold">FREELANCE</span>}
            <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ${perf.className}`}>{perf.label}</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">{m.zone} · {m.type === 'FREELANCE' ? 'Marge nette' : 'VRP salarié'}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-black text-emerald-700">{perfPct}%</div>
          <div className="text-[9px] text-slate-400">perf. globale</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mt-3 text-[10px]">
        <div><div className="text-slate-400">CA/mois</div><div className="font-bold">{formatFcfa(m.ca_mois)}</div></div>
        <div><div className="text-slate-400">Clients récur.</div><div className="font-bold">{m.clients_recurrents}</div></div>
        <div><div className="text-slate-400">Factures/mois</div><div className="font-bold">{m.factures_generees_mois}</div></div>
        <div><div className="text-slate-400">Recouvrement</div><div className={`font-bold ${m.taux_recouvrement_pct < 80 ? 'text-red-600' : 'text-emerald-600'}`}>{m.taux_recouvrement_pct}%</div></div>
      </div>

      <div className="mt-2">
        <Sparkline6m data={m.evolution_ca_6m} />
      </div>

      {m.alerte && (
        <p className="text-[9px] text-red-600 mt-2 flex items-center gap-1">
          <AlertTriangle size={10} /> {m.alerte}
        </p>
      )}
    </button>
  )
}

export function EquipeView() {
  const { user } = useAuth()
  const [vue, setVue] = useState<VueEquipeDG>('classement')
  const [filtreStatut, setFiltreStatut] = useState<string>('tous')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  /** La matrice des postes est une vue de direction (spec V2 §3.4). */
  const peutVoirMatricePostes = user?.role === 'DG' || user?.role === 'DC'
  /** Le DG voit tous les postes ; le DC est limité à son périmètre commercial. */
  const perimetrePostes = user?.role === 'DC' ? POSTES_PERIMETRE_COMMERCIAL : undefined

  /** Synthèse exécutive + décisions = cadrage direction (DG / DC). */
  const isVueDirection = user?.role === 'DG' || user?.role === 'DC'

  const membres = useMemo(() => {
    const tous = buildEquipePerformanceDG()
    // Le superviseur ne pilote que son équipe directe (rattachement hiérarchique).
    if (user?.role === 'SUPERVISEUR' && user.nom) {
      const equipe = tous.filter(m => m.superviseur === user.nom)
      return equipe.length ? equipe : tous
    }
    // Le responsable des ventes est cadré sur ses zones.
    if (user?.role === 'RESP_VENTES' && user.zones?.length) {
      const zoneSet = new Set(user.zones)
      const equipe = tous.filter(m => zoneSet.has(m.zone))
      return equipe.length ? equipe : tous
    }
    return tous
  }, [user])

  const perimetreLabel =
    user?.role === 'SUPERVISEUR' ? 'Mon équipe'
      : user?.role === 'RESP_VENTES' ? 'Mes zones'
        : user?.role === 'DC' ? 'Périmètre commercial'
          : 'Vue DG'
  const synthese = useMemo(() => buildSyntheseEquipeDG(membres), [membres])
  const analyses = useMemo(() => buildAnalysesEquipeIA(membres), [membres])
  const decisions = useMemo(() => buildDecisionsEquipeDG(membres), [membres])

  const filtered = useMemo(() => {
    if (filtreStatut === 'tous') return membres
    if (filtreStatut === 'TOP') return membres.filter(m => m.statut_perf === 'TOP' || m.statut_perf === 'PERFORMANT')
    if (filtreStatut === 'DEGRADE') return membres.filter(m => m.statut_perf === 'DEGRADE' || m.statut_perf === 'SOUS_PERF')
    return membres.filter(m => m.type === filtreStatut)
  }, [membres, filtreStatut])

  const selected = membres.find(m => m.id === selectedId) ?? null
  const topPerformers = membres.filter(m => m.statut_perf === 'TOP' || m.statut_perf === 'PERFORMANT')
  const sousPerf = membres.filter(m => m.statut_perf === 'DEGRADE' || m.statut_perf === 'SOUS_PERF')

  return (
    <div className="p-6 max-w-[90rem] space-y-5">
      <PageHeader
        title="Pilotage équipe & performance commerciale"
        subtitle={`${perimetreLabel} — classement · clients récurrents · factures · commissions · avantages · coaching IA`}
        badge={`${synthese.effectif_commercial} commerciaux`}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'Perf. moyenne', value: `${synthese.performance_moyenne_pct}%`, color: 'text-indigo-700' },
          { label: 'CA total/mois', value: formatFcfa(synthese.ca_total_mois), color: 'text-emerald-700' },
          { label: 'Objectif CA', value: `${synthese.objectif_ca_mois_pct}%`, color: 'text-amber-700' },
          { label: 'Clients récurrents', value: String(synthese.clients_recurrents_total), color: 'text-slate-800' },
          { label: 'Factures/mois', value: String(synthese.factures_total_mois), color: 'text-slate-800' },
          { label: 'Recouvrement moy.', value: `${synthese.taux_recouvrement_moyen}%`, color: 'text-emerald-600' },
          { label: 'Top performers', value: String(synthese.commerciaux_top), color: 'text-amber-600' },
          { label: 'Dégradés', value: String(synthese.commerciaux_degrades), color: 'text-red-600' },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
            <div className="text-[10px] text-slate-400 font-medium">{k.label}</div>
            <div className={`text-sm font-black mt-0.5 ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Synthèse exécutive — cadrage direction (DG / DC) */}
      {isVueDirection && (
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-5 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} className="text-amber-400" />
          <h3 className="text-sm font-bold">Synthèse IA — Performance équipe commerciale · Juin 2026</h3>
        </div>
        <p className="text-sm text-slate-200 leading-relaxed">
          Réseau de {synthese.effectif_commercial} commerciaux — CA cumulé {formatFcfa(synthese.ca_total_mois)}/mois ({synthese.objectif_ca_mois_pct}% objectif).
          <strong className="text-white"> Massan Agbodjan</strong> et <strong className="text-white">Komlan Tetteh</strong> tirent le réseau (recouvrement 94% vs 72%).
          <strong className="text-red-300"> Mawuena Ahi</strong> en dégradation : 0 client récurrent, CA -33% sur 6 mois — intervention DG requise sous 7j.
          <strong className="text-lime-300"> Kofi Agbessi</strong> (freelance) : modèle acquisition à documenter (+18% marge, 2 nouveaux PDV/mois).
        </p>
      </div>
      )}

      {/* Décisions — cadrage direction (DG / DC) */}
      {isVueDirection && (
      <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={14} className="text-amber-600" />
          <h3 className="text-sm font-bold text-amber-900">Décisions recommandées pour le DG</h3>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {decisions.map(d => (
            <div key={d.priorite} className="bg-white rounded-lg border border-amber-100 p-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-200 font-black text-[10px] flex items-center justify-center">{d.priorite}</span>
                <span className="font-bold">{d.titre}</span>
              </div>
              {d.commercial && <div className="text-[10px] text-slate-500 mt-1">{d.commercial}</div>}
              <div className="text-[10px] text-emerald-700 mt-1">Impact : {d.impact}</div>
              <div className="text-[10px] font-semibold text-amber-800 mt-0.5">→ {d.decision}</div>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Top vs Sous-perf */}
      <div className="grid md:grid-cols-2 gap-3">
        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
          <div className="text-[10px] font-bold text-emerald-800 uppercase mb-2 flex items-center gap-1">
            <Star size={12} /> Top performers — à valoriser
          </div>
          {topPerformers.map(m => (
            <div key={m.id} className="text-xs py-2 border-b border-emerald-100 last:border-0 flex justify-between">
              <span className="font-bold">{m.nom} · {getPerformancePct(m)}%</span>
              <span className="text-emerald-700">{formatFcfa(m.remuneration_totale_mois)}/mois</span>
            </div>
          ))}
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-4">
          <div className="text-[10px] font-bold text-red-800 uppercase mb-2 flex items-center gap-1">
            <AlertTriangle size={12} /> À coacher / sous performance
          </div>
          {sousPerf.length === 0 ? (
            <p className="text-xs text-slate-500">Aucun commercial en dégradation.</p>
          ) : sousPerf.map(m => (
            <div key={m.id} className="text-xs py-2 border-b border-red-100 last:border-0">
              <div className="flex justify-between font-bold">
                <span>{m.nom} · {getPerformancePct(m)}%</span>
                <span className="text-red-600">{m.clients_recurrents} client récurrent</span>
              </div>
              <div className="text-[10px] text-red-700 mt-0.5">{m.coaching_ia.slice(0, 80)}…</div>
            </div>
          ))}
        </div>
      </div>

      {peutVoirMatricePostes && (
        <MatricePostesPanel
          perimetre={perimetrePostes}
          titre={perimetrePostes ? 'Score de performance — postes commerciaux' : undefined}
        />
      )}

      <div className="flex flex-wrap gap-2">
        {VUE_TABS.map(t => (
          <button key={t.id} type="button" onClick={() => setVue(t.id)}
            className={`text-[11px] px-4 py-2 rounded-lg font-semibold ${vue === t.id ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid xl:grid-cols-4 gap-4">
        <div className="xl:col-span-3 space-y-3">
          {vue === 'classement' && (
            <>
              <div className="flex flex-wrap gap-2 items-center">
                <Filter size={11} className="text-slate-400" />
                {(['tous', 'TOP', 'SALARIE', 'FREELANCE', 'DEGRADE'] as const).map(f => (
                  <button key={f} type="button" onClick={() => setFiltreStatut(f)}
                    className={`text-[9px] px-2 py-1 rounded-full font-bold ${filtreStatut === f ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-50 text-slate-400'}`}>
                    {f === 'tous' ? 'Tous' : f === 'TOP' ? 'Top performers' : f === 'DEGRADE' ? 'Dégradés' : f}
                  </button>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {filtered.map(m => (
                  <MembreCard
                    key={m.id}
                    m={m}
                    selected={selectedId === m.id}
                    onClick={() => setSelectedId(prev => prev === m.id ? null : m.id)}
                  />
                ))}
              </div>
            </>
          )}

          {vue === 'comparatif' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    {['Rang', 'Commercial', 'Perf.', 'CA/mois', 'Clients récur.', 'Factures', 'Recouv.', 'Commission', 'Prime', 'Total rémun.', 'vs équipe'].map(h => (
                      <th key={h} className="text-left p-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {membres.map(m => (
                    <tr key={m.id} className={`border-t border-slate-100 cursor-pointer hover:bg-slate-50 ${selectedId === m.id ? 'bg-amber-50' : ''}`}
                      onClick={() => setSelectedId(prev => prev === m.id ? null : m.id)}>
                      <td className="p-3 font-black">{m.rang}</td>
                      <td className="p-3 font-semibold whitespace-nowrap">{m.nom}</td>
                      <td className="p-3"><span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${STATUT_PERF_STYLE[m.statut_perf].className}`}>{getPerformancePct(m)}%</span></td>
                      <td className="p-3 font-bold">{formatFcfa(m.ca_mois)}</td>
                      <td className="p-3">{m.clients_recurrents}/{m.clients_portefeuille}</td>
                      <td className="p-3">{m.factures_generees_mois} <span className="text-red-500">({m.factures_impayees_mois} imp.)</span></td>
                      <td className={`p-3 font-bold ${m.taux_recouvrement_pct < 80 ? 'text-red-600' : 'text-emerald-600'}`}>{m.taux_recouvrement_pct}%</td>
                      <td className="p-3">{m.commission_mois > 0 ? formatFcfa(m.commission_mois) : '—'}</td>
                      <td className="p-3">{m.prime_objectif_mois > 0 ? formatFcfa(m.prime_objectif_mois) : '—'}</td>
                      <td className="p-3 font-bold text-emerald-700">{formatFcfa(m.remuneration_totale_mois)}</td>
                      <td className="p-3">{m.vs_equipe_ca_pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {vue === 'coaching' && (
            <div className="space-y-3">
              {membres.map(m => (
                <div key={m.id} className={`p-4 rounded-xl border-2 ${m.statut_perf === 'DEGRADE' ? 'border-red-200 bg-red-50/30' : 'border-slate-200 bg-white'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-sm">{m.nom}</span>
                      <span className={`ml-2 text-[9px] px-1.5 py-0.5 rounded-full font-bold ${STATUT_PERF_STYLE[m.statut_perf].className}`}>{STATUT_PERF_STYLE[m.statut_perf].label}</span>
                    </div>
                    <AiBadge variant="small" label="Score IA" confidence={m.score_ia} />
                  </div>
                  <p className="text-xs text-slate-700 mt-2"><strong>Coaching IA :</strong> {m.coaching_ia}</p>
                  <p className="text-xs text-indigo-800 mt-2 font-semibold flex items-start gap-1">
                    <Sparkles size={12} className="shrink-0 mt-0.5" />
                    <span><strong>Retour DG :</strong> {m.retour_ia_dg}</span>
                  </p>
                  <div className="grid md:grid-cols-2 gap-3 mt-3 text-[10px]">
                    <div className="bg-emerald-50 rounded-lg p-2">
                      <div className="font-bold text-emerald-800 mb-1">Points forts</div>
                      {m.points_forts.map((p, i) => <div key={i}>+ {p}</div>)}
                    </div>
                    <div className="bg-red-50 rounded-lg p-2">
                      <div className="font-bold text-red-800 mb-1">Points faibles</div>
                      {m.points_faibles.map((p, i) => <div key={i}>− {p}</div>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl border border-indigo-200 p-4 sticky top-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={15} className="text-indigo-600" />
              <h3 className="text-sm font-bold text-indigo-900">Analyses IA équipe</h3>
            </div>
            <div className="space-y-2">
              {analyses.map((a, i) => (
                <div key={i} className={`p-2.5 rounded-lg border text-xs ${ANALYSE_STYLE[a.severite]}`}>
                  <div className="font-bold">{a.titre}</div>
                  <div className="text-[10px] opacity-90 mt-0.5">{a.detail}</div>
                  <div className="text-[10px] font-semibold mt-1 text-slate-700">→ {a.action}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fiche détaillée */}
      {selected && (
        <div className="bg-white rounded-xl border-2 border-amber-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="w-14 h-14 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Award size={24} className="text-indigo-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black flex items-center gap-2">
                #{selected.rang} {selected.nom}
                {selected.badge && <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${BADGE_STYLE[selected.badge]}`}>{selected.badge}</span>}
              </h3>
              <p className="text-sm text-slate-500">{selected.zone} · {selected.email}</p>
              <p className="text-sm text-slate-700 mt-2">{selected.synthese_ia}</p>
            </div>
            <AiBadge variant="small" label="Performance" confidence={getPerformancePct(selected)} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 text-xs">
            {[
              { label: 'CA/mois', value: formatFcfa(selected.ca_mois) },
              { label: 'CA/jour', value: formatFcfa(selected.ca_jour) },
              { label: 'Clients récurrents', value: `${selected.clients_recurrents}/${selected.clients_portefeuille}` },
              { label: 'Nouveaux/mois', value: String(selected.clients_nouveaux_mois) },
              { label: 'Factures générées', value: String(selected.factures_generees_mois) },
              { label: 'Factures impayées', value: String(selected.factures_impayees_mois), alert: selected.factures_impayees_mois > 5 },
              { label: 'Panier moyen', value: formatFcfa(selected.panier_moyen) },
              { label: 'Transformation', value: `${selected.taux_transformation_pct}%` },
            ].map((k, i) => (
              <div key={i} className="bg-slate-50 rounded-lg p-2.5">
                <div className="text-slate-400">{k.label}</div>
                <div className={`font-bold ${k.alert ? 'text-red-600' : ''}`}>{k.value}</div>
              </div>
            ))}
          </div>

          {selected.evolution_ca_6m && selected.evolution_ca_6m.length > 0 && (
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="font-bold text-slate-700 text-xs mb-2">Évolution CA — 6 mois (M FCFA)</div>
              <Sparkline6m data={selected.evolution_ca_6m} />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                {['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'].map(m => <span key={m}>{m}</span>)}
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-emerald-50 rounded-xl">
              <div className="font-bold text-emerald-800 mb-2">Rémunération & commissions</div>
              <div className="space-y-1">
                <div className="flex justify-between"><span>Commission/mois</span><span className="font-bold">{selected.commission_mois > 0 ? formatFcfa(selected.commission_mois) : 'Freelance (marge)'}</span></div>
                <div className="flex justify-between"><span>Prime objectif</span><span className="font-bold">{selected.prime_objectif_mois > 0 ? formatFcfa(selected.prime_objectif_mois) : '—'}</span></div>
                <div className="flex justify-between border-t border-emerald-200 pt-1"><span>Total/mois</span><span className="font-black text-emerald-700">{formatFcfa(selected.remuneration_totale_mois)}</span></div>
                {selected.marge_jour && <div className="flex justify-between"><span>Marge/jour</span><span className="font-bold">{formatFcfa(selected.marge_jour)}</span></div>}
              </div>
            </div>
            <div className="p-3 bg-sky-50 rounded-xl">
              <div className="font-bold text-sky-800 mb-2">Activité terrain</div>
              <div className="space-y-1">
                <div className="flex justify-between"><span>Visites/jour</span><span className="font-bold">{selected.visites_jour}/{selected.visites_objectif}</span></div>
                <div className="flex justify-between"><span>Couverture</span><span className="font-bold">{selected.couverture_secteur_pct}%</span></div>
                <div className="flex justify-between"><span>Commandes/mois</span><span className="font-bold">{selected.commandes_mois}</span></div>
                <div className="flex justify-between"><span>GPS conforme</span><span className={`font-bold ${selected.gps_conformite_pct < 80 ? 'text-red-600' : ''}`}>{selected.gps_conformite_pct}%</span></div>
              </div>
            </div>
            <div className="p-3 bg-violet-50 rounded-xl">
              <div className="font-bold text-violet-800 mb-2">Avantages & perks</div>
              <ul className="space-y-1">
                {selected.avantages.map((a, i) => (
                  <li key={i} className="flex items-start gap-1"><Star size={10} className="text-violet-500 shrink-0 mt-0.5" />{a}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-sm">
            <strong className="text-indigo-900">Retour IA pour le DG :</strong> {selected.retour_ia_dg}
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm flex items-center gap-2">
            <Target size={14} className="text-amber-600 shrink-0" />
            <span><strong>Action IA :</strong> {selected.action_ia}</span>
          </div>
        </div>
      )}
    </div>
  )
}
