'use client'

import { useMemo, useState } from 'react'
import {
  Warehouse, Truck, Package, Search, ChevronDown, ChevronRight,
  Sparkles, AlertTriangle, GitBranch, Calendar, Filter,
} from 'lucide-react'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { formatFcfa } from '@/lib/utils'
import {
  buildPilotageEntrepotDG, filterSorties, getDatesSorties,
  type SortieEntrepot, type StatutSortie, type NiveauStockSortie,
} from '@/lib/sorties-entrepot-builder'

const STATUT_STYLE: Record<StatutSortie, string> = {
  LIVRE: 'bg-emerald-100 text-emerald-700',
  EN_ROUTE: 'bg-sky-100 text-sky-700',
  PREPARATION: 'bg-amber-100 text-amber-800',
  RETARD: 'bg-red-100 text-red-700',
}

const STATUT_LABEL: Record<StatutSortie, string> = {
  LIVRE: 'Livré',
  EN_ROUTE: 'En route',
  PREPARATION: 'Préparation',
  RETARD: 'Retard',
}

const NIVEAU_STYLE: Record<NiveauStockSortie, string> = {
  OK: 'text-emerald-600',
  ALERTE: 'text-orange-600',
  RUPTURE: 'text-red-600 font-bold',
}

const ANALYSE_STYLE = {
  CRITIQUE: 'border-red-200 bg-red-50',
  HAUTE: 'border-orange-200 bg-orange-50',
  MODEREE: 'border-sky-200 bg-sky-50',
}

