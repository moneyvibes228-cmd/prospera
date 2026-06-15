// Hub Gestionnaire de Portefeuille — Mawunya Kpodzo · Lomé Centre (300 clients)

import type { RapportIA } from '@/lib/mockMicrofinance'
import { MOCK_GP_HOME } from '@/lib/mockMicrofinance'
import { buildRapportIAGp } from '@/lib/mock-persona-builders'
import {
  buildGpClientsPrioritaires,
  buildGpLomeCentreStats,
  getGpEmprunteursLomeCentre,
  GP_AGENCE_NOM,
} from '@/lib/gp-lome-centre-stats'
import { getEmprunteurIdsAgence } from '@/lib/emprunteurs-builder'
import type { Borrower } from '@/types'

export const GP_AGENT = {
  id: 'gp-mk',
  nom: 'Mawunya Kpodzo',
  agence: GP_AGENCE_NOM,
}

/** IDs emprunteurs assignés au portefeuille GP Lomé Centre (300 clients) */
export const GP_BORROWER_IDS = getEmprunteurIdsAgence(GP_AGENCE_NOM)

export interface ClientPortefeuilleGP {
  borrowerId: string
  nom: string
  encours: number
  retard_j: number
  dernier_paiement: string
  risque: 'CRITIQUE' | 'HAUT' | 'MOYEN' | 'FAIBLE'
  segment: string
  score: number
  telephone: string
  zone: string
  suggestion_ia: string
  action_prioritaire?: string
  lat?: number
  lng?: number
}

export const RAPPORT_IA_GP: RapportIA = buildRapportIAGp()

function risqueFromRetard(j: number): ClientPortefeuilleGP['risque'] {
  if (j > 45) return 'CRITIQUE'
  if (j > 20) return 'HAUT'
  if (j > 7) return 'MOYEN'
  return 'FAIBLE'
}

function segmentFromStatut(statut: Borrower['statut']): string {
  if (statut === 'DEFAUT') return 'PME'
  if (statut === 'RESTRUCTURE') return 'Commerce'
  if (statut === 'EVALUATION' || statut === 'INSTRUCTION') return 'Prospect'
  return 'Artisanat'
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

export function borrowerToGpClient(b: Borrower): ClientPortefeuilleGP {
  const { suggestion_ia, action_prioritaire } = suggestionFromBorrower(b)
  return {
    borrowerId: b.id,
    nom: b.nom,
    encours: b.montant_credit - b.montant_rembourse,
    retard_j: b.retard_jours,
    dernier_paiement: b.retard_jours > 0 ? `Retard ${b.retard_jours} j` : 'À jour',
    risque: risqueFromRetard(b.retard_jours),
    segment: segmentFromStatut(b.statut),
    score: b.score_ia,
    telephone: b.telephone,
    zone: b.zone,
    suggestion_ia,
    action_prioritaire,
    lat: b.lat,
    lng: b.lng,
  }
}

/** 300 clients agence Lomé Centre */
export function getGpAllClients(): ClientPortefeuilleGP[] {
  return getGpEmprunteursLomeCentre().map(borrowerToGpClient)
}

/** Mauvais payeurs agence (retard > 0 j) */
export function getGpMauvaisPayeurs(): ClientPortefeuilleGP[] {
  return getGpAllClients().filter(c => c.retard_j > 0)
}

function buildHubClients(): ClientPortefeuilleGP[] {
  const prioritaires = buildGpClientsPrioritaires(8)
  const bonsPayeurs: ClientPortefeuilleGP[] = getGpEmprunteursLomeCentre()
    .filter(b => b.retard_jours === 0 && b.score_ia >= 70)
    .sort((a, b) => b.score_ia - a.score_ia)
    .slice(0, 4)
    .map(b => ({
      borrowerId: b.id,
      nom: b.nom,
      encours: b.montant_credit - b.montant_rembourse,
      retard_j: 0,
      dernier_paiement: 'il y a 2j',
      risque: 'FAIBLE' as const,
      segment: 'Commerce',
      score: b.score_ia,
      telephone: b.telephone,
      zone: b.zone,
      suggestion_ia: 'Excellent profil — éligible renouvellement',
      action_prioritaire: undefined,
    }))

  const prioritairesMapped: ClientPortefeuilleGP[] = prioritaires.map(c => ({
    borrowerId: c.borrowerId,
    nom: c.nom,
    encours: c.encours,
    retard_j: c.retard_j,
    dernier_paiement: `il y a ${c.retard_j}j`,
    risque: c.risque,
    segment: c.segment,
    score: c.score,
    telephone: c.telephone,
    zone: GP_AGENCE_NOM,
    suggestion_ia: c.suggestion_ia,
    action_prioritaire: c.action_prioritaire,
  }))

  return [...prioritairesMapped, ...bonsPayeurs]
}

export function getGpHubData() {
  const d = MOCK_GP_HOME
  const stats = buildGpLomeCentreStats()
  const clients = buildHubClients()

  return {
    agent: GP_AGENT,
    rapport: RAPPORT_IA_GP,
    ...d,
    clients,
    clients_critiques: clients.filter(c => c.risque === 'CRITIQUE' || c.risque === 'HAUT'),
    suggestions_globales: d.synthese_ia_portefeuille.priorites,
    stats_portefeuille: {
      total_clients: stats.clients_total,
      encours_fcfa: stats.encours_fcfa,
    },
  }
}

export function isGpBorrower(id: string): boolean {
  return GP_BORROWER_IDS.includes(id)
}
