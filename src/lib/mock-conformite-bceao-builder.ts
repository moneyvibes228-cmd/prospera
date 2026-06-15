/**
 * Conformité BCEAO — dérivée de portefeuille-reseau, agences et time-series.
 */
import { AGENCES } from './agences'
import { buildBceaoRepartition } from './portefeuille-reseau'
import { getMoisCourant, RESEAU_MENSUEL } from './mock-time-series'

const JOURS_RAPPORT_BCEAO = 8

function fmtPct(n: number, digits = 1): string {
  return `${n.toFixed(digits).replace('.', ',')}%`
}

function fmtM(n: number): string {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1).replace('.', ',')}M` : `${Math.round(n / 1000)}k`
}

export function buildConformiteBceao() {
  const m = getMoisCourant()
  const bceao = buildBceaoRepartition()
  const beKpota = AGENCES.find(a => a.id === 'AG-003')
  const parBeKpota = beKpota?.par_courant ?? 11.2
  const performant = bceao.classes.find(c => c.code === 'PERFORMANT')
  const douteux = bceao.classes.find(c => c.code === 'DOUTEUX')
  const pctPerformant = performant?.pct_count ?? 0
  const pctDouteux = douteux?.pct_count ?? 0

  const ratioTransformation = 71
  const ratioSolvabilite = 8.4
  const ratioLiquidite = 82
  const couvertureProvisions = bceao.total_provisions_a_constituer > 0
    ? Number(((bceao.total_provisions_constituees / bceao.total_provisions_a_constituer) * 100).toFixed(1))
    : 78.1
  const concentrationTop2 = 37
  const coeffExploitation = 68
  const resultatNetEncours = m.encours_fcfa > 0
    ? Number(((m.collecte_fcfa * 0.22 * 0.33 / m.encours_fcfa) * 100).toFixed(1))
    : 5.9

  const ratios = [
    { indicateur: 'PAR > 30 jours réseau', valeur: fmtPct(m.par_30), seuil: '< 10%', statut: m.par_30 < 10 ? 'CONFORME' as const : 'NON_CONFORME' as const, delta: Number((m.par_30 - 10).toFixed(1)), unite: '%', description: 'Portefeuille à risque > 30 jours / Encours total' },
    { indicateur: 'PAR > 30j — Bè Kpota', valeur: fmtPct(parBeKpota), seuil: '< 10%', statut: parBeKpota < 10 ? 'CONFORME' as const : 'NON_CONFORME' as const, delta: Number((parBeKpota - 10).toFixed(1)), unite: '%', description: 'Agence Bè Kpota hors seuil — plan de redressement requis' },
    { indicateur: 'PAR > 90 jours', valeur: fmtPct(m.par_90), seuil: '< 5%', statut: m.par_90 < 5 ? 'CONFORME' as const : 'NON_CONFORME' as const, delta: Number((m.par_90 - 5).toFixed(1)), unite: '%', description: 'Portefeuille à risque > 90 jours / Encours total' },
    { indicateur: 'Ratio de solvabilité', valeur: fmtPct(ratioSolvabilite), seuil: '≥ 8%', statut: ratioSolvabilite >= 8 ? 'ATTENTION' as const : 'NON_CONFORME' as const, delta: 0.4, unite: '%', description: 'Fonds propres nets / Risques pondérés — norme BCEAO/Bâle I' },
    { indicateur: 'Ratio de liquidité', valeur: `${ratioLiquidite}%`, seuil: '≥ 80%', statut: 'CONFORME' as const, delta: 2.0, unite: '%', description: 'Actifs liquides / Passifs à court terme (≤ 3 mois)' },
    { indicateur: 'Ratio de transformation', valeur: `${ratioTransformation}%`, seuil: '≥ 80%', statut: 'NON_CONFORME' as const, delta: -9.0, unite: '%', description: 'Ressources stables (> 1 an) / Emplois long terme' },
    { indicateur: 'Concentration risques (top 2)', valeur: `${concentrationTop2}%`, seuil: '≤ 25%', statut: 'NON_CONFORME' as const, delta: 12, unite: '%', description: "Top 2 emprunteurs d'un agent / Encours agent — seuil BCEAO" },
    { indicateur: 'Couverture provisions', valeur: `${couvertureProvisions}%`, seuil: '100%', statut: couvertureProvisions >= 100 ? 'CONFORME' as const : 'NON_CONFORME' as const, delta: Number((couvertureProvisions - 100).toFixed(1)), unite: '%', description: `Provisions constituées (${fmtM(bceao.total_provisions_constituees)}) / Provisions requises (${fmtM(bceao.total_provisions_a_constituer)})` },
    { indicateur: "Coefficient d'exploitation", valeur: `${coeffExploitation}%`, seuil: '≤ 75%', statut: 'CONFORME' as const, delta: -7.0, unite: '%', description: "Charges opérationnelles / Produits d'exploitation" },
    { indicateur: 'Résultat net / Encours', valeur: fmtPct(resultatNetEncours), seuil: '≥ 3%', statut: resultatNetEncours >= 3 ? 'CONFORME' as const : 'NON_CONFORME' as const, delta: Number((resultatNetEncours - 3).toFixed(1)), unite: '%', description: 'Indicateur de rentabilité minimale exigée' },
  ]

  const ncCount = ratios.filter(r => r.statut === 'NON_CONFORME').length
  const scoreGlobal = Math.max(50, Math.min(95, 88 - ncCount * 4 - (parBeKpota >= 10 ? 2 : 0)))

  const classesCbi = bceao.classes.map(c => ({
    code: c.code,
    label: c.label,
    count: c.count,
    encours: c.encours,
    pct_portefeuille: Number(c.pct_encours.toFixed(1)),
    taux_provision_requis: c.provision_taux,
    provision_requise: c.provision_fcfa,
    provision_constituee: Math.round(c.provision_fcfa * (couvertureProvisions / 100)),
    ecart: Math.round(c.provision_fcfa * (1 - couvertureProvisions / 100)),
    statut: c.code === 'PERFORMANT' ? 'OK' as const : 'ALERTE' as const,
  }))

  const ecartProvision = bceao.ecart_provisions

  return {
    score_global: scoreGlobal,
    niveau: (scoreGlobal >= 85 ? 'CONFORME' : scoreGlobal >= 70 ? 'ATTENTION' : 'NON_CONFORME') as 'CONFORME' | 'ATTENTION' | 'NON_CONFORME',
    date_evaluation: '23/05/2026',
    prochain_rapport_bceao: '31/05/2026',
    jours_avant_rapport: JOURS_RAPPORT_BCEAO,

    synthese_ia_bceao: `L'institution présente un profil de conformité BCEAO acceptable (${scoreGlobal}/100) mais ${ncCount} ratios critiques nécessitent une attention immédiate avant la remise du rapport mensuel dans ${JOURS_RAPPORT_BCEAO} jours. Le ratio de transformation est en dessous du seuil réglementaire (${ratioTransformation}% vs 80% requis). L'écart de provisions BCEAO persiste à ${fmtM(ecartProvision)} FCFA. La concentration des risques sur 2 agents dépasse le seuil de 25%.`,
    points_ia_bceao: [
      { tone: 'critique' as const, texte: `Ratio de transformation : ${ratioTransformation}% — en dessous du seuil BCEAO de 80%. Ressources stables insuffisantes pour couvrir les emplois longs.`, action: 'Alerter DAF immédiatement pour renforcement des ressources stables' },
      { tone: 'critique' as const, texte: `Écart provisions non régularisé : ${fmtM(ecartProvision)} FCFA manquants (constitués ${fmtM(bceao.total_provisions_constituees)} / requis ${fmtM(bceao.total_provisions_a_constituer)}). Rapport BCEAO impacté dans ${JOURS_RAPPORT_BCEAO} jours.`, action: 'Constituer les provisions complémentaires avant la clôture mensuelle' },
      { tone: 'negatif' as const, texte: `Concentration risques dépassée : agents Koku Ablam (37%) et Mawu Lawson (28%) — seuil BCEAO 25%. 2 dépassements simultanés.`, action: 'Signalement ROC + réallocation portefeuille obligatoire avant rapport' },
      { tone: 'attention' as const, texte: `Ratio de solvabilité à ${ratioSolvabilite}% (seuil BCEAO 8%) — marge de sécurité très étroite. Tout choc de crédit pourrait entraîner une non-conformité.`, action: 'Surveiller mensuellement + plan de renforcement fonds propres' },
      { tone: 'attention' as const, texte: `PAR 30j réseau à ${fmtPct(m.par_30)} — en dessous du seuil (10%) mais l'agence Bè Kpota à ${fmtPct(parBeKpota)} est non conforme. Rapport individuel requis.`, action: 'Plan de redressement Bè Kpota à soumettre à la BCEAO avant 31/07/2026' },
      { tone: 'positif' as const, texte: `PAR 90j à ${fmtPct(m.par_90)} — largement conforme (seuil 5%). Classes Compromis et Perte bien maîtrisées.` },
      { tone: 'positif' as const, texte: `Ratio de liquidité à ${ratioLiquidite}% — conforme au seuil BCEAO de 80%. Aucun risque de liquidité immédiat.` },
      { tone: 'info' as const, texte: `Prochain rapport BCEAO dans ${JOURS_RAPPORT_BCEAO} jours. ${ncCount + 1} indicateurs à mettre à jour : PAR Bè Kpota, provisions, concentration, ratio transformation.` },
    ],

    ratios_reglementaires: ratios,
    classes_cbi: classesCbi,
    total_provision_requise: bceao.total_provisions_a_constituer,
    total_provision_constituee: bceao.total_provisions_constituees,
    ecart_provision_total: ecartProvision,

    calendrier_rapports: [
      { rapport: 'Rapport mensuel BCEAO', echeance: '31/05/2026', jours_restants: JOURS_RAPPORT_BCEAO, statut: 'EN_COURS' as const, indicateurs_a_update: ['PAR Bè Kpota', 'Provisions', 'Concentration risques', 'Ratio transformation'] },
      { rapport: 'Rapport trimestriel (T2)', echeance: '15/07/2026', jours_restants: 53, statut: 'A_PREPARER' as const, indicateurs_a_update: ['Solvabilité', 'Liquidité', 'Plan redressement Bè Kpota'] },
      { rapport: 'Plan de redressement Bè Kpota', echeance: '31/07/2026', jours_restants: 69, statut: 'A_PREPARER' as const, indicateurs_a_update: ['PAR Bè Kpota', 'Actions correctives', 'Engagement DG'] },
      { rapport: 'Rapport semestriel BCEAO', echeance: '31/08/2026', jours_restants: 100, statut: 'PLANIFIE' as const, indicateurs_a_update: ['Tous ratios', 'Bilan complet', 'Résultat semestriel'] },
    ],

    historique_conformite: RESEAU_MENSUEL.map((x, i) => ({
      mois: x.label,
      score: 71 + i,
      par: x.par_30,
      solvabilite: 7.9 + i * 0.1,
      statut: x.par_30 >= 10 ? 'NON_CONFORME' as const : x.par_30 >= 9 ? 'ATTENTION' as const : 'ATTENTION' as const,
    })),

    /** Métadonnées dérivées pour narratifs crédit/risque */
    pct_performant: Number(pctPerformant.toFixed(1)),
    pct_douteux: Number(pctDouteux.toFixed(1)),
  }
}

export const CONFORMITE_BCEAO_SCORE = buildConformiteBceao().score_global
