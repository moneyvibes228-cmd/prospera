'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, ChevronLeft, ChevronRight, ExternalLink, Info } from 'lucide-react'
import type { SousSecteurHub } from '@/lib/sous-secteur-hub'
import { formatFcfa, cn } from '@/lib/utils'

const PAGE_SIZE = 15

interface Props {
  hub: SousSecteurHub
}

export function SousSecteurTables({ hub }: Props) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [agence, setAgence] = useState('')
  const [statut, setStatut] = useState('')

  const agences = useMemo(() => [...new Set(hub.dossiers.map(d => d.agence))].sort(), [hub.dossiers])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return hub.dossiers.filter(d => {
      if (agence && d.agence !== agence) return false
      if (statut && d.statut !== statut) return false
      if (!q) return true
      return d.client.toLowerCase().includes(q) || d.id.toLowerCase().includes(q)
        || d.agent_commercial.toLowerCase().includes(q) || d.agent_gp.toLowerCase().includes(q)
    })
  }, [hub.dossiers, search, agence, statut])

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const start = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const end = Math.min(page * PAGE_SIZE, filtered.length)

  const totalAgences = hub.agences.reduce((s, a) => s + a.dossiers, 0)

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 px-1 text-xs text-slate-600">
        <Info size={14} className="text-teal-600 shrink-0 mt-0.5" />
        <p>
          Registre complet — <strong>{hub.kpis.total_dossiers} dossiers</strong> répartis sur {hub.agences.length} agences
          (total affiché agences : {totalAgences}). Chaque client : 1 commercial terrain + 1 GP de suivi.
        </p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-lg">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Client, réf., agent…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
          </div>
          <select value={agence} onChange={e => { setAgence(e.target.value); setPage(1) }} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white cursor-pointer">
            <option value="">Toutes agences</option>
            {agences.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={statut} onChange={e => { setStatut(e.target.value); setPage(1) }} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white cursor-pointer">
            <option value="">Tous statuts</option>
            <option value="ACTIF">Actif</option>
            <option value="EN_RETARD">En retard</option>
            <option value="RENOUVELLEMENT">Renouvellement</option>
          </select>
          <span className="text-xs text-slate-500 ml-auto">
            Encours filtré : {formatFcfa(filtered.reduce((s, d) => s + d.montant, 0))}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2.5 font-bold">Client</th>
                <th className="px-3 py-2.5 font-bold">Agence · Équipe client</th>
                <th className="px-3 py-2.5 font-bold text-right">Montant</th>
                <th className="px-3 py-2.5 font-bold text-center">Score IA</th>
                <th className="px-3 py-2.5 font-bold text-center">Statut</th>
                <th className="px-3 py-2.5 font-bold text-center">Échéance</th>
                <th className="px-3 py-2.5 w-8" />
              </tr>
            </thead>
            <tbody>
              {paginated.map(d => (
                <tr key={d.id} className={cn('border-t border-slate-100 hover:bg-slate-50', d.statut === 'EN_RETARD' && 'bg-red-50/40')}>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{d.client}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{d.id}</div>
                  </td>
                  <td className="px-3 py-3 text-xs">
                    <div className="font-medium text-slate-800">{d.agence}</div>
                    <div className="text-slate-500">COM <span className="text-slate-700">{d.agent_commercial}</span></div>
                    <div className="text-teal-700">GP <span className="font-medium">{d.agent_gp}</span></div>
                  </td>
                  <td className="px-3 py-3 text-right font-bold">{formatFcfa(d.montant)}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={cn('text-xs font-bold px-2 py-0.5 rounded', d.score_ia < 45 ? 'bg-red-100 text-red-700' : d.score_ia < 60 ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-800')}>
                      {d.score_ia}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded-full',
                      d.statut === 'EN_RETARD' ? 'bg-red-100 text-red-700' : d.statut === 'RENOUVELLEMENT' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700',
                    )}>
                      {d.statut.replace('_', ' ')}
                    </span>
                  </td>
                  <td className={cn('px-3 py-3 text-center text-xs font-medium', d.jours_retard > 0 && 'text-red-600')}>
                    {d.derniere_echeance}
                  </td>
                  <td className="px-3 py-3">
                    <Link href={`/dashboard/credit/clients/${d.id}`} className="text-teal-600 hover:text-teal-800" title="Fiche client complète">
                      <ExternalLink size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-600">
          <span>{filtered.length === 0 ? 'Aucun résultat' : `${start}–${end} sur ${filtered.length} dossiers`}</span>
          <div className="flex items-center gap-1">
            <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="p-1.5 rounded-md border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-100 cursor-pointer transition-colors">
              <ChevronLeft size={14} />
            </button>
            <span className="px-2 font-medium">{page} / {pages}</span>
            <button type="button" disabled={page >= pages} onClick={() => setPage(page + 1)} className="p-1.5 rounded-md border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-100 cursor-pointer transition-colors">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
