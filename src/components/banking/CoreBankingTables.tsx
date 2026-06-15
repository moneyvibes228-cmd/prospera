'use client'

import { Fragment, useMemo, useState } from 'react'
import { Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react'
import type { CoreBankingHub, StatutPret } from '@/lib/core-banking-hub'
import { formatFcfa, cn } from '@/lib/utils'

const PAGE_SIZE = 25

const STATUT_PRET: Record<StatutPret, string> = {
  DEMANDE: 'bg-slate-100 text-slate-700',
  APPROUVE: 'bg-emerald-100 text-emerald-800',
  DECAISSE: 'bg-blue-100 text-blue-800',
  EN_COURS: 'bg-teal-100 text-teal-800',
  SOLDE: 'bg-slate-100 text-slate-600',
  IMPAYE: 'bg-red-100 text-red-800',
  RESTRUCTURE: 'bg-purple-100 text-purple-800',
}

const STATUT_PRET_LABEL: Record<StatutPret, string> = {
  DEMANDE: 'Demande',
  APPROUVE: 'Approuvé',
  DECAISSE: 'Décaissé',
  EN_COURS: 'En cours',
  SOLDE: 'Soldé',
  IMPAYE: 'Impayé',
  RESTRUCTURE: 'Restructuré',
}

const STATUT_ECHEANCE = {
  PAYE: 'bg-emerald-100 text-emerald-800',
  A_VENIR: 'bg-slate-100 text-slate-700',
  RETARD: 'bg-orange-100 text-orange-800',
  IMPAYE: 'bg-red-100 text-red-800',
}

type Tab = 'prets' | 'decaissements' | 'echeancier' | 'refinancement'

function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative flex-1 min-w-[200px] max-w-md">
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
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className="p-1.5 rounded-md border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-100">
          <ChevronLeft size={14} />
        </button>
        <span className="px-2 font-medium">{page} / {pages}</span>
        <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)} className="p-1.5 rounded-md border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-100">
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

interface Props {
  hub: CoreBankingHub
  tab: Tab
}

