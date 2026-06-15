/**
 * Métriques portefeuille GP — Lomé Centre (300 clients, Mawunya Kpodzo).
 * Source de vérité alignée sur PORTEFEUILLE_AGENCES + AGENCES + emprunteurs réseau.
 */
import { AGENCES, AGENCES_DATA } from '@/lib/agences'
import { buildEmprunteursReseau } from '@/lib/emprunteurs-builder'
import { getMoisCourant, buildParGranulaireFromPar30, sparkline, variationMoM } from '@/lib/mock-time-series'
import { getPortefeuilleAgence } from '@/lib/portefeuille-agences-config'
import type { Borrower } from '@/types'

export const GP_AGENCE_ID = 'AG-001'
export const GP_AGENCE_NOM = 'Lomé Centre'
/** Collecte mensuelle GP (agents_performance Lomé Centre) */
export const GP_COLLECTE_MOIS_FCFA = 8_200_000
export const GP_RECOUVREMENT_PCT = 89

export interface GpClientPrioritaire {
  borrowerId: string
  nom: string
  encours: number
  retard_j: number
  score: number
  risque: 'CRITIQUE' | 'HAUT' | 'MOYEN' | 'FAIBLE'
  segment: string
  telephone: string
  suggestion_ia: string
  action_prioritaire?: string
}

export function getGpEmprunteursLomeCentre(): Borrower[] {
  return buildEmprunteursReseau().filter(b => b.zone === GP_AGENCE_NOM)
}

function risqueFromRetard(j: number): GpClientPrioritaire['risque'] {
  if (j > 45) return 'CRITIQUE'
  if (j > 20) return 'HAUT'
  if (j > 7) return 'MOYEN'
  return 'FAIBLE'
}

function suggestionFromBorrower(b: Borrower): { suggestion_ia: string; action_prioritaire?: string } {
  if (b.retard_jours > 45) {
    return { suggestion_ia: 'Escalade superviseur — probabilité défaut élevée', action_prioritaire: 'Visite urgente' }
  }
  if (b.retard_jours > 30) {
    return { suggestion_ia: 'Restructuration ou contentieux — plan non respecté', action_prioritaire: 'Arbitrage RA' }
  }
  if (b.retard_jours > 14) {
    return { suggestion_ia: 'Inactif WhatsApp — visite porte-à-porte prioritaire', action_prioritaire: 'Visite terrain' }
  }
  if (b.retard_jours > 0) {
    return { suggestion_ia: 'Relance MoMo + appel — score en surveillance', action_prioritaire: 'Relancer' }
  }
  return { suggestion_ia: 'Profil sain — fidélisation ou renouvellement', action_prioritaire: undefined }
}

export function buildGpClientsPrioritaires(limit = 12): GpClientPrioritaire[] {
  return getGpEmprunteursLomeCentre()
    .filter(b => b.retard_jours > 0)
    .sort((a, b) => b.retard_jours - a.retard_jours || a.score_ia - b.score_ia)
    .slice(0, limit)
    .map(b => {
      const { suggestion_ia, action_prioritaire } = suggestionFromBorrower(b)
      return {
        borrowerId: b.id,
        nom: b.nom,
        encours: b.montant_credit - b.montant_rembourse,
        retard_j: b.retard_jours,
        score: b.score_ia,
        risque: risqueFromRetard(b.retard_jours),
        segment: b.statut === 'DEFAUT' ? 'PME' : b.statut === 'RESTRUCTURE' ? 'Commerce' : 'Artisanat',
        telephone: b.telephone,
        suggestion_ia,
        action_prioritaire,
      }
    })
}

