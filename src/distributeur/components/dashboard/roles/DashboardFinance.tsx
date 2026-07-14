'use client'
import Link from 'next/link'
import {
  Wallet, Scale, CalendarClock, Building2, Gift, ArrowRight, AlertTriangle,
} from 'lucide-react'
import { PageHeader } from '@distributeur/components/shared/PageHeader'
import { PerformancePostePanel } from '@distributeur/components/dashboard/PerformancePostePanel'
import { formatFcfa } from '@distributeur/lib/utils'
import {
  TRESORERIE_ACTUELLE, PLANCHER_TRESORERIE, RUN_PAIEMENT,
  buildSyntheseBfr, simulerRunPaiement, arbitragesRecommandes,
  buildDemandesCredit, buildRistournes, buildEcheancesFiscales, buildMargesCanal,
} from '@distributeur/lib/daf-pilotage-builder'

/**
 * Dashboard DAF. Ce n'est pas une version allégée du DG : c'est la liste de ce
 * qui attend sa signature. Chaque bloc renvoie vers l'écran où l'acte se pose.
 */
export function DashboardFinance() {
  const bfr = buildSyntheseBfr()
  const run = simulerRunPaiement(arbitragesRecommandes())
  const demandes = buildDemandesCredit()
  const ristournes = buildRistournes()
  const fiscal = buildEcheancesFiscales()
  const pireCanal = buildMargesCanal()[0]

  const echus = RUN_PAIEMENT.filter(l => l.jours_retard > 0).reduce((s, l) => s + l.montant_du, 0)

  const enAttente = [
    {
      href: '/distributeur/pilotage-financier',
      icon: Wallet,
      titre: `Run de paiement — ${formatFcfa(echus)} échus`,
      detail: `${RUN_PAIEMENT.length} lignes à arbitrer. La reco du moteur décaisse ${formatFcfa(run.decaisse)} et laisse ${formatFcfa(run.solde_projete)} en caisse, soit ${formatFcfa(run.marge_plancher)} au-dessus du plancher.`,
      urgent: run.sous_plancher,
    },
    {
      href: '/distributeur/pilotage-financier',
      icon: CalendarClock,
      titre: `Fiscal — ${formatFcfa(fiscal.sous_7j)} sous 7 jours`,
      detail: `TVA, CNSS et IRPP au 15/06. ${fiscal.non_pretes} déclaration encore à préparer côté comptable.`,
      urgent: fiscal.non_pretes > 0,
    },
    {
      href: '/distributeur/pilotage-financier',
      icon: Building2,
      titre: `Crédit client — ${demandes.length} demandes commerciales`,
      detail: `${demandes.filter(d => d.risque === 'ELEVE').length} sur des PDV à risque élevé, dont Kiosque Port déjà hors plafond de ${formatFcfa(demandes.find(d => d.pdv_nom === 'Kiosque Port')?.depassement ?? 0)}.`,
      urgent: demandes.some(d => d.risque === 'ELEVE'),
    },
    {
      href: '/distributeur/pilotage-financier',
      icon: Gift,
      titre: `Marge arrière — ${formatFcfa(ristournes.en_peril)} en péril`,
      detail: 'Ristournes acquises mais non réclamées. Perdues si la demande n\'est pas envoyée avant l\'échéance contractuelle.',
      urgent: ristournes.en_peril > 0,
    },
  ]

  return (
    <div className="p-6 max-w-7xl">
      <PageHeader
        title="Direction financière"
        subtitle="Ce qui attend votre arbitrage aujourd'hui"
      />

      <PerformancePostePanel role="DAF" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Trésorerie', value: formatFcfa(TRESORERIE_ACTUELLE), sub: `plancher ${formatFcfa(PLANCHER_TRESORERIE)}`, icon: Wallet, color: 'text-emerald-700' },
          { label: 'BFR', value: formatFcfa(bfr.bfr), sub: `${bfr.marge_manoeuvre_j >= 0 ? '+' : ''}${bfr.marge_manoeuvre_j} j de marge de manœuvre`, icon: Scale, color: 'text-violet-700' },
          { label: 'Dette échue', value: formatFcfa(echus), sub: 'à arbitrer cette semaine', icon: AlertTriangle, color: 'text-red-600' },
          { label: `Pire canal — ${pireCanal.canal}`, value: `${pireCanal.marge_nette_pct} %`, sub: `net, contre ${pireCanal.marge_brute_pct} % brut`, icon: Scale, color: 'text-red-600' },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-medium">{k.label}</span>
              <k.icon size={14} className="text-slate-300" />
            </div>
            <div className={`text-lg font-black mt-1 ${k.color}`}>{k.value}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800">En attente de votre signature</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {enAttente.map((a, i) => (
            <Link key={i} href={a.href}
              className="flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors group">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                a.urgent ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400'
              }`}>
                <a.icon size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-slate-800">{a.titre}</div>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{a.detail}</p>
              </div>
              <ArrowRight size={14} className="text-slate-300 group-hover:text-amber-600 shrink-0 mt-2" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
