'use client'

import { Briefcase, Building2, ChevronRight, MapPin, Users } from 'lucide-react'
import { AGENCES, AGENCES_DATA, RESEAU_CONSOLIDE } from '@/lib/agences'
import { EQUIPE_DIRECTION_DG, agentNomToId, type AgentDetailDG } from '@/lib/dg-vue360'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { formatFcfa, cn } from '@/lib/utils'

type AgentPerfRow = {
  agent: string
  role?: string
  agence?: string
  rang: number
  visites: number
  collecte: number
  recouvrement: number
  par: number
  score: number
  badge: string | null
  detail?: AgentDetailDG
}

const BADGE_STYLE: Record<string, string> = {
  OR: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  ARGENT: 'bg-slate-200 text-slate-600 border-slate-300',
  BRONZE: 'bg-orange-100 text-orange-700 border-orange-300',
}

const STATUT_STYLE = {
  OK: 'bg-green-100 text-green-700 border-green-200',
  ALERTE: 'bg-red-100 text-red-700 border-red-200',
  TENSION: 'bg-orange-100 text-orange-700 border-orange-200',
}

const ROLE_DIRECTION_STYLE: Record<string, string> = {
  DEC: 'bg-red-100 text-red-700',
  DC: 'bg-teal-100 text-teal-700',
  DAF: 'bg-cyan-100 text-cyan-800',
  AUDIT: 'bg-indigo-100 text-indigo-700',
}

function isRA(a: AgentPerfRow) {
  return a.role === 'Resp. agence' || a.detail?.derniere_visite === 'Pilotage agence'
}

function isTerrain(a: AgentPerfRow) {
  return a.role === 'Commercial' || a.role === 'GP'
}

function equipeTerrainAgence(agenceId: string) {
  return RESEAU_CONSOLIDE.agents_performance.filter(
    x => x.agence === agenceId && x.role !== 'Resp. agence',
  )
}

interface Props {
  agentsPerf: AgentPerfRow[]
  selectedAgenceId: string | null
  showAgenceColumn: boolean
  onAgentClick: (agentId: string) => void
  onOngletDirection?: (onglet: 'CREDIT' | 'COMMERCIAL' | 'FINANCIER' | 'OPERATIONNEL') => void
}

