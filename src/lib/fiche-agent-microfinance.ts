/**
 * Fiche agent microfinance complète — terrain, visites, recouvrement, zones, portefeuille.
 */

import { getAgentById, type AgentDetailDG } from '@/lib/dg-vue360'
import { getEquipeHub, type AgentPerformance } from '@/lib/equipe-hub'
import { buildPortefeuilleAgent, type ClientPortefeuille } from '@/lib/portefeuille-agent-builder'
import { encoursCommercial } from '@/lib/portefeuille-agences-config'
import {
  buildHistorique6MoisAgent,
  buildPointsFortsAgent,
  buildPointsAttentionAgent,
} from '@/lib/agent-synthese-builder'
import { buildRecouvrementsAgent } from '@/lib/agent-recouvrement-builder'
import { buildVisitesTerrainAgent } from '@/lib/agent-visites-builder'

export type { ClientPortefeuille }

export interface ZoneAgent {
  id: string
  nom: string
  agence: string
  couverture_pct: number
  clients_assignes: number
  encours_fcfa: number
  par_pct: number
  collecte_mois_fcfa: number
  statut: 'BON' | 'NORMAL' | 'TENSION' | 'DEGRADE'
  quartiers: string[]
}

export interface VisiteTerrain {
  id: string
  date: string
  heure: string
  client_id?: string
  client: string
  type: 'DOMICILE' | 'ACTIVITE' | 'RECOUVREMENT' | 'PROSPECTION' | 'INSTRUCTION' | 'SUIVI'
  adresse: string
  gps_declare: string
  gps_reel: string
  ecart_m: number
  gps_conforme: boolean
  statut: 'VALIDEE' | 'ANOMALIE' | 'REPORTEE' | 'ANNULEE'
  resultat: 'POSITIVE' | 'NEGATIVE' | 'NEUTRE' | 'PROMESSE_PAIEMENT'
  montant_recouvre_fcfa?: number
  canal_paiement?: string
  commentaire: string
  duree_min: number
}

export interface ActionRecouvrement {
  id: string
  date: string
  heure: string
  client_id?: string
  client: string
  type: 'RELANCE_SMS' | 'RELANCE_WA' | 'APPEL' | 'VISITE' | 'PAIEMENT' | 'PLAN_APUREMENT'
  canal: string
  montant_du_fcfa: number
  montant_recouvre_fcfa: number
  jours_retard: number
  resultat: string
  prochaine_action?: string
}

/** Portefeuille agence Lomé Centre — 300 clients, vues commerciale et GP */
export const PORTEFEUILLE_AGENCE_LC_TOTAL = 300
export const PORTEFEUILLE_AGENCE_LC_ENCOURS = 136_450_000

export interface JournalActivite {
  id: string
  date: string
  heure: string
  categorie: 'VISITE' | 'PAIEMENT' | 'RECOUVREMENT' | 'DECAISSEMENT' | 'PROSPECTION' | 'ADMIN' | 'GPS'
  libelle: string
  client?: string
  montant_fcfa?: number
  gps_ok?: boolean
  detail?: string
}

export interface TournéeJour {
  date: string
  checkin: string
  checkout?: string
  agence_depart: string
  km_parcourus: number
  visites_prevues: number
  visites_realisees: number
  collecte_jour_fcfa: number
  objectif_collecte_fcfa: number
}

export interface FicheAgentMicrofinance extends Omit<AgentDetailDG, 'visites'> {
  matricule: string
  email: string
  telephone: string
  role: string
  date_embauche: string
  est_responsable_agence?: boolean
  equipe_terrain?: Array<{
    id: string
    nom: string
    role: string
    zone?: string
    vue_portefeuille?: 'COMMERCIAL' | 'GP'
    clients: number
    clients_a_risque: number
    encours_fcfa: number
    recouvrement_pct: number
    visites_mois: number
    visites_objectif: number
    lien_fiche: string
  }>
  est_gestionnaire_portefeuille?: boolean
  zones: ZoneAgent[]
  visites_terrain: VisiteTerrain[]
  recouvrements: ActionRecouvrement[]
  portefeuille: ClientPortefeuille[]
  journal: JournalActivite[]
  tournees: TournéeJour[]
  tournée_aujourdhui: Array<{ heure: string; client: string; type: string; adresse: string; statut: 'FAIT' | 'PREVU' | 'REPORTE' }>
}

