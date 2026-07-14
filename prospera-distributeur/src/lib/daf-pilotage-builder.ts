import {
  BFR_REGISTRY, RUN_PAIEMENT, MARGES_CANAL, RISTOURNES, ECHEANCES_FISCALES,
  LIGNES_BANCAIRES, DEMANDES_CREDIT, ENCAISSEMENTS_CERTAINS_7J, PLANCHER_TRESORERIE,
  type ArbitragePaiement, type LignePaiement, type MargeCanal, type DemandeCredit,
} from './registries/daf-registry'
import { COMPTES_TRESORERIE } from './registries/comptabilite-registry'

/**
 * Moteur de pilotage DAF.
 *
 * Différence de nature avec `comptabilite-dg-builder` : celui-ci *constate*
 * (solde, marge, résultat). Celui-là *simule* — il répond à « si je paie ceci et
 * que je reporte cela, où est-ce que je tombe ? ». C'est la question du DAF.
 */

export const TRESORERIE_ACTUELLE = COMPTES_TRESORERIE.reduce((s, c) => s + c.solde, 0)

// ─────────────────────────────────────────────────────────────
// BFR & cycle de conversion de trésorerie
// ─────────────────────────────────────────────────────────────

export interface SyntheseBfr {
  stock: number
  creances: number
  dettes: number
  bfr: number
  variation: number
  /** Jours de rotation du stock : combien de temps le cash reste bloqué en marchandise. */
  dio_j: number
  /** Jours de crédit fournisseur : combien de temps on garde le cash avant de payer. */
  dpo_j: number
  /** Écart : positif = le stock tourne plus vite qu'on ne paie (le fournisseur nous finance). */
  marge_manoeuvre_j: number
  /** Nombre de jours d'achats que le BFR représente. */
  bfr_en_jours: number
}

export function buildSyntheseBfr(): SyntheseBfr {
  const { stock, creances_clients, dettes_fournisseurs, achats_mois, bfr_mois_precedent } = BFR_REGISTRY
  const bfr = stock + creances_clients - dettes_fournisseurs
  const achats_jour = achats_mois / 30

  const dio_j = Math.round(stock / achats_jour)
  const dpo_j = Math.round(dettes_fournisseurs / achats_jour)

  return {
    stock,
    creances: creances_clients,
    dettes: dettes_fournisseurs,
    bfr,
    variation: bfr - bfr_mois_precedent,
    dio_j,
    dpo_j,
    marge_manoeuvre_j: dpo_j - dio_j,
    bfr_en_jours: Math.round(bfr / achats_jour),
  }
}

// ─────────────────────────────────────────────────────────────
// Run de paiement — simulation
// ─────────────────────────────────────────────────────────────

export interface ResultatRunPaiement {
  decaisse: number
  reporte: number
  /** Trésorerie projetée après le run, encaissements certains inclus. */
  solde_projete: number
  /** Marge par rapport au plancher interne. */
  marge_plancher: number
  sous_plancher: boolean
  /** Escomptes captés en payant à temps. */
  escompte_gagne: number
  /** Pénalités déclenchées par les reports. */
  penalites_encourues: number
  /** Fournisseurs dont la couverture stock tombe sous 10 j alors qu'on les reporte. */
  ruptures_risquees: LignePaiement[]
}

/** Montant réellement décaissé pour une ligne selon l'arbitrage retenu. */
export function montantArbitre(ligne: LignePaiement, choix: ArbitragePaiement): number {
  switch (choix) {
    case 'PAYER': return ligne.montant_du
    case 'PARTIEL': return Math.round(ligne.montant_du * 0.6)
    case 'REPORTER': return 0
  }
}

