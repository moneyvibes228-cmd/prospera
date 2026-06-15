// Données enrichies — onglet Opérationnel (transactions, dormants, audit, épargne)

import { getClientRisqueById } from '@/lib/dec-vue360'
import { buildComptesEpargneClient } from '@/lib/fiche-client-microfinance'

export interface TransactionSuspecteDetail {
  id: string
  date: string
  heure: string
  client: string
  client_id?: string
  montant: number
  motif: string
  score_fraude: number
  statut: string
  agent: string
  agence: string
  type_operation: string
  canal: string
  reference_externe: string
  pattern_detecte: string
  signaux: { label: string; valeur: string; severite: 'CRITIQUE' | 'HAUTE' | 'MOYENNE' }[]
  historique_lie: { date: string; libelle: string; montant: number }[]
  analyse_ia: string
  actions_recommandees: string[]
  responsable_enquete?: string
  delai_traitement?: string
}

export interface CompteDormantExemple {
  id: string
  client: string
  client_id?: string
  agence: string
  solde: number
  mois_inactif: number
  dernier_mouvement: string
  secteur: string
}

export interface AnalyseComptesDormants {
  synthese: string
  constats: string[]
  segmentation: { segment: string; count: number; encours: number; strategie: string }[]
  plan_action: { priorite: number; action: string; cible: string; impact_estime: string; delai: string }[]
  risque_provision: string
  opportunite_reactivation_fcfa: number
  exemples_prioritaires: CompteDormantExemple[]
}

export interface ModificationSensibleDetail {
  id: string
  date: string
  user: string
  role: string
  action: string
  entite: string
  entite_id: string
  avant: string
  apres: string
  criticite: string
  justifie: boolean
  ip: string
  appareil: string
  contexte: string
  analyse_ia: string
  impact: string
  procedure_requise: string[]
}

export interface EpargnantDetail {
  client: string
  client_id: string
  agence: string
  type: string
  solde: number
  anciennete_mois: number
  secteur: string
  activite: string
  frequence_depot: string
  dernier_depot: string
  potentiel_credit: number
}

export interface AnalyseEpargneIA {
  synthese: string
  tendances: string[]
  risques: string[]
  opportunites: string[]
  ratio_retrait_depot: number
  croissance_encours_12m_pct: number
}

