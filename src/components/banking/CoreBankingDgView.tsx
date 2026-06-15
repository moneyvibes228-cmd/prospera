'use client'

import { useState } from 'react'
import { Banknote, Calendar, RefreshCw, CheckCircle2 } from 'lucide-react'
import { getCoreBankingHub } from '@/lib/core-banking-hub'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { RapportIAGlobal } from '@/components/dashboard/RapportIAGlobal'
import { KpiCardWithSparkline } from '@/components/dashboard/KpiCardWithSparkline'
import { ExportButton } from '@/components/dashboard/ExportButton'
import { CoreBankingTables } from '@/components/banking/CoreBankingTables'
import { formatFcfa, cn } from '@/lib/utils'
import { RESEAU_CONSOLIDE } from '@/lib/agences'

type Tab = 'prets' | 'decaissements' | 'echeancier' | 'refinancement'

const SYNTHESE_OPERATIONS = {
  date_generation: '28/05/2026 à 06:00',
  periode: 'Mai 2026 — Opérations crédit réseau',
  destinataire: 'Directeur Général',
  synthese_executive:
    `Portefeuille crédit ${formatFcfa(RESEAU_CONSOLIDE.encours_total)} sur ${RESEAU_CONSOLIDE.total_emprunteurs} emprunteurs actifs. Cinq décaissements attendent validation ROC avant cut-off 16h. Priorité : dossiers Bè Kpota (PAR 11,2 %) et refinancement RF-008. Taux remboursement réseau ${RESEAU_CONSOLIDE.taux_remb_moyen} % — en amélioration mais fragile.`,
  chiffres_cles: [
    { label: 'Encours crédit', valeur: formatFcfa(RESEAU_CONSOLIDE.encours_total), tendance: 'HAUSSE' as const, commentaire: '+6,1 % vs avril' },
    { label: 'Emprunteurs actifs', valeur: String(RESEAU_CONSOLIDE.total_emprunteurs), tendance: 'HAUSSE' as const, commentaire: '5 agences' },
    { label: 'PAR réseau', valeur: `${RESEAU_CONSOLIDE.par_moyen}%`, tendance: 'BAISSE' as const, commentaire: 'Seuil BCEAO 10 %' },
    { label: 'Décaissements mois', valeur: formatFcfa(RESEAU_CONSOLIDE.montant_decaisse_mois), tendance: 'HAUSSE' as const, commentaire: `${RESEAU_CONSOLIDE.decaissements_mois} dossiers` },
  ],
  points_forts: [
    'Lomé Centre et Kpalimé : taux remboursement > 92 %',
    'Pipeline décaissement : 13 dossiers validés ce mois',
    'Mobile Money : 68 % des remboursements tracés',
  ],
  points_attention: [
    { titre: '5 décaissements en attente validation', detail: '4,2 M FCFA — cut-off BOA 16h aujourd\'hui', severite: 'HAUTE' as const },
    { titre: 'Bè Kpota — impayés concentrés', detail: '18 dossiers en retard > 15 jours — action recouvrement', severite: 'CRITIQUE' as const },
    { titre: 'Refinancement RF-008', detail: 'Komi Akléssoé — décision comité requise sous 48h', severite: 'MODEREE' as const },
  ],
  recommandations: [
    { priorite: 1 as const, action: 'Valider 5 décaissements en attente avant 16h', impact_estime: '4,2 M FCFA débloqués', delai: 'Aujourd\'hui' },
    { priorite: 1 as const, action: 'Plan recouvrement Bè Kpota — 18 dossiers impayés', impact_estime: 'PAR -1,5 pt', delai: 'Cette semaine' },
    { priorite: 2 as const, action: 'Décision comité sur RF-008 (refinancement)', impact_estime: 'Récupération client', delai: '48h' },
  ],
  previsions_30j: [],
  alertes_immediates: [
    '⚠ 5 décaissements en attente — cut-off 16h',
    '⚠ Bè Kpota : 18 prêts impayés',
    'ℹ RF-008 refinancement à valider',
  ],
  comparaison_mois_precedent: [],
  points_forts_list: [] as string[],
  signature_ia: 'Prospera AI — Opérations crédit',
}

export function CoreBankingDgView() {
  const hub = getCoreBankingHub()
  const k = hub.kpis
  const [tab, setTab] = useState<Tab>('prets')

  const rapport = {
    ...SYNTHESE_OPERATIONS,
    points_forts: SYNTHESE_OPERATIONS.points_forts,
  }

  return (
    <PageWrapper
      title="Pilotage opérations crédit"
      subtitle={`${k.total_prets} prêts · ${formatFcfa(k.encours_credit_fcfa)} encours · Vue direction`}
      actions={
        <div className="flex items-center gap-2">
          {k.decaissements_en_attente > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg">
              {k.decaissements_en_attente} décaissements à valider
            </span>
          )}
          <ExportButton label="Exporter opérations" filename="operations_credit" size="sm" />
        </div>
      }
    >
      <RapportIAGlobal
        rapport={{
          ...rapport,
          synthese_piliers: undefined,
          synthese_agences: undefined,
        }}
        accentColor="teal"
        analyseLabel="Opérations crédit"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KpiCardWithSparkline title="Encours crédit" value={k.encours_credit_fcfa} format="fcfa" variation={6.1} variationLabel="vs avril" sparkline={[78, 80, 82, 84, 85.4].map(v => v * 1_000_000)} sparklineLabels={['Jan', 'Fév', 'Mar', 'Avr', 'Mai']} colorScheme="teal" />
        <KpiCardWithSparkline title="PAR réseau" value={RESEAU_CONSOLIDE.par_moyen} format="pct" variation={-14.6} variationLabel="vs avril" sparkline={RESEAU_CONSOLIDE.par_historique.map(h => h.par_30j)} sparklineLabels={RESEAU_CONSOLIDE.par_historique.map(h => h.mois)} colorScheme="red" invertVariation />
        <KpiCardWithSparkline title="Taux remboursement" value={k.taux_remboursement_pct} format="pct" variation={2.1} variationLabel="vs avril" sparkline={[87, 88, 89, 90, 91.6]} sparklineLabels={['Jan', 'Fév', 'Mar', 'Avr', 'Mai']} colorScheme="green" />
        <KpiCardWithSparkline title="Décaiss. en attente" value={k.decaissements_en_attente} format="number" sparkline={[2, 3, 4, 6, 5]} sparklineLabels={['Jan', 'Fév', 'Mar', 'Avr', 'Mai']} colorScheme="orange" invertVariation badge="ROC" />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {([
          { id: 'prets' as const, label: `Prêts (${k.total_prets})`, icon: Banknote },
          { id: 'decaissements' as const, label: `Décaissements (${hub.decaissements.length})`, icon: CheckCircle2 },
          { id: 'echeancier' as const, label: `Échéancier (${hub.echeancier_reseau.length})`, icon: Calendar },
          { id: 'refinancement' as const, label: `Refinancement (${hub.refinancement.length})`, icon: RefreshCw },
        ]).map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              tab === t.id ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100 bg-white border border-slate-200',
            )}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      <CoreBankingTables hub={hub} tab={tab} />
    </PageWrapper>
  )
}
