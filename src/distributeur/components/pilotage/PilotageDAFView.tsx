'use client'

import { useMemo } from 'react'
import {
  Wallet, AlertTriangle, Landmark, Scale, Percent, ShieldCheck,
  CalendarClock, TrendingDown, Gift, Building2, Lock, Check, Clock, X,
} from 'lucide-react'
import { PageHeader } from '@distributeur/components/shared/PageHeader'
import { PerformancePostePanel } from '@distributeur/components/dashboard/PerformancePostePanel'
import { RapportExportBar } from '@distributeur/components/shared/RapportExportBar'
import { WorkflowToast } from '@distributeur/components/shared/WorkflowToast'
import { useDecisionsWorkflow } from '@distributeur/contexts/DecisionsWorkflowContext'
import { formatFcfa } from '@distributeur/lib/utils'
import {
  TRESORERIE_ACTUELLE, PLANCHER_TRESORERIE, ENCAISSEMENTS_CERTAINS_7J, RUN_PAIEMENT,
  buildSyntheseBfr, simulerRunPaiement, arbitragesRecommandes, montantArbitre,
  buildMargesCanal, buildDemandesCredit, buildRistournes, buildEcheancesFiscales,
  buildLignesBancaires, buildArbitragesDaf,
  type ArbitragePaiement,
} from '@distributeur/lib/daf-pilotage-builder'

const SEVERITE_STYLE = {
  CRITIQUE: 'border-red-200 bg-red-50',
  HAUTE: 'border-orange-200 bg-orange-50',
  MODEREE: 'border-sky-200 bg-sky-50',
} as const

const CHOIX: { id: ArbitragePaiement; label: string; actif: string }[] = [
  { id: 'PAYER', label: 'Payer', actif: 'bg-emerald-600 text-white border-emerald-600' },
  { id: 'PARTIEL', label: 'Partiel', actif: 'bg-amber-500 text-white border-amber-500' },
  { id: 'REPORTER', label: 'Reporter', actif: 'bg-slate-700 text-white border-slate-700' },
]

const RISQUE_STYLE = {
  FAIBLE: 'bg-emerald-100 text-emerald-700',
  MOYEN: 'bg-amber-100 text-amber-700',
  ELEVE: 'bg-red-100 text-red-700',
} as const

const STATUT_RISTOURNE = {
  A_RECLAMER: { label: 'À réclamer', className: 'bg-red-100 text-red-700' },
  RECLAMEE: { label: 'Réclamée', className: 'bg-amber-100 text-amber-700' },
  ENCAISSEE: { label: 'Encaissée', className: 'bg-emerald-100 text-emerald-700' },
  SEUIL_NON_ATTEINT: { label: 'Seuil non atteint', className: 'bg-slate-100 text-slate-500' },
} as const

const STATUT_FISCAL = {
  A_PREPARER: { label: 'À préparer', className: 'bg-red-100 text-red-700' },
  PRETE: { label: 'Prête', className: 'bg-amber-100 text-amber-700' },
  DECLAREE: { label: 'Déclarée', className: 'bg-sky-100 text-sky-700' },
  PAYEE: { label: 'Payée', className: 'bg-emerald-100 text-emerald-700' },
} as const

const LIBELLE_LIGNE = {
  DECOUVERT: 'Découvert autorisé',
  ESCOMPTE: 'Ligne d\'escompte',
  CREDIT_CAMPAGNE: 'Crédit de campagne',
} as const

/** Décision du DAF sur une demande de crédit client — locale à la session de démo. */
type ChoixCredit = 'ACCORDE' | 'REFUSE' | 'CONDITIONNE'

