'use client'

import { Fragment, useMemo, useState } from 'react'
import {
  Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  ArrowRight, Download, Info, Check, Loader2,
} from 'lucide-react'
import type { ConformiteHub, ClasseBceao } from '@/lib/conformite-hub'
import { exportConformiteReport } from '@/lib/conformite-export'
import { formatFcfa, cn } from '@/lib/utils'
import { AiBadge } from '@/components/dashboard/AiBadge'
const PAGE_SIZE = 25

const CLASSE_COLOR: Record<ClasseBceao, string> = {
  NORMAL: 'bg-emerald-100 text-emerald-800',
  SOUS_SURVEILLANCE: 'bg-amber-100 text-amber-800',
  DOUTEUX: 'bg-orange-100 text-orange-800',
  COMPROMISES: 'bg-red-100 text-red-800',
  CONTENTIEUX: 'bg-red-200 text-red-900',
}

const CLASSE_LABEL: Record<ClasseBceao, string> = {
  NORMAL: 'Normal',
  SOUS_SURVEILLANCE: 'Sous surveillance',
  DOUTEUX: 'Douteux',
  COMPROMISES: 'Compromises',
  CONTENTIEUX: 'Contentieux',
}

const STATUT_BCEAO: Record<string, string> = {
  CONFORME: 'bg-emerald-100 text-emerald-800',
  ATTENTION: 'bg-amber-100 text-amber-800',
  NON_CONFORME: 'bg-red-100 text-red-800',
}

const EXPORT_TYPE_LABEL: Record<string, string> = {
  BCEAO_MENSUEL: 'Rapport BCEAO mensuel',
  PAR_TRIMESTRIEL: 'PAR trimestriel',
  LBC_FT: 'Déclaration LBC/FT',
  SITUATION_LIQUIDITE: 'Situation liquidité',
}

type Tab = 'classification' | 'provisions' | 'lbc_ft' | 'exports'

const LBC_STATUT: Record<string, string> = {
  EN_ANALYSE: 'bg-amber-100 text-amber-800',
  DS_TRANSMISE: 'bg-blue-100 text-blue-800',
  GEL_FONDS: 'bg-red-100 text-red-800',
  CLASSEE: 'bg-slate-100 text-slate-700',
}

const LBC_STATUT_LABEL: Record<string, string> = {
  EN_ANALYSE: 'En analyse',
  DS_TRANSMISE: 'DS transmise',
  GEL_FONDS: 'Gel fonds',
  CLASSEE: 'Classée',
}

const LBC_RISQUE: Record<string, string> = {
  CRITIQUE: 'bg-red-200 text-red-900',
  ELEVE: 'bg-orange-100 text-orange-800',
  MOYEN: 'bg-amber-100 text-amber-800',
}

const CENTIF_STATUT: Record<string, string> = {
  TRANSMISE: 'bg-blue-100 text-blue-800',
  ACCUSEE: 'bg-emerald-100 text-emerald-800',
  NEANT: 'bg-slate-100 text-slate-600',
  BROUILLON: 'bg-amber-100 text-amber-800',
}

const KYC_STATUT: Record<string, string> = {
  BLOQUE: 'bg-red-100 text-red-800',
  EN_COURS: 'bg-blue-100 text-blue-800',
  A_RELANCER: 'bg-amber-100 text-amber-800',
}

interface Props {
  hub: ConformiteHub
  tab: Tab
  classeFilter?: ClasseBceao | ''
  onClasseFilter?: (c: ClasseBceao | '') => void
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

export function ConformiteTables({ hub, tab, classeFilter = '', onClasseFilter }: Props) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [agence, setAgence] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [exportingId, setExportingId] = useState<string | null>(null)
  const [exportedId, setExportedId] = useState<string | null>(null)

  const handleExport = (expId: string) => {
    const exp = hub.exports.find(e => e.id === expId)
    if (!exp || exportingId) return
    setExportingId(expId)
    setExportedId(null)
    void (async () => {
      try {
        await new Promise(r => setTimeout(r, 200))
        await exportConformiteReport(hub, exp)
        setExportedId(expId)
        window.setTimeout(() => setExportedId(null), 2500)
      } catch {
        window.alert('Échec de la génération PDF. Réessayez.')
      } finally {
        setExportingId(null)
      }
    })()
  }
  const agences = useMemo(
    () => [...new Set(hub.classifications.map(c => c.agence))].sort(),
    [hub.classifications],
  )

