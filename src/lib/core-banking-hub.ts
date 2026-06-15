/** Hub core banking — décaissement, échéancier, intérêts, refinancement */

import {
  computeKpis,
  getAllPretsActifs,
  getDecaissementsReseau,
  getEcheancierReseau,
  getRefinancementsReseau,
  type EcheanceReseau,
} from '@/lib/core-banking-registry'

export type StatutPret = 'DEMANDE' | 'APPROUVE' | 'DECAISSE' | 'EN_COURS' | 'SOLDE' | 'IMPAYE' | 'RESTRUCTURE'

export interface EcheancePret {
  numero: number
  date_echeance: string
  capital_fcfa: number
  interet_fcfa: number
  total_fcfa: number
  statut: 'A_VENIR' | 'PAYE' | 'RETARD' | 'IMPAYE'
}

export interface PretActif {
  id: string
  ref: string
  client: string
  montant_fcfa: number
  taux_annuel_pct: number
  duree_mois: number
  statut: StatutPret
  solde_restant_fcfa: number
  prochaine_echeance: string
  agence: string
  produit: string
  score_ia: number
  mensualite_fcfa: number
  date_decaissement: string
  echeances_payees: number
  jours_retard?: number
}

export interface Decaissement {
  id: string
  ref_pret: string
  client: string
  montant_fcfa: number
  date_prevue: string
  date_effective?: string
  canal: 'CAISSE' | 'VIREMENT' | 'MOMO'
  statut: 'EN_ATTENTE' | 'EXECUTE' | 'ANNULE'
  validateur: string
}

export interface Refinancement {
  id: string
  ref_pret_initial: string
  client: string
  montant_initial_fcfa: number
  montant_refinance_fcfa: number
  economie_mensuelle_fcfa: number
  statut: 'ETUDE' | 'APPROUVE' | 'REJETE'
  motif_ia: string
  agence: string
}

export interface CoreBankingHub {
  synthese_ia: string
  kpis: {
    encours_credit_fcfa: number
    decaissements_jour_fcfa: number
    decaissements_en_attente: number
    echeances_jour_fcfa: number
    taux_remboursement_pct: number
    refinancement_en_cours: number
    total_prets: number
  }
  prets: PretActif[]
  decaissements: Decaissement[]
  echeancier_reseau: EcheanceReseau[]
  echeancier_exemple: EcheancePret[]
  refinancement: Refinancement[]
}

const _prets = getAllPretsActifs()
const _decaissements = getDecaissementsReseau(_prets)
const _echeancier = getEcheancierReseau(_prets)
const _kpis = computeKpis(_prets, _decaissements, _echeancier)

export const CORE_BANKING_HUB: CoreBankingHub = {
  synthese_ia:
    `${_kpis.decaissements_en_attente} décaissements en attente (${formatMontant(_decaissements.filter(d => d.statut === 'EN_ATTENTE').reduce((s, d) => s + d.montant_fcfa, 0))}) — valider avant 16h pour respecter cut-off BOA. Échéances à traiter : ${formatMontant(_kpis.echeances_jour_fcfa)} attendu sur ${_echeancier.filter(e => e.statut === 'IMPAYE' || e.statut === 'RETARD').length} dossiers en retard. Dossier RF-008 (refinancement Komi Akléssoé) : économie 18 k/mois, recommandation APPROUVER sous conditions garantie solidaire.`,
  kpis: _kpis,
  prets: _prets,
  decaissements: _decaissements,
  echeancier_reseau: _echeancier,
  echeancier_exemple: _echeancier.filter(e => e.ref_pret === 'DC-2912').map(e => ({
    numero: e.numero,
    date_echeance: e.date_echeance,
    capital_fcfa: e.capital_fcfa,
    interet_fcfa: e.interet_fcfa,
    total_fcfa: e.total_fcfa,
    statut: e.statut,
  })),
  refinancement: getRefinancementsReseau(_prets),
}

function formatMontant(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')} M FCFA`
  return `${Math.round(n / 1000)} k FCFA`
}

export function getCoreBankingHub(): CoreBankingHub {
  return CORE_BANKING_HUB
}

export type { EcheanceReseau }
