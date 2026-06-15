/**
 * Rapport IA DG — généré depuis agences.ts (AGENCES, AGENCES_DATA, RESEAU_CONSOLIDE).
 * Source de vérité unique pour cartes dashboard et analyse IA.
 */
import { AGENCES, AGENCES_DATA, RESEAU_CONSOLIDE, type Agence, type AgenceDetaillee } from './agences'
import {
  buildSyntheseAgencesDG,
  type SyntheseAgenceIA,
} from './synthese-agences-dg'
import type { RapportIA } from '@/types/rapport-ia'
import { buildDgMeta } from './mock-core-builder'

/** Indicateurs financiers/réglementaires hors fiche agence (consolidés DG) */
const DG_META = buildDgMeta()

function fmtPct(n: number, decimals = 1): string {
  return `${n.toFixed(decimals).replace('.', ',')} %`
}

function fmtPt(n: number): string {
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(1).replace('.', ',')} pt`
}

function fmtFcfaM(n: number): string {
  return `${(n / 1_000_000).toFixed(1).replace('.', ',')}M FCFA`
}

function collectePct(agence: Agence): number {
  return Math.round((agence.collecte_mois / agence.collecte_objectif) * 100)
}

function collectePctReseau(): number {
  return Math.round((RESEAU_CONSOLIDE.collecte_totale / RESEAU_CONSOLIDE.collecte_objectif) * 100)
}

function parReseauActuel(): number {
  const hist = RESEAU_CONSOLIDE.par_historique
  return hist[hist.length - 1]?.par_30j ?? RESEAU_CONSOLIDE.par_moyen
}

function encoursVarPct(): number {
  return Number(((RESEAU_CONSOLIDE.encours_total / DG_META.encours_mois_precedent - 1) * 100).toFixed(1))
}

function agencesTrieesParSante(): Array<{ agence: Agence; detail: AgenceDetaillee }> {
  return AGENCES.map(a => ({ agence: a, detail: AGENCES_DATA[a.id] }))
    .filter((x): x is { agence: Agence; detail: AgenceDetaillee } => !!x.detail)
    .sort((a, b) => b.detail.kpis.score_sante - a.detail.kpis.score_sante)
}

function nomsEquipe(detail: AgenceDetaillee): { ra: string; commerciaux: string[]; gps: string[] } {
  const commerciaux: string[] = []
  const gps: string[] = []
  let ra = ''
  for (const a of detail.agents_performance) {
    const r = (a.role ?? '').toLowerCase()
    if (r.includes('resp') || r.includes('agence')) ra = a.agent
    else if (r.includes('gp')) gps.push(a.agent)
    else commerciaux.push(a.agent)
  }
  return { ra, commerciaux, gps }
}

function buildSyntheseExecutive(): string {
  const par = parReseauActuel()
  const parDelta = par - DG_META.par_mois_precedent
  const encoursVar = encoursVarPct()
  const collecteRes = collectePctReseau()
  const prevJuin = RESEAU_CONSOLIDE.forecast[0]?.par_prevu ?? par - 0.6

  const meilleures = agencesTrieesParSante().slice(0, 2).map(x => x.agence.nom_court)
  const bk = AGENCES.find(a => a.id === 'AG-003')!
  const bkDetail = AGENCES_DATA['AG-003']
  const bkHist = bkDetail?.par_historique ?? []
  const bkParJan = bkHist[0]?.par_30j ?? bk.par_courant

  const p1 = `En mai 2026, le réseau de ${RESEAU_CONSOLIDE.total_agences} agences enregistre un encours de ${fmtFcfaM(RESEAU_CONSOLIDE.encours_total)} (${encoursVar > 0 ? '+' : ''}${encoursVar} % par rapport à avril) et un PAR consolidé de ${fmtPct(par)} (${fmtPt(parDelta)} vs avril). La dynamique est globalement favorable, mais inégalement répartie : ${meilleures.join(' et ')} tirent les résultats, tandis que Bè Kpota affiche un PAR de ${fmtPct(bk.par_courant)} et reste la seule agence au-dessus du seuil BCEAO de 10 %. Sans action sur ce site, la prévision de ${fmtPct(prevJuin)} fin juin reste incertaine.`

  const p2 = `Deux décisions sont attendues en comité ce mois-ci. Sur le plan réglementaire, il faut régulariser ${(DG_META.provisions_ecart / 1_000_000).toFixed(2).replace('.', ',')} million de provisions manquantes et valider un plan de redressement de 60 jours à Bè Kpota — le PAR y est passé de ${fmtPct(bkParJan)} en janvier à ${fmtPct(bk.par_courant)} en mai, mais le niveau reste non conforme (remboursement ${fmtPct(bk.taux_remboursement)}, collecte à ${collectePct(bk)} % de l'objectif).`

  const p3 = `Sur le plan opérationnel, le réseau compte ${RESEAU_CONSOLIDE.total_agents} agents (${RESEAU_CONSOLIDE.responsables_agence} responsables d'agence, ${RESEAU_CONSOLIDE.agents_terrain} agents terrain). La collecte consolidée atteint ${collecteRes} % de l'objectif mensuel et le taux de remboursement moyen s'établit à ${fmtPct(RESEAU_CONSOLIDE.taux_remb_moyen)}. L'enjeu pour la direction est le pilotage par agence : chaque responsable doit tenir la performance de son binôme commercial / GP, en s'appuyant sur les écarts visibles entre sites comparables.`

  return [p1, p2, p3].join('\n\n')
}

