'use client'

import Link from 'next/link'
import {
  TrendingDown, Target, Sparkles, AlertTriangle,
  Calendar, ArrowRight, CheckCircle2, BarChart3, CalendarClock,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { WorkflowToast } from '@/components/shared/WorkflowToast'
import { useDecisionsWorkflow } from '@/contexts/DecisionsWorkflowContext'
import { formatFcfa } from '@/lib/utils'
import {
  buildSyntheseComptabiliteDG,
  getPrevisionsTresorerie,
  getCreancesComptables,
  getCompteResultat,
  getDecisionsComptaDG,
} from '@/lib/comptabilite-dg-builder'
import { buildEcheancierFournisseurs } from '@/lib/reappro-engine'
import { DETTE_FOURNISSEURS_TOTALE, DETTE_FOURNISSEURS_ECHUE } from '@/lib/registries/fournisseurs-registry'

const ANALYSE_STYLE = {
  CRITIQUE: 'border-red-200 bg-red-50',
  HAUTE: 'border-orange-200 bg-orange-50',
  MODEREE: 'border-sky-200 bg-sky-50',
}

/** Points d'attention reformulés pour le DG — sans jargon comptable. */
const ATTENTIONS_DG = [
  { severite: 'CRITIQUE' as const, titre: 'Provision client Kiosque Port', detail: '1,42 M FCFA à valider — impact sur le résultat de juin.', action: 'Valider ou demander un audit au DAF' },
  { severite: 'HAUTE' as const, titre: 'Pic de décaissement J+5', detail: 'Réappro huile et riz — sortie prévue de 28,6 M.', action: 'Prioriser les paiements · reporter les dépenses non urgentes' },
  { severite: 'MODEREE' as const, titre: 'Marge sous l\'objectif', detail: '23 % brut vs 25 % visé — pression sur les achats et commissions.', action: 'Revoir remises dépôts avec le DC' },
]

export function ComptabiliteDGView() {
  const { getChoix, decider, lastAction, clearLastAction } = useDecisionsWorkflow()
  const synthese = buildSyntheseComptabiliteDG()
  const previsions = getPrevisionsTresorerie()
  const creances = getCreancesComptables()
  const resultat = getCompteResultat()
  const decisions = getDecisionsComptaDG()

  const topCreances = [...creances]
    .filter(c => c.reste > 0)
    .sort((a, b) => b.reste - a.reste)
    .slice(0, 4)

  const kpisResultat = resultat.filter(l =>
    ['PRODUITS', 'MARGE', 'RESULTAT'].includes(l.section),
  )

  const picSortie = previsions.find(p => p.alerte)

  const echeancier = buildEcheancierFournisseurs()
  /** Ce qui sort réellement sous 30 jours : l'échu est dû immédiatement. */
  const sortieJ30 = echeancier
    .filter(t => t.tranche !== 'AU_DELA')
    .reduce((s, t) => s + t.montant, 0)

  return (
    <div className="p-6 max-w-6xl space-y-5">
      <PageHeader
        title="Pilotage financier"
        subtitle="Vue DG — trésorerie · rentabilité · créances · décisions à trancher"
        badge={`Clôture dans ${synthese.jours_cloture} j`}
      />

      {/* KPIs stratégiques */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Trésorerie disponible', value: formatFcfa(synthese.tresorerie_totale), color: 'text-emerald-700', sub: 'Banque + caisses' },
          { label: 'Créances à risque', value: formatFcfa(synthese.creances_retard_30j), color: 'text-red-600', sub: `${synthese.pct_creances_retard} % du poste client` },
          { label: 'Dette fournisseurs', value: formatFcfa(DETTE_FOURNISSEURS_TOTALE), color: 'text-red-600', sub: `dont ${formatFcfa(DETTE_FOURNISSEURS_ECHUE)} échus` },
          { label: 'Marge brute', value: `${synthese.marge_brute_pct} %`, color: synthese.marge_brute_pct < 25 ? 'text-orange-600' : 'text-emerald-600', sub: 'Objectif 25 %' },
          { label: 'Résultat net (mois)', value: formatFcfa(synthese.resultat_net_mois), color: 'text-slate-900', sub: 'Estimation juin' },
          { label: 'Encours clients', value: formatFcfa(synthese.encours_clients), color: 'text-amber-700', sub: 'Total factures ouvertes' },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm">
            <div className="text-[10px] text-slate-400 font-medium">{k.label}</div>
            <div className={`text-base font-black mt-0.5 ${k.color}`}>{k.value}</div>
            <div className="text-[9px] text-slate-400 mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Synthèse + alertes */}
      <div className="grid md:grid-cols-2 gap-3">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={15} className="text-amber-400" />
            <span className="text-sm font-bold">Synthèse IA — pilotage financier</span>
          </div>
          <p className="text-sm leading-relaxed text-slate-200">
            Trésorerie <strong className="text-white">{formatFcfa(synthese.tresorerie_totale)}</strong> confortable aujourd&apos;hui.
            {picSortie && (
              <> Attention au <strong className="text-amber-300">{picSortie.date}</strong> : sorties importantes liées au réappro stock.</>
            )}
            {' '}Créances en retard : <strong className="text-red-300">{formatFcfa(synthese.creances_retard_30j)}</strong> ({synthese.pct_creances_retard} %).
            Marge brute <strong className={synthese.marge_brute_pct < 25 ? 'text-orange-300' : 'text-emerald-300'}>{synthese.marge_brute_pct} %</strong>.
            Une décision de provision client attend votre validation.
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={15} className="text-amber-600" />
            <span className="text-sm font-bold text-slate-800">Points d&apos;attention</span>
          </div>
          <div className="space-y-2">
            {ATTENTIONS_DG.map((a, i) => (
              <div key={i} className={`text-xs p-2.5 rounded-lg border ${ANALYSE_STYLE[a.severite]}`}>
                <div className="font-bold">{a.titre}</div>
                <div className="text-[10px] opacity-90 mt-0.5">{a.detail}</div>
                <div className="text-[10px] font-semibold mt-1 text-slate-700">→ {a.action}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Décisions DG */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target size={14} className="text-amber-600" />
          <h3 className="text-sm font-bold text-slate-800">Décisions à trancher</h3>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {decisions.map(d => {
            const refId = `decision-dg-${d.priorite}`
            const titre = d.titre.replace(/OD PROV-411|601 · /g, '')
            const choix = getChoix('DECISION_DG', refId)
            return (
            <div key={d.priorite} className="border border-slate-100 rounded-xl p-3.5 text-xs hover:border-amber-200 transition-colors">
              <div className="flex items-start gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-black text-[10px] flex items-center justify-center shrink-0">
                  {d.priorite}
                </span>
                <div>
                  <div className="font-bold text-slate-800 leading-snug">{titre}</div>
                  <div className="text-slate-500 mt-1">{d.impact}</div>
                </div>
              </div>
              <div className="text-amber-800 font-semibold pl-8">→ {d.decision.replace(/OD PROV-411|écriture /gi, '').replace(/audit achats 601/g, 'audit des achats')}</div>
              {d.priorite === 1 && (
                <div className="flex gap-2 mt-3 pl-8">
                  <button type="button"
                    onClick={() => decider('DECISION_DG', refId, 'VALIDE', {
                      label: `Validé — ${titre}`,
                      detail: d.impact,
                      message: 'Décision validée et journalisée.',
                    })}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
                      choix === 'VALIDE' ? 'bg-emerald-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-emerald-50'
                    }`}>
                    {choix === 'VALIDE' ? 'Validé ✓' : 'Valider'}
                  </button>
                  <button type="button"
                    onClick={() => decider('DECISION_DG', refId, 'REPORTE', {
                      label: `Reporté — ${titre}`,
                      detail: d.impact,
                      message: 'Décision reportée et journalisée.',
                    })}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
                      choix === 'REPORTE' ? 'bg-slate-700 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}>
                    {choix === 'REPORTE' ? 'Reporté' : 'Reporter'}
                  </button>
                </div>
              )}
            </div>
            )
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Prévision trésorerie simplifiée */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <Calendar size={14} className="text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-800">Trésorerie — 7 prochains jours</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {previsions.map((p, i) => (
              <div key={i} className={`px-4 py-2.5 flex items-center justify-between text-xs ${p.alerte ? 'bg-red-50/60' : ''}`}>
                <div>
                  <span className="font-semibold">{p.date}</span>
                  {p.commentaire && (
                    <span className="text-slate-500 ml-2">{p.commentaire}</span>
                  )}
                </div>
                <div className="text-right">
                  <div className={`font-bold ${p.alerte ? 'text-red-600' : 'text-slate-800'}`}>
                    {formatFcfa(p.solde_fin)}
                  </div>
                  {p.alerte && (
                    <span className="text-[9px] text-red-500 font-semibold">Pic de sortie</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top créances */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown size={14} className="text-red-600" />
              <h3 className="text-sm font-bold text-slate-800">Clients à surveiller</h3>
            </div>
            <Link href="/facturation" className="text-[10px] text-amber-700 font-semibold inline-flex items-center gap-0.5 hover:underline">
              Voir facturation <ArrowRight size={10} />
            </Link>
          </div>
          {topCreances.map(c => (
            <div key={c.client_id} className="px-4 py-3 border-b border-slate-50 last:border-0">
              <div className="flex justify-between items-start gap-2 text-xs">
                <div>
                  <div className="font-bold text-slate-800">{c.client_nom}</div>
                  <div className="text-[10px] text-slate-400">{c.commercial} · {c.jours_retard > 0 ? `${c.jours_retard} j de retard` : 'À jour'}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`font-black ${c.jours_retard > 30 ? 'text-red-600' : 'text-slate-800'}`}>
                    {formatFcfa(c.reste)}
                  </div>
                  {c.jours_retard > 30 && (
                    <span className="text-[9px] text-red-600 font-bold">Action urgente</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dette fournisseurs — l'autre moitié de la balance âgée */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <CalendarClock size={14} className="text-red-600" />
            <h3 className="text-sm font-bold text-slate-800">Dette fournisseurs — échéancier & impact trésorerie</h3>
          </div>
          <Link href="/approvisionnement?tab=fournisseurs" className="text-[10px] text-amber-700 font-semibold inline-flex items-center gap-0.5 hover:underline">
            Voir les fournisseurs <ArrowRight size={10} />
          </Link>
        </div>

        <div className="p-4 space-y-3">
          {echeancier.map(t => {
            const pct = DETTE_FOURNISSEURS_TOTALE > 0
              ? Math.round((t.montant / DETTE_FOURNISSEURS_TOTALE) * 100)
              : 0
            const urgent = t.tranche === 'ECHU' || t.tranche === 'J+7'
            return (
              <div key={t.tranche}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${urgent ? 'bg-red-500' : 'bg-slate-400'}`} />
                    <span className="font-medium text-slate-700">{t.label}</span>
                    <span className="text-[10px] text-slate-400 truncate hidden md:inline">
                      {t.fournisseurs.slice(0, 2).join(' · ')}
                      {t.fournisseurs.length > 2 && ` +${t.fournisseurs.length - 2}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`font-bold ${urgent ? 'text-red-600' : 'text-slate-800'}`}>{formatFcfa(t.montant)}</span>
                    <span className="text-slate-400 tabular-nums">{pct}%</span>
                  </div>
                </div>
                <div className="bg-slate-100 rounded-full h-2">
                  <div className={`h-full rounded-full ${urgent ? 'bg-red-500' : 'bg-slate-400'}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}

          <div className={`mt-1 p-3 rounded-lg border text-xs ${
            sortieJ30 > synthese.tresorerie_totale ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <div className="font-bold mb-0.5">Impact trésorerie à J+30</div>
            <div>
              {formatFcfa(sortieJ30)} à décaisser sous 30 jours pour {formatFcfa(synthese.tresorerie_totale)} disponibles —
              {' '}il resterait <strong>{formatFcfa(synthese.tresorerie_totale - sortieJ30)}</strong> si aucune créance client n&apos;est encaissée d&apos;ici là.
              {' '}Les {formatFcfa(synthese.creances_retard_30j)} de créances en retard couvriraient l&apos;essentiel de cette sortie : c&apos;est le même problème vu des deux côtés.
            </div>
          </div>
        </div>
      </div>

      {/* Rentabilité synthétique */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 size={14} className="text-violet-600" />
          <h3 className="text-sm font-bold text-slate-800">Rentabilité du mois — vue synthétique</h3>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {kpisResultat.map((l, i) => (
            <div key={i} className={`rounded-xl p-4 text-center ${l.section === 'RESULTAT' ? 'bg-amber-50 border border-amber-200' : l.section === 'MARGE' ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50 border border-slate-100'}`}>
              <div className="text-[10px] text-slate-500 font-medium">{l.libelle}</div>
              <div className="text-lg font-black text-slate-900 mt-1">{formatFcfa(l.montant_mois)}</div>
              {l.pct_ca != null && (
                <div className="text-[10px] text-slate-400 mt-0.5">{l.pct_ca} % du CA</div>
              )}
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 mt-3 flex items-center gap-1">
          <CheckCircle2 size={11} />
          Détail comptable (journal, balance, rapprochements) : accessible au DAF et à l&apos;équipe comptable.
        </p>
      </div>

      <WorkflowToast action={lastAction} onClose={clearLastAction} />
    </div>
  )
}
