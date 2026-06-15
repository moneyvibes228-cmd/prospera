// ─── CONSTANTES IA COMMUNES ────────────────────────────────────────────────
import {
  buildCommercialRoleKpis,
  buildCreditRisqueKpis,
  buildGestionnaireKpis,
  buildMarketingRoleKpis,
} from './mock-data-by-role-builder'

export const IA_MODEL_INFO = {
  nom: 'Prospera AI v2.4',
  modele: 'XGBoost + Gradient Boosting',
  dernier_entrainement: '18/05/2026',
  precision_globale: 91.3,
  echantillon_entrainement: '12 400 profils UEMOA',
  variables_actives: 47,
}

// ─── GESTIONNAIRE PORTEFEUILLE ─────────────────────────────────────────────
export const MOCK_GESTIONNAIRE = {
  kpis: buildGestionnaireKpis(),
  clients_portefeuille: [
    { id: 'c1', nom: 'Kwami Ekpé',       agence: 'AG-002', groupe: 'Groupe Soleil',   montant: 400_000, echeance: '24/05', retard: 45, score: 22, delta_score: -18, statut: 'DEFAUT',    canal: 'Espèces',       ia_alerte: 'Baisse activité + absence WA + retard critique', ia_action: 'ESCALADE' },
    { id: 'c2', nom: 'Enyonam Kpade',    agence: 'AG-002', groupe: 'Individuel',      montant: 150_000, echeance: '28/05', retard: 38, score: 18, delta_score: -22, statut: 'RETARD',     canal: 'MTN MoMo',      ia_alerte: 'Aucune réponse 20j + paiement espèces → MoMo',   ia_action: 'VISITE' },
    { id: 'c3', nom: 'Togbui Apedo',     agence: 'AG-003', groupe: 'Groupe Harmonie', montant: 200_000, echeance: '18/05', retard: 62, score: 31, delta_score: -31, statut: 'DEFAUT',     canal: 'Espèces',       ia_alerte: 'Profil similaire à 3 défauts contentieux',        ia_action: 'RESTRUCTURATION' },
    { id: 'c4', nom: 'Komi Akléssoé',    agence: 'AG-001', groupe: 'Individuel',      montant: 500_000, echeance: '23/05', retard: 8,  score: 58, delta_score: -9,  statut: 'RETARD',     canal: 'Orange Money',  ia_alerte: '1er retard après 9 mois impeccables — isolé ?',    ia_action: 'APPEL' },
    { id: 'c5', nom: 'Abla Fiagbedzi',   agence: 'AG-002', groupe: 'Groupe Victoire', montant: 250_000, echeance: '25/05', retard: 12, score: 52, delta_score: -6,  statut: 'RETARD',     canal: 'MTN MoMo',      ia_alerte: 'Paiement partiel x2 + messages lus sans réponse',  ia_action: 'FERME' },
    { id: 'c6', nom: 'Yawa Dossou',      agence: 'AG-001', groupe: 'Individuel',      montant: 300_000, echeance: '29/05', retard: 0,  score: 74, delta_score: 2,   statut: 'EN_COURS',   canal: 'MTN MoMo',      ia_alerte: null,                                              ia_action: null },
    { id: 'c7', nom: 'Akossiwa Mensah',  agence: 'AG-001', groupe: 'Groupe Soleil',   montant: 350_000, echeance: '01/06', retard: 0,  score: 81, delta_score: 4,   statut: 'EN_COURS',   canal: 'MTN MoMo',      ia_alerte: null,                                              ia_action: null },
    { id: 'c8', nom: 'Komlan Attivor',   agence: 'AG-001', groupe: 'Individuel',      montant: 450_000, echeance: '22/05', retard: 2,  score: 71, delta_score: -3,  statut: 'EN_COURS',   canal: 'Orange Money',  ia_alerte: 'Légère baisse — surveiller prochaine éch.',        ia_action: 'SURVEILLANCE' },
    { id: 'c9', nom: 'Elinam Afetogbo',  agence: 'AG-001', groupe: 'Groupe Espoir',   montant: 600_000, echeance: '05/06', retard: 0,  score: 87, delta_score: 5,   statut: 'EN_COURS',   canal: 'MTN MoMo',      ia_alerte: null,                                              ia_action: null },
    { id: 'c10',nom: 'Kafui Dewonou',    agence: 'AG-001', groupe: 'Individuel',      montant: 180_000, echeance: '30/05', retard: 0,  score: 79, delta_score: 1,   statut: 'EN_COURS',   canal: 'MTN MoMo',      ia_alerte: null,                                              ia_action: null },
    { id: 'c11',nom: 'Ama Kpodaho',      agence: 'AG-004', groupe: 'Groupe Victoire', montant: 125_000, echeance: '03/06', retard: 0,  score: 92, delta_score: 8,   statut: 'EN_COURS',   canal: 'MTN MoMo',      ia_alerte: 'Éligible renouvellement 750k — score excellent',   ia_action: 'RENOUVELLEMENT' },
    { id: 'c12',nom: 'Mawuena Hotor',    agence: 'AG-003', groupe: 'Individuel',      montant: 220_000, echeance: '26/05', retard: 5,  score: 61, delta_score: -7,  statut: 'SURVEILLANCE',canal: 'Espèces',       ia_alerte: 'Passage espèces → signe précurseur fréquent',      ia_action: 'SURVEILLANCE' },
  ],
  alertes_urgentes: [
    { id: 'a1', nom: 'Kwami Ekpé',      score: 22, retard: 45, montant: 400_000, action: 'Escalade superviseur immédiate — 2ème défaut',        severity: 'CRITIQUE',    groupe: 'Groupe Soleil' },
    { id: 'a2', nom: 'Enyonam Kpade',   score: 18, retard: 38, montant: 150_000, action: 'Visite terrain urgente — inactif WhatsApp 20j',       severity: 'CRITIQUE',    groupe: 'Individuel' },
    { id: 'a3', nom: 'Togbui Apedo',    score: 31, retard: 62, montant: 200_000, action: 'Révision plan restructuration — J+62',                severity: 'CRITIQUE',    groupe: 'Groupe Harmonie' },
    { id: 'a4', nom: 'Komi Akléssoé',   score: 58, retard: 8,  montant: 500_000, action: 'Appel de rappel — 1er retard après 6 mois réguliers', severity: 'SURVEILLANCE', groupe: 'Individuel' },
    { id: 'a5', nom: 'Abla Fiagbedzi',  score: 52, retard: 12, montant: 250_000, action: 'Relance SMS + reprogrammer visite',                   severity: 'SURVEILLANCE', groupe: 'Groupe Victoire' },
  ],
  tournee_du_jour: [
    { heure: '08h30', nom: 'Kwami Ekpé',       zone: 'Adidogomé — Rue des Forgerons',  priorite: 'HAUTE',   statut: 'A_FAIRE', raison: 'Défaut J+45 — URGENT — 2ème incident', distance: '1.2km' },
    { heure: '10h00', nom: 'Enyonam Kpade',    zone: 'Adidogomé — Marché Central',     priorite: 'HAUTE',   statut: 'A_FAIRE', raison: 'Inactif WhatsApp 20j + retard J+38', distance: '0.4km' },
    { heure: '11h30', nom: 'Komi Akléssoé',    zone: 'Lomé Centre — Rue Duvigneau',    priorite: 'HAUTE',   statut: 'A_FAIRE', raison: '1er retard significatif — signalé IA', distance: '2.1km' },
    { heure: '13h00', nom: 'Komlan Attivor',   zone: 'Lomé Centre — Tokoin',           priorite: 'NORMALE', statut: 'A_FAIRE', raison: 'Échéance dans 2 jours — rappel préventif', distance: '0.8km' },
    { heure: '15h00', nom: 'Mawuena Hotor',    zone: 'Lomé Centre — Bè Kpota',         priorite: 'NORMALE', statut: 'A_FAIRE', raison: 'Paiement partiel x2 — suivi approfondi', distance: '1.5km' },
    { heure: '16h30', nom: 'Akossiwa Mensah',  zone: 'Adidogomé — Zone Commerce',      priorite: 'FAIBLE',  statut: 'A_FAIRE', raison: 'Visite mensuelle de suivi', distance: '0.6km' },
  ],
  echeances_7j: [
    { nom: 'Komlan Attivor',  montant: 50_000,  date: '23/05', jours_restants: 2, canal: 'MTN MoMo',     probabilite: 87 },
    { nom: 'Kwami Ekpé',      montant: 66_667,  date: '24/05', jours_restants: 3, canal: 'Espèces',      probabilite: 22 },
    { nom: 'Abla Fiagbedzi',  montant: 41_667,  date: '25/05', jours_restants: 4, canal: 'MTN MoMo',     probabilite: 52 },
    { nom: 'Yawa Dossou',     montant: 37_500,  date: '29/05', jours_restants: 8, canal: 'MTN MoMo',     probabilite: 93 },
    { nom: 'Kafui Dewonou',   montant: 22_500,  date: '30/05', jours_restants: 9, canal: 'MTN MoMo',     probabilite: 79 },
  ],
  whatsapp_messages: [
    { nom: 'Komi Akléssoé',   message: 'Je passe payer demain matin', heure: '09h14', lu: false },
    { nom: 'Abla Fiagbedzi',  message: 'Est-ce que je peux payer en 2 fois ?',heure: '10h32', lu: false },
    { nom: 'Enyonam Kpade',   message: 'Bonjour, quand est ma prochaine échéance ?', heure: '11h05', lu: false },
    { nom: 'Akossiwa Mensah', message: 'Merci pour le rappel, j\'ai payé via MoMo', heure: '13h28', lu: true },
  ],
  historique_collecte: [
    { semaine: 'S1', collecte: 780_000, objectif: 1_000_000 },
    { semaine: 'S2', collecte: 920_000, objectif: 1_000_000 },
    { semaine: 'S3', collecte: 850_000, objectif: 1_000_000 },
    { semaine: 'S4', collecte: 1_020_000, objectif: 1_000_000 },
    { semaine: 'S5', collecte: 710_000, objectif: 1_000_000 },
  ],
  // ─── DONNÉES IA ─────────────────────────────────────────────────────────
  ia_rapport_journalier: {
    genere_le: '21/05/2026 à 17h00',
    visites_effectuees: 6,
    visites_planifiees: 9,
    collecte_realisee: 185_000,
    nouveaux_cas_risque: 2,
    messages_envoyes: 4,
    score_journee: 78,
    envoye_manager: true,
    ratio_visites: 67,
    demain_priorites: [
      { heure: '08h00', client: 'Kwami Ekpé', raison: 'Défaut J+45 — passer avant ouverture marché', priorite: 'CRITIQUE' },
      { heure: '09h30', client: 'Enyonam Kpade', raison: 'Inactif WA 20j — visite domicile', priorite: 'CRITIQUE' },
      { heure: '11h00', client: 'Ama Kpodaho', raison: 'Score 92 — proposer renouvellement 750k', priorite: 'OPPORTUNITE' },
    ],
    synthese_texte: 'Journée correcte malgré 3 visites manquées. La collecte 185 000 FCFA est à 62% de l\'objectif journalier. 2 nouveaux risques détectés par l\'IA. Rapport transmis au superviseur.',
  },
  wa_inbox_numero_unique: {
    numero: '+228 70 00 00 00',
    messages: [
      { nom: 'Komi Akléssoé', message: 'Je passe payer demain matin', heure: '09h14', lu: false, type: 'PAIEMENT' },
      { nom: 'Abla Fiagbedzi', message: 'Est-ce que je peux payer en 2 fois ?', heure: '10h32', lu: false, type: 'QUESTION' },
      { nom: 'Enyonam Kpade', message: 'Bonjour, quand est ma prochaine échéance ?', heure: '11h05', lu: false, type: 'QUESTION' },
      { nom: 'Akossiwa Mensah', message: 'Merci pour le rappel, j\'ai payé via MoMo', heure: '13h28', lu: true, type: 'CONFIRMATION' },
    ],
    momo_liens: [
      { client: 'Kwami Ekpé', montant: 66_667, lien_momo: 'mtn://pay?merchant=PROSPERA&amount=66667&ref=CTR-0481', expire: '21/05 18h00' },
      { client: 'Enyonam Kpade', montant: 12_500, lien_momo: 'mtn://pay?merchant=PROSPERA&amount=12500&ref=CTR-0382', expire: '22/05 08h00' },
    ],
  },
  ia_insights: [
    { titre: 'Défaut imminent détecté — Kwami Ekpé', detail: 'Score passé de 40→22 en 14j. Profil comparable à 4 dossiers contentieux clôturés. Probabilité de défaut J+7 : 88%. Visitez aujourd\'hui et initiez la restructuration.', type: 'ALERTE' as const, confidence: 88, impact: 'CRITIQUE' as const, acteur: 'Gestionnaire + Superviseur' },
    { titre: 'Tournée optimisée — gain estimé 2h30', detail: 'L\'IA a réorganisé l\'ordre de vos 6 visites pour réduire le trajet de 8.4km à 6.1km. Priorités risque intégrées : les 3 cas critiques sont planifiés avant 12h.', type: 'ACTION' as const, confidence: 95, impact: 'MODERE' as const, acteur: 'Gestionnaire' },
    { titre: 'Opportunité renouvellement — Ama Kpodaho', detail: 'Score 92/100, 8 mois de remboursement impeccable. L\'IA recommande une proposition de renouvellement 750 000 FCFA sur 9 mois. Taux d\'acceptation estimé : 94%.', type: 'OPPORTUNITE' as const, confidence: 94, impact: 'MODERE' as const, acteur: 'Gestionnaire' },
    { titre: 'Prévision collecte semaine prochaine', detail: 'Sur la base des comportements de paiement actuels, la collecte prévue est de 920 000 FCFA (±15%). 4 clients à forte probabilité de paiement, 3 incertains.', type: 'PREVISION' as const, confidence: 78, impact: 'INFO' as const, acteur: 'Gestionnaire' },
  ],
  ia_score_detail: {
    client_exemple: 'Kwami Ekpé',
    score: 22,
    facteurs: [
      { label: 'Retard actuel J+45',                     impact: 'NEGATIF' as const, valeur: '-28 pts' },
      { label: 'Absence communication WA 20j',           impact: 'NEGATIF' as const, valeur: '-15 pts' },
      { label: 'Passage espèces → non traçable',         impact: 'NEGATIF' as const, valeur: '-12 pts' },
      { label: 'Zone Adidogomé : hausse retards +18%',   impact: 'NEGATIF' as const, valeur: '-8 pts' },
      { label: 'Historique 2 crédits antérieurs soldés', impact: 'POSITIF' as const, valeur: '+15 pts' },
      { label: 'Montant faible — < 500k',                impact: 'POSITIF' as const, valeur: '+8 pts' },
    ],
  },
}

