'use client'

import { useState, useMemo } from 'react'
import {
  FileText, AlertTriangle, Sparkles, Filter, BarChart3,
  Building2, Store, Users, TrendingDown, Clock, Tag,
} from 'lucide-react'
import { PageHeader } from '@distributeur/components/shared/PageHeader'
import { AiBadge } from '@distributeur/components/dashboard/AiBadge'
import { getFacturationHub } from '@distributeur/lib/mock-distribution'
import { useHubContext } from '@distributeur/lib/use-hub-context'
import { formatFcfa } from '@distributeur/lib/utils'
import { ENTREPRISE_REGISTRY } from '@distributeur/lib/registries/entreprise-registry'
import {
  buildFacturesDG, buildSyntheseFacturationDG, buildTopImpayeurs,
  buildRecouvrementParCommercial, buildAnalysesFacturationIA,
  filterFacturesVue, getGrillePrixEntreprise,
  STATUT_FACTURE_STYLE, STATUT_LABEL, RISQUE_STYLE,
  type FactureDG, type VueFacturationDG,
} from '@distributeur/lib/facturation-dg-builder'

const VUE_OPTIONS: { id: VueFacturationDG; label: string }[] = [
  { id: 'consolide', label: 'Vue globale' },
  { id: 'impayees', label: 'Créances ouvertes' },
  { id: 'retard', label: 'En retard' },
  { id: 'emises', label: 'Émises (échéance future)' },
  { id: 'payees', label: 'Payées' },
  { id: 'partenaires', label: 'Partenaires B2B' },
  { id: 'enseigne', label: 'Enseigne Atlas Shop' },
]

const ANALYSE_STYLE = {
  CRITIQUE: 'border-red-200 bg-red-50',
  HAUTE: 'border-orange-200 bg-orange-50',
  MODEREE: 'border-sky-200 bg-sky-50',
}

function FactureRow({ f, selected, onClick }: { f: FactureDG; selected: boolean; onClick: () => void }) {
  const risque = RISQUE_STYLE[f.niveau_risque]
  return (
    <button type="button" onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-slate-100 transition-colors hover:bg-slate-50 ${selected ? 'bg-amber-50 border-l-4 border-l-amber-400' : ''}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[11px] text-slate-500 w-28 shrink-0">{f.numero}</span>
        <span className="font-semibold text-sm text-slate-900 flex-1 min-w-[140px]">{f.pdv_nom}</span>
        <span className="text-[10px] text-slate-400 hidden md:inline">{f.zone} · {f.commercial !== '—' ? f.commercial : 'enseigne'}</span>
        <span className="font-bold text-sm text-slate-900 w-24 text-right">{formatFcfa(f.montant)}</span>
        <span className="text-emerald-600 text-xs w-20 text-right">{formatFcfa(f.paye)}</span>
        <span className={`font-bold text-xs w-20 text-right ${f.reste_a_payer > 0 ? 'text-red-600' : 'text-slate-400'}`}>
          {f.reste_a_payer > 0 ? formatFcfa(f.reste_a_payer) : '—'}
        </span>
        <span className="w-12 text-center text-xs">
          {f.jours_retard > 0 ? <span className="text-red-600 font-bold">{f.jours_retard}j</span> : '—'}
        </span>
        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${STATUT_FACTURE_STYLE[f.statut]}`}>
          {STATUT_LABEL[f.statut]}
        </span>
        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold hidden lg:inline ${risque.className}`}>
          {risque.label}
        </span>
      </div>
    </button>
  )
}

