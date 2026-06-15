'use client'

import { Fragment, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import type { EpargneHub, TypeCompteEpargne, CompteEpargne } from '@/lib/epargne-hub'
import { formatFcfa, cn } from '@/lib/utils'
import { EpargneProduitsPanel } from '@/components/epargne/EpargneProduitsPanel'

const PAGE_SIZE = 25

const TYPE_LABEL: Record<TypeCompteEpargne, string> = {
  VUE: 'À vue',
  BLOQUE: 'Bloquée',
  TONTINE: 'Tontine',
  DAT: 'DAT',
}

const STATUT_STYLE = {
  ACTIF: 'bg-emerald-100 text-emerald-800',
  DORMANT: 'bg-amber-100 text-amber-800',
  BLOQUE: 'bg-red-100 text-red-800',
}

const TONTINE_STATUT: Record<string, string> = {
  ACTIF: 'bg-emerald-100 text-emerald-800',
  CLOTURE_IMMINENTE: 'bg-red-100 text-red-800',
  RETARD: 'bg-orange-100 text-orange-800',
}

const MOUV_TYPE_STYLE: Record<string, string> = {
  DEPOT: 'text-emerald-700',
  RETRAIT: 'text-orange-700',
  INTERET: 'text-blue-700',
  FRAIS: 'text-slate-600',
}

type Tab = 'comptes' | 'mouvements' | 'produits' | 'dormants' | 'tontines'

interface Props {
  hub: EpargneHub
  tab: Tab
}

function SearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
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

function Pagination({
  page,
  total,
  onPage,
}: {
  page: number
  total: number
  onPage: (p: number) => void
}) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const end = Math.min(page * PAGE_SIZE, total)

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-600">
      <span>
        {total === 0 ? 'Aucun résultat' : `${start}–${end} sur ${total}`}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="p-1.5 rounded-md border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-100"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="px-2 font-medium">{page} / {pages}</span>
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          className="p-1.5 rounded-md border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-100"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

function CompteDetailRow({ compte }: { compte: CompteEpargne }) {
  return (
    <tr className="bg-teal-50/50 border-t border-teal-100">
      <td colSpan={8} className="px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs flex-1">
            <div><span className="text-slate-400">N° compte</span><div className="font-mono font-bold">{compte.numero}</div></div>
            <div><span className="text-slate-400">Objectif</span><div className="font-bold">{compte.objectif_fcfa ? formatFcfa(compte.objectif_fcfa) : '—'}</div></div>
            <div><span className="text-slate-400">Taux</span><div className="font-bold">{compte.taux_pct ? `${compte.taux_pct} %/an` : '—'}</div></div>
            <div><span className="text-slate-400">Score IA</span><div className="font-bold">{compte.score_ia}/100</div></div>
          </div>
          <Link
            href={`/epargne/${compte.id}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900 bg-white border border-teal-200 px-3 py-1.5 rounded-lg"
          >
            Fiche complète <ExternalLink size={12} />
          </Link>
        </div>
      </td>
    </tr>
  )
}

function ComptesTable({ comptes }: { comptes: CompteEpargne[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [agence, setAgence] = useState('')
  const [type, setType] = useState('')
  const [statut, setStatut] = useState('')
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState<string | null>(null)

  const agences = useMemo(() => [...new Set(comptes.map(c => c.agence))].sort(), [comptes])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return comptes.filter(c => {
      if (agence && c.agence !== agence) return false
      if (type && c.type !== type) return false
      if (statut && c.statut !== statut) return false
      if (!q) return true
      return (
        c.client.toLowerCase().includes(q) ||
        c.numero.toLowerCase().includes(q) ||
        c.agence.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
      )
    })
  }, [comptes, search, agence, type, statut])

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const resetPage = () => setPage(1)

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center">
        <SearchBar value={search} onChange={v => { setSearch(v); resetPage() }} placeholder="Client, n° compte, agence…" />
        <select value={agence} onChange={e => { setAgence(e.target.value); resetPage() }} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white">
          <option value="">Toutes agences</option>
          {agences.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={type} onChange={e => { setType(e.target.value); resetPage() }} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white">
          <option value="">Tous types</option>
          {(Object.keys(TYPE_LABEL) as TypeCompteEpargne[]).map(t => (
            <option key={t} value={t}>{TYPE_LABEL[t]}</option>
          ))}
        </select>
        <select value={statut} onChange={e => { setStatut(e.target.value); resetPage() }} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white">
          <option value="">Tous statuts</option>
          <option value="ACTIF">Actif</option>
          <option value="DORMANT">Dormant</option>
        </select>
        <span className="text-xs text-slate-500 ml-auto">{filtered.length} compte(s)</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500">
              <th className="px-4 py-2.5 font-bold w-8" />
              <th className="px-4 py-2.5 font-bold">Client</th>
              <th className="px-4 py-2.5 font-bold">Agence</th>
              <th className="px-4 py-2.5 font-bold">Type</th>
              <th className="px-4 py-2.5 font-bold">Statut</th>
              <th className="px-4 py-2.5 font-bold text-right">Solde</th>
              <th className="px-4 py-2.5 font-bold">Dernier mouv.</th>
              <th className="px-4 py-2.5 font-bold text-center">IA</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(c => (
              <Fragment key={c.id}>
                <tr
                  onClick={() => router.push(`/epargne/${c.id}`)}
                  className="border-t border-slate-100 cursor-pointer transition-colors hover:bg-teal-50/60"
                >
                  <td className="px-4 py-3 text-slate-400" onClick={e => { e.stopPropagation(); setExpanded(prev => (prev === c.id ? null : c.id)) }}>
                    {expanded === c.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{c.client}</div>
                    <div className="text-[10px] font-mono text-slate-400">{c.numero}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.agence}</td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium">{TYPE_LABEL[c.type]}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded', STATUT_STYLE[c.statut])}>{c.statut}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-teal-700">{formatFcfa(c.solde_fcfa)}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{c.dernier_mouvement}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('text-xs font-bold', c.score_ia >= 80 ? 'text-green-600' : c.score_ia >= 60 ? 'text-orange-600' : 'text-red-600')}>
                      {c.score_ia}
                    </span>
                  </td>
                </tr>
                {expanded === c.id && <CompteDetailRow compte={c} />}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} total={filtered.length} onPage={setPage} />
    </div>
  )
}

export function EpargneDgTables({ hub, tab }: Props) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [expandedMouv, setExpandedMouv] = useState<string | null>(null)

  if (tab === 'comptes') {
    return <ComptesTable comptes={hub.comptes} />
  }

  if (tab === 'mouvements') {
    const q = search.toLowerCase().trim()
    const filtered = hub.mouvements.filter(m => {
      if (!q) return true
      return (
        m.client.toLowerCase().includes(q) ||
        m.compte_id.toLowerCase().includes(q) ||
        m.type.toLowerCase().includes(q) ||
        m.canal.toLowerCase().includes(q)
      )
    })
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center">
          <SearchBar value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Client, compte, type, canal…" />
          <span className="text-xs text-slate-500 ml-auto">{filtered.length} mouvement(s)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2.5 font-bold w-8" />
                <th className="px-4 py-2.5 font-bold">Date</th>
                <th className="px-4 py-2.5 font-bold">Client</th>
                <th className="px-4 py-2.5 font-bold">Type</th>
                <th className="px-4 py-2.5 font-bold">Canal</th>
                <th className="px-4 py-2.5 font-bold text-right">Montant</th>
                <th className="px-4 py-2.5 font-bold text-right">Solde après</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(m => (
                <Fragment key={m.id}>
                  <tr
                    onClick={() => setExpandedMouv(prev => (prev === m.id ? null : m.id))}
                    className={cn('border-t border-slate-100 cursor-pointer hover:bg-slate-50', expandedMouv === m.id && 'bg-slate-50')}
                  >
                    <td className="px-4 py-3 text-slate-400">
                      {expandedMouv === m.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">{m.date}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{m.client}</td>
                    <td className={cn('px-4 py-3 font-bold text-xs', MOUV_TYPE_STYLE[m.type])}>{m.type}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{m.canal}</td>
                    <td className={cn('px-4 py-3 text-right font-bold', m.type === 'RETRAIT' || m.type === 'FRAIS' ? 'text-orange-700' : 'text-emerald-700')}>
                      {m.type === 'RETRAIT' || m.type === 'FRAIS' ? '-' : '+'}{formatFcfa(m.montant_fcfa)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">{formatFcfa(m.solde_apres)}</td>
                  </tr>
                  {expandedMouv === m.id && (
                    <tr className="bg-slate-50 border-t border-slate-100">
                      <td colSpan={7} className="px-4 py-2 text-xs text-slate-500">
                        Compte <span className="font-mono font-bold text-slate-700">{m.compte_id}</span>
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

  if (tab === 'produits') {
    return <EpargneProduitsPanel hub={hub} />
  }

  if (tab === 'dormants') {
    const q = search.toLowerCase().trim()
    const all = hub.dormants_prioritaires
    const filtered = all.filter(d => {
      if (!q) return true
      return d.client.toLowerCase().includes(q) || d.agence.toLowerCase().includes(q) || d.action_ia.toLowerCase().includes(q)
    })
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    return (
      <div className="space-y-3">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
          <strong>{hub.kpis.comptes_dormants} comptes</strong> sans mouvement &gt; 6 mois — potentiel réactivation <strong>8 M FCFA</strong> sur 90 jours.
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center">
            <SearchBar value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Client, agence, action IA…" />
            <span className="text-xs text-slate-500 ml-auto">{filtered.length} dormant(s)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2.5 font-bold">Client</th>
                  <th className="px-4 py-2.5 font-bold">Agence</th>
                  <th className="px-4 py-2.5 font-bold text-right">Solde</th>
                  <th className="px-4 py-2.5 font-bold">Dernier mouv.</th>
                  <th className="px-4 py-2.5 font-bold text-right">Inactif</th>
                  <th className="px-4 py-2.5 font-bold text-right">Potentiel</th>
                  <th className="px-4 py-2.5 font-bold">Action IA</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(d => (
                  <tr key={d.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{d.client}</td>
                    <td className="px-4 py-3 text-slate-600">{d.agence}</td>
                    <td className="px-4 py-3 text-right font-bold text-teal-700">{formatFcfa(d.solde_fcfa)}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{d.dernier_mouvement}</td>
                    <td className="px-4 py-3 text-right text-orange-600 font-bold">{d.jours_inactif} j</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-700">{formatFcfa(d.potentiel_fcfa)}</td>
                    <td className="px-4 py-3 text-xs text-indigo-700 font-medium">{d.action_ia}</td>
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

  if (tab === 'tontines') {
    const q = search.toLowerCase().trim()
    const filtered = hub.tontines.filter(t => {
      if (!q) return true
      return t.nom.toLowerCase().includes(q) || t.agence.toLowerCase().includes(q) || t.statut.toLowerCase().includes(q)
    })
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center">
          <SearchBar value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Groupe, agence, statut…" />
          <span className="text-xs text-slate-500 ml-auto">{filtered.length} tontine(s)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2.5 font-bold">Groupe</th>
                <th className="px-4 py-2.5 font-bold">Agence</th>
                <th className="px-4 py-2.5 font-bold text-right">Membres</th>
                <th className="px-4 py-2.5 font-bold text-right">Encours</th>
                <th className="px-4 py-2.5 font-bold text-right">Cycle</th>
                <th className="px-4 py-2.5 font-bold text-right">Collecte</th>
                <th className="px-4 py-2.5 font-bold">Clôture</th>
                <th className="px-4 py-2.5 font-bold">Statut</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(t => (
                <tr key={t.id} className={cn('border-t border-slate-100 hover:bg-slate-50', t.statut === 'CLOTURE_IMMINENTE' && 'bg-red-50/40')}>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{t.nom}</div>
                    {t.alerte && <div className="text-[10px] text-red-600 mt-0.5">{t.alerte}</div>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{t.agence}</td>
                  <td className="px-4 py-3 text-right">{t.membres}</td>
                  <td className="px-4 py-3 text-right font-bold text-teal-700">{formatFcfa(t.encours_fcfa)}</td>
                  <td className="px-4 py-3 text-right">#{t.cycle_num}</td>
                  <td className="px-4 py-3 text-right font-bold">{t.collecte_pct} %</td>
                  <td className="px-4 py-3 text-xs">{t.prochaine_cloture}</td>
                  <td className="px-4 py-3">
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded', TONTINE_STATUT[t.statut])}>
                      {t.statut.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={filtered.length} onPage={setPage} />
      </div>
    )
  }

  return null
}