// ─── COMMERCIAL TERRAIN ─────────────────────────────────────────────────────
export const MOCK_COMMERCIAL = {
  kpis: buildCommercialRoleKpis(),
  plan_tournee: [
    { heure: '07h30', zone: 'Marché Adidogomé',         statut: 'FAIT',      visitees: 4, positives: 3, collecte: 120_000, distance: '0km' },
    { heure: '10h00', zone: 'Quartier Nord Résidentiel', statut: 'FAIT',      visitees: 3, positives: 2, collecte: 65_000,  distance: '1.4km' },
    { heure: '12h30', zone: 'Zone Industrielle',          statut: 'EN_COURS',  visitees: 0, positives: 0, collecte: 0,       distance: '2.1km' },
    { heure: '14h30', zone: 'Tokoin Fon',                 statut: 'PLANIFIE',  visitees: 0, positives: 0, collecte: 0,       distance: '1.8km' },
    { heure: '16h30', zone: 'Bord Route Nationale',       statut: 'PLANIFIE',  visitees: 0, positives: 0, collecte: 0,       distance: '3.2km' },
  ],
  visites_recentes: [
    { nom: 'Abla Mensah',     activite: 'Vendeuse de pagnes', methode: 'Visite terrain', statut: 'POSITIVE',     heure: '09h14', gps_valide: true,  doublon_alerte: false, notes: 'Intéressée crédit groupe 500k' },
    { nom: 'Koffi Adjohou',   activite: 'Mécanicien',         methode: 'Porte-à-porte',  statut: 'POSITIVE',     heure: '09h52', gps_valide: true,  doublon_alerte: false, notes: 'Déjà client — veut renouveler' },
    { nom: 'Yawa Tetteh',     activite: 'Commerçante',        methode: 'Brochure',       statut: 'SANS_REPONSE', heure: '10h33', gps_valide: true,  doublon_alerte: false, notes: 'À recontacter vendredi' },
    { nom: 'Sena Agbor',      activite: 'Coiffeuse',          methode: 'Porte-à-porte',  statut: 'NEGATIVE',     heure: '11h02', gps_valide: true,  doublon_alerte: false, notes: 'Déjà engagée ailleurs' },
    { nom: 'Afi Dodji',       activite: 'Vendeuse marché',    methode: 'Visite terrain', statut: 'POSITIVE',     heure: '11h45', gps_valide: true,  doublon_alerte: true,  notes: 'ATTENTION: visite proche 34m' },
    { nom: 'Kokou Mensah',    activite: 'Boulanger',          methode: 'Appel',          statut: 'POSITIVE',     heure: '12h10', gps_valide: false, doublon_alerte: false, notes: 'Veut prêt individuel 200k' },
  ],
  classement_equipe: [
    { rang: 1, nom: 'Akua Lawson',  zone: 'Adidogomé', visites: 32, positives: 22, collecte: 1_850_000, conv: 0.69, badge: 'OR',     streak: 12, points: 1_240 },
    { rang: 2, nom: 'Edem Kpélim',  zone: 'Bè Kpota',  visites: 28, positives: 17, collecte: 1_620_000, conv: 0.61, badge: 'ARGENT', streak: 8,  points: 1_050 },
    { rang: 3, nom: 'Dodzi Amegan', zone: 'Bè Kpota',  visites: 21, positives: 12, collecte: 1_100_000, conv: 0.57, badge: 'BRONZE', streak: 3,  points: 780 },
    { rang: 4, nom: 'Komi Atsu',    zone: 'Hédzranawoé',visites: 18, positives: 8,  collecte: 890_000,   conv: 0.44, badge: null,     streak: 1,  points: 540 },
  ],
  mobile_money_du_jour: {
    mtn_momo:     { transactions: 5, montant: 145_000 },
    orange_money: { transactions: 3, montant: 95_000  },
    especes:      { transactions: 1, montant: 30_000  },
  },
  defis_actifs: [
    { titre: '10 visites aujourd\'hui',   objectif: 10, realise: 7, recompense: '50 pts', deadline: 'Ce soir' },
    { titre: 'Recrutement 5 prospects',   objectif: 5,  realise: 3, recompense: 'Badge RECRUTEUR', deadline: 'Cette semaine' },
    { titre: 'Collecte 300k aujourd\'hui',objectif: 300_000, realise: 185_000, recompense: '100 pts', deadline: 'Ce soir' },
  ],
  stats_7j: [
    { jour: 'Lun', visites: 8, collecte: 240_000 },
    { jour: 'Mar', visites: 10, collecte: 310_000 },
    { jour: 'Mer', visites: 6, collecte: 180_000 },
    { jour: 'Jeu', visites: 7, collecte: 185_000 },
    { jour: 'Ven', visites: 0, collecte: 0 },
    { jour: 'Sam', visites: 0, collecte: 0 },
  ],
  ready_to_revisit: [
    { nom: 'Assata Koudjo', zone: 'Adidogomé', derniere_visite: '03/05', jours_attente: 18, score_conversion: 68, ia_conseil: 'Profil chaud — plus de 2 semaines d\'attente. Recontacter cette semaine.', canal_suggere: 'WhatsApp' },
    { nom: 'Boevi Mensah', zone: 'Lomé Centre', derniere_visite: '08/05', jours_attente: 13, score_conversion: 54, ia_conseil: 'Avait demandé des infos tontine — relancer avec les nouveaux tarifs mai.', canal_suggere: 'Appel' },
    { nom: 'Groupe Kpalimé x6', zone: 'Kpalimé', derniere_visite: '07/05', jours_attente: 14, score_conversion: 74, ia_conseil: 'Groupe intéressé crédit agricole — récolte juin approche. URGENT.', canal_suggere: 'Visite terrain' },
    { nom: 'Afi Soglo', zone: 'Tokoin', derniere_visite: '10/05', jours_attente: 11, score_conversion: 61, ia_conseil: 'Prospect tiède — envoyer brochure groupe solidarité avant de recontacter.', canal_suggere: 'WhatsApp' },
  ],
  detection_gps_doublon: [
    { adresse: 'Marché Adidogomé — stand 14', autre_agent: 'Akua Lawson', date_visite: '18/05', distance_m: 23, action_ia: 'Doublon évité — coordonner avec Akua avant nouvelle visite' },
    { adresse: 'Boulangerie Tokoin Nord', autre_agent: 'Edem Kpélim', date_visite: '15/05', distance_m: 41, action_ia: 'Zone visitée récemment — différer la visite de 7 jours' },
  ],
}

