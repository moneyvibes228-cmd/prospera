/**
 * Données cœur API / hooks — réexportées via mockMicrofinance.ts (source unique).
 * @see mockMicrofinance-registry.ts
 */
import type {
  DashboardKpis, KpiSnapshot, Borrower, Visit, AIAlert,
  AgentPerformance, Loan, Reminder
} from '@/types'
import { buildMockKpiHistorique, buildMockKpis } from './mock-core-builder'
import { buildEmprunteursReseau } from './emprunteurs-builder'

export const MOCK_KPIS: DashboardKpis = buildMockKpis()

export const MOCK_KPI_HISTORIQUE: KpiSnapshot[] = buildMockKpiHistorique()

const AGENT_KOFI = { id: '1', nom: 'Kofi Amavi', email: 'k.amavi@imf-togo.com', role: 'GESTIONNAIRE' as const, zone: 'Lomé Centre', actif: true, createdAt: '2025-01-01' }
const AGENT_AKUA = { id: '2', nom: 'Akua Lawson', email: 'a.lawson@imf-togo.com', role: 'GESTIONNAIRE' as const, zone: 'Adidogomé', actif: true, createdAt: '2025-01-01' }
const AGENT_EDEM = { id: '3', nom: 'Edem Kpélim', email: 'e.kpelim@imf-togo.com', role: 'COLLECTRICE' as const, zone: 'Bè Kpota', actif: true, createdAt: '2025-01-01' }

export const MOCK_BORROWERS: Borrower[] = buildEmprunteursReseau()

export const MOCK_ALERTES: AIAlert[] = [
  { id: 'a1', borrowerId: 'b11', borrowerNom: 'Kwami Ekpé',     severity: 'CRITIQUE',     type: 'DEFAUT_PREVU',  message: 'Défaut J+45 — risque de perte totale',        action_recommandee: 'Escalade superviseur immédiate', retard_jours: 45, score_ia: 22, agentNom: 'Akua Lawson', createdAt: new Date().toISOString() },
  { id: 'a2', borrowerId: 'b12', borrowerNom: 'Enyonam Kpade',  severity: 'CRITIQUE',     type: 'DEFAUT_PREVU',  message: 'Défaut J+38 — aucune réponse aux relances',   action_recommandee: 'Visite terrain urgente',         retard_jours: 38, score_ia: 18, agentNom: 'Edem Kpélim', createdAt: new Date().toISOString() },
  { id: 'a3', borrowerId: 'b10', borrowerNom: 'Togbui Apedo',   severity: 'CRITIQUE',     type: 'RETARD_J7',     message: 'Restructuré J+62 — plan non respecté',        action_recommandee: 'Révision du plan de restructuration', retard_jours: 62, score_ia: 31, agentNom: 'Kofi Amavi', createdAt: new Date().toISOString() },
  { id: 'a4', borrowerId: 'b07', borrowerNom: 'Komi Akléssoé',  severity: 'SURVEILLANCE', type: 'RETARD_J7',     message: 'Retard J+8 — 2ème mois consécutif',           action_recommandee: 'Appel de rappel amiable',        retard_jours: 8,  score_ia: 58, agentNom: 'Kofi Amavi', createdAt: new Date().toISOString() },
  { id: 'a5', borrowerId: 'b08', borrowerNom: 'Abla Fiagbedzi', severity: 'SURVEILLANCE', type: 'SCORE_BAISSE',  message: 'Retard J+12 — score en baisse continue',      action_recommandee: 'Relance SMS + visite planifiée', retard_jours: 12, score_ia: 52, agentNom: 'Akua Lawson', createdAt: new Date().toISOString() },
  { id: 'a6', borrowerId: 'b09', borrowerNom: 'Dossi Kokuvi',   severity: 'SURVEILLANCE', type: 'INACTIVITE_WHATSAPP', message: 'Retard J+21 — inactif WhatsApp depuis 2 sem', action_recommandee: 'Visite porte-à-porte',          retard_jours: 21, score_ia: 47, agentNom: 'Edem Kpélim', createdAt: new Date().toISOString() },
  { id: 'a7', borrowerId: 'b04', borrowerNom: 'Komlan Attivor', severity: 'INFO',         type: 'ECHEANCE_3J',   message: 'Échéance dans 3 jours — rappel automatique',  action_recommandee: 'Envoi SMS de rappel',            retard_jours: 2,  score_ia: 74, agentNom: 'Kofi Amavi', createdAt: new Date().toISOString() },
]