function buildYawoCommercial(base: AgentDetailDG): Omit<FicheAgentMicrofinance, keyof AgentDetailDG> {
  const portefeuille = buildPortefeuilleAgent('AG-001', { vue: 'COMMERCIAL', commercialNom: 'Yawo Adjavon' })
  const recouvrementsSeeds: ActionRecouvrement[] = [
    { id: 'R-2801', date: '28/05/2026', heure: '09:42', client_id: 'CL-8801', client: 'Akossiwa Mensah', type: 'PAIEMENT', canal: 'Mixx By Yas', montant_du_fcfa: 46_666, montant_recouvre_fcfa: 46_666, jours_retard: 0, resultat: 'Paiement intégral échéance juin anticipée' },
    { id: 'R-2802', date: '28/05/2026', heure: '08:15', client_id: 'CL-8840', client: 'Yawa Dossou', type: 'RELANCE_WA', canal: 'WhatsApp', montant_du_fcfa: 37_500, montant_recouvre_fcfa: 0, jours_retard: 0, resultat: 'Message lu — rappel échéance 29/05', prochaine_action: 'Visite si non-paiement J+3' },
    { id: 'R-2701', date: '27/05/2026', heure: '14:30', client_id: 'CL-8831', client: 'Ama Kpodaho', type: 'APPEL', canal: 'Téléphone', montant_du_fcfa: 57_778, montant_recouvre_fcfa: 0, jours_retard: 0, resultat: 'Promesse Flooz 30/05', prochaine_action: 'Contrôle réception 30/05' },
    { id: 'R-2601', date: '26/05/2026', heure: '11:20', client_id: 'CL-8824', client: 'Kafui Dewonou', type: 'PAIEMENT', canal: 'Espèces guichet', montant_du_fcfa: 42_222, montant_recouvre_fcfa: 42_222, jours_retard: 0, resultat: 'Encaissement guichet Lomé Centre' },
    { id: 'R-2501', date: '25/05/2026', heure: '09:10', client_id: 'CL-8855', client: 'Komi Akléssoé', type: 'VISITE', canal: 'Terrain', montant_du_fcfa: 53_333, montant_recouvre_fcfa: 0, jours_retard: 8, resultat: 'Promesse 30/05 — difficulté trésorerie atelier', prochaine_action: 'Relance WA 29/05' },
    { id: 'R-2101', date: '21/05/2026', heure: '10:22', client_id: 'CL-8862', client: 'Kwami Ekpé', type: 'VISITE', canal: 'Terrain', montant_du_fcfa: 38_888, montant_recouvre_fcfa: 0, jours_retard: 12, resultat: 'Client absent — 2ème visite sans contact', prochaine_action: 'Escalade superviseur' },
    { id: 'R-2001', date: '20/05/2026', heure: '11:42', client_id: 'CL-1029', client: 'Mensah Folly', type: 'PLAN_APUREMENT', canal: 'Terrain', montant_du_fcfa: 180_000, montant_recouvre_fcfa: 0, jours_retard: 35, resultat: 'Plan 3×60k proposé — acceptation verbale', prochaine_action: 'Formaliser et faire signer' },
    { id: 'R-1901', date: '19/05/2026', heure: '14:00', client_id: 'CL-8801', client: 'Akossiwa Mensah', type: 'PAIEMENT', canal: 'Mixx By Yas', montant_du_fcfa: 50_000, montant_recouvre_fcfa: 50_000, jours_retard: 0, resultat: 'Paiement partiel complémentaire' },
    { id: 'R-1801', date: '18/05/2026', heure: '16:30', client_id: 'CL-1029', client: 'Mensah Folly', type: 'RELANCE_SMS', canal: 'SMS', montant_du_fcfa: 60_000, montant_recouvre_fcfa: 0, jours_retard: 33, resultat: 'SMS délivré — pas de réponse', prochaine_action: 'Visite 20/05' },
  ]
  const recouvrements = buildRecouvrementsAgent(portefeuille, base.visites, { prefix: 'R', isGP: false, seeds: recouvrementsSeeds })
  const visitesSeeds: VisiteTerrain[] = [
    { id: 'V-2801', date: '28/05/2026', heure: '09:42', client_id: 'CL-8801', client: 'Akossiwa Mensah', type: 'ACTIVITE', adresse: 'Marché Grand Lomé — Stand 7', gps_declare: '6.1375°N 1.2123°E', gps_reel: '6.1368°N 1.2131°E', ecart_m: 89, gps_conforme: true, statut: 'VALIDEE', resultat: 'POSITIVE', montant_recouvre_fcfa: 46_666, canal_paiement: 'Mixx By Yas', commentaire: 'Paiement échéance juin anticipé — activité forte', duree_min: 22 },
    { id: 'V-2802', date: '28/05/2026', heure: '10:15', client_id: 'CL-8812', client: 'Elinam Afetogbo', type: 'DOMICILE', adresse: 'Tokoin — Cité OUA lot 12', gps_declare: '6.1390°N 1.2110°E', gps_reel: '6.1392°N 1.2108°E', ecart_m: 28, gps_conforme: true, statut: 'VALIDEE', resultat: 'POSITIVE', commentaire: 'Salon actif, 4 clientes en attente — bon profil', duree_min: 18 },
    { id: 'V-2701', date: '27/05/2026', heure: '14:30', client_id: 'CL-8831', client: 'Ama Kpodaho', type: 'RECOUVREMENT', adresse: 'Tokoin — carrefour Hôpital', gps_declare: '6.1420°N 1.2250°E', gps_reel: '6.1418°N 1.2252°E', ecart_m: 35, gps_conforme: true, statut: 'VALIDEE', resultat: 'PROMESSE_PAIEMENT', montant_recouvre_fcfa: 0, commentaire: 'Promesse paiement 30/05 via Flooz — activité confirmée', duree_min: 25 },
    { id: 'V-2702', date: '27/05/2026', heure: '16:05', client: 'Koffi Aglo', type: 'PROSPECTION', adresse: 'Lomé Centre — porte-à-porte', gps_declare: '6.1380°N 1.2140°E', gps_reel: '6.1381°N 1.2139°E', ecart_m: 12, gps_conforme: true, statut: 'VALIDEE', resultat: 'POSITIVE', commentaire: 'Prospect tontine 5 pers — RDV instruction 30/05', duree_min: 35 },
    { id: 'V-2601', date: '26/05/2026', heure: '11:20', client_id: 'CL-8824', client: 'Kafui Dewonou', type: 'ACTIVITE', adresse: 'Assigamé — échoppe alimentaire', gps_declare: '6.1719°N 1.2110°E', gps_reel: '6.1721°N 1.2108°E', ecart_m: 45, gps_conforme: true, statut: 'VALIDEE', resultat: 'POSITIVE', montant_recouvre_fcfa: 42_222, canal_paiement: 'Espèces', commentaire: 'Stock correct, paiement à jour', duree_min: 20 },
    { id: 'V-2602', date: '26/05/2026', heure: '15:40', client_id: 'CL-8871', client: 'Mawuena Hotor', type: 'INSTRUCTION', adresse: 'Marché Assigamé — allée B', gps_declare: '6.1705°N 1.2095°E', gps_reel: '6.1707°N 1.2093°E', ecart_m: 38, gps_conforme: true, statut: 'VALIDEE', resultat: 'NEUTRE', commentaire: 'Dossier renouvellement — pièce RCCM manquante', duree_min: 40 },
    { id: 'V-2501', date: '25/05/2026', heure: '09:10', client_id: 'CL-8855', client: 'Komi Akléssoé', type: 'RECOUVREMENT', adresse: 'Tokoin — atelier réparation', gps_declare: '6.1420°N 1.2080°E', gps_reel: '6.1420°N 1.2080°E', ecart_m: 0, gps_conforme: true, statut: 'VALIDEE', resultat: 'PROMESSE_PAIEMENT', commentaire: 'Retard J+8 — promesse vendredi 30/05', duree_min: 30 },
    { id: 'V-2401', date: '24/05/2026', heure: '10:55', client_id: 'CL-8840', client: 'Yawa Dossou', type: 'SUIVI', adresse: 'Lomé Centre — boutique cosmétiques', gps_declare: '6.1365°N 1.2135°E', gps_reel: '6.1367°N 1.2133°E', ecart_m: 42, gps_conforme: true, statut: 'VALIDEE', resultat: 'POSITIVE', commentaire: 'Suivi mensuel — client performant', duree_min: 15 },
    { id: 'V-2301', date: '23/05/2026', heure: '08:30', client_id: 'CL-8888', client: 'Adjoa Fiakli', type: 'DOMICILE', adresse: 'Bé — restaurant familial', gps_declare: '6.1450°N 1.2180°E', gps_reel: '6.1452°N 1.2178°E', ecart_m: 55, gps_conforme: true, statut: 'VALIDEE', resultat: 'POSITIVE', commentaire: 'Visite pré-décaissement — conditions OK', duree_min: 28 },
    { id: 'V-2001', date: '20/05/2026', heure: '11:42', client_id: 'CL-1029', client: 'Mensah Folly', type: 'DOMICILE', adresse: 'Lomé Centre — salon beauté', gps_declare: '6.1380°N 1.2120°E', gps_reel: '6.1382°N 1.2118°E', ecart_m: 32, gps_conforme: true, statut: 'VALIDEE', resultat: 'PROMESSE_PAIEMENT', commentaire: 'Plan apurement accepté verbalement — formaliser sous 48h', duree_min: 45 },
    { id: 'V-2101', date: '21/05/2026', heure: '10:22', client_id: 'CL-8862', client: 'Kwami Ekpé', type: 'RECOUVREMENT', adresse: 'Tokoin — gare moto', gps_declare: '6.1400°N 1.2150°E', gps_reel: '6.1403°N 1.2147°E', ecart_m: 52, gps_conforme: true, statut: 'VALIDEE', resultat: 'NEGATIVE', commentaire: 'Client absent — moto garée chez voisin', duree_min: 20 },
    { id: 'V-1901', date: '19/05/2026', heure: '14:00', client_id: 'CL-8801', client: 'Akossiwa Mensah', type: 'ACTIVITE', adresse: 'Marché Grand Lomé', gps_declare: '6.1380°N 1.2100°E', gps_reel: '6.1383°N 1.2098°E', ecart_m: 28, gps_conforme: true, statut: 'VALIDEE', resultat: 'POSITIVE', montant_recouvre_fcfa: 50_000, canal_paiement: 'Mixx By Yas', commentaire: 'Promesse de paiement vendredi honorée', duree_min: 18 },
  ]
  const visites = buildVisitesTerrainAgent(portefeuille, base.visites, {
    prefix: 'V',
    quartiers: ['Marché Grand Lomé', 'Assigamé', 'Tokoin', 'Rue des Bananiers', 'Bé Nord'],
    seeds: visitesSeeds,
  })

  const journal: JournalActivite[] = [
    { id: 'J-001', date: '28/05/2026', heure: '09:42', categorie: 'PAIEMENT', libelle: 'Encaissement échéance', client: 'Akossiwa Mensah', montant_fcfa: 46_666, gps_ok: true, detail: 'Mixx By Yas — ref MIXX-448901223' },
    { id: 'J-002', date: '28/05/2026', heure: '10:15', categorie: 'VISITE', libelle: 'Visite domicile suivi', client: 'Elinam Afetogbo', gps_ok: true, detail: 'Tokoin — durée 18 min' },
    { id: 'J-003', date: '28/05/2026', heure: '07:42', categorie: 'GPS', libelle: 'Check-in agence Lomé Centre', gps_ok: true, detail: 'Tournée IA chargée — 5 visites client prévues' },
    { id: 'J-004', date: '27/05/2026', heure: '14:30', categorie: 'RECOUVREMENT', libelle: 'Visite recouvrement', client: 'Ama Kpodaho', gps_ok: true, detail: 'Promesse Flooz 30/05' },
    { id: 'J-005', date: '27/05/2026', heure: '16:05', categorie: 'PROSPECTION', libelle: 'Prospect tontine', client: 'Koffi Aglo', gps_ok: true, detail: 'Score 74 — dossier à ouvrir' },
    { id: 'J-006', date: '27/05/2026', heure: '18:05', categorie: 'GPS', libelle: 'Check-out journée', gps_ok: true, detail: '5/6 visites — 1 reportée Tokoin' },
    { id: 'J-007', date: '26/05/2026', heure: '11:20', categorie: 'PAIEMENT', libelle: 'Remboursement espèces', client: 'Kafui Dewonou', montant_fcfa: 42_222, gps_ok: true },
    { id: 'J-008', date: '26/05/2026', heure: '15:40', categorie: 'VISITE', libelle: 'Instruction renouvellement', client: 'Mawuena Hotor', gps_ok: true, detail: 'RCCM manquant' },
    { id: 'J-009', date: '25/05/2026', heure: '09:10', categorie: 'RECOUVREMENT', libelle: 'Visite retard J+8', client: 'Komi Akléssoé', gps_ok: true },
    { id: 'J-010', date: '24/05/2026', heure: '10:55', categorie: 'VISITE', libelle: 'Suivi mensuel', client: 'Yawa Dossou', gps_ok: true },
    { id: 'J-011', date: '23/05/2026', heure: '08:30', categorie: 'VISITE', libelle: 'Visite pré-décaissement', client: 'Adjoa Fiakli', gps_ok: true },
    { id: 'J-012', date: '21/05/2026', heure: '09:14', categorie: 'DECAISSEMENT', libelle: 'Décaissement crédit validé', client: 'Akossiwa Mensah', montant_fcfa: 200_000, detail: 'Renouvellement partiel — guichet' },
    { id: 'J-013', date: '21/05/2026', heure: '11:20', categorie: 'ADMIN', libelle: 'Mise à jour fiche emprunteur', client: 'Kwami Ekpé', detail: 'Adresse corrigée' },
    { id: 'J-014', date: '20/05/2026', heure: '11:42', categorie: 'RECOUVREMENT', libelle: 'Plan apurement négocié', client: 'Mensah Folly', gps_ok: true, detail: '3×60 000 FCFA proposé' },
    { id: 'J-015', date: '19/05/2026', heure: '14:00', categorie: 'PAIEMENT', libelle: 'Paiement Mixx By Yas', client: 'Akossiwa Mensah', montant_fcfa: 50_000, gps_ok: true },
  ]

  return {
    matricule: 'COM-LC-2020-008',
    email: 'y.adjavon@prospera.tg',
    telephone: '+228 90 55 12 34',
    role: 'Commercial — zone terrain',
    date_embauche: '12/03/2020',
    zones: [
      { id: 'Z-AG-LC', nom: 'Zone Marché/Assigamé — Lomé Centre', agence: 'Lomé Centre', couverture_pct: 96, clients_assignes: 170, encours_fcfa: encoursCommercial('AG-001', 170), par_pct: 6.2, collecte_mois_fcfa: 11_500_000, statut: 'BON', quartiers: ['Marché Grand Lomé', 'Assigamé', 'Tokoin', 'Rue des Bananiers', 'Bé Nord'] },
    ],
    visites_terrain: visites,
    recouvrements,
    portefeuille,
    journal,
    tournees: [
      { date: '28/05/2026', checkin: '07:42', agence_depart: 'Lomé Centre', km_parcourus: 12, visites_prevues: 6, visites_realisees: 2, collecte_jour_fcfa: 46_666, objectif_collecte_fcfa: 120_000 },
      { date: '27/05/2026', checkin: '07:38', checkout: '18:05', agence_depart: 'Lomé Centre', km_parcourus: 18, visites_prevues: 6, visites_realisees: 5, collecte_jour_fcfa: 0, objectif_collecte_fcfa: 120_000 },
      { date: '26/05/2026', checkin: '07:45', checkout: '17:50', agence_depart: 'Lomé Centre', km_parcourus: 16, visites_prevues: 5, visites_realisees: 5, collecte_jour_fcfa: 42_222, objectif_collecte_fcfa: 120_000 },
      { date: '25/05/2026', checkin: '07:40', checkout: '18:10', agence_depart: 'Lomé Centre', km_parcourus: 20, visites_prevues: 6, visites_realisees: 6, collecte_jour_fcfa: 85_000, objectif_collecte_fcfa: 120_000 },
    ],
    tournée_aujourdhui: [
      { heure: '07:42', client: '—', type: 'Check-in agence', adresse: 'Lomé Centre', statut: 'FAIT' },
      { heure: '09:42', client: 'Akossiwa Mensah', type: 'Recouvrement + visite', adresse: 'Marché Grand Lomé', statut: 'FAIT' },
      { heure: '10:15', client: 'Elinam Afetogbo', type: 'Visite domicile', adresse: 'Tokoin Cité OUA', statut: 'FAIT' },
      { heure: '11:30', client: 'Afi Togbedji', type: 'Suivi activité', adresse: 'Assigamé', statut: 'PREVU' },
      { heure: '14:00', client: 'Mensah Folly', type: 'Recouvrement — plan apurement', adresse: 'Lomé Centre salon', statut: 'PREVU' },
      { heure: '15:30', client: 'Kwami Ekpé', type: 'Visite recouvrement J+12', adresse: 'Tokoin gare moto', statut: 'PREVU' },
      { heure: '17:00', client: '—', type: 'Retour agence / clôture', adresse: 'Lomé Centre', statut: 'PREVU' },
    ],
  }
}

