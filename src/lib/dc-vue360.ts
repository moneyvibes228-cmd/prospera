// Données enrichies — onglet Commercial DC & analyse comportement agences

export interface ClientInactifDetail {
  id: string
  nom: string
  agence: string
  agent: string
  telephone: string
  activite: string
  derniere_activite: string
  encours_passe: number
  probabilite_reactivation: number
  canal_recommande: string
  mois_inactivite: number
  dernier_produit: string
  historique_activite: { date: string; type: string; montant?: number; canal: string }[]
  analyse_dc: string
}

export interface PerformanceAgenceCommercial {
  agence_id: string
  agence: string
  responsable: string
  emprunteurs: number
  nouveaux_mois: number
  leads_mois: number
  encours: number
  collecte_mois: number
  collecte_objectif: number
  conv_leads_pct: number
  cycle_moyen_jours: number
  pipeline_valeur: number
  signatures_mois: number
  objectif_signatures: number
  taux_remboursement: number
  score_commercial: number
  tendance: 'HAUSSE' | 'STABLE' | 'BAISSE'
}

export { PERFORMANCE_AGENCES_COMMERCIAL } from '@/lib/commercial-dc-hub'

export interface MotifVisiteAgence {
  motif: string
  pct: number
  count: number
}

export interface AnalyseComportementAgence {
  agence_id: string
  agence: string
  pct_operations_mobile_money: number
  pct_visites_physiques: number
  retraits_momo_mois: number
  operations_agence_mois: number
  caissieres_actuelles: number
  caissieres_recommandees: number
  motifs_visite_agence: MotifVisiteAgence[]
  synthese_ia: string
  recommandation: 'MAINTENIR' | 'REDUIRE_EFFECTIFS' | 'ETUDIER_FERMETURE' | 'DIGITALISER'
  economie_potentielle_fcfa?: number
}

const CLIENTS_INACTIFS: ClientInactifDetail[] = [
  {
    id: 'CL-1018', nom: 'Yawa Dossou', agence: 'Bè Kpota', agent: 'Edem Kpélim',
    telephone: '+228 91 11 22 33', activite: 'Cosmétiques — marché',
    derniere_activite: '23/11/2025', encours_passe: 800_000, probabilite_reactivation: 68,
    canal_recommande: 'WhatsApp + visite', mois_inactivite: 6,
    dernier_produit: 'Crédit individuel',
    historique_activite: [
      { date: '23/11/2025', type: 'Remboursement', montant: 68_889, canal: 'Mixx By Yas' },
      { date: '20/10/2025', type: 'Dépôt épargne', montant: 25_000, canal: 'Flooz' },
      { date: '15/09/2025', type: 'Retrait épargne', montant: 50_000, canal: 'Agence' },
    ],
    analyse_dc: 'Cliente historiquement régulière. Inactivité post-saison. Campagne WhatsApp personnalisée + offre reconquête recommandée.',
  },
  {
    id: 'CL-1042', nom: 'Komlan Attivor', agence: 'Bè Kpota', agent: 'Edem Kpélim',
    telephone: '+228 90 44 55 66', activite: 'Taxi-moto & pièces détachées',
    derniere_activite: '08/12/2025', encours_passe: 1_500_000, probabilite_reactivation: 74,
    canal_recommande: 'Téléphone', mois_inactivite: 5,
    dernier_produit: 'Crédit individuel',
    historique_activite: [
      { date: '08/12/2025', type: 'Remboursement partiel', montant: 47_222, canal: 'Mixx By Yas' },
      { date: '02/11/2025', type: 'Consultation agence', canal: 'Agence' },
    ],
    analyse_dc: 'Forte probabilité de réactivation (74%). Préfère Mixx By Yas — éviter relance physique inutile.',
  },
  {
    id: 'CL-1095', nom: 'Elinam Afetogbo', agence: 'Lomé Centre', agent: 'Akua Lawson',
    telephone: '+228 90 88 77 66', activite: 'Vente tissus',
    derniere_activite: '14/12/2025', encours_passe: 350_000, probabilite_reactivation: 62,
    canal_recommande: 'WhatsApp', mois_inactivite: 5,
    dernier_produit: 'Conso/scolaire',
    historique_activite: [
      { date: '14/12/2025', type: 'Remboursement', montant: 29_167, canal: 'Flooz' },
    ],
    analyse_dc: 'Profil digital — uniquement Flooz depuis 8 mois. Message WA suffisant.',
  },
  {
    id: 'CL-1029', nom: 'Mensah Folly', agence: 'Lomé Centre', agent: 'Kofi Amavi',
    telephone: '+228 90 22 33 44', activite: 'Salon de beauté',
    derniere_activite: '04/01/2026', encours_passe: 1_200_000, probabilite_reactivation: 71,
    canal_recommande: 'Visite', mois_inactivite: 4,
    dernier_produit: 'Crédit individuel',
    historique_activite: [
      { date: '04/01/2026', type: 'Remboursement', montant: 60_000, canal: 'Espèce' },
      { date: '20/12/2025', type: 'Ouverture dossier', canal: 'Agence' },
    ],
    analyse_dc: 'Alterne agence et espèces — visite terrain pertinente pour renouvellement.',
  },
  {
    id: 'CL-1067', nom: 'Edem Bessan', agence: 'Hédzranawoé', agent: 'Mawu Hotor',
    telephone: '+228 90 77 88 99', activite: 'Élevage porcin',
    derniere_activite: '18/01/2026', encours_passe: 600_000, probabilite_reactivation: 58,
    canal_recommande: 'WhatsApp', mois_inactivite: 4,
    dernier_produit: 'Agriculture',
    historique_activite: [
      { date: '18/01/2026', type: 'Retrait épargne', montant: 80_000, canal: 'Mixx By Yas' },
    ],
    analyse_dc: 'Saisonnalité agricole — réactivation probable au prochain cycle engrais.',
  },
  {
    id: 'CL-1058', nom: 'Adjoa Klutse', agence: 'Hédzranawoé', agent: 'Elom Komlavi',
    telephone: '+228 91 33 44 55', activite: 'Vente légumes',
    derniere_activite: '02/02/2026', encours_passe: 950_000, probabilite_reactivation: 79,
    canal_recommande: 'Téléphone + offre', mois_inactivite: 3,
    dernier_produit: 'Groupe solidaire',
    historique_activite: [
      { date: '02/02/2026', type: 'Remboursement', montant: 42_222, canal: 'Flooz' },
      { date: '15/01/2026', type: 'Dépôt épargne', montant: 15_000, canal: 'Mixx By Yas' },
    ],
    analyse_dc: 'Meilleur candidat réactivation (79%). Offre renouvellement groupe à prioriser.',
  },
]

