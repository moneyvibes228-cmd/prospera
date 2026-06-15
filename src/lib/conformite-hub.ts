/** Conformité BCEAO — classification calculée, provisions, exports régulateur */

import { getConformiteRegistry, PROVISION_PCT } from '@/lib/conformite-registry'

export type ClasseBceao = 'NORMAL' | 'SOUS_SURVEILLANCE' | 'DOUTEUX' | 'COMPROMISES' | 'CONTENTIEUX'

export interface ClassificationClient {
  client_id: string
  ref_pret: string
  client: string
  agence: string
  produit: string
  encours_fcfa: number
  jours_retard_max: number
  classe_calculee: ClasseBceao
  classe_precedente: ClasseBceao
  provision_pct: number
  provision_fcfa: number
  migration_ia: string
  date_derniere_echeance?: string
}

export interface ProvisionAgence {
  agence: string
  agence_id: string
  encours_fcfa: number
  provision_totale_fcfa: number
  taux_provision_pct: number
  par_30_pct: number
  statut_bceao: 'CONFORME' | 'ATTENTION' | 'NON_CONFORME'
  dossiers_a_risque: number
}

export interface ExportRegulateur {
  id: string
  type: 'BCEAO_MENSUEL' | 'PAR_TRIMESTRIEL' | 'LBC_FT' | 'SITUATION_LIQUIDITE'
  periode: string
  date_generation: string
  date_echeance: string
  statut: 'GENERE' | 'ENVOYE' | 'VALIDE'
  taille_ko: number
  conformite_ia_pct: number
  description: string
}

export type NiveauRisqueLbc = 'FAIBLE' | 'MOYEN' | 'ELEVE' | 'CRITIQUE'

export interface OperationSuspecteLbc {
  id: string
  date: string
  heure: string
  client: string
  client_id: string
  agence: string
  montant_fcfa: number
  type_operation: string
  motif_alerte: string
  statut: 'EN_ANALYSE' | 'DS_TRANSMISE' | 'CLASSEE' | 'GEL_FONDS'
  niveau_risque: NiveauRisqueLbc
  reference_centif?: string
  detecte_par: string
}

export interface DeclarationCentif {
  id: string
  type: 'DS' | 'DA' | 'GEL_AVOIRS' | 'RAPPORT_MENSUEL'
  date: string
  client?: string
  montant_fcfa?: number
  statut: 'BROUILLON' | 'TRANSMISE' | 'ACCUSEE' | 'NEANT'
  reference: string
  delai_reponse?: string
  description: string
}

export interface ControleLbcFt {
  libelle: string
  statut: 'CONFORME' | 'ATTENTION' | 'NON_CONFORME'
  valeur: string
  seuil?: string
  derniere_verification: string
}

export interface LbcFtAgence {
  agence: string
  agence_id: string
  kyc_complet_pct: number
  dossiers_incomplets: number
  alertes_ouvertes: number
  ds_mois: number
  formations_a_jour_pct: number
}

export interface DossierKycPrioritaire {
  client_id: string
  client: string
  agence: string
  niveau: 'SIMPLIFIE' | 'STANDARD' | 'RENFORCE'
  motif: string
  montant_bloque_fcfa?: number
  statut: 'BLOQUE' | 'EN_COURS' | 'A_RELANCER'
}

export interface ConformiteLbcFt {
  synthese_ia: string
  referent_reglementaire: string
  kpis: {
    taux_kyc_pct: number
    dossiers_incomplets: number
    operations_suspectes_mois: number
    ds_transmises: number
    ds_en_analyse: number
    comptes_geles: number
    ppe_identifies: number
    agents_formes_pct: number
    dernier_rapport_centif: string
    prochain_rapport_centif: string
  }
  operations_suspectes: OperationSuspecteLbc[]
  declarations_centif: DeclarationCentif[]
  controles: ControleLbcFt[]
  par_agence: LbcFtAgence[]
  dossiers_kyc_prioritaires: DossierKycPrioritaire[]
  referentiel: Array<{ terme: string; definition: string }>
}