const TRANSACTIONS_SUSPECTES: TransactionSuspecteDetail[] = [
  {
    id: 'TX-S-001', date: '20/05/2026', heure: '14:32', client: 'Anonyme', montant: 3_400_000,
    motif: 'Pattern dépôt-retrait rapide', score_fraude: 89, statut: 'EN_INVESTIGATION',
    agent: 'Edem Kpélim', agence: 'Lomé Centre', type_operation: 'RETRAIT_EPARGNE',
    canal: 'Mixx By Yas', reference_externe: 'MIXX-20260520-8841',
    pattern_detecte: 'Dépôt 3.2M à 14h08 puis retrait 3.4M à 14h32 (< 30 min)',
    signaux: [
      { label: 'Vitesse dépôt-retrait', valeur: '24 min', severite: 'CRITIQUE' },
      { label: 'Compte ouvert', valeur: 'J-12', severite: 'HAUTE' },
      { label: 'KYC incomplet', valeur: 'Pièce verso manquante', severite: 'HAUTE' },
      { label: 'Géolocalisation', valeur: '2 pays différents', severite: 'CRITIQUE' },
    ],
    historique_lie: [
      { date: '20/05 14h08', libelle: 'Dépôt épargne', montant: 3_200_000 },
      { date: '20/05 14h32', libelle: 'Retrait épargne', montant: 3_400_000 },
    ],
    analyse_ia: 'Pattern classique de blanchiment ou test de limites MoMo. Le montant du retrait dépasse le dépôt — possible commission ou erreur volontaire. Compte trop récent pour un flux de cette ampleur. Bloquer les sorties jusqu\'à complétion KYC et appel client.',
    actions_recommandees: ['Geler compte épargne immédiatement', 'Demander justificatif origine fonds', 'Escalade ROC + conformité LBC/FT', 'Vérifier lien avec autres comptes même IMEI'],
    responsable_enquete: 'ROC Lomé', delai_traitement: '24h',
  },
  {
    id: 'TX-S-002', date: '20/05/2026', heure: '11:15', client: 'Togbui Apedo', client_id: 'CL-1003',
    montant: 1_800_000, motif: 'Dépôt pré-RDV crédit (gonflement)', score_fraude: 82,
    statut: 'EN_INVESTIGATION', agent: 'Edem Kpélim', agence: 'Lomé Centre',
    type_operation: 'DEPOT_EPARGNE', canal: 'Flooz', reference_externe: 'FLOOZ-20260520-3312',
    pattern_detecte: 'Dépôt 1.8M 48h avant comité crédit dossier 1.2M',
    signaux: [
      { label: 'Timing vs crédit', valeur: '48h avant comité', severite: 'CRITIQUE' },
      { label: 'Historique épargne', valeur: 'Solde moy. 120k', severite: 'HAUTE' },
      { label: 'Ratio dépôt/encours crédit', valeur: '150%', severite: 'HAUTE' },
    ],
    historique_lie: [
      { date: '18/05', libelle: 'Dépôt Flooz', montant: 1_800_000 },
      { date: '16/05', libelle: 'Soumission dossier CR-2024-156', montant: 1_200_000 },
    ],
    analyse_ia: 'Gonflement artificiel du solde épargne pour améliorer le ratio garantie à l\'analyse crédit. Client déjà en retard J+42 sur encours existant — double signal fraude/risque. Suspendre l\'analyse du dossier en cours.',
    actions_recommandees: ['Geler validation dossier CR-2024-156', 'Visite terrain urgence', 'Croiser flux MoMo 90 jours', 'Mise en demeure encours existant'],
    responsable_enquete: 'DEC + Auditeur', delai_traitement: '48h',
  },
  {
    id: 'TX-S-003', date: '19/05/2026', heure: '09:44', client: 'Mawuena Hotor', client_id: 'CL-1093',
    montant: 980_000, motif: 'Dépôt pré-RDV crédit (gonflement)', score_fraude: 78,
    statut: 'EN_INVESTIGATION', agent: 'Akua Lawson', agence: 'Lomé Centre',
    type_operation: 'DEPOT_EPARGNE', canal: 'Mixx By Yas', reference_externe: 'MIXX-20260519-7720',
    pattern_detecte: 'Dépôt inhabituel vs profil boulangerie',
    signaux: [
      { label: 'Écart vs moyenne dépôts', valeur: '+840%', severite: 'HAUTE' },
      { label: 'RDV crédit', valeur: 'Planifié 21/05', severite: 'HAUTE' },
    ],
    historique_lie: [{ date: '19/05', libelle: 'Dépôt épargne', montant: 980_000 }],
    analyse_ia: 'Même schéma que TX-S-002 mais montant moindre. Activité boulangerie — flux habituel < 50k/mois. Probable tentative d\'améliorer scoring épargne.',
    actions_recommandees: ['Interview agent Akua Lawson', 'Reporter RDV crédit', 'Demander relevé activité 3 mois'],
    responsable_enquete: 'Charge crédit', delai_traitement: '72h',
  },
  {
    id: 'TX-S-004', date: '19/05/2026', heure: '16:20', client: 'Coop. Tabligbo', montant: 2_400_000,
    motif: 'Dépôt pré-RDV crédit (gonflement)', score_fraude: 74, statut: 'EN_INVESTIGATION',
    agent: 'Ama Fiagbé', agence: 'Tabligbo', type_operation: 'DEPOT_EPARGNE', canal: 'Espèce',
    reference_externe: 'AG-TAB-20260519-004',
    pattern_detecte: 'Dépôt espèce groupe 2.4M avant renouvellement coopérative',
    signaux: [{ label: 'Cohérence PV AG', valeur: 'Non vérifié', severite: 'MOYENNE' }],
    historique_lie: [{ date: '19/05', libelle: 'Dépôt collectif', montant: 2_400_000 }],
    analyse_ia: 'Dépôt coopérative peut être légitime (cotisations membres) mais timing suspect vs dossier DOS-2407 bloqué. Vérifier provenance espèces et concordance PV.',
    actions_recommandees: ['Croiser avec dossier DOS-2407', 'Audit caisse Tabligbo', 'Liste membres cotisants'],
    responsable_enquete: 'Ama Fiagbé', delai_traitement: '5j',
  },
  {
    id: 'TX-S-005', date: '18/05/2026', heure: '10:05', client: 'Yao Tetevi', montant: 1_200_000,
    motif: 'Transactions multiples > seuil', score_fraude: 71, statut: 'RESOLUE',
    agent: 'Komi Atsu', agence: 'Tsévié', type_operation: 'TRANSFERT_INTERNE', canal: 'Mixx By Yas',
    reference_externe: 'MIXX-20260518-5511',
    pattern_detecte: '4 virements de 300k en 2h — seuil déclaration dépassé',
    signaux: [{ label: 'Fractionnement', valeur: '4 × 300k', severite: 'MOYENNE' }],
    historique_lie: [
      { date: '18/05 08h', libelle: 'Virement 1', montant: 300_000 },
      { date: '18/05 09h', libelle: 'Virement 2-4', montant: 900_000 },
    ],
    analyse_ia: 'Résolu : client PME achetant stock — factures fournisseurs fournies. Fractionnement involontaire (plafond MoMo). Classement : faux positif avec leçon procédure.',
    actions_recommandees: ['Archiver — dossier clos', 'Sensibiliser client plafonds MoMo'],
    responsable_enquete: 'Komi Atsu', delai_traitement: 'Clos',
  },
  {
    id: 'TX-S-006', date: '18/05/2026', heure: '15:48', client: 'Komi Atsu D.', montant: 850_000,
    motif: 'Bénéficiaire blacklist', score_fraude: 84, statut: 'BLOQUEE',
    agent: 'Système', agence: 'Lomé Centre', type_operation: 'DECAISSEMENT_CREDIT', canal: 'Flooz',
    reference_externe: 'SYS-BLK-20260518',
    pattern_detecte: 'Tentative décaissement vers numéro blacklisté LBC/FT',
    signaux: [{ label: 'Liste interne', valeur: 'Match 100%', severite: 'CRITIQUE' }],
    historique_lie: [],
    analyse_ia: 'Blocage automatique conforme. Numéro associé à signalement centrale BCEAO 2024. Ne pas débloquer sans validation compliance officer.',
    actions_recommandees: ['Maintenir blocage', 'Signalement TRACFIN si non fait', 'Audit agent initiateur'],
    responsable_enquete: 'Compliance', delai_traitement: 'Immédiat',
  },
  {
    id: 'TX-S-007', date: '17/05/2026', heure: '11:30', client: 'GIE Marché', montant: 1_650_000,
    motif: 'Géolocalisation incohérente', score_fraude: 68, statut: 'RESOLUE',
    agent: 'Edem Kpélim', agence: 'Lomé Centre', type_operation: 'REMBOURSEMENT_CREDIT', canal: 'Mixx By Yas',
    reference_externe: 'MIXX-20260517-9920',
    pattern_detecte: 'Agent saisit remboursement GPS Adidogomé — agent déclaré Lomé Centre',
    signaux: [{ label: 'Écart GPS', valeur: '8.4 km', severite: 'MOYENNE' }],
    historique_lie: [{ date: '17/05', libelle: 'Remboursement saisi', montant: 1_650_000 }],
    analyse_ia: 'Résolu : visite terrain marché Adidogomé — agent Edem Kpélim hors zone mais mission validée par superviseur. Renforcer géofencing souple pour visites.',
    actions_recommandees: ['Clôturer', 'Paramétrer exception GPS visites'],
    responsable_enquete: 'Superviseur', delai_traitement: 'Clos',
  },
  {
    id: 'TX-S-008', date: '16/05/2026', heure: '08:12', client: 'Anonyme', montant: 2_100_000,
    motif: 'Compte récent + gros montant', score_fraude: 76, statut: 'EN_INVESTIGATION',
    agent: 'Système', agence: 'Lomé Centre', type_operation: 'DEPOT_EPARGNE', canal: 'Flooz',
    reference_externe: 'FLOOZ-20260516-1102',
    pattern_detecte: 'Compte J-5 — dépôt 2.1M',
    signaux: [
      { label: 'Âge compte', valeur: '5 jours', severite: 'HAUTE' },
      { label: 'Montant vs ticket moyen', valeur: '×12', severite: 'HAUTE' },
    ],
    historique_lie: [{ date: '16/05', libelle: 'Premier dépôt', montant: 2_100_000 }],
    analyse_ia: 'En cours — identité client partielle (KYC niveau 1). Risque LBC/FT élevé. Compléter KYC niveau 2 avant toute sortie de fonds.',
    actions_recommandees: ['RDV agence obligatoire', 'Scan CNI + selfie', 'Vérification PEP/sanctions'],
    responsable_enquete: 'ROC', delai_traitement: '48h',
  },
]