export function simulerRunPaiement(
  arbitrages: Record<string, ArbitragePaiement>,
): ResultatRunPaiement {
  let decaisse = 0
  let reporte = 0
  let escompte_gagne = 0
  let penalites_encourues = 0
  const ruptures_risquees: LignePaiement[] = []

  for (const ligne of RUN_PAIEMENT) {
    const choix = arbitrages[ligne.fournisseur_id] ?? ligne.reco
    const paye = montantArbitre(ligne, choix)
    decaisse += paye
    reporte += ligne.montant_du - paye

    if (choix === 'PAYER' && ligne.escompte_pct > 0 && ligne.jours_retard <= 0) {
      escompte_gagne += Math.round(ligne.montant_du * ligne.escompte_pct / 100)
    }
    if (choix !== 'PAYER' && ligne.penalite_retard_pct > 0) {
      penalites_encourues += Math.round((ligne.montant_du - paye) * ligne.penalite_retard_pct / 100)
    }
    if (choix === 'REPORTER' && ligne.couverture_stock_j < 10) {
      ruptures_risquees.push(ligne)
    }
  }

  const solde_projete = TRESORERIE_ACTUELLE + ENCAISSEMENTS_CERTAINS_7J - decaisse

  return {
    decaisse,
    reporte,
    solde_projete,
    marge_plancher: solde_projete - PLANCHER_TRESORERIE,
    sous_plancher: solde_projete < PLANCHER_TRESORERIE,
    escompte_gagne,
    penalites_encourues,
    ruptures_risquees,
  }
}

/** Arbitrages par défaut : la recommandation du moteur sur chaque ligne. */
export function arbitragesRecommandes(): Record<string, ArbitragePaiement> {
  return Object.fromEntries(RUN_PAIEMENT.map(l => [l.fournisseur_id, l.reco]))
}

// ─────────────────────────────────────────────────────────────
// Rentabilité par canal — marge nette après coût de service
// ─────────────────────────────────────────────────────────────

export interface CanalCalcule extends MargeCanal {
  marge_nette: number
  marge_nette_pct: number
  marge_brute_pct: number
  /** Ce que le canal détruit ou crée par rapport à la moyenne de l'entreprise. */
  destructeur: boolean
}

export function buildMargesCanal(): CanalCalcule[] {
  return MARGES_CANAL.map(c => {
    const marge_nette = c.marge_brute
      - c.remises_accordees - c.commissions - c.cout_transport
      - c.cout_credit_client - c.pertes_creances
    return {
      ...c,
      marge_nette,
      marge_nette_pct: Number((marge_nette / c.ca_mois * 100).toFixed(1)),
      marge_brute_pct: Number((c.marge_brute / c.ca_mois * 100).toFixed(1)),
      destructeur: marge_nette / c.ca_mois < 0.02,
    }
  }).sort((a, b) => a.marge_nette_pct - b.marge_nette_pct)
}

// ─────────────────────────────────────────────────────────────
// Crédit client
// ─────────────────────────────────────────────────────────────

export interface DemandeCreditCalculee extends DemandeCredit {
  depassement: number
  /** Marge dégagée sur 12 mois rapportée au crédit demandé — le vrai critère. */
  rendement_credit_pct: number
  /** Ce que le DAF risque si le PDV ne paie pas. */
  exposition_apres: number
}

export function buildDemandesCredit(): DemandeCreditCalculee[] {
  return DEMANDES_CREDIT.map(d => {
    const exposition_apres = d.demande === 'RELEVEMENT_PLAFOND'
      ? d.montant_demande
      : d.encours + d.montant_demande
    return {
      ...d,
      depassement: Math.max(0, d.encours - d.plafond_actuel),
      rendement_credit_pct: Number((d.marge_12m / exposition_apres * 100).toFixed(0)),
      exposition_apres,
    }
  })
}

// ─────────────────────────────────────────────────────────────
// Marge arrière, fiscal, bancaire
// ─────────────────────────────────────────────────────────────

export function buildRistournes() {
  const a_reclamer = RISTOURNES.filter(r => r.statut === 'A_RECLAMER')
  return {
    lignes: RISTOURNES,
    total_acquis: RISTOURNES.reduce((s, r) => s + r.acquis, 0),
    a_reclamer: a_reclamer.reduce((s, r) => s + r.acquis, 0),
    /** Argent qui part à la poubelle si la réclamation n'est pas envoyée à temps. */
    en_peril: a_reclamer.filter(r => r.jours_restants <= 30).reduce((s, r) => s + r.acquis, 0),
  }
}

export function buildEcheancesFiscales() {
  const dues = ECHEANCES_FISCALES.filter(e => e.statut !== 'PAYEE')
  return {
    lignes: [...ECHEANCES_FISCALES].sort((a, b) => a.jours_restants - b.jours_restants),
    total_du: dues.reduce((s, e) => s + e.montant, 0),
    sous_7j: dues.filter(e => e.jours_restants <= 7).reduce((s, e) => s + e.montant, 0),
    non_pretes: dues.filter(e => e.statut === 'A_PREPARER' && e.jours_restants <= 7).length,
  }
}