export function FacturationView() {
  const ctx = useHubContext()
  const { factures: raw } = getFacturationHub(ctx)

  const [vue, setVue] = useState<VueFacturationDG>('consolide')
  const [statutFiltre, setStatutFiltre] = useState('tous')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const all = useMemo(() => buildFacturesDG(raw), [raw])
  const synthese = useMemo(() => buildSyntheseFacturationDG(all), [all])
  const impayeurs = useMemo(() => buildTopImpayeurs(all), [all])
  const commerciaux = useMemo(() => buildRecouvrementParCommercial(all), [all])
  const analyses = useMemo(() => buildAnalysesFacturationIA(all, impayeurs), [all, impayeurs])
  const grillePrix = useMemo(() => getGrillePrixEntreprise(), [])

  const filtered = useMemo(() => {
    let list = filterFacturesVue(all, vue)
    if (statutFiltre !== 'tous') list = list.filter(f => f.statut === statutFiltre)
    return list.sort((a, b) => {
      const prio = (s: string) => ({ EN_RETARD: 0, PARTIELLE: 1, EMISE: 2, PAYEE: 3, BROUILLON: 4 }[s] ?? 5)
      return prio(a.statut) - prio(b.statut) || b.jours_retard - a.jours_retard
    })
  }, [all, vue, statutFiltre])

  const selected = all.find(f => f.id === selectedId) ?? null

  return (
    <div className="p-6 max-w-7xl space-y-5">
      <PageHeader
        title="Pilotage facturation & créances"
        subtitle="Vue DG — 18 factures · grille tarifaire · impayés · recouvrement · plafonds crédit · analyses IA"
        badge={`${synthese.total_factures} factures`}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'CA facturé', value: formatFcfa(synthese.ca_facture_mois), color: 'text-slate-900' },
          { label: 'Encaissé', value: formatFcfa(synthese.ca_encaisse_mois), color: 'text-emerald-600' },
          { label: 'Créances ouvertes', value: formatFcfa(synthese.creances_ouvertes), color: 'text-amber-700' },
          { label: 'Impayés en retard', value: formatFcfa(synthese.impayes_retard), color: 'text-red-600' },
          { label: 'Taux recouvrement', value: `${synthese.taux_recouvrement_pct}%`, color: 'text-emerald-600' },
          { label: 'Délai encaissement', value: `${synthese.delai_moyen_encaissement_j}j`, color: 'text-slate-800' },
          { label: 'Factures en retard', value: String(synthese.factures_retard), color: 'text-red-600' },
          { label: 'Clients à risque', value: String(synthese.clients_a_risque), color: 'text-orange-600' },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
            <div className="text-[10px] text-slate-400 font-medium">{k.label}</div>
            <div className={`text-sm font-black mt-0.5 ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Top impayeurs + commerciaux */}
      <div className="grid md:grid-cols-2 gap-3">
        <div className="bg-red-50 rounded-xl border border-red-200 p-4">
          <div className="text-[10px] font-bold text-red-800 uppercase mb-3 flex items-center gap-1">
            <TrendingDown size={12} /> Top clients impayés
          </div>
          {impayeurs.slice(0, 5).map((c, i) => (
            <div key={c.pdv_id} className="flex justify-between items-center text-xs py-2 border-b border-red-100 last:border-0">
              <div>
                <span className="font-bold">{i + 1}. {c.pdv_nom}</span>
                <span className="text-[10px] text-red-600/70 ml-2">{c.nb_factures_impayees} fact. · {c.plus_ancien_retard_j}j max</span>
                {c.depassement_plafond && (
                  <span className="ml-1 text-[8px] px-1 py-0.5 rounded bg-red-200 text-red-800 font-bold">PLAFOND DÉPASSÉ</span>
                )}
              </div>
              <span className="font-black text-red-700">{formatFcfa(c.creance_totale)}</span>
            </div>
          ))}
        </div>

        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
          <div className="text-[10px] font-bold text-slate-600 uppercase mb-3 flex items-center gap-1">
            <Users size={12} /> Recouvrement par commercial
          </div>
          {commerciaux.map(c => (
            <div key={c.commercial} className="flex justify-between items-center text-xs py-2 border-b border-slate-100 last:border-0">
              <div>
                <span className="font-bold">{c.commercial}</span>
                <span className="text-[10px] text-slate-400 ml-2">{c.factures_emises} fact. · {c.clients_a_risque} à risque</span>
              </div>
              <div className="text-right">
                <div className={`font-bold ${c.impayes > 3_000_000 ? 'text-red-600' : 'text-slate-700'}`}>
                  {formatFcfa(c.impayes)} impayés
                </div>
                <div className="text-[10px] text-emerald-600">{c.taux_recouvrement_pct}% recouvré</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          {/* Filtres */}
          <div className="flex flex-wrap items-center gap-2">
            <BarChart3 size={12} className="text-slate-400" />
            {VUE_OPTIONS.map(v => (
              <button key={v.id} type="button" onClick={() => setVue(v.id)}
                className={`text-[10px] px-3 py-1.5 rounded-lg font-semibold ${vue === v.id ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                {v.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Filter size={11} className="text-slate-400" />
            {(['tous', 'EN_RETARD', 'PARTIELLE', 'EMISE', 'PAYEE'] as const).map(s => (
              <button key={s} type="button" onClick={() => setStatutFiltre(s)}
                className={`text-[9px] px-2 py-1 rounded-full font-bold ${statutFiltre === s ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-50 text-slate-400'}`}>
                {s === 'tous' ? 'Tous statuts' : STATUT_LABEL[s]}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="hidden md:flex px-4 py-2 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase">
              <span className="w-28">N° facture</span>
              <span className="flex-1">Client</span>
              <span className="w-24 text-right">Montant</span>
              <span className="w-20 text-right">Payé</span>
              <span className="w-20 text-right">Reste</span>
              <span className="w-12 text-center">Retard</span>
              <span className="w-20 text-center">Statut</span>
            </div>
            <div className="max-h-[420px] overflow-y-auto">
              {filtered.map(f => (
                <FactureRow
                  key={f.id}
                  f={f}
                  selected={selectedId === f.id}
                  onClick={() => setSelectedId(prev => prev === f.id ? null : f.id)}
                />
              ))}
            </div>
            <div className="px-4 py-2 bg-slate-50 text-[10px] text-slate-500">
              {filtered.length} facture{filtered.length > 1 ? 's' : ''} — cliquez pour le détail lignes & analyse
            </div>
          </div>

          {/* Grille prix entreprise */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Tag size={14} className="text-amber-600" />
              <h3 className="text-sm font-bold text-slate-800">Grille tarifaire {ENTREPRISE_REGISTRY.nom} — prix par type client</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-slate-500 border-b">
                  <tr>
                    <th className="text-left py-2 pr-3">Type client</th>
                    <th className="text-center py-2 px-2">Remise</th>
                    <th className="text-left py-2 px-2">Délai paiement</th>
                    <th className="text-left py-2 px-2">Plafond crédit</th>
                    <th className="text-left py-2 px-2">Exemple produit</th>
                    <th className="text-right py-2 px-2">Prix public</th>
                    <th className="text-right py-2 pl-2">Prix client</th>
                  </tr>
                </thead>
                <tbody>
                  {grillePrix.map(g => (
                    <tr key={g.type_client} className="border-b border-slate-50">
                      <td className="py-2 pr-3 font-semibold">{g.type_client}</td>
                      <td className="py-2 px-2 text-center text-emerald-600 font-bold">-{g.remise_base_pct}%</td>
                      <td className="py-2 px-2 text-slate-600">{g.delai_paiement.replace('_', ' ')}</td>
                      <td className="py-2 px-2 text-slate-600">{g.plafond_type}</td>
                      <td className="py-2 px-2">{g.exemple_produit}</td>
                      <td className="py-2 px-2 text-right text-slate-400">{formatFcfa(g.prix_public)}</td>
                      <td className="py-2 pl-2 text-right font-bold text-amber-700">{formatFcfa(g.prix_client)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Analyses IA */}
        <div className="space-y-3">
          <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl border border-indigo-200 p-4 sticky top-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={15} className="text-indigo-600" />
              <h3 className="text-sm font-bold text-indigo-900">Analyses IA créances</h3>
            </div>
            <div className="space-y-2">
              {analyses.map((a, i) => (
                <div key={i} className={`p-2.5 rounded-lg border text-xs ${ANALYSE_STYLE[a.severite]}`}>
                  <div className="font-bold">{a.titre}</div>
                  <div className="text-[10px] opacity-90 mt-0.5">{a.detail}</div>
                  <div className="text-[10px] font-semibold mt-1 text-slate-700">→ {a.action}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fiche facture détaillée */}
      {selected && (
        <div className="bg-white rounded-xl border-2 border-amber-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="w-14 h-14 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <FileText size={24} className="text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-black text-slate-900">{selected.numero}</h3>
              <p className="text-sm text-slate-500 flex items-center gap-1.5">
                {selected.type_magasin === 'PROPRE'
                  ? <Building2 size={13} className="text-violet-500" />
                  : <Store size={13} className="text-amber-500" />}
                {selected.pdv_nom} · {selected.zone} · {selected.type_client}
                {selected.commercial !== '—' && <> · {selected.commercial}</>}
              </p>
              {selected.synthese_ia && (
                <p className="text-sm text-slate-700 mt-2 leading-relaxed">{selected.synthese_ia}</p>
              )}
            </div>
            <AiBadge variant="small" label="Score risque" confidence={selected.score_risque_ia ?? 70} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 text-xs">
            {[
              { label: 'Montant TTC', value: formatFcfa(selected.montant) },
              { label: 'Payé', value: formatFcfa(selected.paye), color: 'text-emerald-600' },
              { label: 'Reste à payer', value: formatFcfa(selected.reste_a_payer), color: selected.reste_a_payer > 0 ? 'text-red-600' : undefined },
              { label: 'Marge facture', value: `${selected.marge_facture_pct ?? 15}%` },
              { label: 'Émission', value: selected.date_emission ?? '—' },
              { label: 'Échéance', value: selected.echeance },
              { label: 'Mode paiement', value: selected.mode_paiement?.replace(/_/g, ' ') ?? '—' },
              { label: 'Plafond crédit', value: selected.plafond_credit ? formatFcfa(selected.plafond_credit) : 'Interne' },
            ].map((k, i) => (
              <div key={i} className="bg-slate-50 rounded-lg p-2.5">
                <div className="text-slate-400">{k.label}</div>
                <div className={`font-bold ${k.color ?? ''}`}>{k.value}</div>
              </div>
            ))}
          </div>

          {selected.commande_ref && (
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Clock size={11} /> Liée à la commande <span className="font-mono font-bold">{selected.commande_ref}</span>
              {selected.entrepot && <> · expédiée depuis {selected.entrepot}</>}
              {selected.dernier_paiement && <> · dernier paiement {selected.dernier_paiement}</>}
              {selected.nb_relances ? <> · {selected.nb_relances} relance{selected.nb_relances > 1 ? 's' : ''}</> : null}
            </p>
          )}

          {/* Lignes facture */}
          {selected.lignes && selected.lignes.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">Détail lignes — prix appliqués</div>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="text-left p-2.5">Réf.</th>
                      <th className="text-left p-2.5">Produit</th>
                      <th className="text-right p-2.5">Qté</th>
                      <th className="text-right p-2.5">P.U.</th>
                      <th className="text-right p-2.5">Remise</th>
                      <th className="text-right p-2.5">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.lignes.map((l, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="p-2.5 font-mono text-[10px] text-slate-400">{l.reference}</td>
                        <td className="p-2.5 font-medium">{l.produit}</td>
                        <td className="p-2.5 text-right">{l.quantite}</td>
                        <td className="p-2.5 text-right">{formatFcfa(l.prix_unitaire)}</td>
                        <td className="p-2.5 text-right text-emerald-600">{l.remise_pct > 0 ? `-${l.remise_pct}%` : '—'}</td>
                        <td className="p-2.5 text-right font-bold">{formatFcfa(l.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold">
                    <tr>
                      <td colSpan={5} className="p-2.5 text-right">Total facture</td>
                      <td className="p-2.5 text-right text-amber-700">{formatFcfa(selected.montant)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {selected.reste_a_payer > 0 && (
            <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${selected.niveau_risque === 'CRITIQUE' ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-amber-50 border border-amber-200 text-amber-800'}`}>
              <AlertTriangle size={14} />
              <span>
                Créance ouverte {formatFcfa(selected.reste_a_payer)}
                {selected.jours_retard > 0 && <> — {selected.jours_retard} jours de retard</>}
                {selected.plafond_credit && selected.reste_a_payer > selected.plafond_credit * 0.8 && <> — proche ou au-delà du plafond crédit</>}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