const MODIFICATIONS: ModificationSensibleDetail[] = [
  {
    id: 'MOD-001', date: '21/05 09:42', user: 'Edem Kpélim', role: 'Agent crédit',
    action: 'Modification montant prêt', entite: 'Dossier crédit', entite_id: 'CL-1124',
    avant: '550 000 FCFA', apres: '680 000 FCFA', criticite: 'HAUTE', justifie: false,
    ip: '192.168.1.45', appareil: 'Mobile Android',
    contexte: 'Modification effectuée 2h avant passage comité — sans note de dérogation ni validation superviseur.',
    analyse_ia: 'Écart +130k (+23,6%) non documenté. Pattern similaire à 2 autres dossiers Edem Kpélim ce mois. Risque contournement plafond agent ou arrangement client.',
    impact: 'Exposition agent +130k — concentration Edem Kpélim à 63% des approbations',
    procedure_requise: ['Demander note explicative sous 24h', 'Validation ROC rétroactive', 'Comparer avec fiche revenus client'],
  },
  {
    id: 'MOD-002', date: '20/05 17:18', user: 'Akua Lawson', role: 'Agent crédit',
    action: 'Suppression note client', entite: 'Fiche client', entite_id: 'CL-1093',
    avant: 'Note risque : "Retard récurrent — surveillance"', apres: '(supprimée)', criticite: 'HAUTE', justifie: false,
    ip: '10.0.2.18', appareil: 'Desktop agence',
    contexte: 'Suppression 48h avant soumission nouveau dossier crédit même client (Mawuena Hotor).',
    analyse_ia: 'Suppression de note défavorable avant nouvelle demande = signal de manipulation du dossier. La note doit être restaurée immédiatement et l\'agent convoqué.',
    impact: 'Biais analyse crédit — score CBI pourrait être surévalué',
    procedure_requise: ['Restaurer note depuis audit trail', 'Geler dossier en cours', 'Entretien Akua Lawson'],
  },
  {
    id: 'MOD-003', date: '20/05 14:32', user: 'Kofi Amavi', role: 'Agent terrain',
    action: 'Modification adresse', entite: 'Fiche client', entite_id: 'CL-1018',
    avant: 'Bè Kpota Sud, lot 42', apres: 'Tsévié Nord, marché', criticite: 'MOYENNE', justifie: true,
    ip: '192.168.1.12', appareil: 'Mobile',
    contexte: 'Changement suite visite terrain du 20/05 — client déménagé, photos domicile à jour.',
    analyse_ia: 'Modification légitime — GPS visite concordante, photos uploadées, superviseur notifié.',
    impact: 'Aucun — mise à jour conforme',
    procedure_requise: ['Archiver preuves visite dans dossier'],
  },
  {
    id: 'MOD-004', date: '20/05 11:08', user: 'DG', role: 'Direction générale',
    action: 'Validation dérogation plafond', entite: 'Dossier PLF-002', entite_id: 'PLF-002',
    avant: 'EN_REVUE', apres: 'APPROUVE_DEROG', criticite: 'HAUTE', justifie: true,
    ip: '10.0.1.5', appareil: 'Desktop siège',
    contexte: 'Coop. Tabligbo — dépassement 400k justifié par historique groupe et saison agricole.',
    analyse_ia: 'Dérogation conforme — PV comité et historique 3 cycles sans défaut. Traçabilité complète.',
    impact: 'Décaissement autorisé Coop. Tabligbo',
    procedure_requise: ['Notifier agent Ama Fiagbé', 'Archiver PV dérogation'],
  },
  {
    id: 'MOD-005', date: '19/05 16:54', user: 'Ama Fiagbé', role: 'Resp. agence Tabligbo',
    action: 'Modification taux préférentiel', entite: '4 dossiers groupe', entite_id: 'MULTI',
    avant: '12%', apres: '10%', criticite: 'CRITIQUE', justifie: true,
    ip: '10.0.3.22', appareil: 'Desktop',
    contexte: 'Campagne Tabligbo validée par DC — taux promo saisonnière avec plafond 4 dossiers.',
    analyse_ia: 'Dérogation commerciale encadrée — autorisation DC du 15/05 référencée. Impact marge estimé -180k sur 4 dossiers.',
    impact: 'Manque à gagint intérêts -180k — compensé par volume',
    procedure_requise: ['Vérifier respect plafond 4 dossiers', 'Clôturer campagne 31/05'],
  },
  {
    id: 'MOD-006', date: '19/05 10:22', user: 'Komi Atsu', role: 'Agent crédit',
    action: 'Suppression dossier brouillon', entite: 'Dossier', entite_id: 'DOS-2398',
    avant: 'Brouillon 320k — client Yao M.', apres: '(supprimé)', criticite: 'MOYENNE', justifie: true,
    ip: '192.168.2.8', appareil: 'Mobile',
    contexte: 'Doublon de DOS-2399 — client a soumis 2 fois par erreur.',
    analyse_ia: 'Suppression doublon standard — DOS-2399 actif conservé.',
    impact: 'Aucun',
    procedure_requise: ['Aucune'],
  },
]