// ─── CRÉDIT + RISQUE (fusionné) ──────────────────────────────────────────────
export const MOCK_CREDIT_RISQUE = {
  kpis: buildCreditRisqueKpis(),
  pipeline: [
    { stage: 'PROSPECTION',   count: 12, montant: 4_200_000, color: '#94a3b8', bloquees: 0 },
    { stage: 'DEMANDE',       count: 9,  montant: 3_800_000, color: '#60a5fa', bloquees: 1 },
    { stage: 'EVALUATION',    count: 7,  montant: 2_900_000, color: '#f97316', bloquees: 2 },
    { stage: 'APPROBATION',   count: 4,  montant: 1_900_000, color: '#eab308', bloquees: 1 },
    { stage: 'DECAISSEMENT',  count: 3,  montant: 1_400_000, color: '#a855f7', bloquees: 0 },
    { stage: 'REMBOURSEMENT', count: 22, montant: 9_800_000, color: '#22c55e', bloquees: 0 },
    { stage: 'CLOTURE',       count: 6,  montant: 0,          color: '#64748b', bloquees: 0 },
  ],
  dossiers_requierent_action: [
    { id: 'd1', nom: 'Kafui Dewonou',   montant: 500_000, stage: 'APPROBATION',  score: 70, groupe: 'Individuel',       agent: 'Kofi Amavi',  action: 'Approuver — bon profil, historique solide', jours_attente: 3 },
    { id: 'd2', nom: 'Elinam Afetogbo', montant: 300_000, stage: 'EVALUATION',   score: 65, groupe: 'Individuel',       agent: 'Akua Lawson', action: 'Compléter enquête domiciliaire avant avis', jours_attente: 5 },
    { id: 'd3', nom: 'Groupe Espoir x5',montant: 750_000, stage: 'DEMANDE',      score: 0,  groupe: 'Groupe Solidarité',agent: 'Edem Kpélim', action: 'Pré-scoring en attente — données incomplètes', jours_attente: 2 },
    { id: 'd4', nom: 'Adjoa Fiakli',    montant: 200_000, stage: 'DECAISSEMENT', score: 78, groupe: 'Individuel',       agent: 'Kofi Amavi',  action: 'Virement MTN MoMo prêt à exécuter', jours_attente: 1 },
    { id: 'd5', nom: 'Togbui Mensah',   montant: 450_000, stage: 'EVALUATION',   score: 41, groupe: 'Individuel',       agent: 'Akua Lawson', action: 'ALERTE: score faible — avis défavorable probable', jours_attente: 4 },
    { id: 'd6', nom: 'Afi Kpade',       montant: 180_000, stage: 'APPROBATION',  score: 62, groupe: 'Groupe Victoire',  agent: 'Edem Kpélim', action: 'Validation comité requise — dossier complet', jours_attente: 1 },
  ],
  par_historique: [
    { semaine: 'S1', par_30j: 10.5, par_60j: 3.9, par_90j: 1.8, decaisses: 5 },
    { semaine: 'S2', par_30j: 9.8,  par_60j: 3.7, par_90j: 1.6, decaisses: 8 },
    { semaine: 'S3', par_30j: 9.1,  par_60j: 3.4, par_90j: 1.5, decaisses: 6 },
    { semaine: 'S4', par_30j: 9.4,  par_60j: 3.5, par_90j: 1.6, decaisses: 11 },
    { semaine: 'S5', par_30j: 8.9,  par_60j: 3.3, par_90j: 1.4, decaisses: 7 },
    { semaine: 'S6', par_30j: 8.5,  par_60j: 3.2, par_90j: 1.4, decaisses: 9 },
    { semaine: 'S7', par_30j: 8.3,  par_60j: 3.1, par_90j: 1.3, decaisses: 10 },
    { semaine: 'S8', par_30j: 8.2,  par_60j: 3.1, par_90j: 1.4, decaisses: 11 },
  ],
  signaux_faibles_ia: [
    { nom: 'Dossi Kokuvi',   signal: 'Inactif WhatsApp 14j + paiement partiel',   score_avant: 55, score_apres: 43, delta: -12, urgent: true,  action: 'Contacter immédiatement — risque J+7' },
    { nom: 'Togbui Apedo',   signal: '1er retard après 8 mois de régularité',      score_avant: 42, score_apres: 31, delta: -11, urgent: true,  action: 'Visite terrain + restructuration' },
    { nom: 'Mawuena Hotor',  signal: 'Paiement partiel 2 fois consécutifs',        score_avant: 68, score_apres: 61, delta: -7,  urgent: false, action: 'Appel WhatsApp + comprendre situation' },
    { nom: 'Komlan Attivor', signal: '1er retard 2j — profil historique solide',   score_avant: 77, score_apres: 74, delta: -3,  urgent: false, action: 'Rappel doux — probablement accidentel' },
    { nom: 'Afi Kpade',      signal: 'Zone géographique avec hausse retards +15%', score_avant: 62, score_apres: 58, delta: -4,  urgent: false, action: 'Surveiller — facteur zone identifié' },
  ],
  distribution_scores: [
    { tranche: '0-20',  count: 3,  label: 'Critique',    color: '#dc2626' },
    { tranche: '21-40', count: 6,  label: 'Risque élevé',color: '#f97316' },
    { tranche: '41-60', count: 11, label: 'Surveillance', color: '#eab308' },
    { tranche: '61-80', count: 18, label: 'Correct',      color: '#22c55e' },
    { tranche: '81-100',count: 14, label: 'Excellent',    color: '#16a34a' },
  ],
  par_par_zone: [
    { zone: 'Lomé Centre',  par: 6.8,  emprunteurs: 18, encours: 7_200_000, agent: 'Kofi Amavi' },
    { zone: 'Adidogomé',    par: 9.4,  emprunteurs: 14, encours: 5_400_000, agent: 'Akua Lawson' },
    { zone: 'Bè Kpota',     par: 11.2, emprunteurs: 11, encours: 4_100_000, agent: 'Edem Kpélim' },
    { zone: 'Hédzranawoé',  par: 6.1,  emprunteurs: 9,  encours: 3_200_000, agent: 'Komi Atsu' },
  ],
  decaissements_du_jour: [
    { nom: 'Adjoa Fiakli',   montant: 200_000, canal: 'MTN MoMo',     statut: 'CONFIRME',   heure: '09h22', contrat: 'CTR-2026-0481' },
    { nom: 'Kafui Dewonou',  montant: 500_000, canal: 'Orange Money', statut: 'EN_ATTENTE', heure: '14h00', contrat: 'CTR-2026-0482' },
  ],
  recommandations_ia: [
    { type: 'ACTION', message: 'Togbui Apedo J+62 : proposer restructuration sur 3 mois pour éviter contentieux', priorite: 'HAUTE' },
    { type: 'OPPORTUNITE', message: 'Ama Kpodaho (score 92) : eligible renouvellement automatique 750k sur 9 mois', priorite: 'NORMALE' },
    { type: 'RISQUE_ZONE', message: 'Bè Kpota PAR 11.2% — déployer 1 visite terrain renforcée cette semaine', priorite: 'HAUTE' },
  ],
  // ─── IA SPÉCIFIQUE CRÉDIT/RISQUE ────────────────────────────────────────
  ia_prevision_defauts: [
    { horizon: 'J+7',  defauts_prevus: 2, montant_risque: 350_000,  confidence: 91, clients: ['Kwami Ekpé', 'Enyonam Kpade'] },
    { horizon: 'J+14', defauts_prevus: 4, montant_risque: 720_000,  confidence: 83, clients: ['+ Togbui Apedo', 'Dossi Kokuvi'] },
    { horizon: 'J+30', defauts_prevus: 7, montant_risque: 1_450_000,confidence: 71, clients: ['+ 3 profils surveillance'] },
  ],
  ia_scoring_detail: [
    { dossier: 'Kafui Dewonou', score: 70, recommandation: 'Approuver 500k / 6 mois', facteurs_positifs: ['8 mois historique MTN MoMo', 'Activité stable', 'Référencé par membre fiable'], facteurs_negatifs: ['1er crédit — pas d\'historique IMF'], montant_suggere: 500_000, duree_suggeree: 6 },
    { dossier: 'Togbui Mensah', score: 41, recommandation: 'Refuser — risque élevé', facteurs_positifs: ['Activité commerciale déclarée'], facteurs_negatifs: ['Zone PAR élevé', 'Profil similaire à 2 défauts', 'Pas de référent', 'Revenus non documentés'], montant_suggere: 0, duree_suggeree: 0 },
  ],
  ia_par_forecast: [
    { mois: 'Juin',    par_prevu: 7.8,  par_objectif: 8.0, confidence: 84 },
    { mois: 'Juillet', par_prevu: 7.2,  par_objectif: 7.5, confidence: 76 },
    { mois: 'Août',    par_prevu: 6.9,  par_objectif: 7.0, confidence: 68 },
  ],
  ia_insights_credit: [
    { titre: '2 défauts probables dans les 7 prochains jours', detail: 'Kwami Ekpé (confiance 91%) et Enyonam Kpade (confiance 87%) présentent des signaux comportementaux identiques à 94% des défauts enregistrés. Montant à risque immédiat : 350 000 FCFA.', type: 'ALERTE' as const, confidence: 91, impact: 'CRITIQUE' as const },
    { titre: 'PAR Bè Kpota : alerte seuil BCEAO', detail: 'Le PAR de l\'agence Bè Kpota est à 11.2% — au-dessus du seuil réglementaire BCEAO de 10%. Si aucune action n\'est menée avant fin mai, l\'agence sera en zone de non-conformité au rapport trimestriel.', type: 'ALERTE' as const, confidence: 98, impact: 'CRITIQUE' as const },
    { titre: 'Prévision PAR juin : 7.8% (en baisse)', detail: 'Si les 4 restructurations en cours aboutissent et que les 2 décaissements prévus concernent des profils solides (score >70), le PAR global devrait passer à 7.8% en juin. Confiance : 84%.', type: 'PREVISION' as const, confidence: 84, impact: 'ELEVE' as const },
    { titre: '14 dossiers éligibles renouvellement automatique', detail: 'L\'IA a identifié 14 emprunteurs avec un comportement de remboursement exceptionnel (score >85). Un renouvellement proactif représente une opportunité de 4 900 000 FCFA de nouveaux décaissements avec un risque minimal.', type: 'OPPORTUNITE' as const, confidence: 89, impact: 'ELEVE' as const },
  ],
  gap_analysis_agents: [
    { agent: 'Kofi Amavi',  rang: 1, taux_remb: 96.2, par: 5.9, score_qualite: 98, visites_hebdo: 0, clients: 62, badge: 'MEILLEUR' as const, ia_insight: 'RA Lomé Centre — pilotage agence, 62 clients uniques. Équipe terrain : Yawo, Mensah, Mawunya.' },
    { agent: 'Yawo Adjavon', rang: 2, taux_remb: 91, par: 6.2, score_qualite: 88, visites_hebdo: 42, clients: 62, badge: 'MEILLEUR' as const, ia_insight: 'Commercial référence zone Marché/Assigamé — relances WA 14h-17h, 89% MoMo' },
    { agent: 'Mawunya Kpodzo', rang: 3, taux_remb: 89, par: 5.4, score_qualite: 89, visites_hebdo: 12, clients: 300, badge: null, ia_insight: 'GP référence Lomé Centre — suivi 300 clients agence (échéances, relances guichet)' },
    { agent: 'Akua Lawson', rang: 4, taux_remb: 88.4, par: 9.4, score_qualite: 84, visites_hebdo: 0, clients: 48, badge: null, ia_insight: 'RA Adidogomé — pilotage agence, équipe terrain Sena Dossou (GP)' },
    { agent: 'Edem Kpélim', rang: 5, taux_remb: 62.3, par: 14.2, score_qualite: 62, visites_hebdo: 0, clients: 37, badge: 'ALERTE' as const, ia_insight: 'RA Bè Kpota — PAR agence 14.2%, plan redressement 60j. Audit GPS équipe Kossi Adjavon.' },
  ],
}

// ─── COMPTABLE + RELANCE + PAIE (fusionné) ──────────────────────────────────
export const MOCK_FINANCES = {
  kpis: {
    creances_total: 85_450_000,
    encaisse_mois: 72_100_000,
    en_retard: 8_340_000,
    par_recouvrement: 86.4,
    relances_en_attente: 18,
    relances_actives_aujourd_hui: 11,
    taux_reponse_wa: 64,
    transactions_momo: 147,
    reconciliees_auto: 144,
    a_valider_manuellement: 3,
    masse_salariale: 2_800_000,
    commissions_mois: 486_000,
    export_sage_statut: '20/05/2026',
    agents_actifs_paie: 4,
  },
  relances_actives: [
    { id: 'r1', nom: 'Kwami Ekpé',       retard: 45, montant_du: 66_667,  montant_credit: 400_000, strategie: 'ESCALADE', canal: 'Visite',   statut: 'EN_ATTENTE', score: 22, message_wa: null },
    { id: 'r2', nom: 'Enyonam Kpade',    retard: 38, montant_du: 12_500,  montant_credit: 150_000, strategie: 'VISITE',   canal: 'Visite',   statut: 'EN_ATTENTE', score: 18, message_wa: null },
    { id: 'r3', nom: 'Togbui Apedo',     retard: 62, montant_du: 66_667,  montant_credit: 200_000, strategie: 'ESCALADE', canal: 'Appel',    statut: 'EN_ATTENTE', score: 31, message_wa: 'Pas de réponse x3' },
    { id: 'r4', nom: 'Dossi Kokuvi',     retard: 21, montant_du: 20_833,  montant_credit: 250_000, strategie: 'FERME',    canal: 'WhatsApp', statut: 'ENVOYE',     score: 43, message_wa: 'Envoyé 09h30' },
    { id: 'r5', nom: 'Abla Fiagbedzi',   retard: 12, montant_du: 25_000,  montant_credit: 300_000, strategie: 'FERME',    canal: 'WhatsApp', statut: 'LU',         score: 52, message_wa: 'Lu 10h45' },
    { id: 'r6', nom: 'Komi Akléssoé',    retard: 8,  montant_du: 41_667,  montant_credit: 500_000, strategie: 'FERME',    canal: 'WhatsApp', statut: 'LU',         score: 58, message_wa: 'Promet de payer demain' },
    { id: 'r7', nom: 'Mawuena Hotor',    retard: 5,  montant_du: 35_000,  montant_credit: 220_000, strategie: 'DOUX',     canal: 'SMS',      statut: 'ENVOYE',     score: 61, message_wa: null },
    { id: 'r8', nom: 'Komlan Attivor',   retard: 2,  montant_du: 50_000,  montant_credit: 450_000, strategie: 'DOUX',     canal: 'WhatsApp', statut: 'REPONDU',    score: 74, message_wa: 'Paiement en cours MoMo' },
  ],
  flux_tresorerie: [
    { date: '15/05', attendu: 1_200_000, recu: 1_050_000, retard: 150_000 },
    { date: '16/05', attendu: 980_000,   recu: 910_000,   retard: 70_000 },
    { date: '17/05', attendu: 750_000,   recu: 750_000,   retard: 0 },
    { date: '18/05', attendu: 1_100_000, recu: 840_000,   retard: 260_000 },
    { date: '19/05', attendu: 890_000,   recu: 820_000,   retard: 70_000 },
    { date: '20/05', attendu: 960_000,   recu: 960_000,   retard: 0 },
    { date: '21/05', attendu: 1_050_000, recu: 320_000,   retard: 730_000 },
  ],
  transactions_momo_recentes: [
    { id: 't1', emprunteur: 'Akossiwa Mensah', montant: 37_500,  canal: 'MTN MoMo',     statut: 'RECONCILIEE', date: '21/05 09h14', ref_momo: 'MOMO-20260521-0014' },
    { id: 't2', emprunteur: 'Yawa Dossou',     montant: 16_667,  canal: 'Orange Money', statut: 'RECONCILIEE', date: '21/05 10h22', ref_momo: 'OM-20260521-0052' },
    { id: 't3', emprunteur: 'Togbui Apedo',    montant: 15_000,  canal: 'Espèces',      statut: 'A_VALIDER',   date: '21/05 11h05', ref_momo: null },
    { id: 't4', emprunteur: 'Komlan Attivor',  montant: 50_000,  canal: 'MTN MoMo',     statut: 'RECONCILIEE', date: '21/05 11h30', ref_momo: 'MOMO-20260521-0031' },
    { id: 't5', emprunteur: 'Komi Akléssoé',   montant: 41_667,  canal: 'Orange Money', statut: 'EN_ATTENTE',  date: '21/05 12h00', ref_momo: 'OM-20260521-0087' },
    { id: 't6', emprunteur: 'Afi Togbedji',    montant: 29_167,  canal: 'MTN MoMo',     statut: 'RECONCILIEE', date: '21/05 14h05', ref_momo: 'MOMO-20260521-0048' },
  ],
  repartition_paiements: [
    { canal: 'MTN MoMo',     montant: 7_840_000, transactions: 89, pct: 63 },
    { canal: 'Orange Money', montant: 3_120_000, transactions: 42, pct: 25 },
    { canal: 'Espèces',      montant: 1_490_000, transactions: 16, pct: 12 },
  ],
  creances_par_statut: [
    { statut: 'Payée',          count: 132, montant: 72_100_000, color: '#16a34a' },
    { statut: 'À venir',        count: 24,  montant: 11_200_000, color: '#2563eb' },
    { statut: 'En retard',      count: 14,  montant: 7_300_000,  color: '#f97316' },
    { statut: 'Contentieux',    count: 5,   montant: 4_850_000,  color: '#dc2626' },
  ],
  agents_paie: [
    {
      rang: 1, agent: 'Kofi Amavi',  zone: 'Lomé Centre', badge: 'OR',
      visites_gps: 48, visites_obj: 50, collecte: 8_250_000, collecte_obj: 8_500_000,
      recouvrement: 96.2, prospects: 12, taux_conv: 0.75, commission: 165_000, prime_qualite: 25_000,
    },
    {
      rang: 2, agent: 'Edem Kpélim', zone: 'Bè Kpota', badge: 'ARGENT',
      visites_gps: 44, visites_obj: 50, collecte: 7_700_000, collecte_obj: 8_500_000,
      recouvrement: 88.4, prospects: 10, taux_conv: 0.70, commission: 138_000, prime_qualite: 15_000,
    },
    {
      rang: 3, agent: 'Akua Lawson', zone: 'Adidogomé', badge: 'BRONZE',
      visites_gps: 41, visites_obj: 50, collecte: 7_100_000, collecte_obj: 8_500_000,
      recouvrement: 84.1, prospects: 8, taux_conv: 0.62, commission: 112_000, prime_qualite: 10_000,
    },
    {
      rang: 4, agent: 'Dodzi Amegan', zone: 'Bè Kpota', badge: null,
      visites_gps: 21, visites_obj: 50, collecte: 3_400_000, collecte_obj: 8_500_000,
      recouvrement: 62.3, prospects: 4, taux_conv: 0.38, commission: 71_000, prime_qualite: 0,
    },
  ],
  stats_canaux_relance: [
    { canal: 'WhatsApp', envoyes: 42, reponses: 28, taux: 67, meilleures_heures: '14h-17h' },
    { canal: 'SMS',      envoyes: 18, reponses: 9,  taux: 50, meilleures_heures: '09h-11h' },
    { canal: 'Appel',    envoyes: 12, reponses: 7,  taux: 58, meilleures_heures: '10h-12h' },
    { canal: 'Visite',   envoyes: 6,  reponses: 5,  taux: 83, meilleures_heures: 'Toute la journée' },
  ],
  relance_strategie_ia: [
    { situation: 'Échéance dans 3j', action: 'Rappel WA amical + lien paiement MoMo cliquable', canal: 'WhatsApp', escalade: false, automatique: true, taux_succes: 87, couleur: 'green' },
    { situation: 'Retard 1–3 jours', action: 'Relance WA ton ferme — 2ème tentative heure optimale', canal: 'WA + SMS', escalade: false, automatique: true, taux_succes: 74, couleur: 'yellow' },
    { situation: 'Retard 7 jours', action: 'Alerte agent terrain + visite planifiée IA', canal: 'App mobile agent', escalade: true, automatique: false, taux_succes: 58, couleur: 'orange' },
    { situation: 'Score risque ↑ + retard', action: 'Escalade superviseur + plan restructuration IA', canal: 'Dashboard', escalade: true, automatique: true, taux_succes: 43, couleur: 'red' },
    { situation: 'Retard > 90j', action: 'Dossier contentieux — réactivation IA dans 3 mois si profil récupérable', canal: 'IA auto', escalade: true, automatique: true, taux_succes: 22, couleur: 'red' },
  ],
  changement_canal_ia: [
    { emprunteur: 'Dossi Kokuvi', tentatives: [
      { canal: 'WhatsApp', statut: 'ECHEC', heure: '09h22' },
      { canal: 'WhatsApp', statut: 'ECHEC', heure: '14h15' },
      { canal: 'SMS', statut: 'ECHEC', heure: '16h30' },
      { canal: 'Appel direct', statut: 'EN_ATTENTE', heure: 'Demain 10h ✓IA' },
    ]},
    { emprunteur: 'Togbui Apedo', tentatives: [
      { canal: 'WhatsApp', statut: 'ECHEC', heure: 'Lun 08h' },
      { canal: 'Appel', statut: 'SANS_REPONSE', heure: 'Mar 10h' },
      { canal: 'Visite terrain', statut: 'EN_ATTENTE', heure: 'Mer 09h ✓IA' },
    ]},
  ],
  objectifs_agents_multiniveaux: [
    {
      agent: 'Kofi Amavi', agence: 'Lomé Centre',
      mensuel: [
        { kpi: 'Collecte', cible: 8_500_000, actuel: 8_250_000, pct: 97, statut: 'DANS_LES_TEMPS' as const },
        { kpi: 'Visites GPS', cible: 50, actuel: 48, pct: 96, statut: 'DANS_LES_TEMPS' as const },
        { kpi: 'Remboursement', cible: 95, actuel: 96.2, pct: 101, statut: 'EN_AVANCE' as const },
      ],
      trimestriel: [
        { kpi: 'Nouveaux clients', cible: 15, actuel: 12, pct: 80, statut: 'EN_RETARD' as const },
        { kpi: 'PAR zone', cible: 7.0, actuel: 5.9, pct: 116, statut: 'EN_AVANCE' as const },
      ],
      annuel: [
        { kpi: 'Encours géré', cible: 35_000_000, actuel: 28_200_000, pct: 81, statut: 'DANS_LES_TEMPS' as const },
      ],
    },
    {
      agent: 'Edem Kpélim', agence: 'Bè Kpota',
      mensuel: [
        { kpi: 'Collecte', cible: 8_500_000, actuel: 3_400_000, pct: 40, statut: 'CRITIQUE' as const },
        { kpi: 'Visites GPS', cible: 50, actuel: 21, pct: 42, statut: 'CRITIQUE' as const },
        { kpi: 'Remboursement', cible: 95, actuel: 62.3, pct: 66, statut: 'CRITIQUE' as const },
      ],
      trimestriel: [
        { kpi: 'Nouveaux clients', cible: 15, actuel: 4, pct: 27, statut: 'CRITIQUE' as const },
        { kpi: 'PAR zone', cible: 10.0, actuel: 14.2, pct: 71, statut: 'CRITIQUE' as const },
      ],
      annuel: [
        { kpi: 'Encours géré', cible: 35_000_000, actuel: 18_500_000, pct: 53, statut: 'CRITIQUE' as const },
      ],
    },
  ],
}

