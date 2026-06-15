'use client'

import { Fragment, useMemo, useState } from 'react'
import { Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Info } from 'lucide-react'
import type { CaisseHub, TypeFluxCaisse } from '@/lib/caisse-hub'
import { formatFcfa, cn } from '@/lib/utils'

const PAGE_SIZE = 25

const TYPE_LABEL: Record<TypeFluxCaisse, string> = {
  DECAISSEMENT: 'Décaissement crédit',
  REMBOURSEMENT: 'Remboursement',
  VIREMENT_INTER_AGENCE: 'Virement inter-agence',
  APPROVISIONNEMENT: 'Approvisionnement',
  FRAIS_GESTION: 'Frais gestion',
  RETRAIT_EPARGNE: 'Retrait guichet',
  DEPOT_EPARGNE: 'Dépôt guichet',
}

const CANAL_LABEL: Record<string, string> = {
  ESPECES: 'Espèces',
  MOMO_MIXX: 'Mixx By Yas',
  MOMO_FLOOZ: 'Flooz',
  VIREMENT: 'Virement',
  CHEQUE: 'Chèque',
}

const OPERATEUR_MOMO_LABEL: Record<string, string> = {
  MIXX: 'Mixx By Yas',
  FLOOZ: 'Flooz',
}

const STATUT_POSITION = {
  OK: 'bg-emerald-100 text-emerald-800',
  TENSION: 'bg-amber-100 text-amber-800',
  CRITIQUE: 'bg-red-100 text-red-800',
}

const STATUT_CLOTURE = {
  VALIDEE: 'bg-emerald-100 text-emerald-800',
  ECART: 'bg-red-100 text-red-800',
  OUVERTE: 'bg-amber-100 text-amber-800',
}

type Tab = 'position' | 'flux' | 'clotures' | 'momo' | 'virements'

interface Props {
  hub: CaisseHub
  tab: Tab
}

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

