import {
  ENCAISSEMENTS_A_LETTRER, REMISES_CAISSE, DECLARATION_TVA,
  CHECKLIST_CLOTURE, PIECES_MANQUANTES,
} from './registries/comptable-registry'
import {
  ECRITURES_JOURNAL, SUSPENS_COMPTABLES, RAPPROCHEMENTS,
} from './registries/comptabilite-registry'

/**
 * Moteur du poste comptable.
 *
 * Aucune fonction ici ne produit un « arbitrage » ou une « décision » : ce sont des
 * files de travail. La question à laquelle ce module répond n'est pas « que dois-je
 * décider ? » mais « qu'est-ce qui n'est pas encore rapproché, lettré, justifié,
 * déclaré — et qu'est-ce que ça bloque ? ».
 */

export interface ChargeDeTravail {
  ecritures_a_valider: number
  encaissements_a_lettrer: number
  montant_non_lettre: number
  /** Sous 70 % de confiance, le rapprochement auto ne suffit pas. */
  lettrages_manuels: number
  suspens_ouverts: number
  rapprochements_en_ecart: number
  pieces_manquantes: number
  montant_pieces_manquantes: number
  cloture_pct: number
  jours_avant_cloture: number
}

export function buildChargeDeTravail(): ChargeDeTravail {
  const manuels = ENCAISSEMENTS_A_LETTRER.filter(e => e.confiance < 70)
  const faites = CHECKLIST_CLOTURE.filter(t => t.fait).length

  return {
    ecritures_a_valider: ECRITURES_JOURNAL.filter(
      e => e.statut === 'ATTENTE_VALIDATION' || e.statut === 'BROUILLON',
    ).length,
    encaissements_a_lettrer: ENCAISSEMENTS_A_LETTRER.length,
    montant_non_lettre: ENCAISSEMENTS_A_LETTRER.reduce((s, e) => s + e.montant, 0),
    lettrages_manuels: manuels.length,
    suspens_ouverts: SUSPENS_COMPTABLES.length,
    rapprochements_en_ecart: RAPPROCHEMENTS.filter(r => r.statut !== 'POINTE').length,
    pieces_manquantes: PIECES_MANQUANTES.length,
    montant_pieces_manquantes: PIECES_MANQUANTES.reduce((s, p) => s + p.montant, 0),
    cloture_pct: Math.round(faites / CHECKLIST_CLOTURE.length * 100),
    jours_avant_cloture: 19,
  }
}

export interface SyntheseTva {
  a_payer: number
  bloquants_montant: number
  /** Ce qu'on paiera en trop si les factures d'achat manquantes ne sont pas saisies à temps. */
  surcout_si_non_saisi: number
  urgent: boolean
}

export function buildSyntheseTva(): SyntheseTva {
  const brut = DECLARATION_TVA.tva_collectee - DECLARATION_TVA.tva_deductible - DECLARATION_TVA.credit_reporte
  const bloquants_montant = DECLARATION_TVA.bloquants.reduce((s, b) => s + b.impact, 0)
  return {
    a_payer: brut,
    bloquants_montant,
    surcout_si_non_saisi: bloquants_montant,
    urgent: DECLARATION_TVA.jours_restants <= 7 && DECLARATION_TVA.statut !== 'TELEDECLAREE',
  }
}

export function buildRemisesCaisse() {
  const ecarts = REMISES_CAISSE.filter(r => r.statut !== 'CONFORME')
  return {
    lignes: [...REMISES_CAISSE].sort((a, b) => a.ecart - b.ecart),
    ecart_total: ecarts.reduce((s, r) => s + r.ecart, 0),
    non_remis: REMISES_CAISSE.filter(r => r.statut === 'NON_REMIS'),
  }
}

export function buildCloture() {
  const bloquees = CHECKLIST_CLOTURE.filter(t => !t.fait && t.bloque_par)
  return {
    taches: CHECKLIST_CLOTURE,
    faites: CHECKLIST_CLOTURE.filter(t => t.fait).length,
    total: CHECKLIST_CLOTURE.length,
    /** Tâches à l'arrêt à cause de quelqu'un d'autre — l'argument du comptable en réunion. */
    bloquees,
  }
}

export {
  ENCAISSEMENTS_A_LETTRER, REMISES_CAISSE, DECLARATION_TVA,
  CHECKLIST_CLOTURE, PIECES_MANQUANTES,
}