export function buildGpLomeCentreStats() {
  const agence = AGENCES.find(a => a.id === GP_AGENCE_ID)!
  const cfg = getPortefeuilleAgence(GP_AGENCE_ID)!
  const emprunteurs = getGpEmprunteursLomeCentre()
  const encoursRestant = emprunteurs.reduce((s, b) => s + (b.montant_credit - b.montant_rembourse), 0)
  const enRetard = emprunteurs.filter(b => b.retard_jours > 0)
  const parGran = buildParGranulaireFromPar30(agence.par_courant, agence.encours_fcfa)
  const clientsPrioritaires = buildGpClientsPrioritaires(12)
  const clientsCritiques = clientsPrioritaires.filter(c => c.risque === 'CRITIQUE' || c.risque === 'HAUT')
  const m = getMoisCourant()
  const agenceDetail = AGENCES_DATA[GP_AGENCE_ID]
  const aging = agenceDetail.portefeuille_aging
  const tranche1_30 = aging.find(a => a.tranche === '1-30j')
  const tranche31_60 = aging.find(a => a.tranche === '31-60j')
  const tranche61_90 = aging.find(a => a.tranche === '61-90j')
  const trancheCourant = aging.find(a => a.tranche === 'Courant')

  return {
    agence,
    cfg,
    agenceDetail,
    clients_total: cfg.total,
    encours_fcfa: agence.encours_fcfa,
    encours_restant: Math.round(encoursRestant) || Math.round(agence.encours_fcfa * 0.72),
    par_30_pct: agence.par_courant,
    taux_remboursement_agence_pct: agence.taux_remboursement,
    taux_remboursement_reseau_pct: m.remboursement_pct,
    taux_recouvrement_gp_pct: GP_RECOUVREMENT_PCT,
    clients_en_retard: enRetard.length,
    clients_en_retard_agence: (tranche1_30?.count ?? 0) + (tranche31_60?.count ?? 0) + (tranche61_90?.count ?? 0),
    clients_retard_sup_30: (tranche31_60?.count ?? 0) + (tranche61_90?.count ?? 0),
    montant_retard_1_30: tranche1_30?.montant ?? 0,
    montant_retard_sup_30: (tranche31_60?.montant ?? 0) + (tranche61_90?.montant ?? 0),
    clients_courant: trancheCourant?.count ?? 251,
    clients_critiques: clientsCritiques.length,
    montant_retard_fcfa: parGran.par_30.montant,
    parGran,
    clientsPrioritaires,
    clients_risque_affichage: clientsPrioritaires.slice(0, 7),
    collecte_jour_gp: Math.round(GP_COLLECTE_MOIS_FCFA / 24),
    croissance_encours_pct: variationMoM('encours_fcfa'),
    sparkline_encours: sparkline('encours_fcfa').map(v => Math.round(v * (cfg.total / m.emprunteurs))),
  }
}

