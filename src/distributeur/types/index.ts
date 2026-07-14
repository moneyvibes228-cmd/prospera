export type UserRole =
  | 'DG'
  | 'DC'
  | 'RESP_VENTES'
  | 'SUPERVISEUR'
  | 'COMMERCIAL'
  | 'FREELANCE'
  | 'PROSPECTION'
  | 'RESP_STOCK'
  | 'GEST_ENTREPOT'
  | 'DAF'
  | 'COMPTABLE'
  | 'MARKETING'
  | 'RECOUVREMENT'

export type PipelineStage =
  | 'PROSPECTION'
  | 'PREMIER_CONTACT'
  | 'PREMIERE_COMMANDE'
  | 'ACTIF'
  | 'FIDELE'
  | 'A_RISQUE'

export type CommandeStatut =
  | 'BROUILLON'
  | 'VALIDEE'
  | 'PREPARATION'
  | 'LIVREE'
  | 'ANNULEE'

export type FactureStatut = 'BROUILLON' | 'EMISE' | 'PARTIELLE' | 'PAYEE' | 'EN_RETARD'

export type TypeCommercial = 'SALARIE' | 'FREELANCE'

/** Magasin enseigne (PROPRE) ou point de vente partenaire approvisionné par l'entrepôt. */
export type TypeMagasin = 'PROPRE' | 'PARTENAIRE'

export interface PointDeVente {
  id: string
  nom: string
  telephone: string
  zone: string
  adresse: string
  score_ia: number
  pipeline: PipelineStage
  ca_mois: number
  creance: number
  creance_jours: number
  derniere_commande: string
  commercial: string
  type_proprietaire: TypeCommercial
  type_magasin: TypeMagasin
  entrepot_source: string
  lat: number
  lng: number
}

export type TypeClientCommande = 'DEPOT' | 'GROSSISTE' | 'SUPERETTE' | 'ENSEIGNE' | 'EPICERIE' | 'KIOSQUE'

export type PrioriteCommandeIA = 'HAUTE' | 'NORMALE' | 'BLOQUEE'

export interface Commande {
  id: string
  reference: string
  pdv_id: string
  pdv_nom: string
  commercial: string
  type_commercial: TypeCommercial
  montant_societe: number
  montant_client?: number
  marge_freelance?: number
  statut: CommandeStatut
  date: string
  lignes: number
  zone: string
  entrepot: string
  type_magasin: TypeMagasin
  type_client: TypeClientCommande
  marge_brute_pct: number
  familles: string[]
  priorite_ia: PrioriteCommandeIA
  alerte?: string
}

export interface ProduitStock {
  id: string
  reference: string
  nom: string
  categorie: string
  stock: number
  seuil: number
  prix_unitaire: number
  entrepot: string
  /** Fournisseur prioritaire du produit — le moteur de réappro bascule sur le secours si besoin. */
  fournisseur_principal_id?: string
  /** Sorties des 30 derniers jours — base du calcul de vitesse de vente. */
  ventes_30j?: number
}

export type ModePaiementFacture = 'VIREMENT' | 'ESPECES' | 'CHEQUE' | 'CREDIT_30J' | 'CREDIT_45J' | 'CREDIT_60J'

export interface LigneFacture {
  reference: string
  produit: string
  quantite: number
  prix_unitaire: number
  remise_pct: number
  total: number
}

export interface Facture {
  id: string
  numero: string
  pdv_nom: string
  montant: number
  paye: number
  statut: FactureStatut
  echeance: string
  jours_retard: number
  /** Champs enrichis — présents sur le registre DG */
  pdv_id?: string
  zone?: string
  commercial?: string
  type_client?: TypeClientCommande
  type_magasin?: TypeMagasin
  date_emission?: string
  commande_ref?: string
  entrepot?: string
  lignes?: LigneFacture[]
  plafond_credit?: number
  marge_facture_pct?: number
  mode_paiement?: ModePaiementFacture
  score_risque_ia?: number
  nb_relances?: number
  dernier_paiement?: string
  synthese_ia?: string
  /** Cycle documentaire (spec V2 §4) — une facture classique vaut `FACTURE`. */
  type_document?: TypeDocument
  montant_ht?: number
  tva_pct?: number
  montant_ttc?: number
  proforma_ref?: string
  efacture?: EFactureMeta
}

// ─────────────────────────────────────────────────────────────
// Cycle documentaire — devis → proforma → commande → facture → e-facture
// ─────────────────────────────────────────────────────────────

export type TypeDocument = 'DEVIS' | 'PROFORMA' | 'FACTURE' | 'AVOIR' | 'FACTURE_ACHAT'

export type ProformaStatut =
  | 'BROUILLON' | 'ENVOYEE' | 'VUE' | 'ACCEPTEE' | 'REFUSEE' | 'EXPIREE' | 'CONVERTIE'

