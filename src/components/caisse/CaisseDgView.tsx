'use client'

import { useState } from 'react'
import { Vault, ArrowLeftRight, Lock, Smartphone, Layers, BookOpen } from 'lucide-react'
import { getCaisseHub } from '@/lib/caisse-hub'
import { RESEAU_CONSOLIDE } from '@/lib/agences'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { RapportIAGlobal } from '@/components/dashboard/RapportIAGlobal'
import { KpiCardWithSparkline } from '@/components/dashboard/KpiCardWithSparkline'
import { ExportButton } from '@/components/dashboard/ExportButton'
import { CaisseTables } from '@/components/caisse/CaisseTables'
import { formatFcfa, cn } from '@/lib/utils'

type Tab = 'position' | 'flux' | 'clotures' | 'momo' | 'virements'

const RAPPORT_TRESORERIE = {
  date_generation: '28/05/2026 à 06:00',
  periode: 'Mai 2026 — Trésorerie opérationnelle réseau',
  destinataire: 'Directeur Général',
  synthese_executive:
    `Liquidité réseau ${formatFcfa(RESEAU_CONSOLIDE.liquidite_totale)} répartie sur 5 agences. Bè Kpota en tension critique — virement 500 k exécuté ce matin. 2 clôtures non conformes. Écart Mixx By Yas +12 k à lettrer. Ratio liquidité global ${Math.round((RESEAU_CONSOLIDE.liquidite_totale / 1_750_000) * 100)} % vs réserves.`,
  chiffres_cles: [
    { label: 'Liquidité totale', valeur: formatFcfa(RESEAU_CONSOLIDE.liquidite_totale), tendance: 'BAISSE' as const, commentaire: '−300 k vs avril' },
    { label: 'Encours crédit', valeur: formatFcfa(RESEAU_CONSOLIDE.encours_total), tendance: 'HAUSSE' as const, commentaire: 'Besoin liquidité ↑' },
    { label: 'Agences tension', valeur: '2', tendance: 'STABLE' as const, commentaire: 'Bè Kpota, Hédzranawoé' },
    { label: 'Écarts clôture', valeur: formatFcfa(42_000), tendance: 'HAUSSE' as const, commentaire: 'Bè Kpota' },
  ],
  points_forts: [
    'Lomé Centre et Kpalimé : liquidité confortable (> 150 % réserve)',
    'Flooz : rapprochement 100 % conforme',
    'Virement inter-agence exécuté — Bè Kpota stabilisé partiellement',
  ],
  points_attention: [
    { titre: 'Bè Kpota — liquidité critique', detail: 'Ratio 112 % — décaissements 1,2 M prévus demain', severite: 'CRITIQUE' as const },
    { titre: 'Écart clôture +42 k FCFA', detail: 'Bè Kpota — investigation caissier requise', severite: 'HAUTE' as const },
    { titre: 'Mixx By Yas non rapproché +12 k', detail: '3 transactions J-1 — lettrage avant 19h', severite: 'MODEREE' as const },
  ],
  recommandations: [
    { priorite: 1 as const, action: 'Investiguer écart caisse Bè Kpota (+42 k)', impact_estime: 'Conformité interne', delai: 'Aujourd\'hui' },
    { priorite: 1 as const, action: 'Clôturer Hédzranawoé avant 18h', impact_estime: 'Reporting J+0', delai: 'Ce soir' },
    { priorite: 2 as const, action: 'Lettrer 3 opérations Mixx By Yas J-1', impact_estime: 'Écart MoMo = 0', delai: '19h' },
  ],
  previsions_30j: [],
  alertes_immediates: [
    '⚠ Bè Kpota : liquidité CRITIQUE',
    '⚠ Écart clôture +42 k non expliqué',
    'ℹ Hédzranawoé : caisse ouverte',
  ],
  comparaison_mois_precedent: [],
  points_forts_list: [] as string[],
  signature_ia: 'Prospera AI — Trésorerie réseau',
}

