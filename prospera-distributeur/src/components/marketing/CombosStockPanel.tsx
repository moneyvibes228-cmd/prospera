'use client'

import {
  TrendingDown, TrendingUp, Zap, AlertTriangle, Sparkles,
  Send, Megaphone, CheckCircle2, Clock, ShieldCheck,
} from 'lucide-react'
import { formatFcfa, formatFcfaFull } from '@/lib/utils'
import { needsDgValidation, REMISE_SEUIL_DG } from '@/lib/combo-stock-workflow'
import { useComboStockWorkflow } from '@/contexts/ComboStockWorkflowContext'
import type { ComboStockIA, AnalyseEcoulementStock } from '@/lib/marketing-combo-stock-builder'

const SEVERITE_STYLE = {
  CRITIQUE: 'border-red-200 bg-red-50',
  HAUTE: 'border-orange-200 bg-orange-50',
  MODEREE: 'border-sky-200 bg-sky-50',
}

const TYPE_LABEL = {
  COMBO_MOTEUR: 'Combo moteur + lent',
  PROMO_CHOC: 'Promo choc conditionnelle',
  BUNDLE_ADOPTION: 'Bundle adoption',
}

const STATUT_BADGE = {
  EN_ATTENTE_DG: { label: 'En attente validation DG', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  VALIDEE: { label: 'Validé — file marketing', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  AUTO_DISPONIBLE: { label: 'Auto — prêt marketing', className: 'bg-sky-100 text-sky-800 border-sky-200' },
  CAMPAGNE_CREEE: { label: 'Campagne créée', className: 'bg-violet-100 text-violet-800 border-violet-200' },
}

interface Props {
  mode: 'dg' | 'operateur'
  analyse?: AnalyseEcoulementStock
  combos: ComboStockIA[]
  expandedId: string | null
  onToggle: (id: string) => void
  onCampagneCreated?: (campagneId: string) => void
}

function WorkflowActions({
  mode,
  combo,
  onCampagneCreated,
}: {
  mode: 'dg' | 'operateur'
  combo: ComboStockIA
  onCampagneCreated?: (campagneId: string) => void
}) {
  const { getStatut, validerEtTransmettre, creerCampagne, getEntry } = useComboStockWorkflow()
  const statut = getStatut(combo)
  const entry = getEntry(combo.id)
  const requiresDg = needsDgValidation(combo)

  if (mode === 'dg') {
    if (statut === 'CAMPAGNE_CREEE') {
      return (
        <div className="flex items-center gap-2 text-[10px] text-violet-700">
          <CheckCircle2 size={12} />
          Campagne créée par le marketing · {entry?.campagneId}
        </div>
      )
    }
    if (statut === 'VALIDEE') {
      return (
        <div className="flex items-center gap-2 text-[10px] text-emerald-700">
          <CheckCircle2 size={12} />
          Transmis au marketing — en attente de création campagne
        </div>
      )
    }
    if (requiresDg) {
      return (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); validerEtTransmettre(combo) }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-[10px] font-bold hover:bg-violet-700 transition-colors"
        >
          <ShieldCheck size={12} />
          Valider & transmettre au marketing
        </button>
      )
    }
    return (
      <button
        type="button"
        onClick={e => { e.stopPropagation(); validerEtTransmettre(combo) }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 text-white text-[10px] font-bold hover:bg-sky-700 transition-colors"
      >
        <Send size={12} />
        Transmettre au marketing (seuil auto &lt; {REMISE_SEUIL_DG}%)
      </button>
    )
  }

  if (statut === 'CAMPAGNE_CREEE') {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-[10px] text-violet-700 font-semibold">
          <CheckCircle2 size={12} /> Campagne planifiée
        </span>
        {entry?.campagneId && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onCampagneCreated?.(entry.campagneId!) }}
            className="text-[10px] text-violet-600 underline font-semibold"
          >
            Voir la campagne
          </button>
        )}
      </div>
    )
  }
  if (statut === 'EN_ATTENTE_DG') {
    return (
      <div className="flex items-center gap-2 text-[10px] text-amber-700">
        <Clock size={12} />
        Validation DG requise (remise ≥ {REMISE_SEUIL_DG}% ou promo choc)
      </div>
    )
  }
  return (
    <button
      type="button"
      onClick={e => {
        e.stopPropagation()
        const camp = creerCampagne(combo)
        if (camp) onCampagneCreated?.(camp.id)
      }}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700 transition-colors"
    >
      <Megaphone size={12} />
      Créer la campagne
    </button>
  )
}