export function PilotageDAFView() {
  const { getChoix, decider, effacer, lastAction, clearLastAction } = useDecisionsWorkflow()

  // Les arbitrages persistés s'appliquent par-dessus les recommandations par défaut.
  const arbitrages = useMemo(() => {
    const base = arbitragesRecommandes()
    for (const l of RUN_PAIEMENT) {
      const c = getChoix('ARBITRAGE_PAIEMENT', l.fournisseur_id)
      if (c) base[l.fournisseur_id] = c as ArbitragePaiement
    }
    return base
  }, [getChoix])

  const bfr = useMemo(() => buildSyntheseBfr(), [])
  const run = useMemo(() => simulerRunPaiement(arbitrages), [arbitrages])
  const canaux = useMemo(() => buildMargesCanal(), [])
  const demandes = useMemo(() => buildDemandesCredit(), [])
  const ristournes = useMemo(() => buildRistournes(), [])
  const fiscal = useMemo(() => buildEcheancesFiscales(), [])
  const bancaire = useMemo(() => buildLignesBancaires(), [])
  const actes = useMemo(() => buildArbitragesDaf(), [])

  const echus = RUN_PAIEMENT.filter(l => l.jours_retard > 0).reduce((s, l) => s + l.montant_du, 0)

  return (
    <div className="p-6 max-w-7xl space-y-5">
      <PageHeader
        title="Pilotage financier"
        subtitle="Direction financière — ce que vous arbitrez : décaissements, crédit client, BFR, marge réelle"
        badge={`Run de paiement du ${new Date('2026-06-11').toLocaleDateString('fr-FR')}`}
        actions={
          <RapportExportBar
            nomFichier="run-paiement-daf"
            colonnes={['Fournisseur', 'Échéance', 'Dû (FCFA)', 'Retard (j)', 'Couverture stock (j)', 'Arbitrage', 'Décaissé (FCFA)', 'Recommandation']}
            getLignes={() =>
              RUN_PAIEMENT.map(l => {
                const choix = arbitrages[l.fournisseur_id] ?? l.reco
                return [
                  l.fournisseur,
                  l.echeance,
                  l.montant_du,
                  l.jours_retard,
                  l.couverture_stock_j,
                  choix,
                  montantArbitre(l, choix),
                  l.reco,
                ]
              })
            }
          />
        }
      />

      <PerformancePostePanel role="DAF" />

      {/* KPIs du poste — aucun n'est un KPI de DG */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Trésorerie disponible', value: formatFcfa(TRESORERIE_ACTUELLE), color: 'text-emerald-700', sub: `plancher ${formatFcfa(PLANCHER_TRESORERIE)}` },
          { label: 'BFR', value: formatFcfa(bfr.bfr), color: 'text-violet-700', sub: `${bfr.variation > 0 ? '+' : ''}${formatFcfa(bfr.variation)} vs mois dernier` },
          { label: 'Dette échue', value: formatFcfa(echus), color: 'text-red-600', sub: `${RUN_PAIEMENT.filter(l => l.jours_retard > 0).length} fournisseurs en retard` },
          { label: 'Marge arrière à réclamer', value: formatFcfa(ristournes.a_reclamer), color: 'text-amber-700', sub: `dont ${formatFcfa(ristournes.en_peril)} en péril` },
          { label: 'Fiscal sous 7 j', value: formatFcfa(fiscal.sous_7j), color: 'text-red-600', sub: `${fiscal.non_pretes} déclaration à préparer` },
          { label: 'Lignes bancaires', value: formatFcfa(bancaire.disponible), color: 'text-sky-700', sub: `dispo sur ${formatFcfa(bancaire.autorise)}` },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm">
            <div className="text-[10px] text-slate-400 font-medium">{k.label}</div>
            <div className={`text-base font-black mt-0.5 ${k.color}`}>{k.value}</div>
            <div className="text-[9px] text-slate-400 mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Les actes du DAF — pas les décisions du DG */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={14} className="text-violet-600" />
          <h3 className="text-sm font-bold text-slate-800">Vos arbitrages du jour</h3>
          <span className="text-[10px] text-slate-400">— actes que vous posez, sans passer par le DG</span>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {actes.map(a => (
            <div key={a.priorite} className={`rounded-xl border p-3.5 text-xs ${SEVERITE_STYLE[a.severite]}`}>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-white/70 text-slate-700 font-black text-[10px] flex items-center justify-center shrink-0">
                  {a.priorite}
                </span>
                <div className="min-w-0">
                  <div className="font-bold text-slate-800 leading-snug">{a.titre}</div>
                  <div className="text-slate-600 mt-1 leading-relaxed">{a.enjeu}</div>
                  <div className="font-semibold mt-1.5 text-slate-800">→ {a.acte}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ───────── RUN DE PAIEMENT — l'écran que le DG n'a pas ───────── */}
      <div className="bg-white rounded-xl border-2 border-violet-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Wallet size={15} className="text-violet-600" />
            <h3 className="text-sm font-bold text-slate-800">Run de paiement — semaine du 11/06</h3>
          </div>
          <span className="text-[10px] text-slate-400">
            Chaque ligne : ce que ça coûte de payer, ce que ça casse de ne pas payer
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="text-left p-2.5">Fournisseur</th>
                <th className="text-right p-2.5">Dû</th>
                <th className="text-center p-2.5">Retard</th>
                <th className="text-center p-2.5">Couverture stock</th>
                <th className="text-left p-2.5 min-w-[220px]">Si vous ne payez pas</th>
                <th className="text-center p-2.5">Arbitrage</th>
                <th className="text-right p-2.5">Décaissé</th>
              </tr>
            </thead>
            <tbody>
              {RUN_PAIEMENT.map(l => {
                const choix = arbitrages[l.fournisseur_id] ?? l.reco
                const paye = montantArbitre(l, choix)
                const critique = l.couverture_stock_j < 10
                return (
                  <tr key={l.fournisseur_id} className="border-t border-slate-100 align-top">
                    <td className="p-2.5">
                      <div className="font-semibold text-slate-800">{l.fournisseur}</div>
                      <div className="text-[10px] text-slate-400">échéance {l.echeance}</div>
                      {choix !== l.reco && (
                        <div className="text-[10px] text-violet-600 mt-1 leading-snug">
                          Reco : {l.reco.toLowerCase()} — {l.reco_motif}
                        </div>
                      )}
                    </td>
                    <td className="p-2.5 text-right font-bold tabular-nums">{formatFcfa(l.montant_du)}</td>
                    <td className="p-2.5 text-center">
                      {l.jours_retard > 0 ? (
                        <span className="font-bold text-red-600">{l.jours_retard} j</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                      {l.penalite_retard_pct > 0 && (
                        <div className="text-[9px] text-red-500">pénalité {l.penalite_retard_pct} %</div>
                      )}
                      {l.escompte_pct > 0 && (
                        <div className="text-[9px] text-emerald-600">escompte {l.escompte_pct} %</div>
                      )}
                    </td>
                    <td className="p-2.5 text-center">
                      <span className={`font-bold ${critique ? 'text-red-600' : 'text-slate-600'}`}>
                        {l.couverture_stock_j} j
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-600 leading-snug">
                      {critique && <AlertTriangle size={11} className="inline text-red-500 mr-1 -mt-0.5" />}
                      {l.consequence_non_paiement}
                    </td>
                    <td className="p-2.5">
                      <div className="flex justify-center gap-1">
                        {CHOIX.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => decider('ARBITRAGE_PAIEMENT', l.fournisseur_id, c.id, {
                              label: `${l.fournisseur} — ${c.label.toLowerCase()}`,
                              detail: `${formatFcfa(l.montant_du)} dû · reco ${l.reco.toLowerCase()}`,
                              message: `Arbitrage « ${c.label} » enregistré pour ${l.fournisseur}.`,
                            })}
                            className={`px-2 py-1 rounded-md border text-[10px] font-bold transition-colors ${
                              choix === c.id ? c.actif : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className={`p-2.5 text-right font-black tabular-nums ${paye === 0 ? 'text-slate-300' : 'text-slate-800'}`}>
                      {paye === 0 ? '—' : formatFcfa(paye)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Conséquence live du run */}
        <div className="border-t-2 border-slate-100 bg-slate-50 p-4 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Décaissé cette semaine', value: formatFcfa(run.decaisse), color: 'text-red-600' },
              { label: 'Reporté', value: formatFcfa(run.reporte), color: 'text-slate-700' },
              { label: 'Escompte capté', value: `+${formatFcfa(run.escompte_gagne)}`, color: 'text-emerald-600' },
              { label: 'Pénalités déclenchées', value: `-${formatFcfa(run.penalites_encourues)}`, color: run.penalites_encourues > 0 ? 'text-red-600' : 'text-slate-400' },
            ].map((k, i) => (
              <div key={i} className="bg-white rounded-lg border border-slate-200 p-2.5">
                <div className="text-[10px] text-slate-400">{k.label}</div>
                <div className={`font-black text-sm ${k.color}`}>{k.value}</div>
              </div>
            ))}
          </div>

          <div className={`rounded-xl border-2 p-4 ${
            run.sous_plancher ? 'border-red-300 bg-red-50' : 'border-emerald-200 bg-emerald-50'
          }`}>
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Trésorerie projetée après le run
                </div>
                <div className={`text-2xl font-black ${run.sous_plancher ? 'text-red-700' : 'text-emerald-700'}`}>
                  {formatFcfa(run.solde_projete)}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {formatFcfa(TRESORERIE_ACTUELLE)} en caisse
                  {' + '}{formatFcfa(ENCAISSEMENTS_CERTAINS_7J)} d&apos;encaissements certains
                  {' − '}{formatFcfa(run.decaisse)} décaissés
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Marge sur le plancher de {formatFcfa(PLANCHER_TRESORERIE)}
                </div>
                <div className={`text-lg font-black ${run.sous_plancher ? 'text-red-700' : 'text-slate-800'}`}>
                  {run.marge_plancher >= 0 ? '+' : ''}{formatFcfa(run.marge_plancher)}
                </div>
              </div>
            </div>

            {run.sous_plancher && (
              <div className="mt-3 flex items-start gap-2 text-xs text-red-800 bg-white/70 rounded-lg p-2.5">
                <Lock size={14} className="shrink-0 mt-0.5" />
                <span>
                  Ce run fait passer la trésorerie sous le plancher interne. La règle de garde-fou bloque
                  l&apos;envoi automatique : il faut soit reporter une ligne, soit tirer sur le découvert Ecobank
                  ({formatFcfa(bancaire.disponible)} disponibles) — et le covenant « trésorerie nette ≥ 40 M » sauterait à la clôture.
                </span>
              </div>
            )}

            {run.ruptures_risquees.length > 0 && (
              <div className="mt-3 flex items-start gap-2 text-xs text-orange-800 bg-white/70 rounded-lg p-2.5">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>
                  Vous reportez {run.ruptures_risquees.map(l => l.fournisseur).join(', ')} alors que la couverture
                  stock est sous 10 jours. Le cash économisé aujourd&apos;hui devient une rupture — donc du CA perdu — sous 2 semaines.
                </span>
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <button type="button" className="px-4 py-2 rounded-lg bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={run.sous_plancher}>
                Geler le run et générer les ordres de virement
              </button>
              <button type="button" onClick={() => RUN_PAIEMENT.forEach(l => effacer('ARBITRAGE_PAIEMENT', l.fournisseur_id))}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 text-xs font-bold hover:bg-white">
                Revenir aux recommandations
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* BFR */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Scale size={14} className="text-violet-600" />
            <h3 className="text-sm font-bold text-slate-800">Besoin en fonds de roulement</h3>
          </div>

          <div className="flex items-center gap-1.5 text-xs mb-3">
            <div className="flex-1 rounded-lg bg-sky-50 border border-sky-100 p-2.5 text-center">
              <div className="text-[9px] text-slate-500">Stock (311)</div>
              <div className="font-black text-sky-700">{formatFcfa(bfr.stock)}</div>
            </div>
            <span className="font-black text-slate-400">+</span>
            <div className="flex-1 rounded-lg bg-amber-50 border border-amber-100 p-2.5 text-center">
              <div className="text-[9px] text-slate-500">Clients (411)</div>
              <div className="font-black text-amber-700">{formatFcfa(bfr.creances)}</div>
            </div>
            <span className="font-black text-slate-400">−</span>
            <div className="flex-1 rounded-lg bg-emerald-50 border border-emerald-100 p-2.5 text-center">
              <div className="text-[9px] text-slate-500">Fourn. (401)</div>
              <div className="font-black text-emerald-700">{formatFcfa(bfr.dettes)}</div>
            </div>
            <span className="font-black text-slate-400">=</span>
            <div className="flex-1 rounded-lg bg-violet-50 border-2 border-violet-200 p-2.5 text-center">
              <div className="text-[9px] text-slate-500">BFR</div>
              <div className="font-black text-violet-700">{formatFcfa(bfr.bfr)}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            {[
              { label: 'Rotation du stock', value: `${bfr.dio_j} j`, hint: 'cash bloqué en marchandise' },
              { label: 'Crédit fournisseur', value: `${bfr.dpo_j} j`, hint: 'cash gardé avant de payer' },
              { label: 'Marge de manœuvre', value: `${bfr.marge_manoeuvre_j >= 0 ? '+' : ''}${bfr.marge_manoeuvre_j} j`, hint: 'écart entre les deux' },
            ].map((k, i) => (
              <div key={i} className="bg-slate-50 rounded-lg p-2.5">
                <div className="text-[10px] text-slate-400">{k.label}</div>
                <div className="font-black text-sm text-slate-800">{k.value}</div>
                <div className="text-[9px] text-slate-400 mt-0.5">{k.hint}</div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-600 mt-3 leading-relaxed bg-violet-50 border border-violet-100 rounded-lg p-2.5">
            Le stock met <strong>{bfr.dio_j} jours</strong> à se transformer en vente, et les fournisseurs sont payés
            à <strong>{bfr.dpo_j} jours</strong>. {bfr.marge_manoeuvre_j >= 0
              ? <>Le fournisseur finance encore le stock, mais de <strong>{bfr.marge_manoeuvre_j} jours</strong> seulement : le moindre allongement de rotation vous met en trésorerie négative sur le cycle.</>
              : <>Vous payez la marchandise avant de l&apos;avoir vendue — c&apos;est votre trésorerie qui finance les rayons de vos clients.</>}
          </p>
        </div>

        {/* Marge par canal */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Percent size={14} className="text-red-600" />
            <h3 className="text-sm font-bold text-slate-800">Marge nette par canal</h3>
          </div>
          <p className="text-[10px] text-slate-400 mb-3">
            Marge brute − remises − commissions − transport − coût du crédit − pertes. Le DG s&apos;arrête à la première colonne.
          </p>

          <div className="space-y-2.5">
            {canaux.map(c => (
              <div key={c.canal} className={`rounded-lg border p-2.5 ${c.destructeur ? 'border-red-200 bg-red-50/60' : 'border-slate-100'}`}>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-800">{c.canal}</span>
                  <span className="text-[10px] text-slate-400 tabular-nums">CA {formatFcfa(c.ca_mois)}</span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-300" style={{ width: `${Math.min(100, c.marge_brute_pct * 3)}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-400 w-20 text-right tabular-nums">brut {c.marge_brute_pct} %</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${c.destructeur ? 'bg-red-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.max(2, Math.min(100, c.marge_nette_pct * 3))}%` }} />
                  </div>
                  <span className={`text-[10px] font-black w-20 text-right tabular-nums ${c.destructeur ? 'text-red-600' : 'text-emerald-600'}`}>
                    net {c.marge_nette_pct} %
                  </span>
                </div>
                {c.destructeur && (
                  <div className="text-[10px] text-red-700 mt-1.5 leading-snug">
                    {formatFcfa(c.remises_accordees + c.cout_credit_client + c.pertes_creances)} de remises, de crédit et
                    d&apos;impayés sur {formatFcfa(c.marge_brute)} de marge brute. Ce canal fait du volume, pas du résultat.
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Crédit client — la décision que le DAF prend seul */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <Building2 size={14} className="text-amber-600" />
          <h3 className="text-sm font-bold text-slate-800">Encadrement du crédit client</h3>
          <span className="text-[10px] text-slate-400">
            — {demandes.filter(d => !getChoix('CREDIT_CLIENT', d.id)).length} demande(s) commerciales en attente de votre visa
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {demandes.map(d => {
            const decision = getChoix('CREDIT_CLIENT', d.id) as ChoixCredit | undefined
            return (
              <div key={d.id} className={`p-4 ${decision ? 'bg-slate-50/60' : ''}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-800">{d.pdv_nom}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${RISQUE_STYLE[d.risque]}`}>
                        risque {d.risque.toLowerCase()}
                      </span>
                      <span className="text-[10px] text-slate-400">{d.zone} · {d.commercial}</span>
                      {d.depassement > 0 && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-700">
                          hors plafond de {formatFcfa(d.depassement)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 italic mt-1">« {d.motif_commercial} »</p>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2.5 text-xs">
                      {[
                        { label: d.demande === 'RELEVEMENT_PLAFOND' ? 'Plafond demandé' : 'Commande à débloquer', value: formatFcfa(d.montant_demande) },
                        { label: 'Exposition après', value: formatFcfa(d.exposition_apres), color: d.risque === 'ELEVE' ? 'text-red-600' : undefined },
                        { label: 'Paie en moyenne à', value: `${d.delai_paiement_moyen_j} j`, color: d.delai_paiement_moyen_j > 45 ? 'text-red-600' : 'text-emerald-600' },
                        { label: 'Retards sur 12 mois', value: String(d.retards_12m), color: d.retards_12m > 5 ? 'text-red-600' : undefined },
                        { label: 'Marge / crédit engagé', value: `${d.rendement_credit_pct} %`, color: d.rendement_credit_pct < 100 ? 'text-red-600' : 'text-emerald-600' },
                      ].map((k, i) => (
                        <div key={i} className="bg-slate-50 rounded-lg p-2">
                          <div className="text-[9px] text-slate-400">{k.label}</div>
                          <div className={`font-bold ${k.color ?? 'text-slate-800'}`}>{k.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex sm:flex-col gap-1.5 shrink-0">
                    {([
                      { id: 'ACCORDE' as const, label: 'Accorder', icon: Check, actif: 'bg-emerald-600 text-white border-emerald-600' },
                      { id: 'CONDITIONNE' as const, label: 'Sous condition', icon: Clock, actif: 'bg-amber-500 text-white border-amber-500' },
                      { id: 'REFUSE' as const, label: 'Refuser', icon: X, actif: 'bg-red-600 text-white border-red-600' },
                    ]).map(c => (
                      <button key={c.id} type="button"
                        onClick={() => decider('CREDIT_CLIENT', d.id, c.id, {
                          label: `${d.pdv_nom} — ${c.label.toLowerCase()}`,
                          detail: `${formatFcfa(d.montant_demande)} · risque ${d.risque.toLowerCase()}`,
                          message: `Crédit ${c.label.toLowerCase()} — ${d.pdv_nom}.`,
                        })}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-colors ${
                          decision === c.id ? c.actif : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}>
                        <c.icon size={11} /> {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {d.risque === 'ELEVE' && !decision && (
                  <div className="mt-2.5 text-[11px] text-red-800 bg-red-50 border border-red-100 rounded-lg p-2.5 flex items-start gap-2">
                    <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                    <span>
                      {d.marge_12m < d.exposition_apres
                        ? <>Sur 12 mois, ce PDV a rapporté <strong>{formatFcfa(d.marge_12m)}</strong> de marge pour une exposition de <strong>{formatFcfa(d.exposition_apres)}</strong>. Un seul défaut efface plus d&apos;un an de profit sur ce client.</>
                        : <>Paiement moyen à {d.delai_paiement_moyen_j} jours et {d.retards_12m} retards sur l&apos;année : accorder sans garantie revient à financer sa trésorerie avec la vôtre.</>}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Ristournes */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 lg:col-span-2">
          <div className="flex items-center gap-2 mb-1">
            <Gift size={14} className="text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-800">Marge arrière — ristournes fournisseurs</h3>
          </div>
          <p className="text-[10px] text-slate-400 mb-3">
            {formatFcfa(ristournes.total_acquis)} acquis sur la période. Non réclamé avant l&apos;échéance contractuelle = perdu.
          </p>

          <div className="space-y-1.5">
            {ristournes.lignes.map(r => {
              const st = STATUT_RISTOURNE[r.statut]
              const urgent = r.statut === 'A_RECLAMER' && r.jours_restants <= 30
              const progression = r.seuil > 0 ? Math.min(100, Math.round(r.achats_periode / r.seuil * 100)) : 100
              return (
                <div key={r.fournisseur_id} className={`rounded-lg border p-2.5 ${urgent ? 'border-red-200 bg-red-50/60' : 'border-slate-100'}`}>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-slate-800">{r.fournisseur}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-black tabular-nums text-slate-800">{r.acquis > 0 ? formatFcfa(r.acquis) : '—'}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${st.className}`}>{st.label}</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{r.condition}</div>
                  {r.seuil > 0 && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${progression >= 100 ? 'bg-emerald-500' : 'bg-slate-300'}`} style={{ width: `${progression}%` }} />
                      </div>
                      <span className="text-[9px] text-slate-400 tabular-nums w-24 text-right">
                        {formatFcfa(r.achats_periode)} / {formatFcfa(r.seuil)}
                      </span>
                    </div>
                  )}
                  {urgent && (
                    <div className="text-[10px] text-red-700 font-semibold mt-1.5">
                      Réclamation à envoyer sous {r.jours_restants} jours — au-delà, les {formatFcfa(r.acquis)} sont perdus.
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="space-y-4">
          {/* Fiscal */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <CalendarClock size={14} className="text-red-600" />
              <h3 className="text-sm font-bold text-slate-800">Échéances fiscales & sociales</h3>
            </div>
            <div className="space-y-1.5">
              {fiscal.lignes.map(e => {
                const st = STATUT_FISCAL[e.statut]
                const urgent = e.jours_restants <= 7 && e.statut !== 'PAYEE'
                return (
                  <div key={e.id} className={`rounded-lg border p-2.5 text-xs ${urgent && e.statut === 'A_PREPARER' ? 'border-red-200 bg-red-50/60' : 'border-slate-100'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 leading-snug">{e.libelle}</div>
                        <div className="text-[10px] text-slate-400">{e.organisme}</div>
                      </div>
                      <span className="font-black tabular-nums shrink-0">{formatFcfa(e.montant)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-1.5">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${st.className}`}>{st.label}</span>
                      <span className={`text-[10px] font-bold ${urgent ? 'text-red-600' : 'text-slate-400'}`}>
                        {e.jours_restants} j — {e.date_limite}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Lignes bancaires */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Landmark size={14} className="text-sky-600" />
              <h3 className="text-sm font-bold text-slate-800">Lignes bancaires</h3>
            </div>
            <div className="space-y-2.5">
              {bancaire.lignes.map((l, i) => {
                const pct = Math.round(l.utilise / l.autorise * 100)
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">{LIBELLE_LIGNE[l.type]}</span>
                      <span className="text-[10px] text-slate-400 tabular-nums">
                        {formatFcfa(l.utilise)} / {formatFcfa(l.autorise)} · {l.taux_pct} %
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full mt-1 overflow-hidden">
                      <div className={`h-full ${pct > 75 ? 'bg-red-500' : 'bg-sky-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{l.banque}</div>
                    {l.covenant_respecte === false && (
                      <div className="text-[10px] text-red-700 bg-red-50 border border-red-100 rounded-lg p-2 mt-1.5 flex items-start gap-1.5">
                        <TrendingDown size={11} className="shrink-0 mt-0.5" />
                        <span>Covenant rompu — « {l.covenant} ». Ligne révisable au {l.echeance_revision}.</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <WorkflowToast action={lastAction} onClose={clearLastAction} />
    </div>
  )
}