/** Commercial Mensah — mêmes 62 clients, focus zone Tokoin (sous-performance) */
function buildMensahCommercial(base: AgentDetailDG): Omit<FicheAgentMicrofinance, keyof AgentDetailDG> {
  const portefeuille = buildPortefeuilleAgent('AG-001', { vue: 'COMMERCIAL', commercialNom: 'Mensah Kodjo' })
  const recouvrementsSeeds: ActionRecouvrement[] = [
    { id: 'R-M-01', date: '27/05/2026', heure: '15:30', client_id: 'CL-8862', client: 'Kwami Ekpé', type: 'VISITE', canal: 'Terrain', montant_du_fcfa: 38_888, montant_recouvre_fcfa: 0, jours_retard: 12, resultat: 'Client absent', prochaine_action: 'Escalade GP + RA' },
  ]
  const recouvrements = buildRecouvrementsAgent(portefeuille, base.visites, { prefix: 'R-M', isGP: false, seeds: recouvrementsSeeds })
  const visitesSeeds: VisiteTerrain[] = [
    { id: 'V-M-01', date: '27/05/2026', heure: '15:30', client_id: 'CL-8862', client: 'Kwami Ekpé', type: 'RECOUVREMENT', adresse: 'Tokoin — gare moto', gps_declare: '6.1400°N 1.2150°E', gps_reel: '6.1403°N 1.2147°E', ecart_m: 52, gps_conforme: true, statut: 'VALIDEE', resultat: 'NEGATIVE', commentaire: 'Client absent — 3ème passage sans contact', duree_min: 15 },
    { id: 'V-M-02', date: '26/05/2026', heure: '10:00', client_id: 'CL-8855', client: 'Komi Akléssoé', type: 'RECOUVREMENT', adresse: 'Tokoin — atelier réparation', gps_declare: '6.1420°N 1.2080°E', gps_reel: '6.1420°N 1.2080°E', ecart_m: 0, gps_conforme: true, statut: 'VALIDEE', resultat: 'PROMESSE_PAIEMENT', commentaire: 'Retard J+8 — promesse non honorée', duree_min: 20 },
  ]
  const visites = buildVisitesTerrainAgent(portefeuille, base.visites, {
    prefix: 'V-M',
    quartiers: ['Tokoin', 'Adakpamé', 'Cité OUA'],
    seeds: visitesSeeds,
  })
  return {
    matricule: 'COM-LC-2019-014',
    email: 'm.kodjo@prospera.tg',
    telephone: '+228 90 88 44 21',
    role: 'Commercial — zone terrain',
    date_embauche: '08/06/2019',
    zones: [
      { id: 'Z-AG-LC', nom: 'Zone Tokoin/Adakpamé — Lomé Centre', agence: 'Lomé Centre', couverture_pct: 42, clients_assignes: 130, encours_fcfa: encoursCommercial('AG-001', 130), par_pct: 12.4, collecte_mois_fcfa: 8_800_000, statut: 'DEGRADE', quartiers: ['Tokoin', 'Adakpamé', 'Cité OUA'] },
    ],
    visites_terrain: visites,
    recouvrements,
    portefeuille,
    journal: [
      { id: 'J-M-01', date: '27/05/2026', heure: '15:30', categorie: 'RECOUVREMENT', libelle: 'Visite Tokoin — absent', client: 'Kwami Ekpé', gps_ok: true },
      { id: 'J-M-02', date: '28/05/2026', heure: '08:00', categorie: 'ADMIN', libelle: 'Coaching RA planifié', detail: '130 clients zone Tokoin — couverture 42 %' },
    ],
    tournees: [
      { date: '27/05/2026', checkin: '08:15', checkout: '16:00', agence_depart: 'Lomé Centre', km_parcourus: 8, visites_prevues: 4, visites_realisees: 2, collecte_jour_fcfa: 0, objectif_collecte_fcfa: 100_000 },
    ],
    tournée_aujourdhui: [
      { heure: '09:00', client: 'Komi Akléssoé', type: 'Recouvrement J+8', adresse: 'Tokoin atelier', statut: 'PREVU' },
      { heure: '11:00', client: 'Kwami Ekpé', type: 'Visite recouvrement', adresse: 'Tokoin gare moto', statut: 'PREVU' },
    ],
  }
}