export function CaisseDgView() {
  const hub = getCaisseHub()
  const k = hub.kpis
  const [tab, setTab] = useState<Tab>('position')

  return (
    <PageWrapper
      title="Pilotage trésorerie réseau"
      subtitle={`${formatFcfa(k.liquidite_totale_fcfa)} liquidité · 5 agences · Caisse, Mixx By Yas & Flooz`}
      actions={
        <div className="flex items-center gap-2">
          {k.agences_en_tension > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-800 bg-red-50 border border-red-200 rounded-lg">
              {k.agences_en_tension} agence(s) en tension
            </span>
          )}
          <ExportButton label="Exporter trésorerie" filename="tresorerie_reseau" size="sm" />
        </div>
      }
    >
      <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-900">
        <strong>Trésorerie ≠ Épargne.</strong> Cette page pilote la liquidité opérationnelle de l&apos;IMF (caisse physique, float Mixx By Yas & Flooz).
        Les soldes épargne clients et produits sont sur{' '}
        <a href="/epargne" className="font-semibold underline hover:text-blue-700">Épargne réseau</a>.
      </div>

      <RapportIAGlobal
        rapport={{ ...RAPPORT_TRESORERIE, synthese_piliers: undefined, synthese_agences: undefined }}
        accentColor="orange"
        analyseLabel="Trésorerie réseau"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KpiCardWithSparkline title="Liquidité totale" value={k.liquidite_totale_fcfa} format="fcfa" variation={-2.6} variationLabel="vs avril" sparkline={RESEAU_CONSOLIDE.par_historique.map(h => h.liquidite)} sparklineLabels={RESEAU_CONSOLIDE.par_historique.map(h => h.mois)} colorScheme="teal" />
        <KpiCardWithSparkline title="Caisse physique" value={k.caisse_physique_fcfa} format="fcfa" sparkline={[3_800_000, 4_000_000, 4_100_000, 4_300_000, k.caisse_physique_fcfa]} sparklineLabels={['Jan', 'Fév', 'Mar', 'Avr', 'Mai']} colorScheme="blue" />
        <KpiCardWithSparkline title="Écarts clôture" value={k.ecart_cloture_fcfa} format="fcfa" variation={40} variationLabel="vs hier" sparkline={[0, 0, 18_000, 24_000, k.ecart_cloture_fcfa]} sparklineLabels={['Lun', 'Mar', 'Mer', 'Jeu', 'Ven']} colorScheme="red" invertVariation badge="J" />
        <KpiCardWithSparkline title="Ratio liquidité" value={k.ratio_liquidite_pct} format="pct" sparkline={[580, 590, 610, 635, k.ratio_liquidite_pct]} sparklineLabels={['Jan', 'Fév', 'Mar', 'Avr', 'Mai']} colorScheme="green" />
      </div>

      <details className="bg-slate-50 rounded-xl border border-slate-200 mb-5 group">
        <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer text-sm font-semibold text-slate-800 hover:bg-slate-100 rounded-xl transition-colors list-none">
          <BookOpen size={16} className="text-teal-600" />
          Comprendre la trésorerie réseau
        </summary>
        <div className="px-4 pb-4 grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {hub.glossaire.map(g => (
            <div key={g.terme} className="bg-white rounded-lg border border-slate-200 p-3">
              <div className="text-xs font-bold text-teal-700">{g.terme}</div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{g.definition}</p>
            </div>
          ))}
        </div>
      </details>

      <div className="flex flex-wrap gap-2 mb-4">
        {([
          { id: 'position' as const, label: 'Position (5 agences)', icon: Layers },
          { id: 'flux' as const, label: `Flux du jour (${hub.flux.length})`, icon: Vault },
          { id: 'clotures' as const, label: 'Clôtures', icon: Lock },
          { id: 'momo' as const, label: 'Rapprochement MoMo', icon: Smartphone },
          { id: 'virements' as const, label: `Virements (${hub.virements.length})`, icon: ArrowLeftRight },
        ]).map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer',
              tab === t.id ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100 bg-white border border-slate-200',
            )}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      <CaisseTables hub={hub} tab={tab} />
    </PageWrapper>
  )
}
