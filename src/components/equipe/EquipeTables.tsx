'use client'

import { Fragment, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  ExternalLink, Info,
} from 'lucide-react'
import type { EquipeHub, StatutAgent } from '@/lib/equipe-hub'
import { formatFcfa, cn } from '@/lib/utils'
import { AiBadge } from '@/components/dashboard/AiBadge'

const PAGE_SIZE = 25

const BADGE_STYLE: Record<string, string> = {
  OR: 'bg-yellow-100 text-yellow-700 border border-yellow-300',
  ARGENT: 'bg-slate-200 text-slate-600 border border-slate-300',
  BRONZE: 'bg-orange-100 text-orange-700 border border-orange-300',
}

const STATUT_STYLE: Record<StatutAgent, string> = {
  BON: 'bg-emerald-100 text-emerald-800',
  NORMAL: 'bg-slate-100 text-slate-700',
  DEGRADE: 'bg-red-100 text-red-800',
}

interface Props {
  hub: EquipeHub
}

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative flex-1 min-w-[220px] max-w-lg">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      <input
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Nom, agence, rôle…"
        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
      />
    </div>
  )
}

function Pagination({ page, total, onPage }: { page: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const end = Math.min(page * PAGE_SIZE, total)
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-600">
      <span>{total === 0 ? 'Aucun agent' : `${start}–${end} sur ${total}`}</span>
      <div className="flex items-center gap-1">
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className="p-1.5 rounded-md border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-100 cursor-pointer transition-colors">
          <ChevronLeft size={14} />
        </button>
        <span className="px-2 font-medium">{page} / {pages}</span>
        <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)} className="p-1.5 rounded-md border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-100 cursor-pointer transition-colors">
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