/** GP — suivi portefeuille, relances, fidélisation (peu de terrain) */
function buildMawunyaGp(base: AgentDetailDG): Omit<FicheAgentMicrofinance, keyof AgentDetailDG> {
  const portefeuille = buildPortefeuilleAgent('AG-001', { vue: 'GP' })
  const recouvrementsSeeds: ActionRecouvrement[] = [
    { id: 'R-GP-01', date: '28/05/2026', heure: '08:30', client_id: 'CL-8840', client: 'Yawa Dossou', type: 'RELANCE_WA', canal: 'WhatsApp', montant_du_fcfa: 37_500, montant_recouvre_fcfa: 0, jours_retard: 0, resultat: 'Rappel échéance 29/05 — message lu' },
    { id: 'R-GP-02', date: '28/05/2026', heure: '09:15', client_id: 'CL-8831', client: 'Ama Kpodaho', type: 'APPEL', canal: 'Téléphone', montant_du_fcfa: 57_778, montant_recouvre_fcfa: 0, jours_retard: 0, resultat: 'Promesse Flooz 30/05', prochaine_action: 'Contrôle réception' },
    { id: 'R-GP-03', date: '27/05/2026', heure: '14:00', client_id: 'CL-1029', client: 'Mensah Folly', type: 'APPEL', canal: 'Téléphone', montant_du_fcfa: 180_000, montant_recouvre_fcfa: 0, jours_retard: 35, resultat: 'Plan apurement — relance signature', prochaine_action: 'Escalade RA si J+40' },
    { id: 'R-GP-04', date: '27/05/2026', heure: '16:30', client_id: 'CL-8862', client: 'Kwami Ekpé', type: 'RELANCE_SMS', canal: 'SMS', montant_du_fcfa: 38_888, montant_recouvre_fcfa: 0, jours_retard: 12, resultat: 'SMS délivré — pas de réponse', prochaine_action: 'Demander visite commercial zone Tokoin' },
    { id: 'R-GP-05', date: '26/05/2026', heure: '11:00', client_id: 'CL-8855', client: 'Komi Akléssoé', type: 'RELANCE_WA', canal: 'WhatsApp', montant_du_fcfa: 53_333, montant_recouvre_fcfa: 0, jours_retard: 8, resultat: 'Promesse paiement 30/05' },
    { id: 'R-GP-06', date: '25/05/2026', heure: '10:00', client_id: 'CL-8801', client: 'Akossiwa Mensah', type: 'PAIEMENT', canal: 'Mixx By Yas', montant_du_fcfa: 46_666, montant_recouvre_fcfa: 46_666, jours_retard: 0, resultat: 'Paiement anticipé confirmé' },
  ]
  const recouvrements = buildRecouvrementsAgent(portefeuille, base.visites, { prefix: 'R-GP', isGP: true, seeds: recouvrementsSeeds })

  return {
    matricule: 'GP-LC-2021-012',
    email: 'm.kpodzo@prospera.tg',
    telephone: '+228 91 45 67 89',
    role: 'Gestionnaire de portefeuille (GP)',
    date_embauche: '03/09/2021',
    est_gestionnaire_portefeuille: true,
    zones: [],
    visites_terrain: [
      { id: 'V-GP-01', date: '22/05/2026', heure: '15:00', client_id: 'CL-1029', client: 'Mensah Folly', type: 'RECOUVREMENT', adresse: 'Lomé Centre — salon', gps_declare: '6.1380°N 1.2120°E', gps_reel: '6.1382°N 1.2118°E', ecart_m: 32, gps_conforme: true, statut: 'VALIDEE', resultat: 'PROMESSE_PAIEMENT', commentaire: 'Visite exceptionnelle J+35 — plan apurement négocié', duree_min: 45 },
    ],
    recouvrements,
    portefeuille,
    journal: [
      { id: 'J-GP-01', date: '28/05/2026', heure: '08:30', categorie: 'RECOUVREMENT', libelle: 'Relance WA échéance', client: 'Yawa Dossou' },
      { id: 'J-GP-02', date: '28/05/2026', heure: '09:15', categorie: 'RECOUVREMENT', libelle: 'Appel promesse Flooz', client: 'Ama Kpodaho' },
      { id: 'J-GP-03', date: '28/05/2026', heure: '14:00', categorie: 'ADMIN', libelle: 'Revue échéances semaine', detail: `${PORTEFEUILLE_AGENCE_LC_TOTAL} clients agence — 4 relances prioritaires` },
      { id: 'J-GP-04', date: '27/05/2026', heure: '14:00', categorie: 'RECOUVREMENT', libelle: 'Relance plan apurement', client: 'Mensah Folly' },
    ],
    tournees: [],
    tournée_aujourdhui: [],
  }
}