function buildSynthesePiliers(): { titre: string; contenu: string }[] {
  const par = parReseauActuel()
  const hist = RESEAU_CONSOLIDE.par_historique
  const parJan = hist[0]?.par_30j ?? par
  const collecteRes = collectePctReseau()
  const bk = AGENCES.find(a => a.id === 'AG-003')!
  const grpBk = AGENCES_DATA['AG-002']?.repartition_produits.find(p => p.produit.includes('groupe'))

  return [
    {
      titre: 'Portefeuille & risque crédit',
      contenu: `Le PAR réseau recule de ${fmtPct(parJan)} en janvier à ${fmtPct(par)} en mai (${fmtPt(par - parJan)}). Cette amélioration est portée par Lomé Centre (PAR ${fmtPct(AGENCES.find(a => a.id === 'AG-001')!.par_courant)}) et Kpalimé (${fmtPct(AGENCES.find(a => a.id === 'AG-005')!.par_courant)}), masquée partiellement par Bè Kpota (${fmtPct(bk.par_courant)}). Le crédit groupe reste un point sensible à Adidogomé (PAR produit ${fmtPct(grpBk?.par ?? 10.8)}). L'écart de provisions de ${fmtFcfaM(DG_META.provisions_ecart)} doit être comblé avant clôture.`,
    },
    {
      titre: 'Activité commerciale & collecte',
      contenu: `La collecte réseau atteint ${collecteRes} % de l'objectif (${fmtFcfaM(RESEAU_CONSOLIDE.collecte_totale)} sur ${fmtFcfaM(RESEAU_CONSOLIDE.collecte_objectif)} visés). Hédzranawoé (${collectePct(AGENCES.find(a => a.id === 'AG-004')!)} %) et Kpalimé (${collectePct(AGENCES.find(a => a.id === 'AG-005')!)} %) tirent l'écart vers le bas malgré des PAR sains. Lomé Centre (${collectePct(AGENCES.find(a => a.id === 'AG-001')!)} %) et Bè Kpota (${collectePct(bk)} %) nécessitent un suivi RA renforcé. Le réseau compte ${RESEAU_CONSOLIDE.total_agents} agents — la question n'est pas l'effectif, mais l'utilisation de l'équipe existante.`,
    },
    {
      titre: 'Rentabilité & trésorerie',
      contenu: `La liquidité consolidée s'établit à ${fmtFcfaM(RESEAU_CONSOLIDE.liquidite_totale)}. Kpalimé dispose d'un excédent structurel (liquidité agence ${fmtFcfaM(AGENCES_DATA['AG-005']?.kpis.liquidite_disponible ?? 0)}), tandis que Bè Kpota reste en tension (${fmtFcfaM(AGENCES_DATA['AG-003']?.kpis.liquidite_disponible ?? 0)} disponible). Les décaissements du mois : ${RESEAU_CONSOLIDE.decaissements_mois} dossiers pour ${fmtFcfaM(RESEAU_CONSOLIDE.montant_decaisse_mois)}.`,
    },
    {
      titre: 'Conformité BCEAO & audit',
      contenu: `Situation réglementaire : ${RESEAU_CONSOLIDE.agences_conformes} agences conformes, ${RESEAU_CONSOLIDE.agences_attention} en attention, ${RESEAU_CONSOLIDE.agences_non_conformes} non conforme (Bè Kpota, PAR ${fmtPct(bk.par_courant)}). Provisions à constituer : ${fmtFcfaM(DG_META.provisions_ecart)}. Un audit terrain indépendant est recommandé sur Bè Kpota avant toute mesure disciplinaire (signaux GPS sur le GP Kossi Adjavon).`,
    },
    {
      titre: 'Prévisions juin',
      contenu: `Sous réserve d'un plan actif à Bè Kpota, le PAR réseau pourrait atteindre ${fmtPct(RESEAU_CONSOLIDE.forecast[0]?.par_prevu ?? 7.6)} en juin (confiance ${RESEAU_CONSOLIDE.forecast[0]?.confidence ?? 82} %). Collecte prévue : ${fmtFcfaM(RESEAU_CONSOLIDE.forecast[0]?.collecte_prevue ?? 14_800_000)}. Sans correction, le scénario dégradé ramènerait le PAR au-dessus de 9 % et effacerait une partie des gains depuis janvier.`,
    },
  ]
}