export const MOCK_VISITS: Visit[] = [
  { id: 'v1',  borrowerId: 'b01', borrowerNom: 'Akossiwa Mensah',  agentId: '1', agentNom: 'Kofi Amavi',  lat: 6.1380, lng: 1.2100, adresse: 'Rue des Bananiers, Lomé Centre',  methode: 'VISITE_TERRAIN', statut: 'POSITIVE',     commentaire: 'Client présent, remboursement effectué en espèces.', date: '2026-05-20' },
  { id: 'v2',  borrowerId: 'b02', borrowerNom: 'Yawa Dossou',       agentId: '2', agentNom: 'Akua Lawson', lat: 6.1520, lng: 1.2050, adresse: 'Av. de la Paix, Adidogomé',       methode: 'VISITE_TERRAIN', statut: 'POSITIVE',     commentaire: 'Situation stable, paiement prévu demain.', date: '2026-05-20' },
  { id: 'v3',  borrowerId: 'b03', borrowerNom: 'Afi Togbedji',      agentId: '3', agentNom: 'Edem Kpélim', lat: 6.1310, lng: 1.2200, adresse: 'Quartier Bè Kpota, Lomé',        methode: 'PORTE_A_PORTE',  statut: 'POSITIVE',     commentaire: 'Bonne volonté, commerce florissant.', date: '2026-05-20' },
  { id: 'v4',  borrowerId: 'b04', borrowerNom: 'Komlan Attivor',    agentId: '1', agentNom: 'Kofi Amavi',  lat: 6.1400, lng: 1.2150, adresse: 'Cité OUA, Lomé',                 methode: 'APPEL',          statut: 'POSITIVE',     commentaire: 'Promesse de paiement vendredi.', date: '2026-05-19' },
  { id: 'v5',  borrowerId: 'b05', borrowerNom: 'Sena Agbenoxevi',   agentId: '2', agentNom: 'Akua Lawson', lat: 6.1560, lng: 1.2010, adresse: 'Adidogomé Marché',               methode: 'VISITE_TERRAIN', statut: 'POSITIVE',     commentaire: 'Remboursement complet du mois.', date: '2026-05-19' },
  { id: 'v6',  borrowerId: 'b06', borrowerNom: 'Mawuena Hotor',     agentId: '3', agentNom: 'Edem Kpélim', lat: 6.1290, lng: 1.2250, adresse: 'Bè route nationale',             methode: 'VISITE_TERRAIN', statut: 'SANS_REPONSE', commentaire: 'Absent lors de la visite.', date: '2026-05-19' },
  { id: 'v7',  borrowerId: 'b07', borrowerNom: 'Komi Akléssoé',     agentId: '1', agentNom: 'Kofi Amavi',  lat: 6.1420, lng: 1.2080, adresse: 'Tokoin, Lomé',                   methode: 'VISITE_TERRAIN', statut: 'NEGATIVE',     commentaire: 'Client en difficulté, commerce fermé.', date: '2026-05-18' },
  { id: 'v8',  borrowerId: 'b08', borrowerNom: 'Abla Fiagbedzi',    agentId: '2', agentNom: 'Akua Lawson', lat: 6.1540, lng: 1.1990, adresse: 'Adidogomé Nord',                 methode: 'PORTE_A_PORTE',  statut: 'NEGATIVE',     commentaire: 'Refuse de répondre, tension.', date: '2026-05-18' },
  { id: 'v9',  borrowerId: 'b09', borrowerNom: 'Dossi Kokuvi',      agentId: '3', agentNom: 'Edem Kpélim', lat: 6.1340, lng: 1.2180, adresse: 'Bè Apéyémé',                    methode: 'APPEL',          statut: 'SANS_REPONSE', commentaire: 'Téléphone éteint depuis 3 jours.', date: '2026-05-17' },
  { id: 'v10', borrowerId: 'b10', borrowerNom: 'Togbui Apedo',      agentId: '1', agentNom: 'Kofi Amavi',  lat: 6.1360, lng: 1.2130, adresse: 'Quartier Bè, Lomé Centre',       methode: 'VISITE_TERRAIN', statut: 'NEGATIVE',     commentaire: 'Plan de restructuration non respecté.', date: '2026-05-17' },
  { id: 'v11', borrowerId: 'b01', borrowerNom: 'Akossiwa Mensah',   agentId: '1', agentNom: 'Kofi Amavi',  lat: 6.1383, lng: 1.2098, adresse: 'Rue des Bananiers, Lomé Centre',  methode: 'VISITE_TERRAIN', statut: 'POSITIVE',     commentaire: 'Visite de suivi mensuel.', date: '2026-05-10', distance_metres: 28 },
  { id: 'v12', borrowerId: 'b13', borrowerNom: 'Elinam Afetogbo',   agentId: '1', agentNom: 'Kofi Amavi',  lat: 6.1390, lng: 1.2110, adresse: 'Lomé Centre - prospect',          methode: 'VISITE_TERRAIN', statut: 'POSITIVE',     commentaire: 'Évaluation initiale favorable.', date: '2026-05-15' },
]