export type CanalEnvoiProforma = 'WHATSAPP' | 'EMAIL' | 'SMS' | 'IMPRESSION'

export interface Proforma {
  id: string
  numero: string
  pdv_id: string
  pdv_nom: string
  commercial: string
  zone: string
  date_emission: string
  /** Par défaut J+15 — au-delà la proforma passe `EXPIREE`. */
  date_validite: string
  lignes: LigneFacture[]
  montant_ht: number
  tva_pct: number
  montant_ttc: number
  remise_globale_pct: number
  statut: ProformaStatut
  conditions_paiement: ModePaiementFacture
  commande_ref?: string
  facture_ref?: string
  /** Probabilité que le client signe, 0-100. */
  score_acceptation_ia: number
  suggestion_ia?: string
  canal_envoi: CanalEnvoiProforma
  vue_le?: string
  relances_envoyees: number
}

export type EFactureStatut =
  | 'NON_TRANSMISE' | 'EN_ATTENTE' | 'TRANSMISE' | 'CERTIFIEE' | 'REJETEE'

export interface EFactureMeta {
  facture_id: string
  statut: EFactureStatut
  /** Identifiant retourné par la plateforme fiscale. */
  numero_certification?: string
  date_transmission?: string
  qr_code_payload?: string
  hash_document?: string
  motif_rejet?: string
  plateforme: 'OTR_TOGO' | 'INTERNE'
  tentatives: number
  /** Conservation légale 10 ans. */
  archive_legale_url?: string
}

// ─────────────────────────────────────────────────────────────
// Fournisseurs & réapprovisionnement automatique
// ─────────────────────────────────────────────────────────────

export type StatutFournisseur = 'ACTIF' | 'PREFERENTIEL' | 'SUSPENDU' | 'EN_EVALUATION'

export interface Fournisseur {
  id: string
  code: string
  nom: string
  categories: string[]
  contact: { nom: string; telephone: string; email: string }
  pays: string
  statut: StatutFournisseur

  delai_livraison_j: number
  /** Crédit fournisseur accordé. */
  delai_paiement_j: number
  franco_de_port: number
  minimum_commande: number
  remise_volume_pct: number

  encours_du: number
  encours_echu: number
  prochaine_echeance: string
  montant_prochaine_echeance: number
  plafond_credit_accorde: number

  score_fiabilite: number
  taux_livraison_conforme_pct: number
  /** Délai constaté, à comparer au délai annoncé. */
  delai_reel_moyen_j: number
  taux_litige_pct: number
  competitivite_prix: number
  ca_annuel_avec_fournisseur: number
}

export interface ProduitFournisseur {
  produit_ref: string
  fournisseur_id: string
  prix_achat: number
  delai_j: number
  quantite_min: number
  /** Conditionnement — toute quantité commandée est un multiple du lot. */
  quantite_lot: number
  prioritaire: boolean
  dernier_prix_negocie?: number
  date_dernier_achat?: string
}

export type NiveauAutomatisation =
  | 'ALERTE_SEULE'
  | 'PROPOSITION'
  | 'AUTO_SI_SOUS_PLAFOND'
  | 'AUTO_TOTAL'

export type ModeQuantiteReappro = 'STOCK_CIBLE' | 'QUANTITE_FIXE' | 'PREVISION_IA'

export interface RegleReappro {
  id: string
  produit_ref: string
  actif: boolean
  seuil_stock: number
  couverture_min_jours: number
  mode_quantite: ModeQuantiteReappro
  stock_cible: number
  quantite_fixe?: number
  niveau_auto: NiveauAutomatisation
  fournisseur_prefere_id?: string
  /** Au-delà de ce montant, validation humaine obligatoire. */
  plafond_auto_fcfa: number
  valideur_role: UserRole
}

export type MotifLigneReappro =
  | 'SEUIL_ATTEINT' | 'PREVISION_RUPTURE' | 'REGROUPEMENT' | 'MANUEL' | 'PROMO_FOURNISSEUR'

export interface AlerteReappro {
  produit_ref: string
  produit_nom: string
  categorie: string
  entrepot: string
  stock_actuel: number
  seuil: number
  vitesse_vente_jour: number
  couverture_jours: number
  quantite_suggeree: number
  motif: MotifLigneReappro
  criticite: 'CRITIQUE' | 'HAUTE' | 'MODEREE'
  regle_id?: string
}

export interface SelectionFournisseur {
  fournisseur_id: string
  fournisseur_nom: string
  prix_achat: number
  delai_j: number
  score: number
  justification: string
  alternatif_id?: string
  alternatif_nom?: string
}

export type StatutCommandeFournisseur =
  | 'SUGGEREE_IA'
  | 'BROUILLON'
  | 'EN_VALIDATION'
  | 'ENVOYEE'
  | 'CONFIRMEE'
  | 'EN_TRANSIT'
  | 'RECUE_PARTIELLE'
  | 'RECUE'
  | 'ANNULEE'
  | 'LITIGE'

