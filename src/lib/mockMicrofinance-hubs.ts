/**
 * Agrégation des hubs opérationnels — réexport centralisé vers mockMicrofinance.ts
 * Chaque module conserve son fichier *-hub.ts (types + getters) ; les données
 * sont exposées ici sous forme de constantes nommées pour le registre.
 */

export { COMPTABILITE_HUB, getComptabiliteHub } from './comptabilite-hub'
export type { ComptabiliteHub, EcritureComptable, CompteGrandLivre, ComptePlanComptable, EcritureAutomatique } from './comptabilite-hub'

export { RELANCES_HUB, getRelancesHub } from './relances-hub'
export type { RelancesHub, RelanceItem, CampagneRelance, CanalRelance, WorkflowRelance, PromessePaiement, PreuveRelance } from './relances-hub'

export { CONFORMITE_HUB, getConformiteHub } from './conformite-hub'
export type { ConformiteHub, ClassificationClient, ClasseBceao, ExportRegulateur } from './conformite-hub'

export { CAISSE_HUB, getCaisseHub } from './caisse-hub'
export type { CaisseHub, MouvementCaisse, ClotureJournaliere, RapprochementMomo } from './caisse-hub'

export { CREDIT_CYCLE_HUB, getCreditCycleHub, ETAPE_CYCLE_ORDER } from './credit-cycle-hub'
export type { CreditCycleHub, DossierCyclePret, EtapeCyclePret } from './credit-cycle-hub'

export { PRODUITS_HUB, getProduitsHub } from './produits-hub'
export type { ProduitsHub, ProduitImf, FamilleProduit } from './produits-hub'

export { EPARGNE_HUB, getEpargneHub } from './epargne-hub'
export type { EpargneHub, CompteEpargne, MouvementEpargne, ProduitEpargne } from './epargne-hub'

export { CORE_BANKING_HUB, getCoreBankingHub } from './core-banking-hub'
export type { CoreBankingHub, PretActif, Decaissement, Refinancement, EcheancePret } from './core-banking-hub'

export { GROUPES_HUB, getGroupesHub } from './groupes-hub'
export type { GroupesHub, GroupeSolidarite, MembreGroupe } from './groupes-hub'

export { KYC_HUB, getKycHub } from './kyc-hub'
export type { KycHub, DossierKyc, DocumentKyc } from './kyc-hub'

export { TERRAIN_OFFLINE_HUB, getTerrainOfflineHub } from './terrain-offline-hub'
export type { TerrainOfflineHub, ActionOffline } from './terrain-offline-hub'

export { UTILISATEURS_HUB, getUtilisateursHub } from './utilisateurs-hub'
export type { UtilisateursHub, UtilisateurImf } from './utilisateurs-hub'

import { COMPTABILITE_HUB } from './comptabilite-hub'
import { RELANCES_HUB } from './relances-hub'
import { CONFORMITE_HUB } from './conformite-hub'
import { CAISSE_HUB } from './caisse-hub'
import { CREDIT_CYCLE_HUB } from './credit-cycle-hub'
import { PRODUITS_HUB } from './produits-hub'
import { EPARGNE_HUB } from './epargne-hub'
import { CORE_BANKING_HUB } from './core-banking-hub'
import { GROUPES_HUB } from './groupes-hub'
import { KYC_HUB } from './kyc-hub'
import { TERRAIN_OFFLINE_HUB } from './terrain-offline-hub'
import { UTILISATEURS_HUB } from './utilisateurs-hub'

/** Tous les hubs opérationnels statiques (données JSON) */
export const OPERATIONAL_HUBS = {
  comptabilite: COMPTABILITE_HUB,
  relances: RELANCES_HUB,
  conformite: CONFORMITE_HUB,
  caisse: CAISSE_HUB,
  creditCycle: CREDIT_CYCLE_HUB,
  produits: PRODUITS_HUB,
  epargne: EPARGNE_HUB,
  coreBanking: CORE_BANKING_HUB,
  groupes: GROUPES_HUB,
  kyc: KYC_HUB,
  terrainOffline: TERRAIN_OFFLINE_HUB,
  utilisateurs: UTILISATEURS_HUB,
} as const