export function EquipeTables({ hub }: Props) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [agence, setAgence] = useState('')
  const [statut, setStatut] = useState('')
  const [role, setRole] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const agences = useMemo(
    () => [...new Set(hub.agents.map(a => a.agence))].sort(),
    [hub.agents],
  )
  const roles = useMemo(
    () => [...new Set(hub.agents.map(a => a.role))].sort(),
    [hub.agents],
  )

  const q = search.toLowerCase().trim()
  const filtered = hub.agents.filter(a => {
    if (agence && a.agence !== agence) return false
    if (statut && a.statut !== statut) return false
    if (role && a.role !== role) return false
    if (!q) return true
    return (
      a.nom.toLowerCase().includes(q) ||
      a.agence.toLowerCase().includes(q) ||
      a.role.toLowerCase().includes(q)
    )
  })

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const degrades = filtered.filter(a => a.statut === 'DEGRADE').length

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 px-1 text-xs text-slate-600">
        <Info size={14} className="text-teal-600 shrink-0 mt-0.5" />
        <p>
          Classement réseau sur <strong>{hub.kpis.total_agents} agents</strong> enregistrés.
          Cliquez une ligne pour l&apos;analyse IA. Score = collecte + recouvrement + visites + PAR + GPS.
        </p>
      </div>

      {degrades > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-900">
          <strong>{degrades} agent(s) dégradé(s)</strong> dans le filtre actuel — plan d&apos;action requis sous 7 jours.
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center">
          <SearchBar value={search} onChange={v => { setSearch(v); setPage(1) }} />
          <select value={agence} onChange={e => { setAgence(e.target.value); setPage(1) }} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white cursor-pointer">
            <option value="">Toutes agences</option>
            {agences.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={role} onChange={e => { setRole(e.target.value); setPage(1) }} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white cursor-pointer">
            <option value="">Tous rôles</option>
            {roles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={statut} onChange={e => { setStatut(e.target.value); setPage(1) }} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white cursor-pointer">
            <option value="">Tous statuts</option>
            <option value="BON">Bon</option>
            <option value="NORMAL">Normal</option>
            <option value="DEGRADE">Dégradé</option>
          </select>
          <span className="text-xs text-slate-500 ml-auto">{filtered.length} agent(s)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500">
                <th className="px-2 py-2.5 w-8" />
                <th className="px-2 py-2.5 font-bold text-center w-10">#</th>
                <th className="px-2 py-2.5 font-bold">Agent</th>
                <th className="px-2 py-2.5 font-bold">Agence</th>
                <th className="px-2 py-2.5 font-bold">Rôle</th>
                <th className="px-2 py-2.5 font-bold text-center">Clients</th>
                <th className="px-2 py-2.5 font-bold text-center">Visites / Équipe</th>
                <th className="px-2 py-2.5 font-bold text-right">Collecte mois</th>
                <th className="px-2 py-2.5 font-bold text-center">Obj. %</th>
                <th className="px-2 py-2.5 font-bold text-center">Recouv.</th>
                <th className="px-2 py-2.5 font-bold text-center">PAR 30</th>
                <th className="px-2 py-2.5 font-bold text-center">Score</th>
                <th className="px-2 py-2.5 font-bold">Statut</th>
                <th className="px-2 py-2.5 w-8" />
              </tr>
            </thead>
            <tbody>
              {paginated.map(a => (
                <Fragment key={a.id}>
                  <tr
                    onClick={() => setExpanded(prev => (prev === a.id ? null : a.id))}
                    className={cn(
                      'border-t border-slate-100 cursor-pointer transition-colors',
                      expanded === a.id ? 'bg-teal-50' : 'hover:bg-slate-50',
                      a.statut === 'DEGRADE' && 'bg-red-50/30',
                    )}
                  >
                    <td className="px-2 py-2.5 text-slate-400">
                      {expanded === a.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </td>
                    <td className="px-2 py-2.5 text-center font-black text-slate-400">{a.rang}</td>
                    <td className="px-2 py-2.5">
                      <div className="font-bold text-slate-900">{a.nom}</div>
                      {a.badge && (
                        <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 inline-block', BADGE_STYLE[a.badge])}>
                          {a.badge}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2.5 text-xs text-slate-600">{a.agence}</td>
                    <td className="px-2 py-2.5 text-xs">{a.role}</td>
                    <td className="px-2 py-2.5 text-center">
                      <div className="font-semibold">{a.clients_portefeuille}</div>
                      {a.est_responsable_agence && (
                        <div className="text-[10px] text-slate-500">portef. agence</div>
                      )}
                      {a.role === 'Commercial' && !a.est_responsable_agence && (
                        <div className="text-[10px] text-blue-600">même portef. · zone</div>
                      )}
                      {a.role === 'GP' && (
                        <div className="text-[10px] text-teal-600">même portef. · crédit</div>
                      )}
                      {a.clients_a_risque > 0 && (
                        <div className="text-[10px] text-red-600">{a.clients_a_risque} à risque</div>
                      )}
                    </td>
                    <td className="px-2 py-2.5 text-center text-xs">
                      {a.est_responsable_agence ? (
                        <>
                          <span className="font-bold">{a.nb_agents_terrain ?? 0} com.</span>
                          <div className="text-[10px] text-slate-500">{a.visites_mois} visites zones</div>
                        </>
                      ) : a.role === 'GP' ? (
                        <>
                          <span className="font-bold">{a.visites_mois} rel.</span>
                          <div className="text-[10px] text-slate-500">/ {a.visites_objectif} obj.</div>
                        </>
                      ) : (
                        <>
                          <span className="font-bold">{a.visites_mois}</span>
                          <span className="text-slate-400"> / {a.visites_objectif}</span>
                          <div className="text-[10px] text-slate-500">{a.visites_jour}/j zone</div>
                        </>
                      )}
                    </td>
                    <td className="px-2 py-2.5 text-right">
                      <div className="font-bold text-teal-700">{formatFcfa(a.collecte_mois_fcfa)}</div>
                      <div className="text-[10px] text-slate-500">obj. {formatFcfa(a.objectif_collecte_mois_fcfa)}</div>
                    </td>
                    <td className={cn(
                      'px-2 py-2.5 text-center font-bold',
                      a.objectif_atteint_pct >= 85 ? 'text-emerald-600' : a.objectif_atteint_pct >= 65 ? 'text-amber-600' : 'text-red-600',
                    )}>
                      {a.objectif_atteint_pct} %
                    </td>
                    <td className={cn(
                      'px-2 py-2.5 text-center font-bold',
                      a.recouvrement_pct >= 85 ? 'text-emerald-600' : a.recouvrement_pct >= 70 ? 'text-amber-600' : 'text-red-600',
                    )}>
                      {a.recouvrement_pct} %
                    </td>
                    <td className={cn(
                      'px-2 py-2.5 text-center font-bold',
                      a.par_30_pct > 10 ? 'text-red-600' : a.par_30_pct > 8 ? 'text-amber-600' : 'text-slate-700',
                    )}>
                      {a.par_30_pct} %
                    </td>
                    <td className="px-2 py-2.5 text-center font-black text-slate-900">{a.score}</td>
                    <td className="px-2 py-2.5">
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap', STATUT_STYLE[a.statut])}>
                        {a.statut}
                      </span>
                    </td>
                    <td className="px-2 py-2.5">
                      <Link
                        href={a.lien_fiche}
                        onClick={e => e.stopPropagation()}
                        className="text-teal-600 hover:text-teal-800 cursor-pointer"
                        title="Fiche agent"
                      >
                        <ExternalLink size={14} />
                      </Link>
                    </td>
                  </tr>
                  {expanded === a.id && (
                    <tr className="bg-teal-50/50 border-t border-teal-100">
                      <td colSpan={14} className="px-4 py-3">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <AiBadge variant="small" confidence={a.score} />
                              <span className="text-xs font-semibold text-slate-800">Analyse IA</span>
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed">{a.ia_resume}</p>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                            <div><span className="text-slate-400">Portefeuille</span><div className="font-semibold">{formatFcfa(a.portefeuille_fcfa)}</div></div>
                            <div><span className="text-slate-400">Collecte jour</span><div className="font-semibold">{formatFcfa(a.collecte_jour_fcfa)}</div></div>
                            <div><span className="text-slate-400">Retards J+7</span><div className="font-semibold text-red-600">{a.retards_j7}</div></div>
                            <div><span className="text-slate-400">Nvx clients</span><div className="font-semibold">{a.nouveaux_clients_mois}/{a.objectif_nouveaux_clients}</div></div>
                            <div><span className="text-slate-400">Décaissements</span><div className="font-semibold">{a.decaissements_mois}</div></div>
                            <div><span className="text-slate-400">GPS conforme</span><div className={cn('font-semibold', a.gps_conformite_pct < 80 ? 'text-red-600' : 'text-emerald-600')}>{a.gps_conformite_pct} %</div></div>
                            <div className="col-span-2 sm:col-span-3">
                              <span className="text-slate-400">{a.est_responsable_agence ? 'Pilotage' : 'Dernière visite'}</span>
                              <div className="font-semibold">{a.derniere_visite}</div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={filtered.length} onPage={setPage} />
      </div>
    </div>
  )
}

export function EquipeRepartitionAgences({ hub }: { hub: EquipeHub }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
      {hub.repartition_agences.map(r => (
        <div key={r.agence_id} className="bg-white rounded-xl border border-slate-200 p-3 hover:border-teal-300 transition-colors">
          <div className="text-xs font-bold text-slate-900">{r.agence}</div>
          <div className="text-lg font-black text-teal-700 mt-1">{r.nb_agents} agent{r.nb_agents > 1 ? 's' : ''}</div>
          <div className="text-[10px] text-slate-500">Score moy. {r.performance_moyenne} %</div>
          <div className="text-xs text-slate-600 mt-1">{formatFcfa(r.collecte_mois_fcfa)}</div>
        </div>
      ))}
    </div>
  )
}