export const ANALYSE_COMPTES_DORMANTS: AnalyseComptesDormants = {
  synthese: '51 comptes dormants représentent 2,34 M FCFA d\'encours « gelé » (4,9% de l\'épargne totale). Ce n\'est pas un problème de solvabilité mais de relation client inactive : 55% sont inactifs depuis 6-12 mois — fenêtre idéale de réactivation. Les 7 comptes > 24 mois (320k FCFA) ont une probabilité de récupération < 15% sans action judiciaire ou radiation.',
  constats: [
    '28 comptes (6-12 mois) : taux de réactivation historique 42% avec campagne WA + appel — potentiel 520k FCFA de flux',
    '16 comptes (12-24 mois) : nécessitent offre commerciale (bonus taux +0,5% sur 3 mois)',
    '7 comptes (> 24 mois) : 4 sans contact valide — provisionner 60% de l\'encours (192k FCFA)',
    'Concentration : 18 dormants à Bè Kpota (35%) — corréler avec PAR agence',
    '12 dormants ont un crédit actif ailleurs : incohérence — relance épargne liée au remboursement',
  ],
  segmentation: [
    { segment: '6-12 mois — réactivables', count: 28, encours: 1_240_000, strategie: 'WA personnalisé J1-J3 + appel agent J5' },
    { segment: '12-24 mois — offre commerciale', count: 16, encours: 780_000, strategie: 'Bonus taux + visite terrain' },
    { segment: '> 24 mois — radiation ou contentieux', count: 7, encours: 320_000, strategie: 'Mise en demeure puis clôture' },
  ],
  plan_action: [
    { priorite: 1, action: 'Campagne WA segment 6-12 mois (28 clients)', cible: 'Message + lien Mixx By Yas dépôt', impact_estime: '+380k FCFA dépôts sous 30j', delai: 'Semaine 1' },
    { priorite: 2, action: 'Appels agents — top 10 soldes dormants', cible: '10 clients > 80k FCFA', impact_estime: 'Récupération 6-8 comptes', delai: 'Semaine 1-2' },
    { priorite: 3, action: 'Offre « retour épargne » +0,5% pendant 90j', cible: 'Segment 12-24 mois', impact_estime: '+220k FCFA encours', delai: 'Mois 1' },
    { priorite: 4, action: 'Proposition microcrédit garanti 1,5× solde', cible: '12 dormants avec profil crédit éligible', impact_estime: '4,9M FCFA décaissements potentiels', delai: 'Mois 2' },
    { priorite: 5, action: 'Provision + clôture comptes > 24 mois sans contact', cible: '7 comptes', impact_estime: 'Nettoyage bilan -192k provision', delai: 'Mois 3' },
  ],
  risque_provision: 'Provision recommandée : 192 000 FCFA (60% des > 24 mois). Impact P&L limité — représente 0,4% de l\'encours épargne total.',
  opportunite_reactivation_fcfa: 890_000,
  exemples_prioritaires: [
    { id: 'EP-D-001', client: 'Yawa Dossou', client_id: 'CL-1018', agence: 'Bè Kpota', solde: 142_000, mois_inactif: 8, dernier_mouvement: '23/09/2025', secteur: 'Commerce' },
    { id: 'EP-D-002', client: 'Komlan Attivor', client_id: 'CL-1042', agence: 'Bè Kpota', solde: 98_000, mois_inactif: 7, dernier_mouvement: '08/10/2025', secteur: 'Transport' },
    { id: 'EP-D-003', client: 'Elinam Afetogbo', client_id: 'CL-1095', agence: 'Lomé Centre', solde: 76_000, mois_inactif: 9, dernier_mouvement: '14/09/2025', secteur: 'Commerce' },
    { id: 'EP-D-004', client: 'Mensah Folly', client_id: 'CL-1029', agence: 'Lomé Centre', solde: 185_000, mois_inactif: 6, dernier_mouvement: '04/11/2025', secteur: 'Services' },
  ],
}