// ─── AUDITEUR ─────────────────────────────────────────────────────────────
export const MOCK_AUDITEUR = {
  kpis: {
    visites_validees_gps: 234,
    visites_non_conformes: 8,
    taux_conformite_gps: 96.7,
    anomalies_detectees: 3,
    anomalies_resolues: 1,
    transactions_auditees: 147,
    transactions_suspectes: 2,
    agents_sous_surveillance: 1,
    dernier_rapport_bceao: '15/05/2026',
    prochain_rapport: '31/05/2026',
  },
  anomalies: [
    { id: 'an1', agent: 'Dodzi Amegan', type: '12 visites enregistrées en 45 min (impossible physiquement)', severity: 'CRITIQUE',     date: '20/05 14h32', statut: 'EN_COURS',  impact: 'Fraude potentielle — données à invalider' },
    { id: 'an2', agent: 'Komi Atsu',    type: 'GPS visite à 450m de l\'adresse déclarée',                   severity: 'HAUTE',        date: '19/05 10h15', statut: 'RESOLUE',   impact: 'Adresse corrigée — avertissement émis' },
    { id: 'an3', agent: 'Akua Lawson',  type: 'Transaction annulée puis recréée — même montant',            severity: 'SURVEILLANCE', date: '18/05 16h00', statut: 'RESOLUE',   impact: 'Erreur de double saisie confirmée' },
  ],
  journal_audit: [
    { heure: '21/05 11h20', agent: 'Kofi Amavi',   action: 'Mise à jour fiche emprunteur',  entite: 'Kwami Ekpé',       gps: true,  appareil: 'Mobile', ip: '192.168.1.12' },
    { heure: '21/05 10h45', agent: 'Akua Lawson',  action: 'Création visite terrain',        entite: 'Yawa Dossou',      gps: true,  appareil: 'Mobile', ip: '10.0.0.24' },
    { heure: '21/05 09h30', agent: 'Edem Kpélim',  action: 'Collecte Mobile Money',          entite: 'Afi Togbedji',     gps: true,  appareil: 'Mobile', ip: '10.0.0.18' },
    { heure: '21/05 09h14', agent: 'Kofi Amavi',   action: 'Décaissement crédit approuvé',   entite: 'Akossiwa Mensah',  gps: true,  appareil: 'Desktop',ip: '192.168.1.10' },
    { heure: '20/05 16h55', agent: 'Dodzi Amegan', action: '12 visites terrain en 45 min',   entite: '[ANOMALIE DÉTECTÉE]',gps: false,appareil: 'Mobile', ip: '10.0.0.31' },
    { heure: '20/05 14h00', agent: 'Kafui Agbeko', action: 'Approbation dossier crédit',     entite: 'Kafui Dewonou',    gps: false, appareil: 'Desktop',ip: '192.168.1.15' },
  ],
  conformite_par_agent: [
    { agent: 'Kofi Amavi',  conformite_gps: 99.1, conformite_cr: 98.4, visites: 48, alertes: 0 },
    { agent: 'Edem Kpélim', conformite_gps: 97.3, conformite_cr: 95.2, visites: 44, alertes: 0 },
    { agent: 'Akua Lawson', conformite_gps: 98.5, conformite_cr: 97.1, visites: 41, alertes: 1 },
    { agent: 'Dodzi Amegan',conformite_gps: 72.4, conformite_cr: 61.0, visites: 21, alertes: 1 },
  ],
  conformite_historique: [
    { semaine: 'S1', gps: 94.1, cr: 91.2 },
    { semaine: 'S2', gps: 95.4, cr: 93.0 },
    { semaine: 'S3', gps: 96.2, cr: 94.5 },
    { semaine: 'S4', gps: 95.8, cr: 95.1 },
    { semaine: 'S5', gps: 96.7, cr: 95.8 },
  ],
  reporting_bceao: {
    taux_visite_valide: 96.7,
    taux_collecte_momo: 88.0,
    anomalies_traitees: 2,
    anomalies_en_cours: 1,
    statut: 'CONFORME',
  },
  comparaisons_gps: [
    { agent: 'Dodzi Amegan', client: 'Afi Togbedji',  gps_declare: '6.1512°N 1.2478°E', gps_reel: '6.1738°N 1.1921°E', ecart_m: 2840, statut: 'NON_CONFORME' as const, date: '20/05 14h32', action: 'Invalider visites — fraude potentielle confirmée' },
    { agent: 'Komi Atsu',    client: 'Togbui Sossou', gps_declare: '6.1628°N 1.1967°E', gps_reel: '6.1589°N 1.2012°E', ecart_m: 438,  statut: 'ATTENTION' as const,     date: '19/05 10h15', action: 'Avertissement émis — adresse corrigée' },
    { agent: 'Kofi Amavi',   client: 'Kwami Ekpé',    gps_declare: '6.1375°N 1.2123°E', gps_reel: '6.1368°N 1.2131°E', ecart_m: 89,   statut: 'CONFORME' as const,      date: '21/05 10h22', action: 'Visite validée' },
    { agent: 'Akua Lawson',  client: 'Yawa Dossou',   gps_declare: '6.1420°N 1.2180°E', gps_reel: '6.1401°N 1.2195°E', ecart_m: 220,  statut: 'CONFORME' as const,      date: '21/05 09h44', action: 'Tolérance 250m — visite validée' },
  ],
  photos_audit_trail: [
    { agent: 'Kofi Amavi',   client: 'Akossiwa Mensah', type_visite: 'Point de vente',    heure: '10h22', gps_valide: true,  description: 'Boutique tissu — Marché Grand Lomé — Stand 7', anomalie: false },
    { agent: 'Akua Lawson',  client: 'Yawa Dossou',     type_visite: 'Remise fond caisse', heure: '11h45', gps_valide: true,  description: 'Atelier couture — Adidogomé centre', anomalie: false },
    { agent: 'Edem Kpélim',  client: 'Komi Fiagbé',     type_visite: 'Visite groupe',      heure: '09h30', gps_valide: true,  description: 'Réunion groupe solidarité — Bè Kpota', anomalie: false },
    { agent: 'Dodzi Amegan', client: '[ANOMALIE]',       type_visite: 'Visite suspecte',    heure: '14h32', gps_valide: false, description: 'GPS non cohérent avec adresse déclarée — écart 2.84km', anomalie: true },
  ],
}