export const MOCK_TEAM_PERFORMANCE: AgentPerformance[] = [
  {
    agentId: '1', agentNom: 'Kofi Amavi', zone: 'Lomé Centre',
    visites_mois: 48, visites_objectif: 50,
    montant_collecte: 8_250_000, montant_objectif: 8_500_000,
    taux_recouvrement: 96.2, nouveaux_prospects: 12, taux_conversion: 0.75,
    score_performance: 96.2, classement: 1, badge: 'OR',
  },
  {
    agentId: '3', agentNom: 'Edem Kpélim', zone: 'Bè Kpota',
    visites_mois: 44, visites_objectif: 50,
    montant_collecte: 7_700_000, montant_objectif: 8_500_000,
    taux_recouvrement: 88.4, nouveaux_prospects: 10, taux_conversion: 0.70,
    score_performance: 88.4, classement: 2, badge: 'ARGENT',
  },
  {
    agentId: '2', agentNom: 'Akua Lawson', zone: 'Adidogomé',
    visites_mois: 41, visites_objectif: 50,
    montant_collecte: 7_100_000, montant_objectif: 8_500_000,
    taux_recouvrement: 84.1, nouveaux_prospects: 8, taux_conversion: 0.62,
    score_performance: 84.1, classement: 3, badge: 'BRONZE',
  },
]

export const MOCK_LOANS: Loan[] = [
  { id: 'l1', borrowerId: 'b13', borrowerNom: 'Elinam Afetogbo', montant: 300_000, duree_mois: 12, taux_interet: 2.5, stage: 'EVALUATION',  score_ia: 65, recommandation_ia: 'Profil acceptable, compléter enquête domiciliaire.', agent: 'Kofi Amavi',  createdAt: '2026-04-01' },
  { id: 'l2', borrowerId: 'b14', borrowerNom: 'Kafui Dewonou',   montant: 500_000, duree_mois: 18, taux_interet: 2.5, stage: 'APPROBATION', score_ia: 70, recommandation_ia: 'Score satisfaisant, approuver sous réserve garantie.', agent: 'Akua Lawson', createdAt: '2026-04-10' },
  { id: 'l3', borrowerId: 'b01', borrowerNom: 'Akossiwa Mensah', montant: 600_000, montant_approuve: 600_000, duree_mois: 24, taux_interet: 2.0, stage: 'REMBOURSEMENT', score_ia: 87, recommandation_ia: 'Excellent profil.', agent: 'Kofi Amavi', createdAt: '2025-06-01', date_decaissement: '2025-06-15', date_fin_prevue: '2027-06-15' },
]

export const MOCK_REMINDERS: Reminder[] = [
  { id: 'r1', borrowerId: 'b07', borrowerNom: 'Komi Akléssoé',  strategie: 'RELANCE_FERME',    canal: 'WHATSAPP', statut: 'ENVOYE',    montant_du: 41_667, retard_jours: 8,  score_ia: 58, message_ia: 'Bonjour Komi, votre échéance de 41 667 FCFA est en retard. Contactez-nous.', date_envoi: '2026-05-20' },
  { id: 'r2', borrowerId: 'b08', borrowerNom: 'Abla Fiagbedzi', strategie: 'ALERTE_AGENT',     canal: 'APPEL',    statut: 'EN_ATTENTE', montant_du: 25_000, retard_jours: 12, score_ia: 52, message_ia: 'Retard 12j — appel agent requis avant escalade.', date_envoi: '2026-05-20' },
  { id: 'r3', borrowerId: 'b09', borrowerNom: 'Dossi Kokuvi',   strategie: 'VISITE_PLANIFIEE', canal: 'VISITE',   statut: 'EN_ATTENTE', montant_du: 20_833, retard_jours: 21, score_ia: 47, message_ia: 'Visite terrain planifiée — client injoignable par téléphone.', date_envoi: '2026-05-21' },
  { id: 'r4', borrowerId: 'b04', borrowerNom: 'Komlan Attivor', strategie: 'RAPPEL_DOUX',      canal: 'SMS',      statut: 'REPONDU',   montant_du: 50_000, retard_jours: 2,  score_ia: 74, message_ia: 'Rappel amiable — échéance dans 3 jours.', date_envoi: '2026-05-18', date_reponse: '2026-05-18' },
]