export function CombosStockPanel({
  mode, analyse, combos, expandedId, onToggle, onCampagneCreated,
}: Props) {
  const { getStatut, lastAction, clearLastAction } = useComboStockWorkflow()

  if (combos.length === 0 && mode === 'operateur') {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
        Aucun combo en file d&apos;attente. Les combos validés par le DG ou auto-transmis apparaîtront ici.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {lastAction && (
        <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={14} /> {lastAction.message}
          </span>
          <button type="button" onClick={clearLastAction} className="text-[10px] underline shrink-0">Fermer</button>
        </div>
      )}

      {analyse && mode === 'dg' && (
        <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 rounded-xl border border-violet-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={15} className="text-violet-600" />
            <h3 className="text-sm font-bold text-violet-900">IA écoulement stock — combos & promos ciblées</h3>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">{analyse.synthese}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-[10px]">
            <div className="bg-white/80 rounded-lg p-2 border border-violet-100">
              <div className="text-slate-400">SKU lents</div>
              <div className="font-black text-red-600">{analyse.sku_lents}</div>
            </div>
            <div className="bg-white/80 rounded-lg p-2 border border-violet-100">
              <div className="text-slate-400">SKU moteurs</div>
              <div className="font-black text-emerald-600">{analyse.sku_moteurs}</div>
            </div>
            <div className="bg-white/80 rounded-lg p-2 border border-violet-100">
              <div className="text-slate-400">Stock immobilisé</div>
              <div className="font-black">{formatFcfa(analyse.valeur_immobilisee_lente_fcfa)}</div>
            </div>
            <div className="bg-white/80 rounded-lg p-2 border border-violet-100">
              <div className="text-slate-400">Coût/mois (lent)</div>
              <div className="font-black text-orange-700">{formatFcfa(analyse.cout_stock_lent_total_mois_fcfa)}</div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {combos.map(c => {
          const statut = getStatut(c)
          const badge = STATUT_BADGE[statut]
          return (
            <div key={c.id} className={`rounded-xl border-2 overflow-hidden bg-white ${c.severite === 'CRITIQUE' ? 'border-red-300' : 'border-slate-200'}`}>
              <button type="button" onClick={() => onToggle(c.id)} className="w-full text-left p-4 hover:bg-slate-50/50">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-800 font-black text-[10px] flex items-center justify-center shrink-0">
                      {c.priorite}
                    </span>
                    <div>
                      <div className="font-bold text-sm text-slate-900">{c.nom}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {TYPE_LABEL[c.type]} · {c.zone} · {c.contacts_cibles} contacts
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase ${SEVERITE_STYLE[c.severite]} border`}>
                      {c.severite}
                    </span>
                    <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold border ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-emerald-800 font-semibold mt-2">{c.offre}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-[10px]">
                  {c.metriques.map(m => (
                    <div key={m.label}>
                      <div className="text-slate-400">{m.label}</div>
                      <div className="font-bold">{m.value}</div>
                    </div>
                  ))}
                </div>
              </button>

              <div className="px-4 pb-3 border-t border-slate-100 bg-white">
                <div className="pt-3">
                  <WorkflowActions mode={mode} combo={c} onCampagneCreated={onCampagneCreated} />
                </div>
              </div>

              {expandedId === c.id && (
                <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50/40 space-y-3">
                  <p className="text-xs text-slate-700 leading-relaxed pt-3">{c.explication}</p>

                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[10px]">
                      <div className="flex items-center gap-1 font-bold text-red-800 mb-2">
                        <TrendingDown size={12} /> Produit lent — à écouler
                      </div>
                      <div className="font-semibold text-slate-800">{c.lent.nom}</div>
                      <div className="text-slate-500 font-mono">{c.lent.reference}</div>
                      <div className="grid grid-cols-2 gap-1 mt-2">
                        <div>Stock : <strong>{c.lent.stock}</strong> (seuil {c.lent.seuil})</div>
                        <div>Rotation : <strong className="text-red-600">{c.lent.rotation_jours}j</strong></div>
                        <div>Couverture : <strong>{c.lent.couverture_jours}j</strong></div>
                        <div>Demande : <strong>{c.lent.evolution_demande_pct > 0 ? '+' : ''}{c.lent.evolution_demande_pct}%</strong></div>
                        <div>Prix : <strong title={formatFcfaFull(c.lent.prix_fcfa)}>{formatFcfa(c.lent.prix_fcfa)}</strong></div>
                        <div>Promo : <strong className="text-emerald-700">{formatFcfa(c.prix_lent_promo_fcfa)} (-{c.remise_lent_pct}%)</strong></div>
                      </div>
                      <div className="mt-2 text-red-700 font-semibold flex items-center gap-1">
                        <AlertTriangle size={10} />
                        Coût stock lent : {formatFcfa(c.lent.cout_stock_lent_mois_fcfa)}/mois
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-[10px]">
                      <div className="flex items-center gap-1 font-bold text-emerald-800 mb-2">
                        <TrendingUp size={12} /> Produit(s) moteur — facilite l&apos;adoption
                      </div>
                      {c.moteurs.map(m => (
                        <div key={m.reference} className="mb-2 last:mb-0 pb-2 last:pb-0 border-b last:border-0 border-emerald-100">
                          <div className="font-semibold text-slate-800">{m.nom}</div>
                          <div className="text-slate-500">
                            {formatFcfa(m.prix_fcfa)} · rotation {m.rotation_jours}j · {m.sorties_mois.toLocaleString('fr-FR')} sorties/mois · {m.engouement}
                          </div>
                        </div>
                      ))}
                      <div className="mt-2 text-slate-600">
                        Panier combo estimé : <strong>{formatFcfa(c.prix_combo_estime_fcfa)}</strong> · marge ~{c.marge_combo_pct}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2 bg-violet-50 border border-violet-100 rounded-lg text-[10px] text-violet-900">
                    <Zap size={12} className="shrink-0 mt-0.5" />
                    <span>
                      <strong>Logique IA :</strong> pas de promo choc isolée sur le lent (marge effondrée) — remise {c.remise_lent_pct}% uniquement si le panier inclut le moteur.
                      Objectif : libérer {c.stock_a_liberer_unites.toLocaleString('fr-FR')} u. · éviter {formatFcfa(c.cout_evite_mois_fcfa)}/mois de coût stock.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