// ─── AGENT TERRAIN (rôle CECA) ──────────────────────────────────────────────
export const MOCK_AGENT_TERRAIN = {
  kpis: {
    zone: 'Zone Vogan',
    agence_rattachement: 'AG-005 Kpalimé',
    clients_zone: 38,
    visites_aujourd_hui: 5,
    visites_planifiees: 9,
    cash_collecte_aujourd_hui: 142_500,
    cash_objectif_jour: 300_000,
    prospects_ce_mois: 6,
    dossiers_remontes_mois: 8,
    impayés_zone: 4,
    streak_jours: 9,
  },
  tournee_du_jour: [
    { heure: '07h30', nom: 'Akossiwa Fidélis',  activite: 'Vendeuse légumes', zone: 'Marché de Vogan',    statut: 'FAIT',     motif: 'Collecte mensualité 42k — solde mois 1',  cash_collecte: 42_000,  gps: true },
    { heure: '09h00', nom: 'Kokou Dzivagbé',    activite: 'Éleveur',          zone: 'Village Kpélo',     statut: 'FAIT',     motif: 'Collecte mensualité 36k',                  cash_collecte: 36_000,  gps: true },
    { heure: '10h30', nom: 'Afi Gamadé',        activite: 'Couturière',       zone: 'Centre Vogan',      statut: 'FAIT',     motif: 'Collecte mensualité + prospect groupe',    cash_collecte: 38_500,  gps: true },
    { heure: '12h00', nom: 'Groupe Femmes x5',  activite: 'Tontine agricole', zone: 'Route Nationale',   statut: 'FAIT',     motif: 'Réunion mensuelle tontine + collecte',     cash_collecte: 26_000,  gps: true },
    { heure: '13h30', nom: 'Togbui Séwou',      activite: 'Agriculteur',      zone: 'Champ Nord Vogan',  statut: 'EN_COURS', motif: 'Visite relance — 1er retard',              cash_collecte: 0,       gps: false },
    { heure: '15h00', nom: 'Yawa Komla',        activite: 'Commerçante',      zone: 'Marché de Vogan',   statut: 'PLANIFIE', motif: 'Nouveau prospect — crédit motopompe 500k', cash_collecte: 0,       gps: false },
    { heure: '16h00', nom: 'Bernadette Atsu',   activite: 'Maraîchère',       zone: 'Village Agbété',    statut: 'PLANIFIE', motif: 'Visite mensuelle suivi',                   cash_collecte: 0,       gps: false },
    { heure: '17h00', nom: '[Rapport journalier]',activite: '—',              zone: 'Agence Kpalimé',    statut: 'PLANIFIE', motif: 'Remise cash + rapport journalier à l\'agence',cash_collecte: 0,    gps: false },
  ],
  clients_en_retard: [
    { id: 'c1', nom: 'Togbui Séwou',     activite: 'Agriculteur',   retard: 12, montant: 36_000, motif_probale: 'Mauvaise récolte déclarée', action_ia: 'Visite terrain + négocier report 15j', score: 45, urgent: true },
    { id: 'c2', nom: 'Mensah Agbléwon',  activite: 'Commerçant',    retard: 8,  montant: 20_833, motif_probale: 'Voyage familial — absent', action_ia: 'Contact famille + planifier visite semaine prochaine', score: 61, urgent: false },
    { id: 'c3', nom: 'Adjoa Fiagbédzi',  activite: 'Couturière',    retard: 5,  montant: 16_667, motif_probale: 'Paiement partiel annoncé', action_ia: 'Appel WA + relance MoMo', score: 58, urgent: false },
    { id: 'c4', nom: 'Groupe Solidarité',activite: 'Groupe épargne',retard: 3,  montant: 54_000, motif_probale: 'Réunion reportée', action_ia: 'Contacter chef de groupe aujourd\'hui', score: 53, urgent: false },
  ],
  prospects_pipeline: [
    { nom: 'Yawa Komla',       activite: 'Commerçante',    montant_estime: 500_000, statut: 'A_VISITER',   ia_score: 72, notes: 'Activité stable, 2 références connues, demande crédit motopompe' },
    { nom: 'Koffi Akpé',       activite: 'Boulanger',      montant_estime: 300_000, statut: 'DOCS_COLLECTES',ia_score: 65, notes: 'CNI + attestation activité remis. À transmettre agence.' },
    { nom: 'Adzo Kpeglo',      activite: 'Agricultrice',   montant_estime: 200_000, statut: 'A_QUALIFIER',  ia_score: 58, notes: 'Intéressée crédit semences. Vérifier capacité remboursement.' },
    { nom: 'Groupe Femmes Kpélo',activite: 'Tontine x6',   montant_estime: 800_000, statut: 'SOUMIS_AGENCE', ia_score: 78, notes: 'Dossier complet transmis à l\'agence mardi.' },
  ],
  documents_a_remettre: [
    { client: 'Koffi Akpé',    type: 'CNI + Attestation',  statut: 'SCAN_FAIT',   remis_agence: false, ia_note: 'Prêt à transmettre — dossier complet' },
    { client: 'Yawa Komla',    type: 'Photo + Référents',  statut: 'EN_COURS',    remis_agence: false, ia_note: 'Manque 1 document (attestation maire)' },
    { client: 'Adzo Kpeglo',   type: 'Documents d\'activité',statut: 'A_FAIRE',  remis_agence: false, ia_note: 'À collecter lors de prochaine visite' },
    { client: 'Groupe Femmes', type: 'Dossier groupe complet',statut: 'REMIS',    remis_agence: true,  ia_note: '✓ Remis à Kwami (commercial) mardi 19/05' },
  ],
  rapport_soir: {
    genere: '21/05/2026 à 17h45',
    cash_collecte: 142_500,
    nb_visites: 5,
    nb_planifie: 9,
    nb_retard_signales: 2,
    nb_prospects_rencontres: 1,
    score_journee: 62,
    observations: 'Togbui Séwou : mauvaise récolte confirmée — demande report 2 semaines. Nouveau groupe de 4 femmes intéressé par crédit groupe à Agbété.',
    transmission_agence: true,
  },
  ia_insights: [
    { titre: 'Zone Vogan : saisonnalité agricole avril-mai', detail: 'L\'IA détecte une hausse de 23% des retards en zone agricole (avril-mai) liée aux périodes de soudure. Recommande de proposer des produits crédit adaptatifs avec périodes de grâce.', type: 'PREVISION' as const, confidence: 81, impact: 'MODERE' as const },
    { titre: 'Groupe Femmes Kpélo : profil très solide', detail: 'Score groupe de 78/100. L\'IA recommande une approbation accélérée — profil similaire à 8 groupes sans défaut dans le réseau. Opportunité de démarchage 2 autres groupes de la même zone.', type: 'OPPORTUNITE' as const, confidence: 88, impact: 'ELEVE' as const },
    { titre: '4 clients en retard — intervention terrain recommandée', detail: 'Togbui Séwou présente les signes d\'un défaut potentiel (score passé 61→45). Visite physique prioritaire avant fin de semaine. Les 3 autres cas sont récupérables avec relance simple.', type: 'ALERTE' as const, confidence: 84, impact: 'CRITIQUE' as const },
  ],
}

export const OBJECTIFS_AGENT_TERRAIN: import('@/lib/types').Objectif[] = [
  {
    id: 'at1',
    titre: 'Visites terrain / mois',
    metrique: 'Prospection',
    valeur_actuelle: 62,
    valeur_cible: 80,
    unite: 'visites',
    progression: 78,
    statut: 'DANS_LES_TEMPS',
    echeance: '31/05/2026',
    ia_conseil: 'À 62 visites — bon rythme. Planifier 4 visites/jour la semaine prochaine pour atteindre l\'objectif.',
  },
  {
    id: 'at2',
    titre: 'Dossiers prospect soumis à l\'agence',
    metrique: 'Crédit',
    valeur_actuelle: 8,
    valeur_cible: 10,
    unite: 'dossiers',
    progression: 80,
    statut: 'DANS_LES_TEMPS',
    echeance: '31/05/2026',
    ia_conseil: '8/10 dossiers — il reste Koffi Akpé (à finaliser) et 1 autre. Compléter avant vendredi.',
  },
  {
    id: 'at3',
    titre: 'Collecte remboursements',
    metrique: 'Recouvrement',
    valeur_actuelle: 1_120_000,
    valeur_cible: 1_500_000,
    unite: 'FCFA',
    progression: 75,
    statut: 'EN_RETARD',
    echeance: '31/05/2026',
    ia_conseil: '74.7% — en retard. Priorité : récupérer les 4 impayés zone (380k potentiel). Passage obligatoire chez Togbui Séwou et Groupe Solidarité.',
  },
  {
    id: 'at4',
    titre: 'Éducation financière (séances)',
    metrique: 'Formation',
    valeur_actuelle: 3,
    valeur_cible: 4,
    unite: 'séances',
    progression: 75,
    statut: 'DANS_LES_TEMPS',
    echeance: '31/05/2026',
    ia_conseil: '3 séances sur 4 — 1 restante. Proposer séance à Agbété lors de la prochaine réunion de groupe.',
  },
]

// ─── MARKETING ────────────────────────────────────────────────────────────
const _MARKETING_KPIS = buildMarketingRoleKpis()