function buildEquipeTerrainAgence(
  agenceId: string,
  clientsAgence: number,
  encoursFcfa: number,
): NonNullable<FicheAgentMicrofinance['equipe_terrain']> {
  const membres = getEquipeHub().agents.filter(a => a.agence_id === agenceId && a.role !== 'Resp. agence')
  const clientsARisqueCommerciaux = membres
    .filter(a => a.role === 'Commercial')
    .reduce((s, a) => s + a.clients_a_risque, 0)

  return membres.map(a => {
      const focusMatch = a.ia_resume.match(/Focus zones? ([^.]+)/)
      const isGP = a.role === 'GP'
      return {
        id: a.id,
        nom: a.nom,
        role: a.role,
        vue_portefeuille: isGP ? 'GP' as const : 'COMMERCIAL' as const,
        zone: isGP
          ? `Suivi crédit — ${clientsAgence} clients agence`
          : (focusMatch ? `Focus terrain — ${focusMatch[1].trim()}` : `Focus terrain — ${a.agence}`),
        clients: isGP ? clientsAgence : a.clients_portefeuille,
        clients_a_risque: isGP ? clientsARisqueCommerciaux : a.clients_a_risque,
        encours_fcfa: isGP ? encoursFcfa : a.portefeuille_fcfa,
        recouvrement_pct: a.recouvrement_pct,
        visites_mois: a.visites_mois,
        visites_objectif: a.visites_objectif,
        lien_fiche: a.lien_fiche,
      }
    })
}