/** Aging + segmentation + performance — cohérents avec AGENCES_DATA Lomé Centre */
export function buildGpHomeExtra() {
  const stats = buildGpLomeCentreStats()
  const aging = stats.agenceDetail.portefeuille_aging
  const encours = stats.encours_fcfa

  const tranche1_30 = aging.find(a => a.tranche === '1-30j')
  const tranche31_60 = aging.find(a => a.tranche === '31-60j')
  const tranche61_90 = aging.find(a => a.tranche === '61-90j')
  const tranche90 = aging.find(a => a.tranche === '>90j (contentieux)')

  const n1_7 = Math.round((tranche1_30?.count ?? 29) * 0.35)
  const n8_30 = (tranche1_30?.count ?? 29) - n1_7
  const m1_7 = Math.round((tranche1_30?.montant ?? 0) * 0.35)
  const m8_30 = (tranche1_30?.montant ?? 0) - m1_7

  const total = stats.clients_total
  const bonsPayeurs = Math.round(total * 0.67)
  const sensibles = Math.round(total * 0.17)
  const aRisque = stats.clients_en_retard
  const inactifs = Math.round(total * 0.05)
  const grosClients = Math.round(total * 0.07)
  const multiPrets = Math.round(total * 0.10)

  return {
    aging_portefeuille: [
      { tranche: '1–7 jours', nombre: n1_7, montant: m1_7, pct_portefeuille: Number(((m1_7 / encours) * 100).toFixed(1)), couleur: 'yellow' as const },
      { tranche: '8–30 jours', nombre: n8_30, montant: m8_30, pct_portefeuille: Number(((m8_30 / encours) * 100).toFixed(1)), couleur: 'orange' as const },
      { tranche: '31–90 jours', nombre: (tranche31_60?.count ?? 15) + (tranche61_90?.count ?? 5), montant: (tranche31_60?.montant ?? 0) + (tranche61_90?.montant ?? 0), pct_portefeuille: Number((((tranche31_60?.montant ?? 0) + (tranche61_90?.montant ?? 0)) / encours * 100).toFixed(1)), couleur: 'red' as const },
      { tranche: '+90 jours', nombre: tranche90?.count ?? 0, montant: tranche90?.montant ?? 0, pct_portefeuille: Number(((tranche90?.montant ?? 0) / encours * 100).toFixed(1)), couleur: 'rose' as const },
    ],
    segmentation: [
      { categorie: 'Bons payeurs', nb: bonsPayeurs, pct: Math.round((bonsPayeurs / total) * 100), montant_fcfa: Math.round(encours * 0.62), couleur: 'green' as const, description: 'Score ≥ 70, sans retard 6 mois' },
      { categorie: 'Clients sensibles', nb: sensibles, pct: Math.round((sensibles / total) * 100), montant_fcfa: Math.round(encours * 0.18), couleur: 'yellow' as const, description: 'Score 55-69, retards occasionnels' },
      { categorie: 'Clients à risque', nb: aRisque, pct: Math.round((aRisque / total) * 100), montant_fcfa: stats.montant_retard_fcfa, couleur: 'red' as const, description: 'Score < 55 ou retards > 7j' },
      { categorie: 'Clients inactifs', nb: inactifs, pct: Math.round((inactifs / total) * 100), montant_fcfa: Math.round(encours * 0.04), couleur: 'slate' as const, description: 'Sans activité > 30j' },
      { categorie: 'Gros clients', nb: grosClients, pct: Math.round((grosClients / total) * 100), montant_fcfa: Math.round(encours * 0.38), couleur: 'purple' as const, description: 'Encours > 500k FCFA' },
      { categorie: 'Multi-prêts', nb: multiPrets, pct: Math.round((multiPrets / total) * 100), montant_fcfa: Math.round(encours * 0.22), couleur: 'blue' as const, description: '2 prêts ou + simultanés' },
    ],
    recouvrement: {
      objectif_jour_fcfa: Math.round(GP_COLLECTE_MOIS_FCFA / 22),
      recouvre_jour_fcfa: Math.round(GP_COLLECTE_MOIS_FCFA / 22 * 0.86),
      taux_atteint_pct: 86,
      retards_critiques: stats.clientsPrioritaires.filter(c => c.retard_j > 30).length,
      dossiers_contentieux: stats.clientsPrioritaires.filter(c => c.retard_j > 60).length,
      promesses_aujourdhui: stats.clientsPrioritaires.slice(0, 3).map((c, i) => ({
        client: c.nom.startsWith('M.') || c.nom.startsWith('Mme') ? c.nom : `M. ${c.nom}`,
        montant: Math.round(c.encours * 0.08),
        date_promesse: ['11:30', '14:00', '16:00'][i] ?? '15:00',
        confiance_pct: Math.max(55, 78 - i * 6),
      })),
    },
    performance: {
      objectif_mensuel_collecte_fcfa: 9_000_000,
      realise_mois_fcfa: GP_COLLECTE_MOIS_FCFA,
      taux_atteinte_pct: Math.round((GP_COLLECTE_MOIS_FCFA / 9_000_000) * 100),
      dossiers_traites_mois: Math.round(total * 0.55),
      temps_moyen_suivi_min: 18,
      classement_agence: 2,
      classement_evolution: 1,
      badge: 'ARGENT' as const,
    },
  }
}

export function rapportPrevisionsGp() {
  const stats = buildGpLomeCentreStats()
  const encours = stats.encours_fcfa
  return [
    { metrique: 'PAR 30', valeur_actuelle: `${stats.par_30_pct}%`, valeur_prevue: `${Math.max(4, Number((stats.par_30_pct - 0.6).toFixed(1)))}%`, confidence: 82 },
    { metrique: 'Encours', valeur_actuelle: fmtM(encours), valeur_prevue: fmtM(Math.round(encours * 1.012)), confidence: 85 },
    { metrique: 'Remboursement', valeur_actuelle: `${stats.taux_remboursement_agence_pct}%`, valeur_prevue: `${Math.min(99, stats.taux_remboursement_agence_pct + 0.8)}%`, confidence: 80 },
  ]
}