export const MOCK_MARKETING = {
  kpis: {
    ..._MARKETING_KPIS,
    taux_conversion: _MARKETING_KPIS.taux_conversion_pct,
    chatbot_conversations: _MARKETING_KPIS.chatbot_conversations_mois,
    taux_retention: _MARKETING_KPIS.taux_retention_pct,
    nouveaux_clients_mois: _MARKETING_KPIS.leads_convertis,
    cout_par_lead: _MARKETING_KPIS.cac_moyen,
    ltv_moyen: Math.round(_MARKETING_KPIS.pipeline_valeur / Math.max(1, _MARKETING_KPIS.leads_convertis)),
    temps_reponse_moyen_min: 2.8,
    campagnes_actives: 3,
    zones_vierges_identifiees: 5,
    score_presence_digitale: 78,
  },

  // ─── FUNNEL GLOBAL ──────────────────────────────────────────────────────
  funnel: [
    { etape: 'Messages WA reçus',  count: 124, color: '#64748b' },
    { etape: 'Qualifiés chatbot',  count: 89,  color: '#6366f1' },
    { etape: 'Leads créés CRM',    count: 61,  color: '#3b82f6' },
    { etape: 'RDV / visite',       count: 38,  color: '#14b8a6' },
    { etape: 'Dossier soumis',     count: 24,  color: '#f97316' },
    { etape: 'Client gagné',       count: 19,  color: '#16a34a' },
  ],

  // ─── LEADS PAR AGENCE ───────────────────────────────────────────────────
  leads_par_agence: [
    { agence: 'Lomé Centre',    id: 'AG-001', leads: 18, convertis: 7, taux: 39, pipeline: 2_450_000, color: '#14b8a6' },
    { agence: 'Adidogomé',      id: 'AG-002', leads: 12, convertis: 4, taux: 33, pipeline: 1_600_000, color: '#6366f1' },
    { agence: 'Bè Kpota',       id: 'AG-003', leads: 8,  convertis: 2, taux: 25, pipeline: 890_000,   color: '#ef4444' },
    { agence: 'Hédzranawoé',    id: 'AG-004', leads: 9,  convertis: 3, taux: 33, pipeline: 1_100_000, color: '#f97316' },
    { agence: 'Kpalimé',        id: 'AG-005', leads: 14, convertis: 8, taux: 57, pipeline: 1_760_000, color: '#a855f7' },
  ],

  // ─── PIPELINE LEADS ─────────────────────────────────────────────────────
  leads_pipeline: [
    { id: 'l1', nom: 'Adjoa Mensah',     agence: 'AG-002', source: 'Chatbot WA',     score: 87, statut: 'CHAUD',  zone: 'Adidogomé',   date: '21/05', besoin: 'Crédit commerce 400k',   montant_estim: 400_000, suivant: 'Transférer agent Akua — dossier prêt', motif_ia: 'Commerçante marché, CA stable, 2 références' },
    { id: 'l2', nom: 'Koffi Aglo',       agence: 'AG-001', source: 'Porte-à-porte',  score: 74, statut: 'CHAUD',  zone: 'Lomé Centre', date: '21/05', besoin: 'Tontine groupe 5 pers',  montant_estim: 250_000, suivant: 'RDV Kofi Amavi 23/05 à 10h00',         motif_ia: 'Groupe soudé, taux remb. historique 98%' },
    { id: 'l3', nom: 'Ama Tepe',         agence: 'AG-005', source: 'Chatbot WA',     score: 81, statut: 'CHAUD',  zone: 'Kpalimé',     date: '19/05', besoin: 'Crédit agricole 600k',   montant_estim: 600_000, suivant: 'Transférer agent Ama Fiagbé — récolte juin', motif_ia: 'Zone agricole, saisonnalité favorable' },
    { id: 'l4', nom: 'Mawuli Adétou',    agence: 'AG-003', source: 'Chatbot WA',     score: 65, statut: 'TIEDE',  zone: 'Bè Kpota',    date: '20/05', besoin: 'Crédit individuel 250k', montant_estim: 250_000, suivant: 'Qualifier — appeler ce matin',          motif_ia: 'Réponses partielles — besoin non clarifié' },
    { id: 'l5', nom: 'Aku Fiakli',       agence: 'AG-002', source: 'Brochure',       score: 58, statut: 'TIEDE',  zone: 'Adidogomé',   date: '20/05', besoin: 'Rejoindre tontine',      montant_estim: 150_000, suivant: 'Envoyer détails groupe WA',             motif_ia: 'Connait 2 membres actuels — parrainage' },
    { id: 'l6', nom: 'Togbui Sossou',    agence: 'AG-001', source: 'Référencement',  score: 43, statut: 'FROID',  zone: 'Lomé Centre', date: '19/05', besoin: 'Non défini',             montant_estim: null,    suivant: 'Relance automatique WA dans 5 jours',  motif_ia: 'Profil incomplet — à qualifier' },
    { id: 'l7', nom: 'Elikplim Dossou',  agence: 'AG-004', source: 'Événement',      score: 71, statut: 'CHAUD',  zone: 'Hédzranawoé', date: '18/05', besoin: 'Crédit équipement 350k', montant_estim: 350_000, suivant: 'Fixer RDV terrain — intérêt fort',      motif_ia: 'Artisan soudeur, équipement à renouveler' },
    { id: 'l8', nom: 'Kafui Woedem',     agence: 'AG-005', source: 'Chatbot WA',     score: 92, statut: 'CHAUD',  zone: 'Kpalimé',     date: '18/05', besoin: 'Crédit groupe agricole', montant_estim: 800_000, suivant: 'Accélérer dossier — score excellent',   motif_ia: 'Groupe de 6, tous producteurs cacao, historique parfait' },
  ],

  // ─── CHATBOT IA WhatsApp ─────────────────────────────────────────────────
  chatbot_stats: {
    conversations_jour: 14,
    leads_crees_jour: 4,
    qualifies_auto: 89,
    transferes_agent: 41,
    en_attente: 7,
    sujets_top: ['Crédit individuel', 'Tontine groupe', 'Conditions d\'accès', 'Remboursement', 'Création compte'],
    taux_resolution_auto: 71.8,
    satisfaction_score: 4.4,
  },
  chatbot_conversations_recentes: [
    { heure: '11h42', nom: 'Anonyme (Kpalimé)',  message: 'Bonjour je veux un crédit pour ma boutique, combien c\'est le maximum ?', statut: 'LEAD_CREE',     score: 74, attribue_a: 'Ama Fiagbé' },
    { heure: '11h21', nom: 'Adjoa M.',            message: 'Mes documents sont prêts, quand puis-je venir ?',                          statut: 'TRANSFERE',    score: 87, attribue_a: 'Akua Lawson' },
    { heure: '10h58', nom: 'Anonyme (Lomé)',      message: 'Quel est le taux d\'intérêt pour un groupe de 5 personnes ?',              statut: 'QUALIFIE',     score: 58, attribue_a: null },
    { heure: '10h30', nom: 'Kofi T.',             message: 'J\'ai payé via MTN ce matin, ma facture est à jour ?',                     statut: 'REDIRIGE_GES', score: null, attribue_a: 'Kofi Amavi' },
    { heure: '09h55', nom: 'Anonyme (Adidogomé)', message: 'Mon amie a eu un crédit chez vous, elle m\'a recommandé',                 statut: 'LEAD_CREE',    score: 65, attribue_a: null },
  ],
  chatbot_heatmap: [
    { heure: '07h', leads: 1 }, { heure: '08h', leads: 3 }, { heure: '09h', leads: 5 },
    { heure: '10h', leads: 7 }, { heure: '11h', leads: 9 }, { heure: '12h', leads: 6 },
    { heure: '13h', leads: 4 }, { heure: '14h', leads: 8 }, { heure: '15h', leads: 7 },
    { heure: '16h', leads: 10 },{ heure: '17h', leads: 14 },{ heure: '18h', leads: 18 },
    { heure: '19h', leads: 21 },{ heure: '20h', leads: 16 },{ heure: '21h', leads: 12 },
    { heure: '22h', leads: 5 },
  ],

  // ─── SEGMENTS CLIENTS ───────────────────────────────────────────────────
  segments: [
    { segment: 'Commerçantes marché',   count: 52, taux_conv: 58, montant_moyen: 320_000, canal_pref: 'Chatbot WA',    croissance: +12, color: '#14b8a6' },
    { segment: 'Artisans / Ouvriers',   count: 28, taux_conv: 46, montant_moyen: 270_000, canal_pref: 'Porte-à-porte', croissance: +8,  color: '#6366f1' },
    { segment: 'Agriculteurs',          count: 24, taux_conv: 67, montant_moyen: 480_000, canal_pref: 'Agent terrain',  croissance: +18, color: '#16a34a' },
    { segment: 'Groupes tontine',       count: 38, taux_conv: 52, montant_moyen: 200_000, canal_pref: 'Chatbot WA',    croissance: +5,  color: '#f97316' },
    { segment: 'Fonctionnaires / Salariés',count:12, taux_conv: 75, montant_moyen: 580_000, canal_pref: 'Référencement', croissance: +3,  color: '#a855f7' },
    { segment: 'Étudiants / Jeunes',    count: 9,  taux_conv: 28, montant_moyen: 120_000, canal_pref: 'Réseaux sociaux',croissance: +22, color: '#eab308' },
  ],

  // ─── CAMPAGNES ──────────────────────────────────────────────────────────
  campagnes: [
    {
      nom: 'Crédit Express Mai 2026', statut: 'ACTIVE', type: 'WhatsApp Blast', fin: '31/05',
      envois: 312, ouvertures: 198, clics: 47, conversions: 8, roi: 12.4,
      budget_fcfa: 45_000, revenu_genere: 558_000,
      ia_note: 'Campagne performante — taux d\'ouverture 63.5%. Prolonger de 7 jours recommandé.',
    },
    {
      nom: 'Tontine Groupe Femmes', statut: 'ACTIVE', type: 'SMS + WhatsApp', fin: '28/05',
      envois: 156, ouvertures: 104, clics: 29, conversions: 4, roi: 8.1,
      budget_fcfa: 22_000, revenu_genere: 178_200,
      ia_note: 'Bon engagement. Segment femmes commerçantes très réceptif — élargir la cible.',
    },
    {
      nom: 'Lancement Kpalimé Pilote', statut: 'ACTIVE', type: 'Événement + WA', fin: '15/06',
      envois: 89, ouvertures: 71, clics: 38, conversions: 12, roi: 18.7,
      budget_fcfa: 60_000, revenu_genere: 1_122_000,
      ia_note: 'Meilleur ROI du réseau. Dupliquer ce modèle pour les prochaines ouvertures d\'agence.',
    },
    {
      nom: 'Promotion Ramadan', statut: 'TERMINEE', type: 'WhatsApp Blast', fin: '12/04',
      envois: 428, ouvertures: 301, clics: 72, conversions: 18, roi: 21.3,
      budget_fcfa: 55_000, revenu_genere: 1_171_500,
      ia_note: 'Meilleure campagne de l\'année. Reproduire en juin (fêtes Eid).',
    },
  ],

  // ─── CANAUX D'ACQUISITION ───────────────────────────────────────────────
  performance_canaux: [
    { canal: 'Chatbot WhatsApp',    leads: 41, convertis: 14, taux: 34, cout_lead: 0,     meilleure_heure: '18h-21h', trend: +12 },
    { canal: 'Porte-à-porte',       leads: 14, convertis: 6,  taux: 43, cout_lead: 2_500, meilleure_heure: '09h-12h', trend: +2  },
    { canal: 'Événements terrain',  leads: 18, convertis: 9,  taux: 50, cout_lead: 1_800, meilleure_heure: 'Weekend', trend: +8  },
    { canal: 'Référencement client',leads: 8,  convertis: 6,  taux: 75, cout_lead: 0,     meilleure_heure: 'N/A',     trend: +18 },
    { canal: 'Brochures terrain',   leads: 7,  convertis: 1,  taux: 14, cout_lead: 5_000, meilleure_heure: 'N/A',     trend: -3  },
    { canal: 'Réseaux sociaux FB',  leads: 9,  convertis: 2,  taux: 22, cout_lead: 800,   meilleure_heure: '19h-22h', trend: +35 },
  ],

  // ─── PRÉSENCE DIGITALE ──────────────────────────────────────────────────
  presence_digitale: {
    score_global: 61,
    score_cible: 85,
    evolution_pts: +5,
    google_maps: { note: 4.3, avis: 48, vues_mois: 1_240, profil_complet: true },
    facebook: { followers: 1_240, engagement_pct: 4.8, portee_mois: 6_800, posts_mois: 8, meilleur_post: 'Témoignage client Kpalimé — 312 vues' },
    whatsapp_business: { contacts_opt_in: 412, broadcasts_mois: 3, taux_lecture: 89.4, reponses: 147 },
    site_web: { visites_mois: 892, bounce_rate: 48, duree_moy: '2min34', leads_generes: 7 },
    recommandations_ia: [
      { axe: 'Google Maps', action: 'Répondre aux 4 avis sans réponse — impact fort sur crédibilité locale', priorite: 'HAUTE' },
      { axe: 'Facebook', action: 'Publier 2x/semaine : témoignages clients + photos terrain — engagement x3 potentiel', priorite: 'HAUTE' },
      { axe: 'Site web', action: 'Ajouter formulaire de demande en ligne — 892 visites sans conversion', priorite: 'ELEVE' },
      { axe: 'WhatsApp', action: 'Lancer campagne parrainage : 500 FCFA offerts pour chaque nouveau client référé', priorite: 'MODERE' },
    ],
  },

  // ─── RÉPUTATION & RÉTENTION ─────────────────────────────────────────────
  retention: {
    taux: 94.2,
    clients_a_risque_attrition: 8,
    referrals_mois: 8,
    ambassadeurs_potentiels: 14,
    nps: 72,
    avis_google: [
      { auteur: 'Ama K.', note: 5, texte: 'Service rapide, agents très professionnels. J\'ai eu mon crédit en 3 jours.', date: '18/05' },
      { auteur: 'Kofi A.', note: 5, texte: 'Prospera m\'a aidé à développer ma boutique. Je recommande vivement !', date: '12/05' },
      { auteur: 'Anonyme', note: 3, texte: 'Délais de traitement un peu long au début mais résultat satisfaisant.', date: '05/05' },
      { auteur: 'Mawuli T.', note: 4, texte: 'Bon suivi de mon dossier. L\'application WhatsApp est très pratique.', date: '28/04' },
    ],
    raisons_departs: [
      { raison: 'Concurrent moins cher',       count: 2, pct: 33 },
      { raison: 'Remboursement difficile',     count: 2, pct: 33 },
      { raison: 'Déménagement',                count: 1, pct: 17 },
      { raison: 'Mécontentement service',      count: 1, pct: 17 },
    ],
    parrainage_actif: [
      { parrain: 'Akossiwa Mensah', filleuls: 3, credits_generes: 950_000 },
      { parrain: 'Ama Kpodaho',     filleuls: 2, credits_generes: 500_000 },
      { parrain: 'Kafui Dewonou',   filleuls: 1, credits_generes: 300_000 },
    ],
  },

  // ─── ZONES POTENTIEL ────────────────────────────────────────────────────
  zones_potentiel: [
    { zone: 'Agoé-Nyivé (Nord Lomé)',    agence: 'AG-001', potentiel: 'TRES_ELEVE', couverts: 0,  estimes: 85,  taux_couverture: 0,  action: 'Recruter 1 agent terrain Agoé — ROI mois 3', confidence: 91 },
    { zone: 'Tokoin Hôpital',            agence: 'AG-004', potentiel: 'ELEVE',      couverts: 5,  estimes: 52,  taux_couverture: 10, action: 'Assigner 2 tournées supplémentaires AG-004', confidence: 84 },
    { zone: 'Aflao Road (Est)',          agence: 'AG-003', potentiel: 'ELEVE',      couverts: 8,  estimes: 63,  taux_couverture: 13, action: 'Produit crédit commerce frontalier', confidence: 78 },
    { zone: 'Kpalimé périphérie Nord',  agence: 'AG-005', potentiel: 'TRES_ELEVE', couverts: 0,  estimes: 70,  taux_couverture: 0,  action: 'Recrutement 1 agent Kpalimé Nord', confidence: 88 },
    { zone: 'Agbodrafo (Pêcheurs)',     agence: 'AG-002', potentiel: 'MODERE',     couverts: 0,  estimes: 38,  taux_couverture: 0,  action: 'Étude crédit équipement pêche', confidence: 68 },
  ],

  // ─── IA INSIGHTS MARKETING ──────────────────────────────────────────────
  ia_insights: [
    { titre: 'Meilleur créneau de prospection : 18h-21h', detail: 'L\'analyse de 124 conversations chatbot ce mois montre que 52% des leads qualifiés entrent entre 18h et 21h (heure de retour des commerçants). Planifier les campagnes WA à 17h30 pour maximiser l\'impact.', type: 'OPPORTUNITE' as const, confidence: 94, impact: 'ELEVE' as const },
    { titre: 'Référencement client = canal le plus rentable (ROI ×0)', detail: 'Taux de conversion 75% et coût zéro. Seulement 8 leads ce mois via parrainage — potentiel immense. Lancer un programme structuré : prime 500 FCFA par client référé converti.', type: 'OPPORTUNITE' as const, confidence: 92, impact: 'ELEVE' as const },
    { titre: 'Segment agriculteurs sous-exploité — potentiel élevé', detail: 'Les agriculteurs ont le meilleur taux de conversion (67%) et le plus gros montant moyen (480k FCFA). Seulement 24 leads ce mois dans ce segment. Kpalimé AG-005 en est la preuve (+18% croissance).', type: 'OPPORTUNITE' as const, confidence: 89, impact: 'ELEVE' as const },
    { titre: 'Brochures terrain : ROI négatif — à réduire', detail: '7 leads générés pour 35 000 FCFA de coût d\'impression — coût/lead 5 000 FCFA. En comparaison : Chatbot WA = 0 FCFA/lead. Réorienter le budget brochures vers des événements terrain ou réseaux sociaux.', type: 'ACTION' as const, confidence: 88, impact: 'MODERE' as const },
    { titre: 'Présence digitale : note Google Maps 4.3/5 — à améliorer', detail: '4 avis sans réponse depuis +15 jours. Une non-réponse visible nuit à la crédibilité. Répondre sous 24h augmente la note moyenne de +0.3 pts et génère +18% de vues profil.', type: 'ACTION' as const, confidence: 85, impact: 'MODERE' as const },
  ],

  // ─── RECOMMANDATIONS CAMPAGNES IA ───────────────────────────────────────
  ia_recommandations_campagnes: [
    { titre: 'Campagne Parrainage Réseau — Juin 2026',    canal: 'WhatsApp', budget: 30_000,  roi_estime: 24.0, confidence: 92, cible: 'Clients actifs score >70 — 89 contacts', desc: 'Offrir 500 FCFA par filleul converti. L\'IA identifie 14 ambassadeurs potentiels prêts à partager.' },
    { titre: 'Crédit Récolte Agricole — Juin 2026',        canal: 'Agent + WA', budget: 50_000, roi_estime: 18.5, confidence: 88, cible: 'Zone Kpalimé + Agou — 70 agriculteurs identifiés', desc: 'Campagne saisonnière liée à la récolte café/cacao. Timing optimal mi-juin. Coordonner avec AG-005.' },
    { titre: 'Événement communautaire Agoé-Nyivé',         canal: 'Terrain',    budget: 45_000, roi_estime: 12.8, confidence: 79, cible: 'Zone non couverte — 85 prospects estimés', desc: 'Organisation d\'une journée portes ouvertes dans la zone avec démonstration de l\'app WhatsApp. Renforcer présence locale.' },
    { titre: 'Facebook Ads — Campagne image Prospera',     canal: 'Facebook',   budget: 25_000, roi_estime: 8.2,  confidence: 71, cible: 'Lomé 18-45 ans, petits commerçants', desc: 'Témoignages vidéo clients + présentation agences. Objectif : +300 followers et +15 leads qualifiés.' },
  ],
}