export const ANALYSE_EPARGNE_IA: AnalyseEpargneIA = {
  synthese: 'L\'épargne progresse de +8,4% net ce mois (47,8M encours, 287 comptes). Le ratio retrait/dépôt (37%) reste sain. 51 dormants pèsent sur la dynamique mais 38 comptes sont éligibles au crédit garanti — levier de croissance croisée crédit-épargne.',
  tendances: [
    'Encours +16,9% sur 12 mois — croissance portée par groupes femmes (+12,4% MoM)',
    'Digitalisation dépôts : 68% via Mixx By Yas / Flooz sur les comptes actifs',
    'Ticket moyen en hausse : 166k FCFA (+4% vs avril)',
  ],
  risques: [
    '4 retraits massifs (> 80% solde) détectés ce mois — vérifier motifs',
    'Concentration top 5 = 18% de l\'encours total',
    'Bè Kpota : ratio dormants/actifs le plus élevé (19%)',
  ],
  opportunites: [
    '38 comptes éligibles microcrédit garanti épargne → 12,4M FCFA potentiel',
    'Tontines : 47 comptes sous-exploités pour cross-sell assurance',
    'Scolaire : pic dépôts juin-août — campagne ciblée 18 comptes',
  ],
  ratio_retrait_depot: 37,
  croissance_encours_12m_pct: 16.9,
}