const RA_FICHE_META: Record<string, {
  matricule: string
  email: string
  telephone: string
  date_embauche: string
  quartiers: string[]
}> = {
  'agent-kofi-amavi': {
    matricule: 'RA-LC-2019-001',
    email: 'k.amavi@prospera.tg',
    telephone: '+228 90 12 34 56',
    date_embauche: '15/01/2019',
    quartiers: ['Marché Grand Lomé', 'Assigamé', 'Tokoin', 'Rue des Bananiers', 'Cité OUA'],
  },
  'agent-akua-lawson': {
    matricule: 'RA-AD-2021-002',
    email: 'a.lawson@prospera.tg',
    telephone: '+228 91 22 33 44',
    date_embauche: '03/04/2021',
    quartiers: ['Marché Adidogomé', 'Zongo', 'Gbossimé', 'Agbalépédogan'],
  },
  'agent-edem-kpelim': {
    matricule: 'RA-BK-2022-003',
    email: 'e.kpelim@prospera.tg',
    telephone: '+228 90 77 88 99',
    date_embauche: '10/06/2022',
    quartiers: ['Marché de Bè', 'Bè Kpota', 'Agbalépédogan sud'],
  },
  'agent-komi-atsu': {
    matricule: 'RA-HZ-2023-004',
    email: 'k.atsu@prospera.tg',
    telephone: '+228 92 11 22 33',
    date_embauche: '20/02/2023',
    quartiers: ['Hédzranawoé', 'Adidogomé nord', 'Agoè'],
  },
  'agent-ama-fiagbe': {
    matricule: 'RA-KP-2023-005',
    email: 'a.fiagbe@prospera.tg',
    telephone: '+228 93 44 55 66',
    date_embauche: '05/09/2023',
    quartiers: ['Kpalimé Centre', 'Kpimé', 'Agomé'],
  },
}

