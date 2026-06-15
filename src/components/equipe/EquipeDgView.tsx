'use client'

import { BookOpen } from 'lucide-react'
import { getEquipeHub } from '@/lib/equipe-hub'
import { AGENCES, RESEAU_CONSOLIDE } from '@/lib/agences'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { RapportIAGlobal } from '@/components/dashboard/RapportIAGlobal'
import { KpiCardWithSparkline } from '@/components/dashboard/KpiCardWithSparkline'
import { ExportButton } from '@/components/dashboard/ExportButton'
import { EquipeTables, EquipeRepartitionAgences } from '@/components/equipe/EquipeTables'
import { formatFcfa } from '@/lib/utils'

const bkAgence = AGENCES.find(a => a.id === 'AG-003')!
const collecteRes = Math.round((RESEAU_CONSOLIDE.collecte_totale / RESEAU_CONSOLIDE.collecte_objectif) * 100)

const RAPPORT_EQUIPE = {
  date_generation: '28/05/2026 à 06:00',
  periode: 'Mai 2026 — Performance équipes réseau',
  destinataire: 'Directeur Général',
  synthese_executive:
    `Performance réseau — mai 2026. Collecte à ${collecteRes} % de l'objectif, recouvrement moyen ${RESEAU_CONSOLIDE.taux_remb_moyen} %. Le réseau (${RESEAU_CONSOLIDE.total_agents} agents, ${RESEAU_CONSOLIDE.responsables_agence} RA et ${RESEAU_CONSOLIDE.agents_terrain} agents terrain sur ${RESEAU_CONSOLIDE.total_agences} agences) progresse globalement, mais deux signaux nécessitent une intervention : (1) Bè Kpota — PAR agence ${bkAgence.par_courant.toString().replace('.', ',')} %, remboursement ${bkAgence.taux_remboursement} %, statut BCEAO non conforme ; (2) Lomé Centre — écart de recouvrement entre Yawo Adjavon (91 %) et Mensah Kodjo (48 %). Recommandation : revue des 5 responsables d'agence en comité, avec plan d'accompagnement ciblé.`,
  chiffres_cles: [
    { label: 'Agents réseau', valeur: String(RESEAU_CONSOLIDE.total_agents), tendance: 'STABLE' as const, commentaire: `${RESEAU_CONSOLIDE.responsables_agence} RA · ${RESEAU_CONSOLIDE.agents_terrain} terrain` },
    { label: 'Collecte objectif', valeur: '76,9 %', tendance: 'BAISSE' as const, commentaire: '−3,1 pt vs avril' },
    { label: 'Recouvrement moy.', valeur: `${RESEAU_CONSOLIDE.taux_remb_moyen} %`, tendance: 'HAUSSE' as const, commentaire: 'Tendance positive' },
    { label: 'Agents dégradés', valeur: '2', tendance: 'HAUSSE' as const, commentaire: 'Action sous 7 j' },
  ],
  points_forts: [
    'Kofi Amavi — PAR agence 5,9 %, pilotage Lomé Centre',
    'Mawunya Kpodzo — GP suivi portefeuille (89 % recouvrement)',
    'Yawo Adjavon — commercial référence zone Marché',
    'Ama Fiagbé — PAR 4,2 %, score santé 91/100, meilleur RA du réseau',
  ],
  points_attention: [
    { titre: 'Bè Kpota — PAR et gouvernance agence', detail: `PAR agence ${bkAgence.par_courant} % — plan redressement RA à valider en comité direction`, severite: 'CRITIQUE' as const },
    { titre: 'Lomé Centre — couverture zone Tokoin', detail: 'Retard de collecte sur une zone — coaching commercial via le RA, pas arbitrage DG direct', severite: 'HAUTE' as const },
    { titre: 'Bè Kpota — intégrité données terrain', detail: 'Audit indépendant recommandé avant mesure disciplinaire', severite: 'CRITIQUE' as const },
  ],
  recommandations: [
    { priorite: 1 as const, action: 'Plan coaching Mensah Kodjo — 7 jours', impact_estime: 'Recouvrement +15 pt', delai: 'Cette semaine' },
    { priorite: 1 as const, action: 'Audit GPS équipe Bè Kpota (Kossi Adjavon)', impact_estime: 'Conformité interne', delai: '48h' },
    { priorite: 2 as const, action: 'Documenter bonnes pratiques Yawo Adjavon (commercial zone)', impact_estime: 'Formation réseau', delai: 'Juin' },
  ],
  previsions_30j: [],
  alertes_immediates: [
    '⚠ Mensah Kodjo — statut DEGRADE',
    '⚠ Kossi Adjavon — audit GPS Bè Kpota',
    'ℹ Collecte réseau −3,1 pt vs objectif',
  ],
  comparaison_mois_precedent: [],
  points_forts_list: [] as string[],
  signature_ia: 'Prospera AI — Équipe & Performance',
}