function buildPointsForts(): string[] {
  const top = agencesTrieesParSante()
  const points: string[] = []
  for (const { agence, detail } of top.slice(0, 2)) {
    points.push(
      `${agence.nom_court} — PAR ${fmtPct(agence.par_courant)}, remboursement ${fmtPct(agence.taux_remboursement)}, score santé ${detail.kpis.score_sante}/100`,
    )
  }
  points.push(
    `PAR réseau en baisse : ${fmtPct(DG_META.par_mois_precedent)} → ${fmtPct(parReseauActuel())} (${fmtPt(parReseauActuel() - DG_META.par_mois_precedent)})`,
  )
  points.push(`Encours en croissance : ${fmtFcfaM(RESEAU_CONSOLIDE.encours_total)} (+${encoursVarPct()} % vs avril)`)
  const kofi = AGENCES_DATA['AG-001']?.agents_performance.find(a => a.agent === 'Kofi Amavi')
  if (kofi) {
    points.push(`Kofi Amavi (Lomé Centre) — score ${kofi.score}/100, meilleur RA du réseau`)
  }
  return points.slice(0, 5)
}

function buildPointsAttention(): RapportIA['points_attention'] {
  const bk = AGENCES.find(a => a.id === 'AG-003')!
  const ad = AGENCES.find(a => a.id === 'AG-002')!
  const items: RapportIA['points_attention'] = [
    {
      titre: 'Bè Kpota — Non-conformité BCEAO',
      detail: `PAR ${fmtPct(bk.par_courant)} > seuil 10 %. Remboursement ${fmtPct(bk.taux_remboursement)}. Plan de redressement 60 jours requis.`,
      severite: 'CRITIQUE',
    },
    {
      titre: 'Bè Kpota — Intégrité données terrain',
      detail: 'Anomalies GPS signalées sur Kossi Adjavon (GP). Audit indépendant recommandé.',
      severite: 'CRITIQUE',
    },
    {
      titre: `Provisions à constituer : ${fmtFcfaM(DG_META.provisions_ecart)}`,
      detail: `Écart réglementaire à régulariser avant clôture mai (provisions constituées ${fmtFcfaM(DG_META.provisions_constituees)}).`,
      severite: 'HAUTE',
    },
  ]
  if (ad.par_courant >= 9) {
    items.push({
      titre: 'Adidogomé — Proximité seuil BCEAO',
      detail: `PAR ${fmtPct(ad.par_courant)} — marge de ${fmtPt(10 - ad.par_courant)} avant le seuil. Crédit groupe à ${fmtPct(AGENCES_DATA['AG-002']?.repartition_produits.find(p => p.produit.includes('groupe'))?.par ?? 10.8)}.`,
      severite: 'HAUTE',
    })
  }
  items.push({
    titre: `Collecte réseau — ${collectePctReseau()} % objectif`,
    detail: `Retard de ${fmtFcfaM(RESEAU_CONSOLIDE.collecte_objectif - RESEAU_CONSOLIDE.collecte_totale)} vs cible mensuelle.`,
    severite: 'MODEREE',
  })
  return items
}