export type StatutPaiementFournisseur = 'NON_DUE' | 'A_PAYER' | 'PARTIEL' | 'PAYEE' | 'ECHUE'

export interface LigneCommandeFournisseur {
  produit_ref: string
  produit_nom: string
  quantite_commandee: number
  quantite_recue?: number
  prix_achat_unitaire: number
  total: number
  motif: MotifLigneReappro
}

export interface CommandeFournisseur {
  id: string
  reference: string
  fournisseur_id: string
  fournisseur_nom: string
  entrepot_destination: string
  statut: StatutCommandeFournisseur
  origine: 'AUTO_IA' | 'MANUELLE'
  regle_declenchee?: string
  lignes: LigneCommandeFournisseur[]
  montant_ht: number
  montant_ttc: number
  date_creation: string
  date_envoi?: string
  date_livraison_prevue: string
  date_livraison_reelle?: string
  /** = date de réception + delai_paiement_j du fournisseur. */
  echeance_paiement: string
  statut_paiement: StatutPaiementFournisseur
  montant_paye: number
  justification_ia?: string
  fournisseur_alternatif_id?: string
  economie_regroupement?: number
  valide_par?: string
  valide_le?: string
}

export interface ImpactTresorerie {
  solde_actuel: number
  montant_engage: number
  solde_projete: number
  seuil_plancher: number
  /** true = le garde-fou saute, la commande doit être escaladée au DAF. */
  franchit_plancher: boolean
  commentaire: string
}

export interface LigneReception {
  produit_ref: string
  quantite_recue: number
  conforme: boolean
  motif_ecart?: string
}

export type RelanceStatut =
  | 'DETECTION'
  | 'PLANIFIEE'
  | 'ENVOYEE'
  | 'REPONDUE'
  | 'VISITE'
  | 'ACCORD'
  | 'PAYEE'
  | 'ECHEC'

export type RelancePriorite = 'CRITIQUE' | 'HAUTE' | 'NORMALE' | 'BASSE'

export interface HistoriqueRelance {
  date: string
  action: string
  auteur: string
  canal?: string
}

export interface Relance {
  id: string
  pdv_nom: string
  type: 'IMPAYE' | 'REAPPRO' | 'PROSPECTION'
  canal: 'WHATSAPP' | 'SMS' | 'VISITE' | 'APPEL' | 'EMAIL'
  montant?: number
  statut: RelanceStatut
  date: string
  score_succes: number
  pdv_id?: string
  zone?: string
  commercial?: string
  facture_ref?: string
  jours_retard?: number
  priorite?: RelancePriorite
  automate?: boolean
  message_template?: string
  prochaine_action?: string
  prochaine_action_date?: string
  historique?: HistoriqueRelance[]
  synthese_ia?: string
  nb_tentatives?: number
}

export interface CommercialKpi {
  id: string
  nom: string
  zone: string
  type: TypeCommercial
  visites_jour: number
  visites_objectif: number
  commandes_jour: number
  ca_jour: number
  marge_jour?: number
  score_ia: number
}

/** Motif d'une visite planifiée — pilote le tri de la tournée et le script terrain. */
export type MotifVisite =
  | 'REASSORT'
  | 'RELANCE_IMPAYE'
  | 'PROSPECTION'
  | 'LANCEMENT_PRODUIT'
  | 'FIDELISATION'
  | 'RECLAMATION'

export type StatutVisite = 'PLANIFIEE' | 'EN_COURS' | 'FAITE' | 'REPORTEE' | 'ANNULEE'

/** Ce que la visite a produit — saisi par le commercial au check-out. */
export type ResultatVisite = 'COMMANDE' | 'SANS_SUITE' | 'PROMESSE' | 'ENCAISSEMENT' | 'ABSENT'

export interface Visite {
  id: string
  commercial: string
  pdv_id: string
  pdv_nom: string
  zone: string
  adresse: string
  lat: number
  lng: number
  /** Jour de la visite, format ISO YYYY-MM-DD. */
  date: string
  /** Créneau prévu, format HH:MM. */
  heure: string
  duree_min: number
  motif: MotifVisite
  statut: StatutVisite
  /** Ordre dans la tournée du jour — 1 = premier arrêt. */
  ordre: number
  resultat?: ResultatVisite
  /** Montant de la commande prise pendant la visite, au tarif société. */
  montant_commande?: number
  /** Montant encaissé sur place (relance impayé soldée en cash). */
  montant_encaisse?: number
  commentaire?: string
  /** Suggestion IA affichée avant l'arrêt — argumentaire ou produit à pousser. */
  conseil_ia?: string
}

export * from './rapport-ia'