export function EquipeDgView() {
  const hub = getEquipeHub()
  const k = hub.kpis

  return (
    <PageWrapper
      title="Équipe & Performance réseau"
      subtitle={`${k.total_agents} agents · ${k.performance_moyenne_pct} % perf. moyenne · Classement & objectifs`}
      actions={
        <div className="flex items-center gap-2">
          {k.agents_degrades > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-800 bg-red-50 border border-red-200 rounded-lg">
              {k.agents_degrades} agent(s) dégradé(s)
            </span>
          )}
          <ExportButton label="Exporter équipe" filename="equipe_performance" size="sm" />
        </div>
      }
    >
      <RapportIAGlobal
        rapport={{ ...RAPPORT_EQUIPE, synthese_piliers: undefined, synthese_agences: undefined }}
        accentColor="indigo"
        analyseLabel="Équipe réseau"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KpiCardWithSparkline title="Performance moyenne" value={k.performance_moyenne_pct} format="pct" variation={2.4} variationLabel="vs avril" sparkline={[72, 74, 76, 78, k.performance_moyenne_pct]} sparklineLabels={['Jan', 'Fév', 'Mar', 'Avr', 'Mai']} colorScheme="purple" />
        <KpiCardWithSparkline title="Objectif collecte" value={k.objectif_atteint_pct} format="pct" variation={-3.1} variationLabel="vs avril" sparkline={[82, 80, 79, 78, k.objectif_atteint_pct]} sparklineLabels={['Jan', 'Fév', 'Mar', 'Avr', 'Mai']} colorScheme="orange" invertVariation />
        <KpiCardWithSparkline title="Recouvrement moy." value={k.recouvrement_moyen_pct} format="pct" variation={1.8} variationLabel="vs avril" sparkline={[85, 86, 87, 88, k.recouvrement_moyen_pct]} sparklineLabels={['Jan', 'Fév', 'Mar', 'Avr', 'Mai']} colorScheme="green" />
        <KpiCardWithSparkline title="Clients portefeuille" value={k.clients_portefeuille_total} format="number" sparkline={[280, 295, 310, 325, k.clients_portefeuille_total]} sparklineLabels={['Jan', 'Fév', 'Mar', 'Avr', 'Mai']} colorScheme="teal" />
      </div>

      <EquipeRepartitionAgences hub={hub} />

      <details className="bg-slate-50 rounded-xl border border-slate-200 mb-5 group">
        <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer text-sm font-semibold text-slate-800 hover:bg-slate-100 rounded-xl transition-colors list-none">
          <BookOpen size={16} className="text-teal-600" />
          Comprendre les indicateurs performance
        </summary>
        <div className="px-4 pb-4 grid md:grid-cols-2 gap-3">
          {hub.glossaire.map(g => (
            <div key={g.terme} className="bg-white rounded-lg border border-slate-200 p-3">
              <div className="text-xs font-bold text-teal-700">{g.terme}</div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{g.definition}</p>
            </div>
          ))}
        </div>
      </details>

      <EquipeTables hub={hub} />
    </PageWrapper>
  )
}