export function CoreBankingTables({ hub, tab }: Props) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [agence, setAgence] = useState('')
  const [statut, setStatut] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const agences = useMemo(() => [...new Set(hub.prets.map(p => p.agence))].sort(), [hub.prets])

  if (tab === 'prets') {
    const q = search.toLowerCase().trim()
    const filtered = hub.prets.filter(p => {
      if (agence && p.agence !== agence) return false
      if (statut && p.statut !== statut) return false
      if (!q) return true
      return (
        p.ref.toLowerCase().includes(q) ||
        p.client.toLowerCase().includes(q) ||
        p.agence.toLowerCase().includes(q) ||
        p.produit.toLowerCase().includes(q)
      )
    })
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center">
          <SearchBar value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Réf., client, agence, produit…" />
          <select value={agence} onChange={e => { setAgence(e.target.value); setPage(1) }} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white">
            <option value="">Toutes agences</option>
            {agences.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={statut} onChange={e => { setStatut(e.target.value); setPage(1) }} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white">
            <option value="">Tous statuts</option>
            {(Object.keys(STATUT_PRET_LABEL) as StatutPret[]).map(s => (
              <option key={s} value={s}>{STATUT_PRET_LABEL[s]}</option>
            ))}
          </select>
          <span className="text-xs text-slate-500 ml-auto">{filtered.length} prêt(s) · encours réseau {formatFcfa(hub.kpis.encours_credit_fcfa)}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2.5 w-8" />
                <th className="px-3 py-2.5 font-bold">Réf.</th>
                <th className="px-3 py-2.5 font-bold">Client</th>
                <th className="px-3 py-2.5 font-bold">Agence</th>
                <th className="px-3 py-2.5 font-bold">Produit</th>
                <th className="px-3 py-2.5 font-bold text-right">Montant</th>
                <th className="px-3 py-2.5 font-bold text-right">Solde restant</th>
                <th className="px-3 py-2.5 font-bold text-right">Mensualité</th>
                <th className="px-3 py-2.5 font-bold text-center">Taux</th>
                <th className="px-3 py-2.5 font-bold">Statut</th>
                <th className="px-3 py-2.5 font-bold">Proch. éch.</th>
                <th className="px-3 py-2.5 font-bold text-center">IA</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(p => (
                <Fragment key={p.id}>
                  <tr
                    onClick={() => setExpanded(prev => (prev === p.id ? null : p.id))}
                    className={cn(
                      'border-t border-slate-100 cursor-pointer transition-colors',
                      expanded === p.id ? 'bg-teal-50' : 'hover:bg-slate-50',
                      p.statut === 'IMPAYE' && 'bg-red-50/30',
                    )}
                  >
                    <td className="px-3 py-2.5 text-slate-400">{expanded === p.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</td>
                    <td className="px-3 py-2.5 font-mono font-bold text-teal-700 text-xs">{p.ref}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-900 max-w-[140px] truncate">{p.client}</td>
                    <td className="px-3 py-2.5 text-slate-600 text-xs">{p.agence}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-600">{p.produit}</td>
                    <td className="px-3 py-2.5 text-right text-slate-700">{formatFcfa(p.montant_fcfa)}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-slate-900">{formatFcfa(p.solde_restant_fcfa)}</td>
                    <td className="px-3 py-2.5 text-right text-slate-600">{formatFcfa(p.mensualite_fcfa)}</td>
                    <td className="px-3 py-2.5 text-center text-xs">{p.taux_annuel_pct} % · {p.duree_mois}m</td>
                    <td className="px-3 py-2.5">
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap', STATUT_PRET[p.statut])}>
                        {STATUT_PRET_LABEL[p.statut]}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-600 whitespace-nowrap">{p.prochaine_echeance}</td>
                    <td className={cn('px-3 py-2.5 text-center text-xs font-bold', p.score_ia >= 70 ? 'text-green-600' : p.score_ia >= 45 ? 'text-orange-600' : 'text-red-600')}>
                      {p.score_ia}
                    </td>
                  </tr>
                  {expanded === p.id && (
                    <tr className="bg-teal-50/50 border-t border-teal-100">
                      <td colSpan={12} className="px-4 py-3">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                          <div><span className="text-slate-400">Décaissement</span><div className="font-semibold">{p.date_decaissement}</div></div>
                          <div><span className="text-slate-400">Échéances payées</span><div className="font-semibold">{p.echeances_payees} / {p.duree_mois}</div></div>
                          <div><span className="text-slate-400">Capital remboursé</span><div className="font-semibold">{formatFcfa(p.montant_fcfa - p.solde_restant_fcfa)}</div></div>
                          {p.jours_retard != null && (
                            <div><span className="text-slate-400">Retard</span><div className="font-bold text-red-600">{p.jours_retard} jours</div></div>
                          )}
                          <div><span className="text-slate-400">Progression</span><div className="font-semibold">{Math.round((1 - p.solde_restant_fcfa / p.montant_fcfa) * 100)} %</div></div>
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
    )
  }

  if (tab === 'decaissements') {
    const q = search.toLowerCase().trim()
    const filtered = hub.decaissements.filter(d => {
      if (!q) return true
      return d.ref_pret.toLowerCase().includes(q) || d.client.toLowerCase().includes(q) || d.validateur.toLowerCase().includes(q)
    })
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    const attente = filtered.filter(d => d.statut === 'EN_ATTENTE').reduce((s, d) => s + d.montant_fcfa, 0)

    return (
      <div className="space-y-3">
        {hub.kpis.decaissements_en_attente > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-900">
            <strong>{hub.kpis.decaissements_en_attente} décaissements en attente</strong> — {formatFcfa(attente)} à valider avant 16h (cut-off BOA).
          </div>
        )}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center">
            <SearchBar value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Réf. prêt, client, validateur…" />
            <span className="text-xs text-slate-500 ml-auto">{filtered.length} décaissement(s)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2.5 font-bold">Réf. prêt</th>
                  <th className="px-4 py-2.5 font-bold">Client</th>
                  <th className="px-4 py-2.5 font-bold text-right">Montant</th>
                  <th className="px-4 py-2.5 font-bold">Date prévue</th>
                  <th className="px-4 py-2.5 font-bold">Exécution</th>
                  <th className="px-4 py-2.5 font-bold">Canal</th>
                  <th className="px-4 py-2.5 font-bold">Validateur</th>
                  <th className="px-4 py-2.5 font-bold">Statut</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(d => (
                  <tr key={d.id} className={cn('border-t border-slate-100 hover:bg-slate-50', d.statut === 'EN_ATTENTE' && 'bg-amber-50/40')}>
                    <td className="px-4 py-3 font-mono font-bold text-teal-700 text-xs">{d.ref_pret}</td>
                    <td className="px-4 py-3 font-medium">{d.client}</td>
                    <td className="px-4 py-3 text-right font-bold">{formatFcfa(d.montant_fcfa)}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{d.date_prevue}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{d.date_effective ?? '—'}</td>
                    <td className="px-4 py-3 text-xs">{d.canal}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{d.validateur}</td>
                    <td className="px-4 py-3">
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded', d.statut === 'EXECUTE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800')}>
                        {d.statut === 'EXECUTE' ? 'Exécuté' : 'En attente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={filtered.length} onPage={setPage} />
        </div>
      </div>
    )
  }

  if (tab === 'echeancier') {
    const q = search.toLowerCase().trim()
    const filtered = hub.echeancier_reseau.filter(e => {
      if (statut && e.statut !== statut) return false
      if (!q) return true
      return e.ref_pret.toLowerCase().includes(q) || e.client.toLowerCase().includes(q) || e.agence.toLowerCase().includes(q)
    })
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    const impayes = filtered.filter(e => e.statut === 'IMPAYE' || e.statut === 'RETARD').length

    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-3 text-xs text-slate-600 px-1">
          <span><strong className="text-slate-900">{hub.echeancier_reseau.length}</strong> échéances consolidées réseau</span>
          {impayes > 0 && <span className="text-red-600 font-bold">{impayes} en retard / impayé</span>}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center">
            <SearchBar value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Réf., client, agence…" />
            <select value={statut} onChange={e => { setStatut(e.target.value); setPage(1) }} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white">
              <option value="">Tous statuts</option>
              <option value="IMPAYE">Impayé</option>
              <option value="RETARD">Retard</option>
              <option value="A_VENIR">À venir</option>
              <option value="PAYE">Payé</option>
            </select>
            <span className="text-xs text-slate-500 ml-auto">{filtered.length} ligne(s)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2.5 font-bold">Réf.</th>
                  <th className="px-4 py-2.5 font-bold">Client</th>
                  <th className="px-4 py-2.5 font-bold">Agence</th>
                  <th className="px-4 py-2.5 font-bold text-center">N°</th>
                  <th className="px-4 py-2.5 font-bold">Échéance</th>
                  <th className="px-4 py-2.5 font-bold text-right">Capital</th>
                  <th className="px-4 py-2.5 font-bold text-right">Intérêt</th>
                  <th className="px-4 py-2.5 font-bold text-right">Total</th>
                  <th className="px-4 py-2.5 font-bold">Statut</th>
                  <th className="px-4 py-2.5 font-bold text-right">Retard</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(e => (
                  <tr key={e.id} className={cn('border-t border-slate-100 hover:bg-slate-50', (e.statut === 'IMPAYE' || e.statut === 'RETARD') && 'bg-red-50/30')}>
                    <td className="px-4 py-3 font-mono font-bold text-teal-700 text-xs">{e.ref_pret}</td>
                    <td className="px-4 py-3 font-medium max-w-[130px] truncate">{e.client}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{e.agence}</td>
                    <td className="px-4 py-3 text-center font-bold text-slate-500">{e.numero}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">{e.date_echeance}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatFcfa(e.capital_fcfa)}</td>
                    <td className="px-4 py-3 text-right text-slate-500">{formatFcfa(e.interet_fcfa)}</td>
                    <td className="px-4 py-3 text-right font-bold">{formatFcfa(e.total_fcfa)}</td>
                    <td className="px-4 py-3">
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded', STATUT_ECHEANCE[e.statut])}>{e.statut.replace('_', ' ')}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs">{e.jours_retard ? `${e.jours_retard} j` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={filtered.length} onPage={setPage} />
        </div>
      </div>
    )
  }

  if (tab === 'refinancement') {
    const q = search.toLowerCase().trim()
    const filtered = hub.refinancement.filter(r => {
      if (!q) return true
      return r.id.toLowerCase().includes(q) || r.client.toLowerCase().includes(q) || r.ref_pret_initial.toLowerCase().includes(q)
    })

    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <p className="text-xs text-slate-500 mb-3">Dossiers de restructuration / refinancement — recommandations IA incluses</p>
          <SearchBar value={search} onChange={setSearch} placeholder="RF-xxx, client, prêt initial…" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2.5 font-bold">Dossier</th>
                <th className="px-4 py-2.5 font-bold">Client</th>
                <th className="px-4 py-2.5 font-bold">Agence</th>
                <th className="px-4 py-2.5 font-bold">Prêt initial</th>
                <th className="px-4 py-2.5 font-bold text-right">Solde actuel</th>
                <th className="px-4 py-2.5 font-bold text-right">Montant refinancé</th>
                <th className="px-4 py-2.5 font-bold text-right">Économie/mois</th>
                <th className="px-4 py-2.5 font-bold">Statut</th>
                <th className="px-4 py-2.5 font-bold min-w-[200px]">Recommandation IA</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50 align-top">
                  <td className="px-4 py-3 font-mono font-bold text-teal-700 text-xs">{r.id}</td>
                  <td className="px-4 py-3 font-medium">{r.client}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{r.agence}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{r.ref_pret_initial}</td>
                  <td className="px-4 py-3 text-right">{formatFcfa(r.montant_initial_fcfa)}</td>
                  <td className="px-4 py-3 text-right font-bold text-teal-700">{formatFcfa(r.montant_refinance_fcfa)}</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-700">{formatFcfa(r.economie_mensuelle_fcfa)}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded',
                      r.statut === 'APPROUVE' ? 'bg-emerald-100 text-emerald-800' : r.statut === 'REJETE' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800',
                    )}>
                      {r.statut === 'ETUDE' ? 'En étude' : r.statut === 'APPROUVE' ? 'Approuvé' : 'Rejeté'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-indigo-800 leading-relaxed">{r.motif_ia}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return null
}
