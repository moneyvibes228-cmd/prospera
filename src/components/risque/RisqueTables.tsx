'use client'

import { Fragment, useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ExternalLink, Info } from 'lucide-react'
import type { RisqueHub } from '@/lib/risque-hub'
import { formatFcfa, cn } from '@/lib/utils'

const PAGE_SIZE = 25

type Tab = 'clients' | 'dossiers'

interface Props {
  hub: RisqueHub
  tab: Tab
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

export function RisqueTables({ hub, tab }: Props) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [agence, setAgence] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const agences = useMemo(
    () => [...new Set(hub.clients_risque.map(c => c.agence))].sort(),
    [hub.clients_risque],
  )

  if (tab === 'clients') {
    const q = search.toLowerCase().trim()
    const filtered = hub.clients_risque.filter(c => {
      if (agence && c.agence !== agence) return false
      if (!q) return true
      return c.nom.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.agent.toLowerCase().includes(q) || c.agence.toLowerCase().includes(q)
    })
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    const elTotal = filtered.reduce((s, c) => s + c.el_fcfa, 0)

    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2 px-1 text-xs text-slate-600">
          <Info size={14} className="text-red-600 shrink-0 mt-0.5" />
          <p>
            Classement par probabilité de défaut (PD) et Expected Loss individuel.
            Ce tableau n&apos;apparaît pas sur le tableau de bord — c&apos;est la vue « micro » pour arbitrer dossier par dossier.
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center">
            <SearchBar value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Client, réf., agent, agence…" />
            <select value={agence} onChange={e => { setAgence(e.target.value); setPage(1) }} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white cursor-pointer">
              <option value="">Toutes agences</option>
              {agences.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <span className="text-xs text-slate-500 ml-auto">
              EL totale filtrée : {formatFcfa(elTotal)}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500">
                  <th className="px-2 py-2.5 w-8" />
                  <th className="px-2 py-2.5 font-bold text-center w-10">#</th>
                  <th className="px-2 py-2.5 font-bold">Client</th>
                  <th className="px-2 py-2.5 font-bold">Agence · Agent</th>
                  <th className="px-2 py-2.5 font-bold text-right">Encours</th>
                  <th className="px-2 py-2.5 font-bold text-center">Score IA</th>
                  <th className="px-2 py-2.5 font-bold text-center">PD</th>
                  <th className="px-2 py-2.5 font-bold text-right">EL</th>
                  <th className="px-2 py-2.5 font-bold text-center">Retard</th>
                  <th className="px-2 py-2.5 font-bold">Action recommandée</th>
                  <th className="px-2 py-2.5 w-8" />
                </tr>
              </thead>
              <tbody>
                {paginated.map((c, i) => {
                  const rank = (page - 1) * PAGE_SIZE + i + 1
                  return (
                    <Fragment key={c.id}>
                      <tr
                        onClick={() => setExpanded(prev => (prev === c.id ? null : c.id))}
                        className={cn(
                          'border-t border-slate-100 cursor-pointer transition-colors',
                          expanded === c.id ? 'bg-red-50' : 'hover:bg-slate-50',
                          rank <= 3 && 'bg-red-50/40',
                        )}
                      >
                        <td className="px-2 py-2.5 text-slate-400">
                          {expanded === c.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </td>
                        <td className="px-2 py-2.5 text-center">
                          <span className={cn('inline-flex w-6 h-6 items-center justify-center rounded text-[10px] font-bold', rank <= 3 ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-600')}>
                            {rank}
                          </span>
                        </td>
                        <td className="px-2 py-2.5">
                          <div className="font-bold text-slate-900">{c.nom}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{c.id}</div>
                        </td>
                        <td className="px-2 py-2.5 text-xs">
                          <div>{c.agence}</div>
                          <div className="text-slate-500">{c.agent}</div>
                        </td>
                        <td className="px-2 py-2.5 text-right font-bold">{formatFcfa(c.encours_fcfa)}</td>
                        <td className="px-2 py-2.5 text-center">
                          <span className={cn('text-xs font-bold px-2 py-0.5 rounded', c.score_ia < 45 ? 'bg-red-100 text-red-700' : c.score_ia < 55 ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-800')}>
                            {c.score_ia}
                          </span>
                        </td>
                        <td className="px-2 py-2.5 text-center font-bold text-red-700">{c.pd_pct} %</td>
                        <td className="px-2 py-2.5 text-right font-bold text-red-700">{formatFcfa(c.el_fcfa)}</td>
                        <td className="px-2 py-2.5 text-center">
                          <span className={cn('font-bold text-xs', c.jours_retard >= 60 ? 'text-red-600' : c.jours_retard >= 30 ? 'text-orange-600' : 'text-amber-600')}>
                            J+{c.jours_retard}
                          </span>
                        </td>
                        <td className="px-2 py-2.5 text-xs text-slate-700 max-w-[160px]">{c.action}</td>
                        <td className="px-2 py-2.5">
                          <Link href={`/dashboard/credit/clients/${c.id}`} onClick={e => e.stopPropagation()} className="text-teal-600 hover:text-teal-800" title="Fiche client complète">
                            <ExternalLink size={14} />
                          </Link>
                        </td>
                      </tr>
                      {expanded === c.id && (
                        <tr className="bg-red-50/60 border-t border-red-100">
                          <td colSpan={11} className="px-4 py-3 text-xs text-slate-700">
                            <strong>Pour le DG :</strong> PD {c.pd_pct} % = {c.pd_pct >= 50 ? 'décision comité crédit ou contentieux requise' : 'plan recouvrement renforcé'}.
                            EL {formatFcfa(c.el_fcfa)} à provisionner si migration vers classe DOUTEUX.
                            <Link href={`/dashboard/credit/clients/${c.id}`} className="inline-flex items-center gap-1 ml-3 text-teal-700 font-bold hover:underline">
                              Fiche complète <ExternalLink size={12} />
                            </Link>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={filtered.length} onPage={setPage} />
        </div>
      </div>
    )
  }

  const q = search.toLowerCase().trim()
  const filtered = hub.dossiers_bloques_dg.filter(d => {
    if (!q) return true
    return d.client.toLowerCase().includes(q) || d.id.toLowerCase().includes(q) || d.agence.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 px-1 text-xs text-slate-600">
        <Info size={14} className="text-red-600 shrink-0 mt-0.5" />
        <p>Dossiers bloqués &gt; 48h nécessitant arbitrage — ceux marqués « DG » attendent une décision direction.</p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <SearchBar value={search} onChange={setSearch} placeholder="Client, réf. dossier…" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2.5 font-bold">Dossier</th>
                <th className="px-4 py-2.5 font-bold">Client</th>
                <th className="px-4 py-2.5 font-bold text-right">Montant</th>
                <th className="px-4 py-2.5 font-bold">Étape</th>
                <th className="px-4 py-2.5 font-bold text-center">Bloqué</th>
                <th className="px-4 py-2.5 font-bold">Raison</th>
                <th className="px-4 py-2.5 font-bold">DG</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id} className={cn('border-t border-slate-100 hover:bg-slate-50', d.necessite_dg && 'bg-amber-50/50')}>
                  <td className="px-4 py-3 font-mono text-xs text-teal-700">{d.id}</td>
                  <td className="px-4 py-3 font-medium">{d.client}</td>
                  <td className="px-4 py-3 text-right font-bold">{formatFcfa(d.montant)}</td>
                  <td className="px-4 py-3 text-xs">{d.etape}</td>
                  <td className="px-4 py-3 text-center font-bold text-red-600">{d.bloque_depuis_h}h</td>
                  <td className="px-4 py-3 text-xs text-slate-600 max-w-[200px]">{d.raison}</td>
                  <td className="px-4 py-3">
                    {d.necessite_dg ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">Requis</span>
                    ) : (
                      <span className="text-[10px] text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