export function buildLignesBancaires() {
  const autorise = LIGNES_BANCAIRES.reduce((s, l) => s + l.autorise, 0)
  const utilise = LIGNES_BANCAIRES.reduce((s, l) => s + l.utilise, 0)
  return {
    lignes: LIGNES_BANCAIRES,
    autorise,
    utilise,
    disponible: autorise - utilise,
    covenants_rompus: LIGNES_BANCAIRES.filter(l => l.covenant_respecte === false),
  }
}

// ─────────────────────────────────────────────────────────────
// Les arbitrages du DAF — l'équivalent des « décisions » du DG,
// mais formulés comme des actes qu'il pose lui-même.
// ─────────────────────────────────────────────────────────────

export interface ArbitrageDaf {
  priorite: number
  titre: string
  enjeu: string
  acte: string
  /** Route de l'écran où l'acte se pose. */
  severite: 'CRITIQUE' | 'HAUTE' | 'MODEREE'
}

export function buildArbitragesDaf(): ArbitrageDaf[] {
  const bfr = buildSyntheseBfr()
  const ristournes = buildRistournes()
  const fiscal = buildEcheancesFiscales()
  const canaux = buildMargesCanal()
  const pire = canaux[0]

  return [
    {
      priorite: 1,
      severite: 'CRITIQUE',
      titre: `Run de paiement — ${RUN_PAIEMENT.length} lignes, 43,8 M échus`,
      enjeu: 'Payer tout vide la trésorerie sous le plancher. Ne rien payer bloque l\'huile 5L à 6 jours de couverture.',
      acte: 'Arbitrer ligne par ligne ci-dessous et geler le run',
    },
    {
      priorite: 2,
      severite: 'CRITIQUE',
      titre: `TVA + CNSS : ${(fiscal.sous_7j / 1_000_000).toFixed(1)} M à 4 jours`,
      enjeu: `${fiscal.non_pretes} déclaration(s) encore à préparer. Pénalité OTR de 10 % + 1 %/mois.`,
      acte: 'Faire remonter la déclaration TVA du comptable aujourd\'hui',
    },
    {
      priorite: 3,
      severite: 'HAUTE',
      titre: `${pire.canal} : ${pire.marge_nette_pct} % de marge nette`,
      enjeu: `${(pire.marge_brute_pct - pire.marge_nette_pct).toFixed(1)} points mangés par les remises, le crédit et les pertes. Le DG voit 23 % de marge brute et ne voit pas ça.`,
      acte: 'Réviser la grille grossistes ou fermer le crédit sur ce canal',
    },
    {
      priorite: 4,
      severite: 'HAUTE',
      titre: `Ristournes fournisseurs : ${(ristournes.en_peril / 1_000_000).toFixed(1)} M à réclamer sous 30 j`,
      enjeu: 'Marge arrière acquise mais non réclamée — perdue si la demande n\'est pas envoyée avant l\'échéance contractuelle.',
      acte: 'Envoyer la réclamation Huiles Ouest avant le 30/06',
    },
    {
      priorite: 5,
      severite: bfr.marge_manoeuvre_j >= 0 ? 'MODEREE' : 'HAUTE',
      titre: `BFR ${(bfr.bfr / 1_000_000).toFixed(1)} M — ${bfr.variation > 0 ? '+' : ''}${(bfr.variation / 1_000_000).toFixed(1)} M sur le mois`,
      enjeu: `Stock à ${bfr.dio_j} j de rotation, fournisseurs payés à ${bfr.dpo_j} j : ${bfr.marge_manoeuvre_j >= 0 ? 'le fournisseur finance encore le stock, de justesse' : 'on paie plus vite qu\'on ne vend — le cash sort avant de rentrer'}.`,
      acte: 'Négocier 45 j chez Huiles Ouest ou déstocker les références lentes',
    },
  ]
}

export { RUN_PAIEMENT, PLANCHER_TRESORERIE, ENCAISSEMENTS_CERTAINS_7J }
export type { ArbitragePaiement, LignePaiement }