export const EPARGNANTS_DETAIL: EpargnantDetail[] = [
  { client: 'Sika Adjovi', client_id: 'CL-1071', agence: 'Lomé Centre', type: 'INDIVIDUEL', solde: 1_240_000, anciennete_mois: 38, secteur: 'Artisanat', activite: 'Couture & retouches', frequence_depot: 'MENSUEL', dernier_depot: '15/05/2026', potentiel_credit: 1_860_000 },
  { client: 'Groupe Soleil', client_id: 'GRP-001', agence: 'Lomé Centre', type: 'GROUPE_FEMMES', solde: 980_000, anciennete_mois: 24, secteur: 'Commerce', activite: 'Vente produits alimentaires', frequence_depot: 'HEBDO', dernier_depot: '18/05/2026', potentiel_credit: 2_400_000 },
  { client: 'Mensah Folly', client_id: 'CL-1029', agence: 'Adidogomé', type: 'INDIVIDUEL', solde: 720_000, anciennete_mois: 18, secteur: 'Services', activite: 'Salon de beauté', frequence_depot: 'MENSUEL', dernier_depot: '04/05/2026', potentiel_credit: 1_080_000 },
  { client: 'Groupe Victoire', client_id: 'GRP-004', agence: 'Hédzranawoé', type: 'GROUPE_FEMMES', solde: 680_000, anciennete_mois: 14, secteur: 'Commerce', activite: 'Tissus & habillement', frequence_depot: 'HEBDO', dernier_depot: '12/05/2026', potentiel_credit: 1_700_000 },
  { client: 'Akouvi Senou', client_id: 'CL-1112', agence: 'Kpalimé', type: 'INDIVIDUEL', solde: 540_000, anciennete_mois: 12, secteur: 'Agroalimentaire', activite: 'Poisson fumé', frequence_depot: 'IRREGULIER', dernier_depot: '06/05/2026', potentiel_credit: 810_000 },
]