function buildRespAgence(base: AgentDetailDG): Omit<FicheAgentMicrofinance, keyof AgentDetailDG> {
  const meta = RA_FICHE_META[base.id] ?? {
    matricule: `RA-${base.agence_id}-${base.rang}`,
    email: `${base.nom.toLowerCase().replace(/\s+/g, '.')}@prospera.tg`,
    telephone: '+228 90 00 00 00',
    date_embauche: '—',
    quartiers: [base.agence],
  }
  const encoursFcfa = base.agence_id === 'AG-001'
    ? PORTEFEUILLE_AGENCE_LC_ENCOURS
    : Math.round(base.clients_portefeuille * 450_000)
  const parStatut: ZoneAgent['statut'] = base.par > 10 ? 'TENSION' : base.par > 8 ? 'NORMAL' : 'BON'

  return {
    matricule: meta.matricule,
    email: meta.email,
    telephone: meta.telephone,
    role: 'Responsable d\'agence',
    date_embauche: meta.date_embauche,
    est_responsable_agence: true,
    equipe_terrain: buildEquipeTerrainAgence(base.agence_id, base.clients_portefeuille, encoursFcfa),
    zones: [{
      id: `Z-AG-${base.agence_id}`,
      nom: `${base.agence} — agence`,
      agence: base.agence,
      couverture_pct: base.gps_conformite_pct,
      clients_assignes: base.clients_portefeuille,
      encours_fcfa: encoursFcfa,
      par_pct: base.par,
      collecte_mois_fcfa: base.collecte,
      statut: parStatut,
      quartiers: meta.quartiers,
    }],
    visites_terrain: [],
    recouvrements: [],
    portefeuille: [],
    journal: [
      { id: `J-RA-${base.id}-01`, date: '28/05/2026', heure: '08:30', categorie: 'ADMIN', libelle: 'Ouverture agence — revue objectifs', detail: base.agence },
      { id: `J-RA-${base.id}-02`, date: '28/05/2026', heure: '11:00', categorie: 'ADMIN', libelle: 'Point équipe terrain', detail: 'Commerciaux zones + GP portefeuille' },
      { id: `J-RA-${base.id}-03`, date: '27/05/2026', heure: '16:45', categorie: 'ADMIN', libelle: 'Revue PAR agence', detail: `PAR ${base.par} %` },
    ],
    tournees: [],
    tournée_aujourdhui: [],
  }
}

function buildKofiRespAgence(base: AgentDetailDG): Omit<FicheAgentMicrofinance, keyof AgentDetailDG> {
  const fiche = buildRespAgence(base)
  return {
    ...fiche,
    journal: [
      { id: 'J-RA-01', date: '28/05/2026', heure: '08:30', categorie: 'ADMIN', libelle: 'Comité décaissements — 4 dossiers validés', detail: 'Guichet Lomé Centre' },
      { id: 'J-RA-02', date: '28/05/2026', heure: '11:00', categorie: 'ADMIN', libelle: 'Point équipe', detail: '2 commerciaux zones + 1 GP portefeuille — objectifs semaine' },
      { id: 'J-RA-03', date: '27/05/2026', heure: '16:45', categorie: 'ADMIN', libelle: 'Revue PAR agence', detail: 'PAR 5,9 % — conforme BCEAO' },
      { id: 'J-RA-04', date: '26/05/2026', heure: '09:15', categorie: 'ADMIN', libelle: 'Coaching Mensah Kodjo (commercial)', detail: 'Couverture zone Tokoin 42 % — plan prospection' },
    ],
  }
}

