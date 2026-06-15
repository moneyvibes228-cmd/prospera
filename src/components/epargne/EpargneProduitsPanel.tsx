'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PiggyBank, ChevronDown, ChevronUp, ChevronRight, Layers, Users } from 'lucide-react'
import type { EpargneHub } from '@/lib/epargne-hub'
import { formatFcfa, cn } from '@/lib/utils'

const TYPE_COLOR: Record<string, string> = {
  VUE: 'border-teal-200 bg-teal-50 text-teal-800',
  DAT: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  TONTINE: 'border-orange-200 bg-orange-50 text-orange-800',
  BLOQUE: 'border-purple-200 bg-purple-50 text-purple-800',
}

interface Props {
  hub: EpargneHub
}

export function EpargneProduitsPanel({ hub }: Props) {
  const [expanded, setExpanded] = useState<string | null>(hub.produits[0]?.id ?? null)
  const encoursTotal = hub.kpis.encours_total_fcfa

  return (
    <div className="space-y-6">
      {/* Synthèse */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Catalogue épargne — 4 produits contractuels</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {hub.kpis.comptes_actifs} comptes · {formatFcfa(encoursTotal)} encours total réseau
          </p>
        </div>
        <Link
          href="/produits"
          className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900 px-3 py-1.5 bg-white border border-teal-200 rounded-lg"
        >
          Fiche produits complète <ChevronRight size={12} />
        </Link>
      </div>

      {/* 4 produits — lignes claires */}
      <div className="space-y-3">
        {hub.produits.map(p => {
          const pct = encoursTotal > 0 ? Math.round((p.encours_fcfa / encoursTotal) * 1000) / 10 : 0
          const pctComptes = Math.round((p.clients_actifs / hub.kpis.comptes_actifs) * 1000) / 10
          const isOpen = expanded === p.id

          return (
            <div key={p.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setExpanded(prev => (prev === p.id ? null : p.id))}
                className="w-full text-left p-4 hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex flex-wrap items-start gap-4">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border', TYPE_COLOR[p.type])}>
                    <PiggyBank size={18} />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900">{p.nom}</span>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {p.clients_actifs} comptes · {pctComptes} % du parc
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{p.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-4 text-right shrink-0">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Encours</div>
                      <div className="font-black text-teal-700">{formatFcfa(p.encours_fcfa)}</div>
                      <div className="text-[10px] text-slate-500">{pct} % réseau</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Rémunération</div>
                      <div className="font-bold text-slate-800">{p.taux_label}</div>
                    </div>
                    <div className="flex items-center text-slate-400 self-center">
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>
                </div>
                <div className="mt-3 ml-14">
                  <div className="bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-teal-500 transition-all"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-0 ml-14 border-t border-slate-100">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 text-sm">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase mb-0.5">Profil cible</div>
                      <div className="text-slate-700 text-xs leading-relaxed">{p.profil_cible}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase mb-0.5">Durée</div>
                      <div className="font-semibold text-slate-800">{p.duree}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase mb-0.5">Dépôt minimum</div>
                      <div className="font-semibold text-slate-800">{formatFcfa(p.depot_min_fcfa)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase mb-0.5">Croissance 30j</div>
                      <div className={cn('font-bold', p.croissance_pct >= 8 ? 'text-green-600' : 'text-orange-600')}>
                        +{p.croissance_pct} %
                      </div>
                    </div>
                  </div>
                  {p.variantes && p.variantes.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="text-[10px] text-slate-400 uppercase mb-1.5">Variantes incluses dans ce produit</div>
                      <div className="flex flex-wrap gap-2">
                        {p.variantes.map(v => (
                          <span key={v} className="text-xs bg-blue-50 text-blue-800 border border-blue-100 px-2 py-0.5 rounded-full">
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Profils clients — dimension distincte */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <Users size={15} className="text-slate-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">Segmentation clients épargne</h3>
            <p className="text-[11px] text-slate-500">
              Profil marketing — distinct du type de contrat ci-dessus · totalise 287 comptes
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2.5 font-bold">Profil client</th>
                <th className="px-4 py-2.5 font-bold">Description</th>
                <th className="px-4 py-2.5 font-bold text-right">Comptes</th>
                <th className="px-4 py-2.5 font-bold text-right">Encours</th>
                <th className="px-4 py-2.5 font-bold text-right">Part encours</th>
              </tr>
            </thead>
            <tbody>
              {hub.profils_clients.map(profil => (
                <tr key={profil.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: profil.color }} />
                      <span className="font-semibold text-slate-900">{profil.label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 max-w-xs">{profil.description}</td>
                  <td className="px-4 py-3 text-right font-bold">{profil.comptes}</td>
                  <td className="px-4 py-3 text-right font-bold text-teal-700">{formatFcfa(profil.encours_fcfa)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${profil.pct_encours}%`, backgroundColor: profil.color }} />
                      </div>
                      <span className="font-bold text-slate-700 w-10">{profil.pct_encours} %</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-sm">
                <td className="px-4 py-3 text-slate-900" colSpan={2}>
                  <span className="inline-flex items-center gap-1.5">
                    <Layers size={14} className="text-slate-500" />
                    Total réseau
                  </span>
                </td>
                <td className="px-4 py-3 text-right">{hub.kpis.comptes_actifs}</td>
                <td className="px-4 py-3 text-right text-teal-700">{formatFcfa(encoursTotal)}</td>
                <td className="px-4 py-3 text-right">100 %</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