export function getTransactionSuspecteById(id: string): TransactionSuspecteDetail | undefined {
  return TRANSACTIONS_SUSPECTES.find(t => t.id === id)
}

export function getModificationById(id: string): ModificationSensibleDetail | undefined {
  const idx = parseInt(id.replace('MOD-', ''), 10) - 1
  if (idx >= 0 && idx < MODIFICATIONS.length) return MODIFICATIONS[idx]
  return MODIFICATIONS.find(m => m.id === id)
}

export function getEpargnantByClientId(clientId: string): EpargnantDetail | undefined {
  const found = EPARGNANTS_DETAIL.find(e => e.client_id === clientId)
  if (found) return found

  const base = getClientRisqueById(clientId)
  if (!base) return undefined

  const comptes = buildComptesEpargneClient(clientId, base)
  const principal = comptes[0]
  const seed = parseInt(clientId.replace(/\D/g, ''), 10) || 1

  return {
    client: base.nom,
    client_id: clientId,
    agence: base.agence,
    type: comptes.length > 1 ? 'INDIVIDUEL + TONTINE' : 'INDIVIDUEL',
    solde: comptes.reduce((s, c) => s + c.solde_fcfa, 0),
    anciennete_mois: 12 + (seed % 36),
    secteur: base.secteur,
    activite: base.activite,
    frequence_depot: base.jours_retard >= 45 ? 'IRREGULIER' : seed % 3 === 0 ? 'HEBDO' : 'MENSUEL',
    dernier_depot: principal.dernier_mouvement,
    potentiel_credit: Math.round(base.encours * 1.5),
  }
}

export function getEpargnantByNom(nom: string): EpargnantDetail | undefined {
  return EPARGNANTS_DETAIL.find(e => e.client === nom)
}

/** Map modification list index to MOD-00X id */
export function getModificationIdByIndex(index: number): string {
  return `MOD-${String(index + 1).padStart(3, '0')}`
}