  if (tab === 'classification') {
    const q = search.toLowerCase().trim()
    const filtered = hub.classifications.filter(c => {
      if (classeFilter && c.classe_calculee !== classeFilter) return false
      if (agence && c.agence !== agence) return false
      if (!q) return true
      return (
        c.client.toLowerCase().includes(q) ||
        c.ref_pret.toLowerCase().includes(q) ||
        c.agence.toLowerCase().includes(q) ||
        c.client_id.toLowerCase().includes(q)
      )
    })
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    const migrations = filtered.filter(c => c.classe_calculee !== c.classe_precedente).length

    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2 px-1 text-xs text-slate-600">
          <Info size={14} className="text-teal-600 shrink-0 mt-0.5" />
          <p>
            Chaque ligne = un dossier crédit classé selon le <strong>retard maximum (J+)</strong> et les règles BCEAO.
            Cliquez une ligne pour voir le motif IA de classification. Les migrations (changement de classe) sont signalées par une flèche.
          </p>
        </div>

        {migrations > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-amber-900">
            <strong>{migrations} migration(s)</strong> détectée(s) ce mois dans le filtre actuel — vérifier provisions associées.
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center">
            <SearchBar value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Réf. prêt, client, agence…" />
            <select value={agence} onChange={e => { setAgence(e.target.value); setPage(1) }} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white cursor-pointer">
              <option value="">Toutes agences</option>
              {agences.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            {classeFilter && onClasseFilter && (
              <button
                type="button"
                onClick={() => onClasseFilter('')}
                className="text-xs text-teal-700 font-medium hover:text-teal-900 cursor-pointer"
              >
                Effacer filtre classe
              </button>
            )}
            <span className="text-xs text-slate-500 ml-auto">
              {filtered.length} dossier(s) · encours {formatFcfa(filtered.reduce((s, c) => s + c.encours_fcfa, 0))}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2.5 w-8" />
                  <th className="px-3 py-2.5 font-bold">Réf. prêt</th>
                  <th className="px-3 py-2.5 font-bold">Client</th>
                  <th className="px-3 py-2.5 font-bold">Agence</th>
                  <th className="px-3 py-2.5 font-bold">Produit</th>
                  <th className="px-3 py-2.5 font-bold text-right">Encours</th>
                  <th className="px-3 py-2.5 font-bold text-center">J+ max</th>
                  <th className="px-3 py-2.5 font-bold">Classe</th>
                  <th className="px-3 py-2.5 font-bold text-right">Provision</th>
                  <th className="px-3 py-2.5 font-bold">Proch. éch.</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(c => {
                  const migrated = c.classe_calculee !== c.classe_precedente
                  return (
                    <Fragment key={c.client_id}>
                      <tr
                        onClick={() => setExpanded(prev => (prev === c.client_id ? null : c.client_id))}
                        className={cn(
                          'border-t border-slate-100 cursor-pointer transition-colors',
                          expanded === c.client_id ? 'bg-teal-50' : 'hover:bg-slate-50',
                          c.classe_calculee === 'CONTENTIEUX' && 'bg-red-50/30',
                          c.classe_calculee === 'COMPROMISES' && 'bg-red-50/20',
                        )}
                      >
                        <td className="px-3 py-2.5 text-slate-400">
                          {expanded === c.client_id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </td>
                        <td className="px-3 py-2.5 font-mono font-bold text-teal-700 text-xs">{c.ref_pret}</td>
                        <td className="px-3 py-2.5 font-medium text-slate-900 max-w-[130px] truncate">{c.client}</td>
                        <td className="px-3 py-2.5 text-xs text-slate-600">{c.agence}</td>
                        <td className="px-3 py-2.5 text-xs text-slate-600 max-w-[100px] truncate">{c.produit}</td>
                        <td className="px-3 py-2.5 text-right font-medium">{formatFcfa(c.encours_fcfa)}</td>
                        <td className={cn('px-3 py-2.5 text-center font-bold text-xs', c.jours_retard_max >= 31 ? 'text-red-600' : c.jours_retard_max > 0 ? 'text-amber-600' : 'text-emerald-600')}>
                          {c.jours_retard_max > 0 ? `J+${c.jours_retard_max}` : '—'}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1 flex-wrap">
                            {migrated && (
                              <>
                                <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded opacity-60', CLASSE_COLOR[c.classe_precedente])}>
                                  {CLASSE_LABEL[c.classe_precedente]}
                                </span>
                                <ArrowRight size={10} className="text-amber-600" />
                              </>
                            )}
                            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap', CLASSE_COLOR[c.classe_calculee])}>
                              {CLASSE_LABEL[c.classe_calculee]}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <div className="text-xs font-bold text-red-700">{formatFcfa(c.provision_fcfa)}</div>
                          <div className="text-[10px] text-slate-500">{c.provision_pct} %</div>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-slate-600 whitespace-nowrap">{c.date_derniere_echeance ?? '—'}</td>
                      </tr>
                      {expanded === c.client_id && (
                        <tr className="bg-teal-50/50 border-t border-teal-100">
                          <td colSpan={10} className="px-4 py-3">
                            <div className="flex items-start gap-3">
                              <AiBadge variant="small" confidence={c.classe_calculee === 'NORMAL' ? 92 : 78} />
                              <div className="text-xs text-slate-700">
                                <span className="font-semibold text-slate-900">Motif IA : </span>
                                {c.migration_ia}
                              </div>
                            </div>
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

  if (tab === 'lbc_ft') {
    const lbc = hub.lbc_ft
    const q = search.toLowerCase().trim()
    const opsFiltered = lbc.operations_suspectes.filter(o => {
      if (!q) return true
      return (
        o.client.toLowerCase().includes(q) ||
        o.agence.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        o.motif_alerte.toLowerCase().includes(q)
      )
    })
    const opsPaginated = opsFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    const enAnalyse = lbc.operations_suspectes.filter(o => o.statut === 'EN_ANALYSE' || o.statut === 'GEL_FONDS').length

    const handleLbcExport = () => {
      const exp = hub.exports.find(e => e.type === 'LBC_FT')
      if (exp && !exportingId) handleExport(exp.id)
    }

    return (
      <div className="space-y-4">
        <div className="flex items-start gap-2 px-1 text-xs text-slate-600">
          <Info size={14} className="text-indigo-600 shrink-0 mt-0.5" />
          <p>
            Pilotage <strong>LBC/FT</strong> — {lbc.referent_reglementaire}. Opérations suspectes détectées par IA ou agents,
            déclarations CENTIF (DS, DA, gel des avoirs) et suivi KYC prioritaire.
          </p>
        </div>

        {enAnalyse > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-900 flex items-center gap-2">
            <strong>{enAnalyse} opération(s) en cours</strong> — dont gel de fonds ou analyse conformité. Action DG requise.
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {[
            { label: 'KYC complet', value: `${lbc.kpis.taux_kyc_pct} %`, warn: lbc.kpis.taux_kyc_pct < 95 },
            { label: 'Ops suspectes (mois)', value: String(lbc.kpis.operations_suspectes_mois) },
            { label: 'DS transmises', value: String(lbc.kpis.ds_transmises) },
            { label: 'Comptes gelés', value: String(lbc.kpis.comptes_geles), warn: lbc.kpis.comptes_geles > 0 },
            { label: 'PPE identifiés', value: String(lbc.kpis.ppe_identifies) },
            { label: 'Agents formés', value: `${lbc.kpis.agents_formes_pct} %` },
          ].map(item => (
            <div key={item.label} className={cn('rounded-xl border p-3 bg-white', item.warn ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200')}>
              <div className="text-[10px] uppercase tracking-wide text-slate-500 font-bold">{item.label}</div>
              <div className={cn('text-lg font-black mt-1', item.warn ? 'text-amber-800' : 'text-slate-900')}>{item.value}</div>
            </div>
          ))}
        </div>

        <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 text-sm text-indigo-900">
          <AiBadge variant="small" label="LBC/FT" pulse />
          <span className="ml-2">{lbc.synthese_ia}</span>
        </div>

        {/* Opérations suspectes */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center">
            <h3 className="text-sm font-semibold text-slate-900">Opérations suspectes — mai 2026</h3>
            <div className="flex-1 min-w-[200px] max-w-md">
              <SearchBar value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Client, agence, motif…" />
            </div>
            <button
              type="button"
              onClick={handleLbcExport}
              className="flex items-center gap-1 text-xs text-indigo-700 font-medium hover:text-indigo-900 cursor-pointer transition-colors ml-auto"
            >
              <Download size={14} />
              Export CENTIF
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2.5 font-bold">Réf.</th>
                  <th className="px-3 py-2.5 font-bold">Date</th>
                  <th className="px-3 py-2.5 font-bold">Client</th>
                  <th className="px-3 py-2.5 font-bold">Agence</th>
                  <th className="px-3 py-2.5 font-bold">Type opération</th>
                  <th className="px-3 py-2.5 font-bold text-right">Montant</th>
                  <th className="px-3 py-2.5 font-bold">Risque</th>
                  <th className="px-3 py-2.5 font-bold">Statut</th>
                </tr>
              </thead>
              <tbody>
                {opsPaginated.map(o => (
                  <Fragment key={o.id}>
                    <tr
                      onClick={() => setExpanded(prev => (prev === o.id ? null : o.id))}
                      className={cn(
                        'border-t border-slate-100 cursor-pointer transition-colors hover:bg-slate-50',
                        o.niveau_risque === 'CRITIQUE' && 'bg-red-50/40',
                        expanded === o.id && 'bg-indigo-50',
                      )}
                    >
                      <td className="px-3 py-2.5 font-mono text-xs font-bold text-indigo-700">{o.id}</td>
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap">{o.date} {o.heure}</td>
                      <td className="px-3 py-2.5 font-medium text-slate-900">{o.client}</td>
                      <td className="px-3 py-2.5 text-xs text-slate-600">{o.agence}</td>
                      <td className="px-3 py-2.5 text-xs text-slate-600 max-w-[140px] truncate">{o.type_operation}</td>
                      <td className="px-3 py-2.5 text-right font-medium">{formatFcfa(o.montant_fcfa)}</td>
                      <td className="px-3 py-2.5">
                        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded', LBC_RISQUE[o.niveau_risque])}>{o.niveau_risque}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap', LBC_STATUT[o.statut])}>
                          {LBC_STATUT_LABEL[o.statut] ?? o.statut}
                        </span>
                      </td>
                    </tr>
                    {expanded === o.id && (
                      <tr className="bg-indigo-50/50 border-t border-indigo-100">
                        <td colSpan={8} className="px-4 py-3 text-xs text-slate-700">
                          <div className="grid md:grid-cols-2 gap-2">
                            <div><span className="font-semibold">Motif : </span>{o.motif_alerte}</div>
                            <div><span className="font-semibold">Détecté par : </span>{o.detecte_par}</div>
                            {o.reference_centif && <div><span className="font-semibold">Réf. CENTIF : </span>{o.reference_centif}</div>}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={opsFiltered.length} onPage={setPage} />
        </div>

        {/* Déclarations CENTIF + Contrôles */}
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Déclarations CENTIF</h3>
              <p className="text-xs text-slate-500 mt-0.5">Prochain rapport : {lbc.kpis.prochain_rapport_centif}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2 font-bold">Type</th>
                    <th className="px-3 py-2 font-bold">Date</th>
                    <th className="px-3 py-2 font-bold">Référence</th>
                    <th className="px-3 py-2 font-bold">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {lbc.declarations_centif.map(d => (
                    <tr key={d.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-3 py-2.5 font-bold text-xs text-indigo-700">{d.type}</td>
                      <td className="px-3 py-2.5 text-xs">{d.date}</td>
                      <td className="px-3 py-2.5 font-mono text-xs">{d.reference}</td>
                      <td className="px-3 py-2.5">
                        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded', CENTIF_STATUT[d.statut])}>{d.statut}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Contrôles LBC/FT</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {lbc.controles.map(c => (
                <div key={c.libelle} className="px-4 py-2.5 flex items-center gap-3 text-xs">
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded shrink-0', STATUT_BCEAO[c.statut])}>{c.statut}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900">{c.libelle}</div>
                    <div className="text-slate-500">{c.valeur}{c.seuil ? ` · seuil ${c.seuil}` : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* KYC prioritaires + par agence */}
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Dossiers KYC prioritaires ({lbc.kpis.dossiers_incomplets})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2 font-bold">Client</th>
                    <th className="px-3 py-2 font-bold">Agence</th>
                    <th className="px-3 py-2 font-bold">Niveau</th>
                    <th className="px-3 py-2 font-bold text-right">Bloqué</th>
                    <th className="px-3 py-2 font-bold">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {lbc.dossiers_kyc_prioritaires.map(d => (
                    <tr key={d.client_id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-3 py-2.5">
                        <div className="font-medium text-slate-900">{d.client}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[160px]">{d.motif}</div>
                      </td>
                      <td className="px-3 py-2.5 text-xs">{d.agence}</td>
                      <td className="px-3 py-2.5 text-xs font-medium">{d.niveau}</td>
                      <td className="px-3 py-2.5 text-right text-xs font-medium text-red-700">
                        {d.montant_bloque_fcfa ? formatFcfa(d.montant_bloque_fcfa) : '—'}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded', KYC_STATUT[d.statut])}>{d.statut.replace('_', ' ')}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">LBC/FT par agence</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2 font-bold">Agence</th>
                    <th className="px-3 py-2 font-bold text-center">KYC %</th>
                    <th className="px-3 py-2 font-bold text-center">Incomplets</th>
                    <th className="px-3 py-2 font-bold text-center">Alertes</th>
                    <th className="px-3 py-2 font-bold text-center">DS mois</th>
                  </tr>
                </thead>
                <tbody>
                  {lbc.par_agence.map(a => (
                    <tr key={a.agence_id} className={cn('border-t border-slate-100 hover:bg-slate-50', a.kyc_complet_pct < 95 && 'bg-amber-50/30')}>
                      <td className="px-3 py-2.5 font-semibold">{a.agence}</td>
                      <td className={cn('px-3 py-2.5 text-center font-bold', a.kyc_complet_pct < 95 ? 'text-amber-700' : 'text-emerald-700')}>{a.kyc_complet_pct} %</td>
                      <td className="px-3 py-2.5 text-center">{a.dossiers_incomplets}</td>
                      <td className="px-3 py-2.5 text-center">{a.alertes_ouvertes}</td>
                      <td className="px-3 py-2.5 text-center">{a.ds_mois}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (tab === 'provisions') {
    const totalEncours = hub.provisions_agences.reduce((s, a) => s + a.encours_fcfa, 0)
    const totalProv = hub.provisions_agences.reduce((s, a) => s + a.provision_totale_fcfa, 0)

    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2 px-1 text-xs text-slate-600">
          <Info size={14} className="text-teal-600 shrink-0 mt-0.5" />
          <p>
            Provisions agrégées par agence — calculées à partir des classifications individuelles.
            Le <strong>taux de provision</strong> = provisions / encours. Bè Kpota dépasse le seuil d&apos;alerte (PAR &gt; 10 %).
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2.5 font-bold">Agence</th>
                  <th className="px-4 py-2.5 font-bold text-right">Encours</th>
                  <th className="px-4 py-2.5 font-bold text-right">Provisions</th>
                  <th className="px-4 py-2.5 font-bold text-center">Taux prov.</th>
                  <th className="px-4 py-2.5 font-bold text-center">PAR 30</th>
                  <th className="px-4 py-2.5 font-bold text-center">Dossiers à risque</th>
                  <th className="px-4 py-2.5 font-bold">Statut BCEAO</th>
                </tr>
              </thead>
              <tbody>
                {hub.provisions_agences.map(a => (
                  <tr key={a.agence_id} className={cn('border-t border-slate-100 hover:bg-slate-50', a.statut_bceao === 'NON_CONFORME' && 'bg-red-50/30')}>
                    <td className="px-4 py-3 font-semibold text-slate-900">{a.agence}</td>
                    <td className="px-4 py-3 text-right">{formatFcfa(a.encours_fcfa)}</td>
                    <td className="px-4 py-3 text-right font-bold text-red-700">{formatFcfa(a.provision_totale_fcfa)}</td>
                    <td className="px-4 py-3 text-center font-medium">{a.taux_provision_pct} %</td>
                    <td className={cn('px-4 py-3 text-center font-bold', a.par_30_pct > 10 ? 'text-red-600' : a.par_30_pct > 8 ? 'text-amber-600' : 'text-emerald-600')}>
                      {a.par_30_pct} %
                    </td>
                    <td className="px-4 py-3 text-center">{a.dossiers_a_risque}</td>
                    <td className="px-4 py-3">
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded', STATUT_BCEAO[a.statut_bceao])}>
                        {a.statut_bceao.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold">
                  <td className="px-4 py-3 text-slate-900">Réseau (5 agences)</td>
                  <td className="px-4 py-3 text-right">{formatFcfa(totalEncours)}</td>
                  <td className="px-4 py-3 text-right text-red-700">{formatFcfa(totalProv)}</td>
                  <td className="px-4 py-3 text-center">{totalEncours > 0 ? ((totalProv / totalEncours) * 100).toFixed(1) : 0} %</td>
                  <td className="px-4 py-3 text-center">{hub.kpis.par_30_pct} %</td>
                  <td className="px-4 py-3 text-center">{hub.classifications.filter(c => c.classe_calculee !== 'NORMAL').length}</td>
                  <td className="px-4 py-3" />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  const q = search.toLowerCase().trim()
  const filtered = hub.exports.filter(e => {
    if (!q) return true
    return e.type.toLowerCase().includes(q) || e.periode.toLowerCase().includes(q)
  })
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 px-1 text-xs text-slate-600">
        <Info size={14} className="text-teal-600 shrink-0 mt-0.5" />
        <p>
          Exports réglementaires générés ou planifiés. Le rapport <strong>BCEAO mensuel</strong> doit être transmis avant le 5 du mois suivant.
          Clic sur <strong>Export PDF</strong> → rapport réglementaire mis en page (format PDF, prêt pour transmission BCEAO).
        </p>
      </div>

      {hub.kpis.exports_en_attente > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-amber-900">
          <strong>{hub.kpis.exports_en_attente} export(s) à générer</strong> — échéance juin : 02/07/2026
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <SearchBar value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Type, période…" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2.5 font-bold">Type</th>
                <th className="px-4 py-2.5 font-bold">Période</th>
                <th className="px-4 py-2.5 font-bold">Description</th>
                <th className="px-4 py-2.5 font-bold">Généré le</th>
                <th className="px-4 py-2.5 font-bold">Échéance</th>
                <th className="px-4 py-2.5 font-bold">Statut</th>
                <th className="px-4 py-2.5 font-bold text-center">IA</th>
                <th className="px-4 py-2.5 font-bold" />
              </tr>
            </thead>
            <tbody>
              {paginated.map(e => (
                <tr key={e.id} className={cn('border-t border-slate-100 hover:bg-slate-50', e.statut === 'GENERE' && 'bg-amber-50/40')}>
                  <td className="px-4 py-3 font-medium text-slate-900">{EXPORT_TYPE_LABEL[e.type] ?? e.type}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{e.periode}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-[220px]">{e.description}</td>
                  <td className="px-4 py-3 text-xs">{e.date_generation}</td>
                  <td className="px-4 py-3 text-xs font-medium">{e.date_echeance}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded',
                      e.statut === 'VALIDE' ? 'bg-emerald-100 text-emerald-800' : e.statut === 'ENVOYE' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800',
                    )}>
                      {e.statut === 'VALIDE' ? 'Validé' : e.statut === 'ENVOYE' ? 'Envoyé' : 'À générer'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {e.conformite_ia_pct > 0 ? <AiBadge variant="small" confidence={e.conformite_ia_pct} /> : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {exportingId === e.id ? (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Loader2 size={14} className="animate-spin" />
                        Génération PDF…
                      </span>
                    ) : exportedId === e.id ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-700 font-medium">
                        <Check size={14} />
                        Téléchargé
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleExport(e.id)}
                        className="flex items-center gap-1 text-xs text-teal-700 font-medium hover:text-teal-900 cursor-pointer transition-colors"
                        title="Télécharger le rapport PDF BCEAO"
                      >
                        <Download size={14} />
                        Export PDF
                      </button>
                    )}
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

/** Bandeau répartition classes — cliquable pour filtrer le tableau */
export function ConformiteRepartitionBar({
  hub,
  activeClasse,
  onSelect,
}: {
  hub: ConformiteHub
  activeClasse: ClasseBceao | ''
  onSelect: (c: ClasseBceao | '') => void
}) {
  const total = hub.kpis.total_dossiers

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
      {hub.repartition_classes.map(r => {
        const pct = total > 0 ? ((r.count / total) * 100).toFixed(1) : '0'
        const active = activeClasse === r.classe
        return (
          <button
            key={r.classe}
            type="button"
            onClick={() => onSelect(active ? '' : r.classe)}
            className={cn(
              'text-left p-3 rounded-xl border transition-colors duration-200 cursor-pointer',
              active ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-500/20' : 'border-slate-200 bg-white hover:border-teal-300 hover:bg-slate-50',
            )}
          >
            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded', CLASSE_COLOR[r.classe])}>
              {CLASSE_LABEL[r.classe]}
            </span>
            <div className="text-xl font-black text-slate-900 mt-2">{r.count}</div>
            <div className="text-[10px] text-slate-500">{pct} % du portefeuille</div>
            <div className="text-xs text-slate-600 mt-1">{formatFcfa(r.encours_fcfa)}</div>
            <div className="text-[10px] text-red-600 font-medium mt-0.5">Prov. {formatFcfa(r.provision_fcfa)}</div>
          </button>
        )
      })}
    </div>
  )
}

export { CLASSE_COLOR, CLASSE_LABEL }