// ─── MANAGER (vision globale) ────────────────────────────────────────────────
export const MOCK_MANAGER = {
  kpis: {
    par_30j: 8.0,
    par_30j_variation: -1.2,
    taux_remboursement: 91.8,
    taux_remb_variation: 1.1,
    encours_total: 85_450_000,
    collecte_mois: 12_300_000,
    collecte_objectif: 16_000_000,
    total_emprunteurs: 188,
    agents_actifs: 12,
    nouveaux_clients_mois: 12,
    alertes_critiques: 3,
    dossiers_en_cours: 52,
    leads_non_traites: 8,
    objectifs_equipe_pct: 76.9,
  },
  synthese_zones: [
    { zone: 'Lomé Centre — Marché/Assigamé', par: 6.2, emprunteurs: 62, encours: 28_200_000, collecte: 6_270_000, agent: 'Yawo Adjavon (COM)', objectif_pct: 91 },
    { zone: 'Lomé Centre — Tokoin/Adakpamé', par: 12.4, emprunteurs: 62, encours: 28_200_000, collecte: 2_980_000, agent: 'Mensah Kodjo (COM)', objectif_pct: 48 },
    { zone: 'Adidogomé', par: 9.4, emprunteurs: 48, encours: 22_100_000, collecte: 3_680_000, agent: 'Sena Dossou (GP)', objectif_pct: 81 },
    { zone: 'Bè Kpota', par: 11.2, emprunteurs: 37, encours: 17_400_000, collecte: 2_980_000, agent: 'Edem Kpélim (RA)', objectif_pct: 62 },
  ],
  alertes_direction: [
    { type: 'PAR élevé', zone: 'Bè Kpota', agent: 'Edem Kpélim (RA)', detail: 'PAR 14.2% agence — au-dessus du seuil BCEAO 10%', urgence: 'HAUTE', action: 'Plan redressement 60j + audit GPS équipe terrain' },
    { type: 'GPS suspect', zone: 'Bè Kpota', agent: 'Kossi Adjavon (GP)', detail: 'Anomalies GPS — 12 visites en 45 min impossibles', urgence: 'HAUTE', action: 'Audit terrain indépendant sous 48h' },
    { type: 'Commercial sous objectif', zone: 'Tokoin', agent: 'Mensah Kodjo', detail: 'Couverture zone 42% — recouvrement 48%', urgence: 'HAUTE', action: 'Coaching commercial 7 jours' },
    { type: 'Zone non couverte', zone: 'Agoè Nyivé', agent: null, detail: '~120 prospects estimés, 4% couverture', urgence: 'NORMALE', action: 'Planifier campagne prospection juin' },
    { type: 'Leads entrants', zone: null, agent: null, detail: '8 leads WhatsApp non traités depuis >24h', urgence: 'NORMALE', action: 'Assigner aux commerciaux zones' },
  ],
  performance_agents: [
    { agent: 'Kofi Amavi', role: 'RA', rang: 1, badge: 'OR', par: 5.9, recouvrement: 96.2, visites: 0, collecte: 4_120_000, clients: 62, score_global: 96 },
    { agent: 'Yawo Adjavon', role: 'COM', rang: 2, badge: 'OR', par: 6.2, recouvrement: 91, visites: 42, collecte: 6_270_000, clients: 62, score_global: 88 },
    { agent: 'Mawunya Kpodzo', role: 'GP', rang: 3, badge: 'ARGENT', par: 5.4, recouvrement: 89, visites: 12, collecte: 2_850_000, clients: 300, score_global: 89 },
    { agent: 'Mensah Kodjo', role: 'COM', rang: 4, badge: null, par: 12.4, recouvrement: 48, visites: 18, collecte: 2_980_000, clients: 62, score_global: 48 },
  ],
  par_historique: [
    { mois: 'Jan', par_30j: 12.1, remboursement: 87.4, decaissements: 28 },
    { mois: 'Fév', par_30j: 11.4, remboursement: 88.6, decaissements: 31 },
    { mois: 'Mar', par_30j: 10.8, remboursement: 89.2, decaissements: 35 },
    { mois: 'Avr', par_30j: 10.2, remboursement: 90.1, decaissements: 29 },
    { mois: 'Mai', par_30j: 8.2,  remboursement: 91.8, decaissements: 11 },
  ],
  tendances: [
    { metrique: 'PAR 30j',           valeur: '8.2%',   trend: -2.3, bon: true,  objectif: '< 8%' },
    { metrique: 'Taux remb.',         valeur: '91.8%',  trend: 1.1,  bon: true,  objectif: '> 93%' },
    { metrique: 'Collecte vs objectif',valeur: '76.9%', trend: -3.2, bon: false, objectif: '100%' },
    { metrique: 'Nouveaux clients',   valeur: '12/20',  trend: 2,    bon: true,  objectif: '20/mois' },
  ],
  // ─── IA MANAGER ─────────────────────────────────────────────────────────
  ia_executive_summary: {
    genere_le: '21/05/2026 à 06h00',
    score_sante_reseau: 72,
    tendance: 'AMELIORATION',
    resume: 'Le réseau est en amélioration constante (PAR -2.3pts/mois). L\'agence Bè Kpota reste préoccupante — action prioritaire requise. L\'agence Kpalimé (pilote) performe au-dessus des attentes avec un PAR de 4.2%.',
  },
  ia_forecast_reseau: [
    { mois: 'Juin',      par_prevu: 7.6, remb_prevu: 92.4, collecte_prevue: 14_800_000, confidence: 82 },
    { mois: 'Juillet',   par_prevu: 7.1, remb_prevu: 93.1, collecte_prevue: 15_400_000, confidence: 74 },
    { mois: 'Août',      par_prevu: 6.8, remb_prevu: 93.8, collecte_prevue: 16_200_000, confidence: 65 },
  ],
  ia_insights_manager: [
    { titre: 'Agence Bè Kpota : non-conformité BCEAO imminente', detail: 'PAR 11.2% > seuil 10%. Recommandation : convoquer responsable + déployer audit terrain cette semaine + restructurer les 3 dossiers critiques identifiés par l\'IA.', type: 'ALERTE' as const, confidence: 98, impact: 'CRITIQUE' as const },
    { titre: 'Kossi Adjavon (GP Bè Kpota) : anomalie GPS détectée', detail: 'Score GPS 88% mais 12 visites déclarées en 45 min (impossible physiquement). L\'IA détecte une probabilité de fraude aux données de 73%. Audit terrain urgent — le RA Edem Kpélim pilote l\'agence.', type: 'ALERTE' as const, confidence: 73, impact: 'CRITIQUE' as const },
    { titre: 'Mensah Kodjo (COM Tokoin) : couverture insuffisante', detail: 'Recouvrement 48% vs objectif 80%. Seulement 18 visites ce mois sur zone Tokoin/Adakpamé. Coaching commercial 7 jours recommandé.', type: 'ALERTE' as const, confidence: 91, impact: 'CRITIQUE' as const },
    { titre: 'Agence Kpalimé : dépasser les objectifs — expansion ?', detail: 'Avec un PAR de 4.2% et un taux de remboursement de 97.1% après 6 mois de pilote, l\'IA recommande d\'étudier l\'expansion de la capacité de l\'agence avec +1 agent et +30 clients.', type: 'OPPORTUNITE' as const, confidence: 86, impact: 'ELEVE' as const },
    { titre: 'Prévision réseau juin : PAR 7.6%, collecte 14.8M FCFA', detail: 'Si les actions correctives sur Bè Kpota sont menées, le PAR réseau devrait atteindre 7.6% en juin — sous l\'objectif de 8%. La collecte mensuelle est sur une trajectoire de croissance de +20% vs jan-26.', type: 'PREVISION' as const, confidence: 82, impact: 'ELEVE' as const },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// OBJECTIFS PAR RÔLE — IA Coach
// ─────────────────────────────────────────────────────────────────────────────
import type { Objectif } from '@/lib/types'

// ── GESTIONNAIRE PORTEFEUILLE ──────────────────────────────────────────────
export const OBJECTIFS_GESTIONNAIRE: Objectif[] = [
  {
    id: 'g1', titre: 'PAR personnel', metrique: 'PAR >30j',
    valeur_actuelle: 7.4, valeur_cible: 8, unite: '%',
    progression: 93, statut: 'DANS_LES_TEMPS', echeance: '31/05/2026', inversé: true,
    ia_conseil: 'Tu es à 0.6% du seuil. Priorité : traiter Kwami Ekpé (J+45) et Enyonam Kpade (J+38) cette semaine. Une restructuration de ces 2 dossiers ramènerait ton PAR à ~6.1%.',
  },
  {
    id: 'g2', titre: 'Taux de recouvrement', metrique: 'Remboursements reçus/attendus',
    valeur_actuelle: 94.2, valeur_cible: 92, unite: '%',
    progression: 100, statut: 'EN_AVANCE', echeance: '31/05/2026', inversé: false,
    ia_conseil: 'Tu dépasses l\'objectif de 2.2 points. Le canal MTN MoMo (taux lecture WA 89%) est ton meilleur outil — continue de l\'utiliser pour les relances préventives 5 jours avant échéance.',
  },
  {
    id: 'g3', titre: 'Visites terrain', metrique: 'Visites hebdomadaires',
    valeur_actuelle: 22, valeur_cible: 25, unite: ' visites',
    progression: 71, statut: 'EN_RETARD', echeance: '25/05/2026',
    ia_conseil: 'Il te manque 7 visites cette semaine (lundi/mardi). L\'IA recommande d\'enchaîner les zones Adidogomé (3 clients proches) mercredi matin puis Lomé Centre l\'après-midi. Distance optimisée : 4.3km total.',
    ia_action_urgente: 'Débloquer Kwami Ekpé et Enyonam Kpade cette semaine — les 2 sont dans la même zone Adidogomé.',
  },
  {
    id: 'g4', titre: 'Collecte mensuelle', metrique: 'Montant collecté',
    valeur_actuelle: 4_280_000, valeur_cible: 5_000_000, unite: ' FCFA',
    progression: 86, statut: 'EN_RETARD', echeance: '31/05/2026',
    ia_conseil: 'Il te reste 720k FCFA à collecter sur 10 jours. L\'IA identifie 5 clients dont les échéances arrivent cette semaine (Komlan, Komi, Yawa, Kafui, Abla). Les relancer via WA à 14h augmente le taux de réponse de 40%.',
    ia_action_urgente: 'Envoyer les relances WA groupées ce matin avant 14h — 5 clients · 213k FCFA d\'échéances dues.',
  },
  {
    id: 'g5', titre: 'Nouveaux clients', metrique: 'Dossiers ouverts',
    valeur_actuelle: 3, valeur_cible: 5, unite: ' clients',
    progression: 60, statut: 'EN_RETARD', echeance: '31/05/2026',
    ia_conseil: 'Ama Kpodaho est éligible renouvellement (score 92). Tu as aussi 2 leads chatbot assignés non traités depuis 3 jours (Adjoa Mensah, Ama Tepe). Les convertir compléterait ton objectif.',
  },
]

// ── COMMERCIAL TERRAIN ────────────────────────────────────────────────────
export const OBJECTIFS_COMMERCIAL: Objectif[] = [
  {
    id: 'c1', titre: 'Prospects contactés', metrique: 'Nouveaux prospects visités',
    valeur_actuelle: 18, valeur_cible: 25, unite: '',
    progression: 72, statut: 'EN_RETARD', echeance: '31/05/2026',
    ia_conseil: 'Il te manque 7 prospects. La zone Tokoin Hôpital (identifiée par l\'IA) concentre 12 commerçants non couverts à 800m de ton secteur habituel. Une tournée de 3h couvre 7 à 9 contacts.',
    ia_action_urgente: 'Planifier la tournée Tokoin Hôpital vendredi matin — l\'IA a optimisé le parcours GPS (3.2km, 8 contacts).',
  },
  {
    id: 'c2', titre: 'Taux de conversion', metrique: 'Prospects → Clients',
    valeur_actuelle: 44, valeur_cible: 40, unite: '%',
    progression: 100, statut: 'EN_AVANCE', echeance: '31/05/2026',
    ia_conseil: 'Tu dépasses ton objectif de 4 points. Le segment "agriculteurs" que tu prospectes convertit à 67%. Continuer à cibler ce profil sur les zones périphériques augmenterait encore ton ratio.',
  },
  {
    id: 'c3', titre: 'Visites GPS validées', metrique: 'Conformité terrain',
    valeur_actuelle: 97, valeur_cible: 95, unite: '%',
    progression: 100, statut: 'EN_AVANCE', echeance: '31/05/2026',
    ia_conseil: 'Excellente conformité. L\'IA valide 97% de tes visites via GPS — parmi les meilleurs du réseau. Ce taux de conformité contribue directement à ton score de performance.',
  },
  {
    id: 'c4', titre: 'Décaissements facilités', metrique: 'Dossiers complets soumis',
    valeur_actuelle: 7, valeur_cible: 10, unite: ' dossiers',
    progression: 70, statut: 'EN_RETARD', echeance: '31/05/2026',
    ia_conseil: '3 leads chauds (score >70) attendent leur dossier complet : Elikplim Dossou, Kafui Woedem, Koffi Aglo. Rassembler leurs pièces cette semaine = 3 dossiers soumis et objectif atteint.',
  },
  {
    id: 'c5', titre: 'Objectif collecte zone', metrique: 'Collecte terrain',
    valeur_actuelle: 3_680_000, valeur_cible: 4_500_000, unite: ' FCFA',
    progression: 82, statut: 'EN_RETARD', echeance: '31/05/2026',
    ia_conseil: 'Il manque 820k FCFA. 3 clients ont des paiements en attente via MoMo : si récupérés cette semaine, tu passes à 91% de l\'objectif. Appuie les relances WhatsApp à 16h-17h (pic de réponse détecté par l\'IA).',
  },
]

// ── GESTIONNAIRE CRÉDIT & RISQUE ─────────────────────────────────────────
export const OBJECTIFS_CREDIT_RISQUE: Objectif[] = [
  {
    id: 'cr1', titre: 'Délai traitement dossiers', metrique: 'Traitement sous 72h',
    valeur_actuelle: 68, valeur_cible: 72, unite: 'h',
    progression: 95, statut: 'EN_AVANCE', echeance: '31/05/2026', inversé: true,
    ia_conseil: 'Tu traites les dossiers en 68h en moyenne — 4h sous la limite. L\'IA identifie les étapes les plus longues : validation pièces (24h moy). Le scoring automatique peut réduire cette étape de 8h.',
  },
  {
    id: 'cr2', titre: 'Taux approbation qualité', metrique: 'Dossiers approuvés sans révision',
    valeur_actuelle: 78, valeur_cible: 85, unite: '%',
    progression: 72, statut: 'EN_RETARD', echeance: '31/05/2026',
    ia_conseil: 'Sur 18 dossiers ce mois, 4 ont nécessité une révision (pièces incomplètes x2, scoring limite x2). L\'IA recommande une checklist pré-soumission à envoyer aux agents terrain — réduirait les révisions de 70%.',
    ia_action_urgente: 'Créer la checklist dossier complet et la partager aux agents cette semaine via WhatsApp.',
  },
  {
    id: 'cr3', titre: 'PAR portefeuille approuvé', metrique: 'PAR dossiers du mois',
    valeur_actuelle: 5.2, valeur_cible: 7, unite: '%',
    progression: 100, statut: 'EN_AVANCE', echeance: '31/05/2026', inversé: true,
    ia_conseil: 'PAR du portefeuille que tu as approuvé ce mois : 5.2% — très bon. Le scoring XGBoost que tu appliques correctement élimine 92% des profils à risque élevé dès la soumission. Continue sur ce rythme.',
  },
  {
    id: 'cr4', titre: 'Dossiers restructuration', metrique: 'Plans de restructuration traités',
    valeur_actuelle: 2, valeur_cible: 5, unite: '',
    progression: 40, statut: 'CRITIQUE', echeance: '25/05/2026',
    ia_conseil: 'Il te manque 3 restructurations cette semaine. L\'IA identifie Togbui Apedo (J+62), Kwami Ekpé (J+45) et Enyonam Kpade (J+38) comme prioritaires. Chaque jour de retard augmente le risque de perte totale.',
    ia_action_urgente: 'Convoquer Togbui Apedo et Kwami Ekpé aujourd\'hui même — délai maximum dépassé. Préparer les avenant de restructuration.',
  },
  {
    id: 'cr5', titre: 'Rapports risque mensuels', metrique: 'Rapports soumis dans les délais',
    valeur_actuelle: 3, valeur_cible: 4, unite: '/4',
    progression: 75, statut: 'DANS_LES_TEMPS', echeance: '31/05/2026',
    ia_conseil: 'Rapport PAR détaillé prévu pour le 31/05. L\'IA a pré-rempli 80% du rapport avec les données terrain. Il te reste à valider les commentaires qualitatifs sur les 2 dossiers critiques.',
  },
]

// ── FINANCES & RECOUVREMENT ───────────────────────────────────────────────
export const OBJECTIFS_FINANCES: Objectif[] = [
  {
    id: 'f1', titre: 'Réconciliation MoMo', metrique: 'Transactions réconciliées <24h',
    valeur_actuelle: 96, valeur_cible: 98, unite: '%',
    progression: 86, statut: 'EN_RETARD', echeance: '31/05/2026',
    ia_conseil: '5 transactions MTN/Orange sont en attente depuis >24h. L\'IA a identifié les références manquantes. Les valider manuellement prend 8 min au total — faire cela maintenant ramène le taux à 99%.',
    ia_action_urgente: '5 transactions en attente : MOMO-0087, OM-0091, MOMO-0094, OM-0099, MOMO-0102 — réconcilier avant 17h.',
  },
  {
    id: 'f2', titre: 'Taux recouvrement forcé', metrique: 'Récupération dossiers contentieux',
    valeur_actuelle: 38, valeur_cible: 50, unite: '%',
    progression: 76, statut: 'EN_RETARD', echeance: '31/05/2026',
    ia_conseil: 'Sur 8 dossiers en contentieux, l\'IA priorise 3 contacts avec potentiel de remboursement partiel (score comportemental >40). Appels recommandés mardi entre 10h et 12h — taux de réponse 58% sur ce créneau.',
  },
  {
    id: 'f3', titre: 'Rapport BCEAO mensuel', metrique: 'Soumission rapport dans les délais',
    valeur_actuelle: 80, valeur_cible: 100, unite: '%',
    progression: 80, statut: 'DANS_LES_TEMPS', echeance: '31/05/2026',
    ia_conseil: 'Le rapport est à 80% — il manque la section "Crédits restructurés" (2 dossiers) et le tableau des garanties. L\'IA a pré-rempli les données disponibles. Validation humaine requise sur les montants.',
  },
  {
    id: 'f4', titre: 'Export SAGE mensuel', metrique: 'Export comptable soumis',
    valeur_actuelle: 1, valeur_cible: 1, unite: '',
    progression: 100, statut: 'EN_AVANCE', echeance: '31/05/2026',
    ia_conseil: 'Export SAGE du mois d\'avril déjà validé et transmis le 05/05. L\'IA a pré-formaté l\'export de mai — prêt à validation. Aucun écart comptable détecté ce mois.',
  },
  {
    id: 'f5', titre: 'Paiements partiels traités', metrique: 'Dossiers échéancier à jour',
    valeur_actuelle: 14, valeur_cible: 18, unite: ' dossiers',
    progression: 78, statut: 'DANS_LES_TEMPS', echeance: '31/05/2026',
    ia_conseil: '4 dossiers avec paiements partiels non mis à jour depuis >7 jours. L\'IA recommande de mettre à jour les soldes restants chaque lundi matin pour éviter des écarts lors du bilan mensuel.',
  },
]

// ── AUDITEUR ──────────────────────────────────────────────────────────────
export const OBJECTIFS_AUDITEUR: Objectif[] = [
  {
    id: 'a1', titre: 'Conformité GPS visites', metrique: 'Visites validées par GPS',
    valeur_actuelle: 96.7, valeur_cible: 95, unite: '%',
    progression: 100, statut: 'EN_AVANCE', echeance: '31/05/2026',
    ia_conseil: 'Tu dépasses l\'objectif. 1 agent (Dodzi Amegan) tire les statistiques vers le bas — son taux individuel est 72.4%. L\'IA a généré un rapport d\'anomalie automatique à lui soumettre.',
  },
  {
    id: 'a2', titre: 'Anomalies traitées', metrique: 'Anomalies résolues sous 48h',
    valeur_actuelle: 2, valeur_cible: 3, unite: '/3',
    progression: 67, statut: 'EN_RETARD', echeance: '25/05/2026',
    ia_conseil: 'L\'anomalie de Dodzi Amegan (12 visites en 45 min) est ouverte depuis 48h. Elle doit être fermée avant vendredi pour respecter la politique d\'audit. Statut actuel : EN_COURS.',
    ia_action_urgente: 'Finaliser le rapport d\'audit Dodzi Amegan aujourd\'hui — convoquer l\'agent, recueillir ses explications et statuer FRAUDE / ERREUR.',
  },
  {
    id: 'a3', titre: 'Rapport BCEAO trimestriel', metrique: 'Rapport audit Q2 soumis',
    valeur_actuelle: 70, valeur_cible: 100, unite: '%',
    progression: 70, statut: 'DANS_LES_TEMPS', echeance: '31/05/2026',
    ia_conseil: 'Il manque la section "Transactions suspectes" (2 cas à documenter) et la validation des photos terrain (48 photos à auditer). L\'IA a présélectionné les 8 photos les plus anormales pour accélérer la revue.',
  },
  {
    id: 'a4', titre: 'Agents sous surveillance', metrique: 'Dossiers de surveillance actifs',
    valeur_actuelle: 1, valeur_cible: 0, unite: '',
    progression: 0, statut: 'CRITIQUE', echeance: '25/05/2026', inversé: true,
    ia_conseil: 'Dodzi Amegan est en surveillance depuis 5 jours. Le délai max de traitement est 7 jours. La décision finale (maintien, avertissement formel, ou suspension) doit être prise avant vendredi.',
    ia_action_urgente: 'Préparer le dossier disciplinaire Dodzi Amegan — clôture impérative vendredi 24/05.',
  },
  {
    id: 'a5', titre: 'Taux transactions auditées', metrique: 'Transactions vérifiées / total',
    valeur_actuelle: 94, valeur_cible: 90, unite: '%',
    progression: 100, statut: 'EN_AVANCE', echeance: '31/05/2026',
    ia_conseil: 'Tu audites 94% des transactions — au-dessus de l\'objectif 90%. L\'IA détecte automatiquement les transactions suspectes et les remonte pour review humaine — optimisation en cours pour t\'alléger la charge.',
  },
]

// ── MARKETING ─────────────────────────────────────────────────────────────
export const OBJECTIFS_MARKETING: Objectif[] = [
  {
    id: 'm1', titre: 'Leads générés', metrique: 'Total leads qualifiés',
    valeur_actuelle: 38, valeur_cible: 50, unite: ' leads',
    progression: 76, statut: 'EN_RETARD', echeance: '31/05/2026',
    ia_conseil: 'Il manque 12 leads en 10 jours. Le chatbot génère en moyenne 4 leads/jour qualifiés. Booster la campagne WA "Crédit Express" avec 200 envois supplémentaires ce soir = +6 à +8 leads estimés. Compléter avec une tournée Agoé-Nyivé.',
    ia_action_urgente: 'Lancer la campagne WA boost ce soir à 17h30 — pic de leads identifié par l\'IA sur ce créneau.',
  },
  {
    id: 'm2', titre: 'Taux de conversion leads', metrique: 'Leads → Clients',
    valeur_actuelle: 50, valeur_cible: 40, unite: '%',
    progression: 100, statut: 'EN_AVANCE', echeance: '31/05/2026',
    ia_conseil: 'Tu dépasses l\'objectif de 10 points. Le segment agriculteurs (67% conv.) et les fonctionnaires (75% conv.) tirent la performance. Continuer à scorer et prioriser ces profils dans le pipeline.',
  },
  {
    id: 'm3', titre: 'Présence digitale', metrique: 'Score présence 0-100',
    valeur_actuelle: 61, valeur_cible: 75, unite: '/100',
    progression: 64, statut: 'EN_RETARD', echeance: '30/06/2026',
    ia_conseil: 'Pour gagner 14 points : (1) Répondre aux 4 avis Google sans réponse (+3 pts), (2) Passer à 3 posts Facebook/semaine (+4 pts), (3) Ajouter formulaire de demande sur le site web (+5 pts), (4) Compléter le profil WhatsApp Business (+2 pts).',
  },
  {
    id: 'm4', titre: 'Campagnes actives', metrique: 'Campagnes ROI >8x',
    valeur_actuelle: 3, valeur_cible: 3, unite: '',
    progression: 100, statut: 'EN_AVANCE', echeance: '31/05/2026',
    ia_conseil: '3 campagnes actives, toutes avec ROI >8x (Crédit Express 12.4x, Kpalimé Pilote 18.7x, Tontine 8.1x). L\'IA recommande de préparer la campagne "Parrainage Juin" dès maintenant pour un lancement le 1er juin.',
  },
  {
    id: 'm5', titre: 'Budget marketing', metrique: 'ROI moyen campagnes',
    valeur_actuelle: 13.1, valeur_cible: 10, unite: 'x',
    progression: 100, statut: 'EN_AVANCE', echeance: '31/05/2026',
    ia_conseil: 'ROI moyen 13.1x — tu dépasses largement l\'objectif. Le budget de brochures (ROI ~3x) devrait être réduit au profit des événements terrain (ROI 18.7x). L\'IA recommande de réallouer 30k FCFA de brochures vers les événements.',
  },
  {
    id: 'm6', titre: 'NPS clients', metrique: 'Net Promoter Score',
    valeur_actuelle: 72, valeur_cible: 70, unite: '',
    progression: 100, statut: 'EN_AVANCE', echeance: '30/06/2026',
    ia_conseil: 'NPS 72 — au-dessus de l\'objectif 70. Pour maintenir et améliorer : répondre aux avis Google rapidement, activer le programme parrainage pour les ambassadeurs identifiés, et relancer les 8 clients à risque d\'attrition avec une offre personnalisée.',
  },
]