function buildRecommandations(): RapportIA['recommandations'] {
  const bkEquipe = nomsEquipe(AGENCES_DATA['AG-003'])
  return [
    {
      priorite: 1,
      action: `Valider le plan de redressement Bè Kpota (${bkEquipe.ra} — restructuration dossiers + audit terrain GP)`,
      impact_estime: `PAR cible < 10 % sous 60 j`,
      delai: 'Comité direction — cette semaine',
    },
    {
      priorite: 1,
      action: `Constituer ${fmtFcfaM(DG_META.provisions_ecart)} de provisions complémentaires`,
      impact_estime: 'Conformité réglementaire juin',
      delai: 'Avant 31/05/2026',
    },
    {
      priorite: 2,
      action: 'Revue mensuelle PAR + collecte par responsable d\'agence (seuils d\'alerte automatiques)',
      impact_estime: 'Pilotage homogène sur 5 sites',
      delai: 'Juin 2026',
    },
    {
      priorite: 2,
      action: 'Coaching Mensah Kodjo (Lomé Centre) — recouvrement à 48 % vs 91 % pour Yawo Adjavon',
      impact_estime: 'Réduction écart interne Lomé Centre',
      delai: '7 jours',
    },
    {
      priorite: 3,
      action: `Traiter les ${DG_META.dossiers_rejetes} dossiers crédit rejetés ce mois en comité`,
      impact_estime: 'Taux d\'approbation stabilisé',
      delai: 'Juin 2026',
    },
  ]
}

function buildAlertes(): string[] {
  const bk = AGENCES.find(a => a.id === 'AG-003')!
  return [
    `🚨 Bè Kpota — PAR ${fmtPct(bk.par_courant)} : seule agence hors seuil BCEAO`,
    `🚨 Provisions — écart ${fmtFcfaM(DG_META.provisions_ecart)} à régulariser avant clôture mai`,
    '⚠ Bè Kpota — audit terrain recommandé (Kossi Adjavon, GP)',
    `⚠ ${DG_META.dossiers_rejetes} dossiers crédit rejetés ce mois — analyse comité crédit`,
    `ℹ Collecte réseau à ${collectePctReseau()} % de l'objectif`,
  ]
}

function buildChiffresCles(): RapportIA['chiffres_cles'] {
  return [
    {
      label: 'Agents réseau',
      valeur: String(RESEAU_CONSOLIDE.total_agents),
      tendance: 'STABLE',
      commentaire: `${RESEAU_CONSOLIDE.responsables_agence} RA · ${RESEAU_CONSOLIDE.agents_terrain} terrain`,
    },
    {
      label: 'Encours total',
      valeur: fmtFcfaM(RESEAU_CONSOLIDE.encours_total),
      tendance: 'HAUSSE',
      commentaire: `+${encoursVarPct()} % vs avril`,
    },
    {
      label: 'PAR 30j réseau',
      valeur: fmtPct(parReseauActuel()),
      tendance: 'BAISSE',
      commentaire: `${fmtPt(parReseauActuel() - DG_META.par_mois_precedent)} vs avril`,
    },
    {
      label: 'Expected Loss',
      valeur: fmtFcfaM(DG_META.expected_loss_fcfa),
      tendance: 'BAISSE',
      commentaire: 'Consolidé risque',
    },
    {
      label: 'Provisions BCEAO',
      valeur: fmtFcfaM(DG_META.provisions_constituees),
      tendance: 'HAUSSE',
      commentaire: `Écart à constituer : ${(DG_META.provisions_ecart / 1_000_000).toFixed(2).replace('.', ',')}M`,
    },
    {
      label: 'Comptes épargne',
      valeur: String(DG_META.comptes_epargne),
      tendance: 'HAUSSE',
      commentaire: `+${DG_META.comptes_epargne_delta} ce mois`,
    },
    {
      label: 'Transactions/mois',
      valeur: String(DG_META.transactions_mois),
      tendance: 'HAUSSE',
      commentaire: `+${DG_META.transactions_delta_pct} % vs avril`,
    },
    {
      label: 'Décaissements',
      valeur: `${DG_META.decaissements_mois} dossiers`,
      tendance: 'HAUSSE',
      commentaire: fmtFcfaM(DG_META.decaissements_montant),
    },
    {
      label: 'Taux d\'approbation',
      valeur: fmtPct(DG_META.taux_approbation),
      tendance: 'BAISSE',
      commentaire: 'Exigence accrue',
    },
  ]
}