export function rapportComparaisonMoMGp() {
  const stats = buildGpLomeCentreStats()
  const encours = stats.encours_fcfa
  const prevEncours = Math.round(encours / (1 + stats.croissance_encours_pct / 100))
  const prevPar = Number((stats.par_30_pct + 0.4).toFixed(1))
  const collecteMois = GP_COLLECTE_MOIS_FCFA
  const prevCollecte = Math.round(collecteMois / 1.08)
  return [
    { metrique: 'Encours', mois_precedent: fmtM(prevEncours), mois_courant: fmtM(encours), variation_pct: stats.croissance_encours_pct },
    { metrique: 'PAR 30', mois_precedent: `${prevPar}%`, mois_courant: `${stats.par_30_pct}%`, variation_pct: Number(((stats.par_30_pct - prevPar) / Math.max(prevPar, 0.1) * 100).toFixed(1)) },
    { metrique: 'Collecte GP', mois_precedent: fmtM(prevCollecte), mois_courant: fmtM(collecteMois), variation_pct: 8.0 },
  ]
}

function fmtM(n: number): string {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2).replace('.', ',')}M` : `${Math.round(n / 1000)}k`
}

/** Piliers « Analyse par domaine » — rapport IA GP */
export function buildGpSynthesePiliers() {
  const stats = buildGpLomeCentreStats()
  const top3 = stats.clients_risque_affichage.slice(0, 3).map(c => c.nom).join(', ')

  return [
    {
      titre: 'Recouvrement & encours',
      contenu:
        `${stats.clients_total} clients actifs · encours ${fmtM(stats.encours_fcfa)} · ${stats.clients_courant} dossiers sans retard significatif. ` +
        `Remboursement agence ${stats.taux_remboursement_agence_pct}% (réseau ${stats.taux_remboursement_reseau_pct}%). ` +
        `Collecte GP ${fmtM(GP_COLLECTE_MOIS_FCFA)}/mois · recouvrement personnel ${stats.taux_recouvrement_gp_pct}%.`,
    },
    {
      titre: 'Risque & retards',
      contenu:
        `PAR 30 à ${stats.par_30_pct}% · ${stats.clients_en_retard} clients en retard · ${stats.clients_risque_affichage.length} priorités recouvrement cette semaine. ` +
        `${stats.clients_retard_sup_30} dossiers > 30 j (${fmtM(stats.montant_retard_sup_30)}) · ${stats.montant_retard_1_30 ? `${stats.clients_en_retard_agence - stats.clients_retard_sup_30} en 1-30 j (${fmtM(stats.montant_retard_1_30)})` : 'retards légers maîtrisés'}. ` +
        (top3 ? `→ Relances prioritaires : ${top3}.` : ''),
    },
    {
      titre: 'Suivi terrain & promesses',
      contenu:
        `12 visites prévues aujourd'hui · 5 effectuées · 2 manquées. ` +
        `Objectif collecte jour ${fmtM(Math.round(GP_COLLECTE_MOIS_FCFA / 22))} · promesses du jour à confirmer (3 clients). ` +
        `→ Concentrer la matinée sur les ${stats.clients_retard_sup_30} dossiers > 30 j et valider les promesses avant 16h.`,
    },
  ]
}

export function buildGpSyntheseExecutive(): string {
  const stats = buildGpLomeCentreStats()
  return (
    `Le portefeuille GP couvre l'intégralité de l'agence Lomé Centre : ${stats.clients_total} clients pour un encours de ${fmtM(stats.encours_fcfa)} FCFA.\n\n` +
    `Performance solide : remboursement agence ${stats.taux_remboursement_agence_pct}% (réseau ${stats.taux_remboursement_reseau_pct}%), PAR 30 à ${stats.par_30_pct}%. ` +
    `${stats.clients_en_retard} clients en retard dont ${stats.clients_risque_affichage.length} à traiter en priorité cette semaine.`
  )
}