export function CaisseTables({ hub, tab }: Props) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [agence, setAgence] = useState('')
  const [typeFlux, setTypeFlux] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const agences = useMemo(() => hub.positions.map(p => p.agence), [hub.positions])

  if (tab === 'position') {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2 px-1 text-xs text-slate-600">
          <Info size={14} className="text-teal-600 shrink-0 mt-0.5" />
          <p>
            Liquidité <strong>opérationnelle</strong> par agence : caisse physique et float Mobile Money (Mixx By Yas, Flooz).
            Ce n&apos;est pas l&apos;encours épargne clients (voir page Épargne réseau).
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2.5 font-bold">Agence</th>
                  <th className="px-4 py-2.5 font-bold text-right">Caisse phys.</th>
                  <th className="px-4 py-2.5 font-bold text-right">Mixx By Yas</th>
                  <th className="px-4 py-2.5 font-bold text-right">Flooz</th>
                  <th className="px-4 py-2.5 font-bold text-right">Total dispo.</th>
                  <th className="px-4 py-2.5 font-bold text-right">Réserve min.</th>
                  <th className="px-4 py-2.5 font-bold text-center">Ratio</th>
                  <th className="px-4 py-2.5 font-bold text-right">Décaiss. prévus</th>
                  <th className="px-4 py-2.5 font-bold">Statut</th>
                </tr>
              </thead>
              <tbody>
                {hub.positions.map(p => (
                  <tr key={p.agence_id} className={cn('border-t border-slate-100 hover:bg-slate-50', p.statut === 'CRITIQUE' && 'bg-red-50/40', p.statut === 'TENSION' && 'bg-amber-50/30')}>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{p.agence}</div>
                      <div className="text-[10px] text-slate-500">{p.responsable}</div>
                    </td>
                    <td className="px-4 py-3 text-right">{formatFcfa(p.caisse_physique_fcfa)}</td>
                    <td className="px-4 py-3 text-right">{formatFcfa(p.momo_mixx_fcfa)}</td>
                    <td className="px-4 py-3 text-right">{formatFcfa(p.momo_flooz_fcfa)}</td>
                    <td className="px-4 py-3 text-right font-bold text-teal-700">{formatFcfa(p.total_disponible_fcfa)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatFcfa(p.reserve_obligatoire_fcfa)}</td>
                    <td className={cn('px-4 py-3 text-center font-bold', p.ratio_couverture_pct < 120 ? 'text-red-600' : p.ratio_couverture_pct < 150 ? 'text-amber-600' : 'text-emerald-600')}>
                      {p.ratio_couverture_pct} %
                    </td>
                    <td className="px-4 py-3 text-right text-orange-700 font-medium">
                      {p.decaissements_prevus_jour_fcfa > 0 ? formatFcfa(p.decaissements_prevus_jour_fcfa) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded', STATUT_POSITION[p.statut])}>{p.statut}</span>
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold">
                  <td className="px-4 py-3">Réseau</td>
                  <td className="px-4 py-3 text-right">{formatFcfa(hub.kpis.caisse_physique_fcfa)}</td>
                  <td className="px-4 py-3 text-right">{formatFcfa(hub.positions.reduce((s, p) => s + p.momo_mixx_fcfa, 0))}</td>
                  <td className="px-4 py-3 text-right">{formatFcfa(hub.positions.reduce((s, p) => s + p.momo_flooz_fcfa, 0))}</td>
                  <td className="px-4 py-3 text-right text-teal-700">{formatFcfa(hub.kpis.liquidite_totale_fcfa)}</td>
                  <td colSpan={4} />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  if (tab === 'flux') {
    const q = search.toLowerCase().trim()
    const filtered = hub.flux.filter(f => {
      if (agence && f.agence !== agence) return false
      if (typeFlux && f.type !== typeFlux) return false
      if (!q) return true
      return f.libelle.toLowerCase().includes(q) || f.piece?.toLowerCase().includes(q) || f.agent.toLowerCase().includes(q)
    })
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2 px-1 text-xs text-slate-600">
          <Info size={14} className="text-teal-600 shrink-0 mt-0.5" />
          <p>
            Flux de trésorerie du jour au guichet : décaissements crédit, remboursements, virements inter-agences.
            Les dépôts/retraits épargne y passent comme mouvements de caisse, pas comme soldes comptes.
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center">
            <SearchBar value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Libellé, pièce, agent…" />
            <select value={agence} onChange={e => { setAgence(e.target.value); setPage(1) }} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white cursor-pointer">
              <option value="">Toutes agences</option>
              {agences.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <select value={typeFlux} onChange={e => { setTypeFlux(e.target.value); setPage(1) }} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white cursor-pointer">
              <option value="">Tous types</option>
              {(Object.keys(TYPE_LABEL) as TypeFluxCaisse[]).map(t => (
                <option key={t} value={t}>{TYPE_LABEL[t]}</option>
              ))}
            </select>
            <span className="text-xs text-slate-500 ml-auto">{filtered.length} opération(s)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2.5 font-bold">Heure</th>
                  <th className="px-3 py-2.5 font-bold">Agence</th>
                  <th className="px-3 py-2.5 font-bold">Type</th>
                  <th className="px-3 py-2.5 font-bold">Libellé</th>
                  <th className="px-3 py-2.5 font-bold">Canal</th>
                  <th className="px-3 py-2.5 font-bold text-right">Montant</th>
                  <th className="px-3 py-2.5 font-bold">Agent</th>
                  <th className="px-3 py-2.5 font-bold text-center">Lettré</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((f, rowIdx) => (
                  <tr key={`${f.id}-${f.piece}-${f.heure}-${f.agence}-${rowIdx}`} className={cn('border-t border-slate-100 hover:bg-slate-50', !f.rapproche && 'bg-amber-50/30')}>
                    <td className="px-3 py-2.5 text-xs font-mono whitespace-nowrap">{f.heure}</td>
                    <td className="px-3 py-2.5 text-xs">{f.agence}</td>
                    <td className="px-3 py-2.5 text-[10px] font-medium text-slate-600">{TYPE_LABEL[f.type]}</td>
                    <td className="px-3 py-2.5 max-w-[200px] truncate">{f.libelle}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-500">{CANAL_LABEL[f.canal] ?? f.canal.replace('_', ' ')}</td>
                    <td className={cn('px-3 py-2.5 text-right font-bold tabular-nums', f.sens === 'ENTREE' ? 'text-emerald-700' : 'text-orange-700')}>
                      {f.sens === 'ENTREE' ? '+' : '−'}{formatFcfa(f.montant_fcfa)}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-600">{f.agent}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded', f.rapproche ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800')}>
                        {f.rapproche ? 'Oui' : 'Non'}
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

  if (tab === 'clotures') {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2 px-1 text-xs text-slate-600">
          <Info size={14} className="text-teal-600 shrink-0 mt-0.5" />
          <p>Clôture journalière = comptage physique vs solde théorique en caisse. Toute agence avec écart doit être investiguée avant le lendemain.</p>
        </div>
        {hub.kpis.agences_non_cloturees > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-amber-900">
            <strong>{hub.kpis.agences_non_cloturees} agence(s)</strong> non conformes — Bè Kpota écart {formatFcfa(42_000)}, Hédzranawoé non clôturée.
          </div>
        )}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2.5 font-bold">Agence</th>
                  <th className="px-4 py-2.5 font-bold text-right">Solde théorique</th>
                  <th className="px-4 py-2.5 font-bold text-right">Comptage phys.</th>
                  <th className="px-4 py-2.5 font-bold text-right">Écart</th>
                  <th className="px-4 py-2.5 font-bold text-center">Opérations</th>
                  <th className="px-4 py-2.5 font-bold">Validateur</th>
                  <th className="px-4 py-2.5 font-bold">Clôture</th>
                  <th className="px-4 py-2.5 font-bold">Statut</th>
                </tr>
              </thead>
              <tbody>
                {hub.clotures.map(c => (
                  <tr key={c.id} className={cn('border-t border-slate-100 hover:bg-slate-50', c.statut === 'ECART' && 'bg-red-50/40')}>
                    <td className="px-4 py-3 font-semibold">{c.agence}</td>
                    <td className="px-4 py-3 text-right">{formatFcfa(c.solde_theorique_fcfa)}</td>
                    <td className="px-4 py-3 text-right">{formatFcfa(c.solde_physique_fcfa)}</td>
                    <td className={cn('px-4 py-3 text-right font-bold', c.ecart_fcfa !== 0 ? 'text-red-600' : 'text-emerald-600')}>
                      {c.ecart_fcfa === 0 ? '—' : formatFcfa(Math.abs(c.ecart_fcfa))}
                    </td>
                    <td className="px-4 py-3 text-center">{c.nb_operations_jour}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{c.validateur ?? '—'}</td>
                    <td className="px-4 py-3 text-xs">{c.heure_cloture ?? 'En cours'}</td>
                    <td className="px-4 py-3">
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded', STATUT_CLOTURE[c.statut])}>{c.statut}</span>
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

  if (tab === 'virements') {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2 px-1 text-xs text-slate-600">
          <Info size={14} className="text-teal-600 shrink-0 mt-0.5" />
          <p>Virements inter-agences pour rééquilibrer la liquidité. Validation DG requise au-delà de 500 000 FCFA.</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2.5 font-bold">Réf.</th>
                <th className="px-4 py-2.5 font-bold">Émetteur</th>
                <th className="px-4 py-2.5 font-bold">Bénéficiaire</th>
                <th className="px-4 py-2.5 font-bold text-right">Montant</th>
                <th className="px-4 py-2.5 font-bold">Motif</th>
                <th className="px-4 py-2.5 font-bold">Validateur</th>
                <th className="px-4 py-2.5 font-bold">Statut</th>
              </tr>
            </thead>
            <tbody>
              {hub.virements.map(v => (
                <tr key={v.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-teal-700">{v.id}</td>
                  <td className="px-4 py-3">{v.emetteur}</td>
                  <td className="px-4 py-3">{v.beneficiaire}</td>
                  <td className="px-4 py-3 text-right font-bold">{formatFcfa(v.montant_fcfa)}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 max-w-[200px]">{v.motif}</td>
                  <td className="px-4 py-3 text-xs">{v.validateur}</td>
                  <td className="px-4 py-3">
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded', v.statut === 'EXECUTE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800')}>
                      {v.statut === 'EXECUTE' ? 'Exécuté' : 'En attente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // momo tab
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 px-1 text-xs text-slate-600">
        <Info size={14} className="text-teal-600 shrink-0 mt-0.5" />
        <p>Rapprochement Mobile Money : conciliation solde plateforme opérateur vs comptabilité Prospera. Les écarts proviennent souvent de transactions J-1 non lettrées.</p>
      </div>
      {hub.rapprochements_momo.map(r => (
        <div key={r.id} className={cn('bg-white rounded-xl border shadow-sm overflow-hidden', r.statut === 'ECART' ? 'border-orange-300' : 'border-slate-200')}>
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
            <span className="font-bold text-slate-900">{OPERATEUR_MOMO_LABEL[r.operateur] ?? r.operateur}</span>
            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded', r.statut === 'OK' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800')}>{r.statut}</span>
            <span className="text-xs text-slate-500 ml-auto">Sync {r.derniere_sync}</span>
          </div>
          <div className="p-4 grid md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-slate-500 text-xs">Plateforme</span><div className="font-bold">{formatFcfa(r.solde_plateforme_fcfa)}</div></div>
            <div><span className="text-slate-500 text-xs">Comptabilité</span><div className="font-bold">{formatFcfa(r.solde_compta_fcfa)}</div></div>
            <div><span className="text-slate-500 text-xs">Écart</span><div className={cn('font-bold', r.ecart_fcfa !== 0 ? 'text-red-600' : 'text-emerald-600')}>{formatFcfa(r.ecart_fcfa)}</div></div>
            <div><span className="text-slate-500 text-xs">Non rapprochées</span><div className="font-bold">{r.transactions_non_rapprochees}</div></div>
          </div>
          <p className="px-4 pb-4 text-xs text-slate-600 bg-slate-50 mx-4 mb-4 rounded-lg p-2">{r.suggestion_ia}</p>
        </div>
      ))}
      {hub.transactions_momo.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 font-semibold text-sm text-slate-900">Transactions non lettrées (Mixx By Yas)</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2 font-bold">Réf.</th>
                <th className="px-4 py-2 font-bold">Date</th>
                <th className="px-4 py-2 font-bold">Libellé</th>
                <th className="px-4 py-2 font-bold">Agence</th>
                <th className="px-4 py-2 font-bold text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              {hub.transactions_momo.map(t => (
                <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer">
                  <td className="px-4 py-2.5 font-mono text-xs text-teal-700">{t.id}</td>
                  <td className="px-4 py-2.5 text-xs">{t.date} {t.heure}</td>
                  <td className="px-4 py-2.5">{t.libelle}</td>
                  <td className="px-4 py-2.5 text-xs">{t.agence}</td>
                  <td className="px-4 py-2.5 text-right font-bold">{formatFcfa(t.montant_fcfa)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export { TYPE_LABEL }