export interface ConformiteHub {
  synthese_ia: string
  kpis: {
    par_30_pct: number
    par_90_pct: number
    provisions_totales_fcfa: number
    taux_couverture_pct: number
    migrations_mois: number
    exports_en_attente: number
    encours_total_fcfa: number
    total_dossiers: number
    score_bceao: number
    niveau_bceao: 'CONFORME' | 'ATTENTION' | 'NON_CONFORME'
    ratios_non_conformes: number
    jours_avant_rapport_bceao: number
  }
  repartition_classes: Array<{ classe: ClasseBceao; count: number; encours_fcfa: number; provision_fcfa: number }>
  classifications: ClassificationClient[]
  provisions_agences: ProvisionAgence[]
  exports: ExportRegulateur[]
  lbc_ft: ConformiteLbcFt
  calcul_ia: {
    methode: string
    date_calcul: string
    regles_appliquees: Array<{ tranche: string; classe: ClasseBceao; provision_pct: number; description: string }>
  }
  glossaire: Array<{ terme: string; definition: string }>
}

export const CONFORMITE_HUB: ConformiteHub = buildHub()

function buildHub(): ConformiteHub {
  const reg = getConformiteRegistry()
  return {
    synthese_ia: reg.synthese_ia,
    kpis: reg.kpis,
    repartition_classes: reg.repartition_classes,
    classifications: reg.classifications,
    provisions_agences: reg.provisions_agences,
    exports: reg.exports,
    lbc_ft: reg.lbc_ft,
    calcul_ia: {
      methode: 'Classification automatique BCEAO (Instruction n°001-01-2020) + ajustement comportemental CBI v5',
      date_calcul: '28/05/2026 06:00',
      regles_appliquees: [
        { tranche: 'J+0 à J+30', classe: 'NORMAL', provision_pct: PROVISION_PCT.NORMAL, description: 'Créances saines — historique remboursement conforme' },
        { tranche: 'J+31 à J+90', classe: 'SOUS_SURVEILLANCE', provision_pct: PROVISION_PCT.SOUS_SURVEILLANCE, description: 'Retard modéré — suivi renforcé agent terrain' },
        { tranche: 'J+91 à J+180', classe: 'DOUTEUX', provision_pct: PROVISION_PCT.DOUTEUX, description: 'Doute sur recouvrabilité — plan recouvrement obligatoire' },
        { tranche: 'J+181 à J+360', classe: 'COMPROMISES', provision_pct: PROVISION_PCT.COMPROMISES, description: 'Créance compromise — restructuration ou garantie' },
        { tranche: 'J+360 ou contentieux', classe: 'CONTENTIEUX', provision_pct: PROVISION_PCT.CONTENTIEUX, description: 'Procédure judiciaire — provision intégrale' },
      ],
    },
    glossaire: [
      { terme: 'PAR 30', definition: 'Part du portefeuille en retard de plus de 30 jours. Seuil d\'alerte BCEAO : 10 % pour les IMF.' },
      { terme: 'Provision', definition: 'Montant comptabilisé en couverture d\'une créance à risque. Calculé selon la classe BCEAO du dossier.' },
      { terme: 'Migration', definition: 'Changement de classe entre deux calculs mensuels (ex. NORMAL → SOUS_SURVEILLANCE).' },
      { terme: 'Taux de couverture', definition: 'Ratio provisions constituées / perte attendue (Expected Loss). Objectif : ≥ 100 %.' },
      { terme: 'Export BCEAO', definition: 'Fichier réglementaire mensuel transmis à la BCEAO avant le 5 du mois suivant.' },
      { terme: 'LBC/FT', definition: 'Lutte contre le Blanchiment de Capitaux et le Financement du Terrorisme — obligation CENTIF/BCEAO pour toutes les SFD.' },
      { terme: 'DS (Déclaration de soupçon)', definition: 'Signalement au CENTIF d\'une opération suspecte. Délai : sans retard après identification.' },
      { terme: 'KYC', definition: 'Know Your Customer — identification et vérification du client avant toute relation d\'affaires.' },
      { terme: 'PPE', definition: 'Personne Politiquement Exposée — due diligence renforcée obligatoire.' },
    ],
  }
}

export function getConformiteHub(): ConformiteHub {
  return CONFORMITE_HUB
}