/** Rapport IA DG complet — dérivé de agences.ts */
export function buildRapportIADG(): RapportIA {
  const par = parReseauActuel()
  const prevJuin = RESEAU_CONSOLIDE.forecast[0]?.par_prevu ?? 7.6

  return {
    date_generation: '21/05/2026 à 06:00',
    periode: 'Mai 2026 — Vue consolidée 5 agences',
    destinataire: 'Directeur Général',
    synthese_executive: buildSyntheseExecutive(),
    synthese_piliers: buildSynthesePiliers(),
    synthese_agences: buildSyntheseAgencesDG(),
    chiffres_cles: buildChiffresCles(),
    points_forts: buildPointsForts(),
    points_attention: buildPointsAttention(),
    recommandations: buildRecommandations(),
    previsions_30j: [
      {
        metrique: 'PAR 30j réseau',
        valeur_actuelle: fmtPct(par),
        valeur_prevue: fmtPct(prevJuin),
        confidence: RESEAU_CONSOLIDE.forecast[0]?.confidence ?? 82,
      },
      {
        metrique: 'Encours total',
        valeur_actuelle: fmtFcfaM(RESEAU_CONSOLIDE.encours_total),
        valeur_prevue: fmtFcfaM(Math.round(RESEAU_CONSOLIDE.encours_total * 1.071)),
        confidence: 79,
      },
      {
        metrique: 'Expected Loss',
        valeur_actuelle: fmtFcfaM(DG_META.expected_loss_fcfa),
        valeur_prevue: fmtFcfaM(2_710_000),
        confidence: 74,
      },
      {
        metrique: 'Décaissements',
        valeur_actuelle: `${DG_META.decaissements_mois}/mois`,
        valeur_prevue: '48/mois',
        confidence: 81,
      },
      {
        metrique: 'Comptes épargne',
        valeur_actuelle: String(DG_META.comptes_epargne),
        valeur_prevue: String(DG_META.comptes_epargne + 11),
        confidence: 86,
      },
      {
        metrique: 'Transactions',
        valeur_actuelle: `${DG_META.transactions_mois}/mois`,
        valeur_prevue: '785/mois',
        confidence: 84,
      },
    ],
    alertes_immediates: buildAlertes(),
    comparaison_mois_precedent: [
      {
        metrique: 'Encours',
        mois_precedent: fmtFcfaM(DG_META.encours_mois_precedent),
        mois_courant: fmtFcfaM(RESEAU_CONSOLIDE.encours_total),
        variation_pct: encoursVarPct(),
      },
      {
        metrique: 'PAR 30j',
        mois_precedent: fmtPct(DG_META.par_mois_precedent),
        mois_courant: fmtPct(par),
        variation_pct: Number(((par - DG_META.par_mois_precedent) / DG_META.par_mois_precedent * 100).toFixed(1)),
      },
      {
        metrique: 'Décaissements',
        mois_precedent: String(DG_META.decaissements_mois_precedent),
        mois_courant: String(DG_META.decaissements_mois),
        variation_pct: Number(((DG_META.decaissements_mois - DG_META.decaissements_mois_precedent) / DG_META.decaissements_mois_precedent * 100).toFixed(1)),
      },
      {
        metrique: 'Comptes épargne',
        mois_precedent: String(DG_META.comptes_epargne_mois_precedent),
        mois_courant: String(DG_META.comptes_epargne),
        variation_pct: Number(((DG_META.comptes_epargne - DG_META.comptes_epargne_mois_precedent) / DG_META.comptes_epargne_mois_precedent * 100).toFixed(1)),
      },
      {
        metrique: 'Transactions',
        mois_precedent: String(DG_META.transactions_mois_precedent),
        mois_courant: String(DG_META.transactions_mois),
        variation_pct: DG_META.transactions_delta_pct,
      },
      {
        metrique: 'Provisions',
        mois_precedent: fmtFcfaM(DG_META.provisions_mois_precedent),
        mois_courant: fmtFcfaM(DG_META.provisions_constituees),
        variation_pct: Number(((DG_META.provisions_constituees - DG_META.provisions_mois_precedent) / DG_META.provisions_mois_precedent * 100).toFixed(1)),
      },
    ],
    signature_ia: 'Prospera AI v2.4 — Rapport généré automatiquement chaque jour à 06:00 — Précision globale 91.3%',
  }
}

export type { SyntheseAgenceIA }
