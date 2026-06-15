'use client'

import { Fragment, useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ExternalLink, Info } from 'lucide-react'
import type { ZonesHub } from '@/lib/zones-hub'
import { formatFcfa, cn } from '@/lib/utils'

const PAGE_SIZE = 25

type Tab = 'zones' | 'agents' | 'expansion'

interface Props {
  hub: ZonesHub
  tab: Tab
  onSelectZone?: (id: string) => void
  onSelectAgent?: (id: string) => void
}

function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative flex-1 min-w-[220px] max-w-lg">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      <input
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
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
      <span>{total === 0 ? 'Aucun résultat' : `${start}–${end} sur ${total}`}</span>
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

const STATUT_STYLE: Record<string, string> = {
  BON: 'bg-emerald-100 text-emerald-800',
  NORMAL: 'bg-slate-100 text-slate-700',
  TENSION: 'bg-orange-100 text-orange-800',
  DEGRADE: 'bg-red-100 text-red-800',
}

const POTENTIEL_STYLE: Record<string, string> = {
  TRES_ELEVE: 'bg-emerald-100 text-emerald-800',
  ELEVE: 'bg-blue-100 text-blue-800',
  MODERE: 'bg-slate-100 text-slate-700',
}

export function ZonesTables({ hub, tab, onSelectZone, onSelectAgent }: Props) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [agence, setAgence] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const agences = useMemo(
    () => [...new Set(hub.micro_zones.map(z => z.agence))].sort(),
    [hub.micro_zones],
  )

  if (tab === 'zones') {
    const q = search.toLowerCase().trim()
    const filtered = hub.micro_zones.filter(z => {
      if (agence && z.agence !== agence) return false
      if (!q) return true
      return z.nom.toLowerCase().includes(q) || z.agence.toLowerCase().includes(q)
    })

    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2 px-1 text-xs text-slate-600">
          <Info size={14} className="text-teal-600 shrink-0 mt-0.5" />
          <p>Micro-zones opérationnelles — couverture visites vs planifié. Les scores performance agents sont sur la page Équipe.</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center">
            <SearchBar value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Zone, agence…" />
            <select value={agence} onChange={e => { setAgence(e.target.value); setPage(1) }} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white cursor-pointer">
              <option value="">Toutes agences</option>
              {agences.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2.5 font-bold">Micro-zone</th>
                  <th className="px-4 py-2.5 font-bold">Agence</th>
                  <th className="px-4 py-2.5 font-bold text-center">Agents</th>
                  <th className="px-4 py-2.5 font-bold text-center">Couverture</th>
                  <th className="px-4 py-2.5 font-bold text-right">Collecte jour</th>
                  <th className="px-4 py-2.5 font-bold text-center">Statut</th>
                  <th className="px-4 py-2.5 w-8" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(z => (
                  <tr
                    key={z.id}
                    onClick={() => onSelectZone?.(z.id)}
                    className={cn(
                      'border-t border-slate-100 cursor-pointer transition-colors hover:bg-slate-50',
                      z.couverture_pct < 65 && 'bg-red-50/30',
                    )}
                  >
                    <td className="px-4 py-3 font-bold text-slate-900">{z.nom}</td>
                    <td className="px-4 py-3 text-slate-600">{z.agence}</td>
                    <td className="px-4 py-3 text-center">{z.agents_assignes}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn('font-bold', z.couverture_pct < 65 ? 'text-red-600' : z.couverture_pct < 80 ? 'text-orange-600' : 'text-emerald-600')}>
                        {z.couverture_pct} %
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-bold">{formatFcfa(z.collecte_jour)}</div>
                      <div className="text-[10px] text-slate-400">/ {formatFcfa(z.objectif_jour)}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded', STATUT_STYLE[z.statut])}>{z.statut}</span>
                    </td>
                    <td className="px-4 py-3 text-teal-600"><ExternalLink size={14} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  if (tab === 'agents') {
    const q = search.toLowerCase().trim()
    const filtered = hub.agents.filter(a => {
      if (agence && a.agence !== agence) return false
      if (!q) return true
      return a.nom.toLowerCase().includes(q) || a.micro_zone.toLowerCase().includes(q) || a.agence.toLowerCase().includes(q)
    })
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2 px-1 text-xs text-slate-600">
          <Info size={14} className="text-teal-600 shrink-0 mt-0.5" />
          <p>Affectation géographique et conformité GPS — complément de la page Équipe (scores, collecte, recouvrement).</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center">
            <SearchBar value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Agent, zone, agence…" />
            <select value={agence} onChange={e => { setAgence(e.target.value); setPage(1) }} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white cursor-pointer">
              <option value="">Toutes agences</option>
              {agences.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500">
                  <th className="px-2 py-2.5 w-8" />
                  <th className="px-2 py-2.5 font-bold">Agent</th>
                  <th className="px-2 py-2.5 font-bold">Micro-zone assignée</th>
                  <th className="px-2 py-2.5 font-bold">Agence</th>
                  <th className="px-2 py-2.5 font-bold text-center">Couverture</th>
                  <th className="px-2 py-2.5 font-bold text-center">Visites/j</th>
                  <th className="px-2 py-2.5 font-bold text-center">GPS</th>
                  <th className="px-2 py-2.5 font-bold text-center">Statut</th>
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
                      <td className="px-2 py-2.5">
                        <div className="font-bold text-slate-900">{a.nom}</div>
                        <div className="text-[10px] text-slate-400">{a.role}</div>
                      </td>
                      <td className="px-2 py-2.5 text-xs font-medium">{a.micro_zone}</td>
                      <td className="px-2 py-2.5 text-xs">{a.agence}</td>
                      <td className="px-2 py-2.5 text-center font-bold">{a.couverture_pct} %</td>
                      <td className="px-2 py-2.5 text-center text-xs">
                        <span className={cn('font-bold', a.visites_jour < a.visites_prevues * 0.6 ? 'text-red-600' : 'text-slate-700')}>
                          {a.visites_jour}/{a.visites_prevues}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <span className={cn('text-xs font-bold', a.gps_conformite_pct < 80 ? 'text-red-600' : 'text-emerald-600')}>
                          {a.gps_conformite_pct} %
                        </span>
                        {a.gps_alerte && <div className="text-[9px] text-red-600 font-bold">Alerte</div>}
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded', STATUT_STYLE[a.statut])}>{a.statut}</span>
                      </td>
                      <td className="px-2 py-2.5">
                        <Link href={`/equipe`} onClick={e => e.stopPropagation()} className="text-teal-600 hover:text-teal-800">
                          <ExternalLink size={14} />
                        </Link>
                      </td>
                    </tr>
                    {expanded === a.id && (
                      <tr className="bg-teal-50/60 border-t border-teal-100">
                        <td colSpan={9} className="px-4 py-3 text-xs text-slate-700">
                          <strong>Analyse IA :</strong> {a.ia_resume}
                          {a.gps_alerte && ' — Audit géofencing recommandé sous 48h.'}
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

  const q = search.toLowerCase().trim()
  const filtered = hub.zones_expansion.filter(z => {
    if (!q) return true
    return z.nom.toLowerCase().includes(q) || z.agence_nom.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 px-1 text-xs text-slate-600">
        <Info size={14} className="text-teal-600 shrink-0 mt-0.5" />
        <p>Zones identifiées par l&apos;IA avec fort potentiel mais faible ou nulle couverture — arbitrage croissance vs capacité agents.</p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <SearchBar value={search} onChange={setSearch} placeholder="Zone, agence de rattachement…" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2.5 font-bold">Zone cible</th>
                <th className="px-4 py-2.5 font-bold">Agence ref.</th>
                <th className="px-4 py-2.5 font-bold text-center">Prospects</th>
                <th className="px-4 py-2.5 font-bold text-center">Couverture</th>
                <th className="px-4 py-2.5 font-bold text-center">Potentiel</th>
                <th className="px-4 py-2.5 font-bold">Action recommandée</th>
                <th className="px-4 py-2.5 font-bold text-center">Conf.</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(z => (
                <tr key={z.id} className={cn('border-t border-slate-100 hover:bg-slate-50', z.couverture_pct === 0 && 'bg-emerald-50/30')}>
                  <td className="px-4 py-3 font-bold text-slate-900">
                    {z.nom}
                    {z.roi_rapide && <span className="ml-2 text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">ROI 3 mois</span>}
                  </td>
                  <td className="px-4 py-3 text-xs">{z.agence_nom}</td>
                  <td className="px-4 py-3 text-center font-bold">{z.prospects}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('font-bold', z.couverture_pct === 0 ? 'text-emerald-600' : 'text-orange-600')}>{z.couverture_pct} %</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded', POTENTIEL_STYLE[z.potentiel])}>{z.potentiel.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-700 max-w-[220px]">{z.action}</td>
                  <td className="px-4 py-3 text-center text-xs font-bold text-slate-600">{z.confidence} %</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