export function PilotageEquipesDg({
  agentsPerf,
  selectedAgenceId,
  showAgenceColumn,
  onAgentClick,
  onOngletDirection,
}: Props) {
  const raList = agentsPerf.filter(isRA).sort((a, b) => b.score - a.score)
  const terrainList = agentsPerf.filter(isTerrain).sort((a, b) => b.score - a.score)

  const titreScope = selectedAgenceId
    ? AGENCES.find(a => a.id === selectedAgenceId)?.nom_court ?? 'agence'
    : 'réseau complet'

  return (
    <div className="space-y-4">
      {/* ── 1. Responsables d'agence ── */}
      <section className="bg-white rounded-xl border border-indigo-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-indigo-100 bg-gradient-to-r from-indigo-50/80 to-white flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-indigo-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                Pilotage agences — Responsables (RA) · {titreScope}
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">{raList.length} RA</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 max-w-2xl">
              Vue consolidée agence : clients, PAR, collecte et équipe terrain supervisée. Les RA ne font pas de visites — le score reflète la santé du portefeuille agence.
            </p>
          </div>
          <AiBadge variant="small" label="Pilotage · 0 visite" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 font-medium"># · Responsable</th>
                {showAgenceColumn && <th className="text-left px-4 py-3 font-medium">Agence</th>}
                <th className="text-left px-3 py-3 font-medium">Équipe terrain</th>
                <th className="text-right px-3 py-3 font-medium">Clients</th>
                <th className="text-right px-3 py-3 font-medium">Collecte agence</th>
                <th className="text-right px-3 py-3 font-medium">% obj.</th>
                <th className="text-right px-3 py-3 font-medium">PAR agence</th>
                <th className="text-right px-3 py-3 font-medium">Remb.</th>
                <th className="text-right px-3 py-3 font-medium">Score santé</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {raList.map((a, i) => {
                const agenceId = a.agence ?? a.detail?.agence_id ?? ''
                const agInfo = AGENCES.find(ag => ag.id === agenceId)
                const agDetail = agenceId ? AGENCES_DATA[agenceId] : undefined
                const equipe = equipeTerrainAgence(agenceId)
                const objCollecte = a.detail?.objectifs.collecte
                const pctCollecte = objCollecte ? Math.round((a.collecte / objCollecte) * 100) : null
                const scoreSante = agDetail?.kpis.score_sante ?? a.score
                const agentId = a.detail?.id ?? agentNomToId(a.agent)
                return (
                  <tr
                    key={a.agent}
                    onClick={() => onAgentClick(agentId)}
                    className="hover:bg-indigo-50/40 cursor-pointer transition-colors group"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${i === 0 ? 'bg-indigo-500 text-white' : 'bg-indigo-100 text-indigo-700'}`}>{i + 1}</div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-slate-800 group-hover:text-indigo-700">{a.agent}</span>
                            <span className="text-[9px] px-1 py-0.5 rounded font-bold bg-indigo-100 text-indigo-700">RA</span>
                            {a.badge && <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${BADGE_STYLE[a.badge]}`}>{a.badge}</span>}
                          </div>
                          <span className="text-[10px] text-slate-400">Pilotage agence · BCEAO {agDetail?.conformite_bceao?.statut ?? '—'}</span>
                        </div>
                      </div>
                    </td>
                    {showAgenceColumn && agInfo && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold" style={{ backgroundColor: agInfo.color + '20', color: agInfo.color }}>{agInfo.initiales}</div>
                          <span className="text-xs text-slate-600">{agInfo.nom_court}</span>
                        </div>
                      </td>
                    )}
                    <td className="px-3 py-3">
                      <div className="text-xs text-slate-700">
                        <span className="font-bold">{equipe.length}</span>
                        <span className="text-slate-400"> agent{equipe.length > 1 ? 's' : ''}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[140px]" title={equipe.map(e => e.agent).join(', ')}>
                        {equipe.map(e => e.agent.split(' ')[0]).join(' · ') || '—'}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-slate-700">{a.detail?.clients_portefeuille ?? '—'}</td>
                    <td className="px-3 py-3 text-right font-medium text-slate-800">{formatFcfa(a.collecte)}</td>
                    <td className="px-3 py-3 text-right">
                      {pctCollecte !== null && (
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${pctCollecte >= 90 ? 'bg-green-100 text-green-700' : pctCollecte >= 70 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                          {pctCollecte}%
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className={`font-bold ${a.par > 10 ? 'text-red-600' : a.par > 8 ? 'text-orange-600' : 'text-green-600'}`}>{a.par}%</span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className={`font-bold text-xs ${a.recouvrement >= 90 ? 'text-green-600' : a.recouvrement >= 80 ? 'text-orange-600' : 'text-red-600'}`}>{a.recouvrement}%</span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className={`text-sm font-black ${scoreSante >= 80 ? 'text-green-600' : scoreSante >= 65 ? 'text-orange-600' : 'text-red-600'}`}>{scoreSante}</span>
                    </td>
                    <td className="pr-3"><ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-500" /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── 2. Agents terrain ── */}
      <section className="bg-white rounded-xl border border-teal-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-teal-100 bg-gradient-to-r from-teal-50/80 to-white flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-teal-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                Performance terrain — Commerciaux & GP · {titreScope}
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">{terrainList.length} agents</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 max-w-2xl">
              Classement sur visites, collecte zone et recouvrement. Lomé Centre : 62 clients partagés (vue terrain par zone commerciale).
            </p>
          </div>
          <AiBadge variant="small" label="Visites · GPS · Collecte" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 font-medium"># · Agent · Rôle</th>
                {showAgenceColumn && <th className="text-left px-4 py-3 font-medium">Agence</th>}
                <th className="text-right px-3 py-3 font-medium">Visites mois</th>
                <th className="text-right px-3 py-3 font-medium">Collecte</th>
                <th className="text-right px-3 py-3 font-medium">% obj.</th>
                <th className="text-right px-3 py-3 font-medium">Remb.</th>
                <th className="text-right px-3 py-3 font-medium">PAR</th>
                <th className="text-right px-4 py-3 font-medium">Score</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {terrainList.map((a, i) => {
                const agInfo = a.agence ? AGENCES.find(ag => ag.id === a.agence) : null
                const objCollecte = a.detail?.objectifs.collecte
                const pctCollecte = objCollecte ? Math.round((a.collecte / objCollecte) * 100) : null
                const agentId = a.detail?.id ?? agentNomToId(a.agent)
                const isDegrade = a.score < 70
                return (
                  <tr
                    key={a.agent}
                    onClick={() => onAgentClick(agentId)}
                    className={cn(
                      'hover:bg-teal-50/60 cursor-pointer transition-colors group',
                      isDegrade && 'bg-red-50/20',
                      i === 0 && !isDegrade && 'bg-yellow-50/20',
                    )}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${i === 0 ? 'bg-yellow-400 text-white' : i === 1 ? 'bg-slate-400 text-white' : i === 2 ? 'bg-orange-400 text-white' : 'bg-slate-200 text-slate-500'}`}>{i + 1}</div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-slate-800 group-hover:text-teal-700">{a.agent}</span>
                            <span className={cn(
                              'text-[9px] px-1 py-0.5 rounded font-bold',
                              a.role === 'GP' ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700',
                            )}>{a.role === 'GP' ? 'GP' : 'COM'}</span>
                            {a.badge && <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${BADGE_STYLE[a.badge]}`}>{a.badge}</span>}
                          </div>
                          {a.detail && (
                            <span className="text-[10px] text-slate-400">{a.detail.clients_portefeuille} clients · GPS {a.detail.gps_conformite_pct}%</span>
                          )}
                        </div>
                      </div>
                    </td>
                    {showAgenceColumn && agInfo && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold" style={{ backgroundColor: agInfo.color + '20', color: agInfo.color }}>{agInfo.initiales}</div>
                          <span className="text-xs text-slate-600">{agInfo.nom_court}</span>
                        </div>
                      </td>
                    )}
                    <td className="px-3 py-3 text-right text-xs">
                      <span className="font-bold text-slate-700">{a.visites}</span>
                      {a.detail && a.detail.objectifs.visites > 0 && (
                        <span className="text-slate-400"> / {a.detail.objectifs.visites}</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-slate-800">{formatFcfa(a.collecte)}</td>
                    <td className="px-3 py-3 text-right">
                      {pctCollecte !== null && (
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${pctCollecte >= 90 ? 'bg-green-100 text-green-700' : pctCollecte >= 70 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                          {pctCollecte}%
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className={`font-bold text-xs ${a.recouvrement >= 90 ? 'text-green-600' : a.recouvrement >= 80 ? 'text-orange-600' : 'text-red-600'}`}>{a.recouvrement}%</span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className={`font-bold ${a.par > 10 ? 'text-red-600' : a.par > 8 ? 'text-orange-600' : 'text-green-600'}`}>{a.par}%</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-bold ${a.score >= 85 ? 'text-green-600' : a.score >= 70 ? 'text-orange-600' : 'text-red-600'}`}>{a.score}</span>
                    </td>
                    <td className="pr-3"><ChevronRight size={14} className="text-slate-300 group-hover:text-teal-500" /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── 3. Direction siège ── */}
      {!selectedAgenceId && (
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <Briefcase size={16} className="text-slate-600" />
                <h3 className="text-sm font-semibold text-slate-900">Direction siège — DEC · DC · DAF · Audit</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{EQUIPE_DIRECTION_DG.length} membres</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 max-w-2xl">
                Indicateurs clés par fonction — complète la vue agences. Cliquer une ligne pour ouvrir l&apos;onglet dédié du tableau de bord.
              </p>
            </div>
            <AiBadge variant="small" label="Siège · Hors terrain" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 font-medium">Membre · Fonction</th>
                  <th className="text-left px-4 py-3 font-medium">Périmètre</th>
                  <th className="text-left px-3 py-3 font-medium">Indicateur clé</th>
                  <th className="text-left px-3 py-3 font-medium">Synthèse IA</th>
                  <th className="text-left px-4 py-3 font-medium">Action prioritaire</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {EQUIPE_DIRECTION_DG.map(m => (
                  <tr
                    key={m.id}
                    onClick={() => m.onglet_lie && onOngletDirection?.(m.onglet_lie)}
                    className={cn(
                      'transition-colors group',
                      m.onglet_lie ? 'hover:bg-slate-50 cursor-pointer' : '',
                    )}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                          <Users size={14} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-medium text-slate-800 group-hover:text-slate-900">{m.nom}</span>
                            <span className={cn('text-[9px] px-1.5 py-0.5 rounded font-bold', ROLE_DIRECTION_STYLE[m.role])}>{m.role}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">{m.role_label}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 max-w-[120px]">{m.domaine}</td>
                    <td className="px-3 py-3">
                      <div className="text-xs font-bold text-slate-800">{m.kpi_principal.valeur}</div>
                      <div className="text-[10px] text-slate-400">{m.kpi_principal.label}</div>
                      <span className={cn('inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded border font-bold', STATUT_STYLE[m.kpi_principal.statut])}>
                        {m.kpi_principal.statut}
                      </span>
                      <div className="text-[10px] text-slate-500 mt-0.5">{m.kpi_secondaire.label} : {m.kpi_secondaire.valeur}</div>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-600 leading-relaxed max-w-[200px]">{m.synthese}</td>
                    <td className="px-4 py-3 text-xs font-medium text-teal-700 max-w-[160px]">→ {m.action_prioritaire}</td>
                    <td className="pr-3">
                      {m.onglet_lie && <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