function SortieRow({ sortie, expanded, onToggle }: {
  sortie: SortieEntrepot
  expanded: boolean
  onToggle: () => void
}) {
  const ruptures = sortie.lignes.filter(l => l.niveau === 'RUPTURE').length
  const alertes = sortie.lignes.filter(l => l.niveau === 'ALERTE').length

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50 transition-colors"
      >
        {expanded ? <ChevronDown size={14} className="text-slate-400 shrink-0" /> : <ChevronRight size={14} className="text-slate-400 shrink-0" />}
        <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-6 gap-2 text-[10px]">
          <div>
            <div className="text-slate-400">Date / BL</div>
            <div className="font-bold text-slate-800">{sortie.date}</div>
            <div className="font-mono text-slate-500">{sortie.bl_reference}</div>
          </div>
          <div className="col-span-2">
            <div className="text-slate-400">Destination</div>
            <div className="font-semibold text-slate-800 truncate">{sortie.destination_nom}</div>
            <div className="text-slate-500">
              {sortie.zone} · {sortie.type_magasin === 'PROPRE' ? 'Enseigne' : 'Partenaire'}
              {sortie.distance_km !== undefined && <> · {sortie.distance_km} km</>}
            </div>
          </div>
          <div>
            <div className="text-slate-400">Produits</div>
            <div className="font-bold">{sortie.nb_lignes} SKU · {sortie.unites_total} u.</div>
            {(ruptures > 0 || alertes > 0) && (
              <div className="text-red-600 font-semibold">
                {ruptures > 0 && `${ruptures} rupture`}
                {ruptures > 0 && alertes > 0 && ' · '}
                {alertes > 0 && `${alertes} alerte`}
              </div>
            )}
          </div>
          <div>
            <div className="text-slate-400">Valeur</div>
            <div className="font-bold text-slate-800">{formatFcfa(sortie.valeur_fcfa)}</div>
          </div>
          <div className="flex flex-col items-start gap-1">
            <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ${STATUT_STYLE[sortie.statut]}`}>
              {STATUT_LABEL[sortie.statut]}
            </span>
            {sortie.chauffeur && <span className="text-[9px] text-slate-400">{sortie.heure} · {sortie.chauffeur}</span>}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 border-t border-slate-100 bg-slate-50/50">
          <div className="text-[9px] text-slate-400 mb-2 pt-2">
            Commande {sortie.commande_reference} · Entrepôt {sortie.entrepot_nom} · {sortie.type_client}
          </div>
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-[10px]">
              <thead className="bg-white text-slate-500">
                <tr>
                  <th className="text-left px-2 py-1.5 font-semibold">Produit</th>
                  <th className="text-right px-2 py-1.5 font-semibold">Qté sortie</th>
                  <th className="text-right px-2 py-1.5 font-semibold">Stock avant</th>
                  <th className="text-right px-2 py-1.5 font-semibold">Stock après</th>
                  <th className="text-right px-2 py-1.5 font-semibold">Seuil</th>
                  <th className="text-right px-2 py-1.5 font-semibold">Niveau</th>
                </tr>
              </thead>
              <tbody>
                {sortie.lignes.map(l => (
                  <tr key={l.reference} className="border-t border-slate-100 bg-white">
                    <td className="px-2 py-1.5">
                      <div className="font-medium text-slate-700 truncate max-w-[180px]">{l.nom}</div>
                      <div className="text-slate-400 font-mono">{l.reference}</div>
                    </td>
                    <td className="px-2 py-1.5 text-right font-bold">{l.quantite} {l.unite}</td>
                    <td className="px-2 py-1.5 text-right">{l.stock_avant.toLocaleString('fr-FR')}</td>
                    <td className="px-2 py-1.5 text-right font-semibold">{l.stock_apres.toLocaleString('fr-FR')}</td>
                    <td className="px-2 py-1.5 text-right text-slate-400">{l.seuil}</td>
                    <td className={`px-2 py-1.5 text-right uppercase text-[9px] font-bold ${NIVEAU_STYLE[l.niveau]}`}>
                      {l.niveau}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

interface Props {
  compact?: boolean
}

export function EntrepotSortiesHistoriquePanel({ compact = false }: Props) {
  const pilotage = useMemo(() => buildPilotageEntrepotDG(), [])
  const dates = useMemo(() => getDatesSorties(pilotage.sorties), [pilotage.sorties])

  const [entrepotId, setEntrepotId] = useState<string>('tous')
  const [dateFiltre, setDateFiltre] = useState<string>('2026-06-11')
  const [statut, setStatut] = useState<StatutSortie | 'tous'>('tous')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [section, setSection] = useState<'historique' | 'flux' | 'ia'>('historique')

  const sortiesFiltrees = useMemo(
    () => filterSorties(pilotage.sorties, { entrepotId, date: dateFiltre, statut, search }),
    [pilotage.sorties, entrepotId, dateFiltre, statut, search],
  )

  const fluxActif = entrepotId !== 'tous'
    ? pilotage.flux.find(f => f.entrepot_id === entrepotId)
    : pilotage.flux[0]

  const analysesFiltrees = entrepotId !== 'tous'
    ? pilotage.analyses.filter(a => a.entrepot_ids.includes(entrepotId))
    : pilotage.analyses

  const suggestionsFiltrees = entrepotId === 'ent-kara'
    ? pilotage.suggestions.filter(s => s.zone_ids.some(z => ['zn-kara', 'zn-centrale'].includes(z)))
    : entrepotId === 'ent-lome-port'
      ? pilotage.suggestions.filter(s => s.zone_ids.some(z => z.startsWith('zn-lome')))
      : pilotage.suggestions

  return (
    <div className={compact ? '' : 'bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden'}>
      {!compact && (
        <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Warehouse size={15} className="text-amber-600" />
            <h3 className="text-sm font-semibold text-slate-900">Entrepôts — sorties, flux & analyses IA</h3>
            <AiBadge variant="small" label="Logistique IA" confidence={86} />
          </div>
          <div className="text-[10px] text-slate-500">
            {pilotage.sorties.length} sorties enregistrées · {pilotage.flux.reduce((s, f) => s + f.sorties_semaine, 0)} cette semaine
          </div>
        </div>
      )}

      <div className={`flex flex-wrap gap-1 ${compact ? 'mb-3' : 'px-4 pt-3'}`}>
        {([
          { id: 'historique' as const, label: 'Historique sorties', Icon: Package },
          { id: 'flux' as const, label: 'Flux entrepôt', Icon: GitBranch },
          { id: 'ia' as const, label: 'Suggestions IA', Icon: Sparkles },
        ]).map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSection(id)}
            className={`text-[10px] px-3 py-1.5 rounded-lg font-semibold inline-flex items-center gap-1.5 transition-colors ${
              section === id ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            <Icon size={11} /> {label}
          </button>
        ))}
      </div>

      <div className={`flex flex-wrap items-center gap-2 ${compact ? 'mb-3' : 'px-4 pb-3 border-b border-slate-100'}`}>
        <Filter size={11} className="text-slate-400" />
        <select
          value={entrepotId}
          onChange={e => setEntrepotId(e.target.value)}
          className="text-[10px] border border-slate-200 rounded-lg px-2 py-1 bg-white font-medium"
        >
          <option value="tous">Tous entrepôts</option>
          <option value="ent-lome-port">Lomé Port</option>
          <option value="ent-kara">Kara</option>
        </select>
        <select
          value={dateFiltre}
          onChange={e => setDateFiltre(e.target.value)}
          className="text-[10px] border border-slate-200 rounded-lg px-2 py-1 bg-white font-medium"
        >
          <option value="tous">Toutes dates</option>
          {dates.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        {section === 'historique' && (
          <>
            <select
              value={statut}
              onChange={e => setStatut(e.target.value as StatutSortie | 'tous')}
              className="text-[10px] border border-slate-200 rounded-lg px-2 py-1 bg-white font-medium"
            >
              <option value="tous">Tous statuts</option>
              <option value="LIVRE">Livré</option>
              <option value="EN_ROUTE">En route</option>
              <option value="PREPARATION">Préparation</option>
            </select>
            <div className="relative flex-1 min-w-[140px] max-w-xs">
              <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Client, BL, zone…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full text-[10px] pl-7 pr-2 py-1 border border-slate-200 rounded-lg bg-white"
              />
            </div>
          </>
        )}
      </div>

      <div className={compact ? '' : 'p-4'}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {(entrepotId === 'tous' ? pilotage.flux : pilotage.flux.filter(f => f.entrepot_id === entrepotId)).map(f => (
            <div key={f.entrepot_id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700 mb-1">
                <Warehouse size={11} className="text-amber-600" /> {f.entrepot_nom}
              </div>
              <div className="grid grid-cols-2 gap-1 text-[9px]">
                <div><span className="text-slate-400">Sorties jour</span><div className="font-bold">{f.sorties_jour}</div></div>
                <div><span className="text-slate-400">Semaine</span><div className="font-bold">{f.sorties_semaine}</div></div>
                <div><span className="text-slate-400">Valeur jour</span><div className="font-bold">{formatFcfa(f.valeur_jour_fcfa)}</div></div>
                <div><span className="text-slate-400">Taux service</span><div className="font-bold text-emerald-600">{f.taux_service_pct}%</div></div>
              </div>
              <div className="mt-1 text-[9px] text-slate-500">
                {f.bl_enseigne} enseigne · {f.bl_partenaires} partenaires · {f.destinations_uniques} dest.
              </div>
            </div>
          ))}
        </div>

        {section === 'historique' && (
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
              <span className="flex items-center gap-1"><Calendar size={10} /> {sortiesFiltrees.length} sortie(s)</span>
              <span>Cliquez une ligne pour voir les niveaux produits</span>
            </div>
            {sortiesFiltrees.slice(0, 50).map(s => (
              <SortieRow
                key={s.id}
                sortie={s}
                expanded={expandedId === s.id}
                onToggle={() => setExpandedId(prev => prev === s.id ? null : s.id)}
              />
            ))}
            {sortiesFiltrees.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400">Aucune sortie pour ces filtres.</div>
            )}
            {sortiesFiltrees.length > 50 && (
              <div className="text-center text-[10px] text-slate-400 py-2">
                {sortiesFiltrees.length - 50} sorties supplémentaires — affinez les filtres
              </div>
            )}
          </div>
        )}

        {section === 'flux' && (
          <div className="space-y-4">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
              <Truck size={11} /> Points de livraison par entrepôt
            </div>
            {(entrepotId === 'tous' ? pilotage.flux : pilotage.flux.filter(f => f.entrepot_id === entrepotId)).map(f => {
              const points = pilotage.sorties
                .filter(s => s.entrepot_id === f.entrepot_id && (dateFiltre === 'tous' || s.date === dateFiltre))
                .reduce((acc, s) => {
                  const existing = acc.get(s.destination_id)
                  if (existing) {
                    existing.bl += 1
                    existing.valeur += s.valeur_fcfa
                    existing.unites += s.unites_total
                  } else {
                    acc.set(s.destination_id, {
                      nom: s.destination_nom,
                      zone: s.zone,
                      type: s.type_magasin,
                      bl: 1,
                      valeur: s.valeur_fcfa,
                      unites: s.unites_total,
                      distance: s.distance_km,
                    })
                  }
                  return acc
                }, new Map<string, { nom: string; zone: string; type: string; bl: number; valeur: number; unites: number; distance?: number }>())

              const sorted = [...points.values()].sort((a, b) => b.valeur - a.valeur).slice(0, 15)

              return (
                <div key={f.entrepot_id} className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-3 py-2 bg-amber-50 border-b border-amber-100 text-xs font-bold text-amber-900">
                    {f.entrepot_nom} — {sorted.length} destinations · {formatFcfa(f.valeur_jour_fcfa)} expédiés
                  </div>
                  <table className="w-full text-[10px]">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="text-left px-2 py-1.5">Destination</th>
                        <th className="text-left px-2 py-1.5">Zone</th>
                        <th className="text-right px-2 py-1.5">BL</th>
                        <th className="text-right px-2 py-1.5">Unités</th>
                        <th className="text-right px-2 py-1.5">CA</th>
                        <th className="text-right px-2 py-1.5">Dist.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((p, i) => (
                        <tr key={i} className="border-t border-slate-100">
                          <td className="px-2 py-1.5 font-medium text-slate-700">
                            <span className={`inline-block w-2 h-2 rounded-full mr-1 ${p.type === 'PROPRE' ? 'bg-violet-600' : 'bg-emerald-500'}`} />
                            {p.nom}
                          </td>
                          <td className="px-2 py-1.5 text-slate-500">{p.zone}</td>
                          <td className="px-2 py-1.5 text-right font-bold">{p.bl}</td>
                          <td className="px-2 py-1.5 text-right">{p.unites}</td>
                          <td className="px-2 py-1.5 text-right font-bold">{formatFcfa(p.valeur)}</td>
                          <td className="px-2 py-1.5 text-right text-slate-500">{p.distance !== undefined ? `${p.distance} km` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            })}
            {fluxActif && (
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-[10px] text-indigo-900">
                <strong>Ratio flux :</strong> {fluxActif.bl_partenaires} BL partenaires vs {fluxActif.bl_enseigne} BL enseigne aujourd&apos;hui
                · {fluxActif.unites_jour.toLocaleString('fr-FR')} unités sorties · {fluxActif.destinations_uniques} clients distincts
              </div>
            )}
          </div>
        )}

        {section === 'ia' && (
          <div className="space-y-3">
            <div className="grid md:grid-cols-2 gap-2">
              {analysesFiltrees.map((a, i) => (
                <div key={i} className={`p-3 rounded-xl border text-xs ${ANALYSE_STYLE[a.severite]}`}>
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5 opacity-70" />
                    <div>
                      <div className="font-bold mb-0.5">{a.titre}</div>
                      <div className="text-[10px] opacity-90 mb-1.5">{a.detail}</div>
                      <div className="text-[10px] font-semibold text-slate-700">→ {a.action}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {suggestionsFiltrees.length > 0 && (
              <>
                <div className="text-[10px] font-bold text-teal-700 uppercase tracking-wide mt-2">
                  Implantation & optimisation réseau
                </div>
                <div className="grid md:grid-cols-2 gap-2">
                  {suggestionsFiltrees.map(s => (
                    <div key={s.id} className={`p-3 rounded-xl border text-xs ${ANALYSE_STYLE[s.severite]}`}>
                      <div className="font-bold mb-0.5">{s.titre}</div>
                      <div className="text-[10px] opacity-90 mb-1">{s.detail}</div>
                      <div className="text-[10px] font-semibold text-slate-700">→ {s.action}</div>
                      <div className="text-[9px] text-slate-400 mt-1">
                        {s.points_count} point(s) · {formatFcfa(s.ca_couvert_fcfa)} CA couvert
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
