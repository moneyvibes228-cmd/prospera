'use client'

import { BookOpen, Scale, Sparkles } from 'lucide-react'
import { getComptabiliteHub } from '@/lib/comptabilite-hub'
import { formatFcfa } from '@/lib/utils'
import { DafComptabilitePanel } from '@/components/finance/DafComptabilitePanel'
import { getComptabilitePanelData } from '@/lib/comptabilite-hub'

export function ComptabiliteView() {
  const hub = getComptabiliteHub()
  const panelData = getComptabilitePanelData()
  const op = hub.syscohada.operations
  const rapEcart = hub.syscohada.rapprochements.find(r => r.ecart !== 0)

  return (
    <div className="space-y-5">
      {/* Synthèse — données réelles SYSCOHADA, pas texte générique */}
      <section className="bg-gradient-to-br from-teal-50 via-cyan-50 to-slate-50 border border-teal-200 rounded-2xl p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-teal-800 rounded-xl flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-slate-900 text-sm sm:text-base">
              Pilotage comptable — {hub.syscohada.referentiel.norme}
            </h2>
            <p className="text-[11px] text-teal-800 font-medium mt-0.5">
              {hub.syscohada.referentiel.plan} · {hub.date_cloture}
            </p>
            <p className="text-sm text-slate-800 mt-2 leading-relaxed border-l-4 border-teal-600 pl-3">
              {hub.synthese_ia}
            </p>
          </div>
        </div>
      </section>

      {/* KPIs issus de la balance / journal (cohérents avec les onglets détail) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
        {[
          {
            label: 'Comptes mouvementés',
            value: String(hub.kpis.comptes_mouvementes),
            sub: `Plan ${hub.kpis.comptes_plan} · ${hub.syscohada.balance_generale.date_arrete}`,
          },
          {
            label: 'Épargne actifs',
            value: hub.kpis.comptes_epargne_actifs.toLocaleString('fr-FR'),
            sub: `${hub.syscohada.referentiel.portefeuille.comptes_epargne_dormants} dormants`,
          },
          {
            label: 'Écritures attente',
            value: String(hub.kpis.ecritures_a_valider),
            sub: 'Validation DAF',
            alert: hub.kpis.ecritures_a_valider > 0,
          },
          {
            label: 'Caisse 531',
            value: formatFcfa(hub.kpis.solde_caisse_fcfa),
            sub: 'Solde N',
          },
          {
            label: 'Banques 512',
            value: formatFcfa(hub.kpis.solde_banque_fcfa),
            sub: 'Siège + réseau',
          },
          {
            label: 'Écart rapproch.',
            value: formatFcfa(hub.kpis.ecart_rapprochement_fcfa),
            sub: rapEcart?.compte ?? '—',
            alert: hub.kpis.ecart_rapprochement_fcfa > 0,
          },
          {
            label: 'Score BCEAO',
            value: `${hub.kpis.taux_conformite_pct}/100`,
            sub: 'Ratios réglementaires',
          },
        ].map((k, i) => (
          <div
            key={i}
            className={`rounded-xl border p-3 text-center ${
              k.alert ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'
            }`}
          >
            <div className={`text-lg sm:text-xl font-black tabular-nums ${k.alert ? 'text-amber-800' : 'text-slate-900'}`}>
              {k.value}
            </div>
            <div className="text-[10px] font-semibold text-slate-600 uppercase mt-0.5">{k.label}</div>
            {k.sub && <div className="text-[10px] text-slate-500 mt-0.5 truncate">{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* Rappels métier */}
      <div className="flex flex-wrap gap-3 text-[11px]">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-900 border border-indigo-200">
          <Scale className="w-3.5 h-3.5" />
          Balance : D/C mai + soldes N et N-1
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-900 border border-indigo-200">
          <BookOpen className="w-3.5 h-3.5" />
          Journal AN · OD · BQ · CA · CR
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-900 border border-indigo-200">
          Classe 8 — dotations 871 / 891
        </span>
        {op.suspens_comptables.some(s => s.statut === 'CRITIQUE') && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-800 border border-red-200 font-semibold">
            Suspens 471 — action requise
          </span>
        )}
      </div>

      {/* Module compta complet (même moteur que Finance → Comptabilité) */}
      <DafComptabilitePanel d={panelData} defaultTab="balance" />
    </div>
  )
}