export const ANALYSE_COMPORTEMENT_AGENCES: AnalyseComportementAgence[] = [
  {
    agence_id: 'AG-004',
    agence: 'Hédzranawoé',
    pct_operations_mobile_money: 82,
    pct_visites_physiques: 18,
    retraits_momo_mois: 412,
    operations_agence_mois: 89,
    caissieres_actuelles: 3,
    caissieres_recommandees: 2,
    motifs_visite_agence: [
      { motif: 'Décaissement crédit (signature)', pct: 38, count: 34 },
      { motif: 'Ouverture compte / KYC', pct: 22, count: 20 },
      { motif: 'Réclamation / litige', pct: 18, count: 16 },
      { motif: 'Retrait espèces (sans MoMo)', pct: 12, count: 11 },
      { motif: 'Autre', pct: 10, count: 8 },
    ],
    synthese_ia: '82% des opérations passent par mobile money (Mixx By Yas dominant). Les visites agence concernent surtout le crédit (décaissement, KYC) — pas les retraits courants. Affluence guichet en baisse de 34% sur 6 mois.',
    recommandation: 'REDUIRE_EFFECTIFS',
    economie_potentielle_fcfa: 420_000,
  },
  {
    agence_id: 'AG-005',
    agence: 'Kpalimé',
    pct_operations_mobile_money: 78,
    pct_visites_physiques: 22,
    retraits_momo_mois: 198,
    operations_agence_mois: 56,
    caissieres_actuelles: 2,
    caissieres_recommandees: 1,
    motifs_visite_agence: [
      { motif: 'Décaissement crédit', pct: 42, count: 24 },
      { motif: 'Conseil produit / simulation', pct: 25, count: 14 },
      { motif: 'Retrait espèces', pct: 20, count: 11 },
      { motif: 'Dépôt épargne', pct: 13, count: 7 },
    ],
    synthese_ia: 'Agence la moins fréquentée du réseau (56 opérations guichet/mois). 78% digital — volume insuffisant pour 2 caissières à plein temps. Visites concentrées sur décaissements crédit.',
    recommandation: 'ETUDIER_FERMETURE',
    economie_potentielle_fcfa: 1_200_000,
  },
  {
    agence_id: 'AG-002',
    agence: 'Adidogomé',
    pct_operations_mobile_money: 71,
    pct_visites_physiques: 29,
    retraits_momo_mois: 356,
    operations_agence_mois: 148,
    caissieres_actuelles: 3,
    caissieres_recommandees: 3,
    motifs_visite_agence: [
      { motif: 'Remboursement espèces', pct: 32, count: 47 },
      { motif: 'Décaissement crédit', pct: 28, count: 41 },
      { motif: 'Retrait épargne', pct: 24, count: 36 },
      { motif: 'Dépôt épargne', pct: 16, count: 24 },
    ],
    synthese_ia: 'Équilibre MoMo/agence encore pertinent. 32% des visites = remboursements espèces (habitude clientèle marché). Maintenir 3 caissières — pic 10h-12h non couvert par le digital.',
    recommandation: 'MAINTENIR',
  },
  {
    agence_id: 'AG-001',
    agence: 'Lomé Centre',
    pct_operations_mobile_money: 68,
    pct_visites_physiques: 32,
    retraits_momo_mois: 524,
    operations_agence_mois: 248,
    caissieres_actuelles: 4,
    caissieres_recommandees: 4,
    motifs_visite_agence: [
      { motif: 'Remboursement / collecte', pct: 35, count: 87 },
      { motif: 'Décaissement crédit PME', pct: 26, count: 64 },
      { motif: 'Retrait épargne', pct: 22, count: 55 },
      { motif: 'Ouverture / KYC', pct: 17, count: 42 },
    ],
    synthese_ia: 'Siège — volume guichet le plus élevé. Digitalisation 68% mais 248 visites/mois justifient l\'effectif actuel. PME et gros décaissements nécessitent présence physique.',
    recommandation: 'MAINTENIR',
  },
  {
    agence_id: 'AG-003',
    agence: 'Bè Kpota',
    pct_operations_mobile_money: 64,
    pct_visites_physiques: 36,
    retraits_momo_mois: 298,
    operations_agence_mois: 168,
    caissieres_actuelles: 3,
    caissieres_recommandees: 3,
    motifs_visite_agence: [
      { motif: 'Recouvrement / mise en demeure', pct: 28, count: 47 },
      { motif: 'Remboursement espèces', pct: 30, count: 50 },
      { motif: 'Décaissement', pct: 24, count: 40 },
      { motif: 'Autre', pct: 18, count: 31 },
    ],
    synthese_ia: 'PAR élevé — 30% des visites liées au recouvrement terrain. Le digital ne remplace pas la présence pour cette agence en redressement. Ne pas réduire les effectifs avant stabilisation PAR.',
    recommandation: 'MAINTENIR',
  },
]