const FICHES_ENRICHIES: Record<string, (base: AgentDetailDG) => Omit<FicheAgentMicrofinance, keyof AgentDetailDG>> = {
  'agent-kofi-amavi': buildKofiRespAgence,
  'agent-akua-lawson': buildRespAgence,
  'agent-edem-kpelim': buildRespAgence,
  'agent-komi-atsu': buildRespAgence,
  'agent-ama-fiagbe': buildRespAgence,
  'agent-yawo-adjavon': buildYawoCommercial,
  'agent-mensah-kodjo': buildMensahCommercial,
  'agent-mawunya-kpodzo': buildMawunyaGp,
}

function equipeToAgentDetail(eq: AgentPerformance): AgentDetailDG {
  return {
    id: eq.id,
    nom: eq.nom,
    agence_id: eq.agence_id,
    agence: eq.agence,
    responsable_agence: eq.agence,
    rang: eq.rang,
    badge: eq.badge,
    score: eq.score,
    visites: eq.visites_mois,
    collecte: eq.collecte_mois_fcfa,
    recouvrement: eq.recouvrement_pct,
    par: eq.par_30_pct,
    objectifs: {
      visites: eq.visites_objectif,
      collecte: eq.objectif_collecte_mois_fcfa,
      recouvrement: eq.objectif_recouvrement_pct,
      nouveaux_clients: eq.objectif_nouveaux_clients,
      decaissements: 3,
    },
    realise: {
      visites: eq.visites_mois,
      collecte: eq.collecte_mois_fcfa,
      recouvrement: eq.recouvrement_pct,
      nouveaux_clients: eq.nouveaux_clients_mois,
      decaissements: eq.decaissements_mois,
    },
    historique_6m: buildHistorique6MoisAgent(
      eq.collecte_mois_fcfa,
      eq.recouvrement_pct,
      eq.visites_mois,
    ),
    ia_analyse: eq.ia_resume,
    points_forts: buildPointsFortsAgent(eq),
    points_attention: buildPointsAttentionAgent(eq),
    clients_portefeuille: eq.clients_portefeuille,
    clients_a_risque: eq.clients_a_risque,
    gps_conformite_pct: eq.gps_conformite_pct,
    streak_jours: eq.role === 'Resp. agence' ? 0 : eq.role === 'GP' ? 0 : 14,
    derniere_visite: eq.derniere_visite,
  }
}

function buildFallback(base: AgentDetailDG): FicheAgentMicrofinance {
  const equipeAgent = getEquipeHub().agents.find(a => a.nom === base.nom)
  const isRA = equipeAgent?.role === 'Resp. agence'
  const isGP = equipeAgent?.role === 'GP'
  const portefeuille = equipeAgent && !isRA
    ? buildPortefeuilleAgent(base.agence_id, {
        vue: isGP ? 'GP' : 'COMMERCIAL',
        commercialNom: isGP ? undefined : base.nom,
      })
    : []
  const recouvrements = equipeAgent && !isRA
    ? buildRecouvrementsAgent(portefeuille, base.visites, {
        prefix: 'R-F',
        isGP: isGP === true,
      })
    : []
  const visites_terrain = equipeAgent && !isRA && !isGP
    ? buildVisitesTerrainAgent(portefeuille, base.visites, {
        prefix: 'V-F',
        quartiers: [base.agence],
      })
    : []

  return {
    ...base,
    matricule: `AGT-${base.agence_id}-${base.rang}`,
    email: `${base.nom.toLowerCase().replace(/\s+/g, '.')}@prospera.tg`,
    telephone: '+228 90 00 00 00',
    role: equipeAgent?.role ?? 'Agent terrain',
    date_embauche: '—',
    est_responsable_agence: isRA,
    equipe_terrain: isRA ? undefined : undefined,
    zones: [{
      id: 'Z-00',
      nom: base.agence,
      agence: base.agence,
      couverture_pct: base.gps_conformite_pct,
      clients_assignes: base.clients_portefeuille,
      encours_fcfa: base.collecte * 6,
      par_pct: base.par,
      collecte_mois_fcfa: base.collecte,
      statut: base.par > 10 ? 'TENSION' as const : 'NORMAL' as const,
      quartiers: [base.agence],
    }],
    visites_terrain,
    recouvrements,
    portefeuille,
    journal: base.points_attention.map((p, i) => ({
      id: `J-F${i}`,
      date: '28/05/2026',
      heure: '—',
      categorie: 'ADMIN' as const,
      libelle: p,
    })),
    tournees: [],
    tournée_aujourdhui: [],
  }
}

export function getFicheAgentMicrofinance(id: string): FicheAgentMicrofinance | undefined {
  let base = getAgentById(id)
  if (!base) {
    const eq = getEquipeHub().agents.find(a => a.id === id)
    if (!eq) return undefined
    base = equipeToAgentDetail(eq)
  }

  const enrichir = FICHES_ENRICHIES[id]
  if (enrichir) {
    return { ...base, ...enrichir(base) }
  }
  return buildFallback(base)
}

export function getFicheAgentByNom(nom: string): FicheAgentMicrofinance | undefined {
  const equipe = getEquipeHub().agents.find(a => a.nom === nom)
  if (!equipe) return undefined
  const id = equipe.lien_fiche.replace('/dashboard/agents/', '')
  return getFicheAgentMicrofinance(id)
}
