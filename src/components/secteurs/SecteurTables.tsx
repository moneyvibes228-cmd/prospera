'use client'

import { Fragment, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ExternalLink, Info, ArrowRight } from 'lucide-react'
import type { SecteurHub } from '@/lib/secteur-hub'
import { getClientRisqueById } from '@/lib/dec-vue360'
import { formatFcfa, cn } from '@/lib/utils'

const PAGE_SIZE = 20

type Tab = 'agences' | 'sous_secteurs' | 'dossiers'

interface Props {
  hub: SecteurHub
  tab: Tab
}

function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative flex-1 min-w-[200px] max-w-lg">
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

export function SecteurTables({ hub, tab }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState<string | null>(null)

  if (tab === 'agences') {
    const q = search.toLowerCase().trim()
    const filtered = hub.agences_exposition.filter(a => !q || a.agence.toLowerCase().includes(q))

    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2 px-1 text-xs text-slate-600">
          <Info size={14} className="text-teal-600 shrink-0 mt-0.5" />
          <p>Exposition {hub.nom} par agence — corrélation avec PAR agence et concentration locale.</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <SearchBar value={search} onChange={setSearch} placeholder="Agence…" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2.5 font-bold">Agence</th>
                  <th className="px-3 py-2.5 font-bold text-right">Dossiers</th>
                  <th className="px-3 py-2.5 font-bold text-right">Encours</th>
                  <th className="px-3 py-2.5 font-bold text-center">PAR</th>
                  <th className="px-4 py-2.5 font-bold text-right">Part secteur</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.agence_id} className={cn('border-t border-slate-100 hover:bg-slate-50', a.par > 10 && 'bg-red-50/30')}>
                    <td className="px-4 py-3 font-bold">{a.agence}</td>
                    <td className="px-3 py-3 text-right">{a.dossiers}</td>
                    <td className="px-3 py-3 text-right font-medium">{formatFcfa(a.encours)}</td>
                    <td className={cn('px-3 py-3 text-center font-bold', a.par > 10 ? 'text-red-600' : a.par > 8 ? 'text-orange-600' : 'text-emerald-600')}>{a.par} %</td>
                    <td className="px-4 py-3 text-right">{a.pct_encours} %</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  if (tab === 'sous_secteurs') {
    const q = search.toLowerCase().trim()
    const filtered = hub.sous_secteurs_detail.filter(ss => !q || ss.nom.toLowerCase().includes(q))

    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2 px-1 text-xs text-slate-600">
          <Info size={14} className="text-teal-600 shrink-0 mt-0.5" />
          <p>Granularité sectorielle — cliquez une ligne pour ouvrir la fiche sous-secteur détaillée.</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <SearchBar value={search} onChange={setSearch} placeholder="Sous-secteur…" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500">
                  <th className="px-2 py-2.5 w-8" />
                  <th className="px-2 py-2.5 font-bold">Sous-secteur</th>
                  <th className="px-2 py-2.5 font-bold text-center">Dossiers</th>
                  <th className="px-2 py-2.5 font-bold text-right">Encours</th>
                  <th className="px-2 py-2.5 font-bold text-center">PAR</th>
                  <th className="px-2 py-2.5 font-bold text-center">Part secteur</th>
                  <th className="px-2 py-2.5 font-bold text-right">Ticket moy.</th>
                  <th className="px-2 py-2.5 w-8" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(ss => (
                  <Fragment key={ss.slug}>
                    <tr
                      onClick={() => setExpanded(prev => (prev === ss.slug ? null : ss.slug))}
                      className={cn(
                        'border-t border-slate-100 cursor-pointer transition-colors',
                        expanded === ss.slug ? 'bg-teal-50' : 'hover:bg-slate-50',
                        ss.par > 10 && 'bg-red-50/30',
                      )}
                    >
                      <td className="px-2 py-2.5 text-slate-400">
                        {expanded === ss.slug ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </td>
                      <td className="px-2 py-2.5 font-bold text-slate-900">{ss.nom}</td>
                      <td className="px-2 py-2.5 text-center">{ss.count}</td>
                      <td className="px-2 py-2.5 text-right font-medium">{formatFcfa(ss.encours)}</td>
                      <td className={cn('px-2 py-2.5 text-center font-bold', ss.par > 10 ? 'text-red-600' : ss.par > 8 ? 'text-orange-600' : 'text-emerald-600')}>{ss.par} %</td>
                      <td className="px-2 py-2.5 text-center">{ss.part_secteur_pct} %</td>
                      <td className="px-2 py-2.5 text-right text-xs">{formatFcfa(ss.ticket_moyen)}</td>
                      <td className="px-2 py-2.5">
                        <Link href={`/dashboard/secteurs/${hub.slug}/${ss.slug}`} onClick={e => e.stopPropagation()} className="text-teal-600 hover:text-teal-800">
                          <ExternalLink size={14} />
                        </Link>
                      </td>
                    </tr>
                    {expanded === ss.slug && (
                      <tr className="bg-teal-50/60 border-t border-teal-100">
                        <td colSpan={8} className="px-4 py-3 text-xs text-slate-700">
                          <strong>IA :</strong> {ss.ia_analyse}
                          {ss.risques.length > 0 && <span className="text-red-700"> · Risques : {ss.risques.join(', ')}</span>}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  const q = search.toLowerCase().trim()
  const filtered = hub.dossiers_risque.filter(d => {
    if (!q) return true
    return d.client.toLowerCase().includes(q) || d.agence.toLowerCase().includes(q) || d.sous_secteur.toLowerCase().includes(q)
  })
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 px-1 text-xs text-slate-600">
        <Info size={14} className="text-red-600 shrink-0 mt-0.5" />
        <p>Dossiers à risque dans le secteur {hub.nom} — cliquez une ligne pour l&apos;aperçu ou ouvrir la fiche client complète.</p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <SearchBar value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Client, agence, sous-secteur…" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500">
                <th className="px-2 py-2.5 w-8" />
                <th className="px-4 py-2.5 font-bold">Client</th>
                <th className="px-3 py-2.5 font-bold">Sous-secteur</th>
                <th className="px-3 py-2.5 font-bold">Agence · Agent</th>
                <th className="px-3 py-2.5 font-bold text-right">Montant</th>
                <th className="px-3 py-2.5 font-bold text-center">Retard</th>
                <th className="px-4 py-2.5 font-bold">Action</th>
                <th className="px-2 py-2.5 w-8" />
              </tr>
            </thead>
            <tbody>
              {paginated.map(d => {
                const fiche = getClientRisqueById(d.id)
                return (
                  <Fragment key={d.id}>
                    <tr
                      onClick={() => setExpanded(prev => (prev === d.id ? null : d.id))}
                      className={cn(
                        'border-t border-slate-100 cursor-pointer transition-colors hover:bg-slate-50',
                        expanded === d.id && 'bg-teal-50/50',
                        d.jours_retard >= 60 && 'bg-red-50/30',
                      )}
                    >
                      <td className="px-2 py-3 text-slate-400">
                        {expanded === d.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{d.client}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{d.id}</div>
                      </td>
                      <td className="px-3 py-3 text-xs">{d.sous_secteur}</td>
                      <td className="px-3 py-3 text-xs">
                        <div>{d.agence}</div>
                        <div className="text-slate-500">{d.agent}</div>
                      </td>
                      <td className="px-3 py-3 text-right font-bold">{formatFcfa(d.montant)}</td>
                      <td className="px-3 py-3 text-center font-bold text-red-600">J+{d.jours_retard}</td>
                      <td className="px-4 py-3 text-xs text-slate-700">{d.action}</td>
                      <td className="px-2 py-3">
                        <Link
                          href={`/dashboard/credit/clients/${d.id}`}
                          onClick={e => e.stopPropagation()}
                          className="text-teal-600 hover:text-teal-800"
                          title="Fiche client complète"
                        >
                          <ExternalLink size={14} />
                        </Link>
                      </td>
                    </tr>
                    {expanded === d.id && (
                      <tr className="bg-teal-50/60 border-t border-teal-100">
                        <td colSpan={8} className="px-4 py-4">
                          {fiche ? (
                            <div className="grid md:grid-cols-2 gap-4 text-xs">
                              <div className="space-y-2">
                                <div className="flex flex-wrap gap-2">
                                  <span className="font-bold text-slate-900">Score IA {fiche.score_ia}/100</span>
                                  <span className="text-red-700 font-bold">PD {fiche.pd_pct} %</span>
                                  <span className="text-slate-600">EL {formatFcfa(fiche.el)}</span>
                                  <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">{fiche.classe_bceao}</span>
                                </div>
                                <p className="text-slate-700"><strong>Activité :</strong> {fiche.activite}</p>
                                <p className="text-slate-700"><strong>Contact :</strong> {fiche.telephone} · {fiche.dernier_contact}</p>
                                <p className="text-slate-600 leading-relaxed">{fiche.analyse_dec}</p>
                              </div>
                              <div className="space-y-2">
                                <p className="font-bold text-slate-800">Crédits ({fiche.credits.length})</p>
                                {fiche.credits.slice(0, 2).map(c => (
                                  <div key={c.reference} className="flex justify-between bg-white/80 rounded-lg px-3 py-2 border border-slate-200">
                                    <span>{c.reference}</span>
                                    <span className="font-bold">{formatFcfa(c.encours)} · {c.statut.replace('_', ' ')}</span>
                                  </div>
                                ))}
                                {fiche.alertes_ia[0] && (
                                  <p className="text-red-700"><strong>Alerte :</strong> {fiche.alertes_ia[0].message}</p>
                                )}
                                <button
                                  type="button"
                                  onClick={() => router.push(`/dashboard/credit/clients/${d.id}`)}
                                  className="inline-flex items-center gap-1.5 mt-2 px-3 py-2 bg-teal-600 text-white text-xs font-bold rounded-lg hover:bg-teal-700 cursor-pointer transition-colors"
                                >
                                  Voir fiche complète <ArrowRight size={14} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-slate-600">Fiche détaillée non disponible pour {d.id}.</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50 text-xs">
            <span>{filtered.length} dossiers</span>
            <div className="flex items-center gap-1">
              <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="p-1.5 rounded-md border border-slate-200 bg-white disabled:opacity-40 cursor-pointer"><ChevronLeft size={14} /></button>
              <span className="px-2">{page}/{pages}</span>
              <button type="button" disabled={page >= pages} onClick={() => setPage(page + 1)} className="p-1.5 rounded-md border border-slate-200 bg-white disabled:opacity-40 cursor-pointer"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