export const SYNTHESE_IA_COMPORTEMENT_RESEAU = {
  titre: 'Analyse IA — Digital vs agence physique',
  paragraphe: 'Sur le réseau, 72% des opérations clients passent par mobile money (Mixx By Yas 58%, Flooz 22%). Les visites en agence (28%) sont principalement motivées par le crédit (décaissement, KYC) et le recouvrement — rarement par les retraits, désormais majoritairement sur MoMo.',
  recommandations_globales: [
    'Hédzranawoé : passer de 3 à 2 caissières — économie estimée 420k FCFA/mois',
    'Kpalimé : étudier point de service allégé (1 agent + 1 caissière) ou relais partenaire — 1 200k FCFA/mois',
    'Lomé Centre & Bè Kpota : maintenir effectifs — volume et recouvrement justifient la présence',
    'Généraliser les liens de paiement Mixx By Yas / Flooz pour les remboursements afin de réduire la pression guichet',
  ],
  agences_plus_digital: ['Hédzranawoé', 'Kpalimé'],
  agences_maintenir: ['Lomé Centre', 'Adidogomé', 'Bè Kpota'],
}

export function getClientInactifById(id: string): ClientInactifDetail | undefined {
  return CLIENTS_INACTIFS.find(c => c.id === id)
}

export function getClientInactifByNom(nom: string): ClientInactifDetail | undefined {
  return CLIENTS_INACTIFS.find(c => c.nom === nom)
}

export function getAllClientsInactifs(): ClientInactifDetail[] {
  return CLIENTS_INACTIFS
}
