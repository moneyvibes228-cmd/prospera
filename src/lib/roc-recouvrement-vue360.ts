// Données enrichies recouvrement — vue ROC (mauvais payeurs, équipe, dossiers bloqués)

export interface FacteurScoreIA {
  code: string
  label: string
  impact: 'POSITIF' | 'NEGATIF' | 'NEUTRE'
  poids_pct: number
  detail: string
}

export interface EchangeRemboursement {
  date: string
  heure: string
  canal: 'VISITE' | 'APPEL' | 'WHATSAPP' | 'MOMO' | 'GUICHET' | 'SMS'
  type: 'PAIEMENT' | 'PROMESSE' | 'REFUS' | 'INJOIGNABLE' | 'PARTIEL' | 'RESTRUCTURATION'
  montant?: number
  agent: string
  resume: string
  promesse_date?: string
  promesse_honoree?: boolean
}

export interface ClientRecouvrementCredit {
  reference: string
  montant_initial: number
  encours: number
  mensualite: number
  echeances_impayees: number
  date_decaissement: string
}

export interface ClientRecouvrementDetail {
  id: string
  /** Lien vers fiche client à risque (/dashboard/credit/clients/[id]) */
  client_id?: string
  nom: string
  telephone: string
  agence: string
  agent_id: string
  agent: string
  activite: string
  localite: string
  montant_du: number
  retard_j: number
  score_recouvrement_ia: number
  probabilite_remboursement_pct: number
  classe_bceao: string
  credits: ClientRecouvrementCredit[]
  echanges: EchangeRemboursement[]
  facteurs_score: FacteurScoreIA[]
  analyse_ia_recouvrement: string
  actions_recommandees: string[]
  derniere_visite?: string
}

export interface MauvaisPayeurDetail extends ClientRecouvrementDetail {
  rang_reseau: number
  analyse_ia_mauvais_payeur: string
  causes_principales: string[]
  historique_retards: { mois: string; jours_max: number; montant_impaye: number }[]
}

export interface DossierBloqueRocDetail {
  reference: string
  client: string
  client_id?: string
  agence: string
  agent: string
  montant: number
  etape: string
  bloque_depuis_h: number
  blocage_raison: string
  date_soumission: string
  date_blocage: string
  charge_credit?: string
  score_cbi?: number
  classe_bceao?: string
  dossier_analyse_id?: string
  historique: { date: string; etape: string; acteur: string; commentaire: string }[]
  pieces_manquantes?: string[]
  analyse_ia_blocage: string
  actions_roc: string[]
}

export interface AgentRecouvrementClient {
  client_id: string
  nom: string
  encours: number
  retard_j: number
  score_ia: number
  probabilite_pct: number
  dernier_echange: string
}

export interface AgentRecouvrementDetail {
  id: string
  nom: string
  zone: string
  clients_actifs: number
  visites_jour: number
  visites_obj: number
  collecte_jour: number
  retards_j7: number
  taux_recouvrement: number
  portefeuille_fcfa: number
  statut: 'BON' | 'NORMAL' | 'DEGRADE'
  analyse_ia_equipe: string
  points_forts: string[]
  points_faibles: string[]
  clients_portefeuille: AgentRecouvrementClient[]
  evolution_collecte: { jour: string; collecte: number; objectif: number }[]
}

export interface EquipeRecouvrementRoc {
  analyse_ia_reseau: string
  synthese: { label: string; valeur: string; alerte?: boolean }[]
  agents: AgentRecouvrementDetail[]
  priorites_jour: string[]
}

const FACTEURS_DEFAUT: FacteurScoreIA[] = [
  { code: 'HIST', label: 'Historique remboursement', impact: 'NEGATIF', poids_pct: 25, detail: 'Plus de 3 échéances manquées sur les 6 derniers mois' },
  { code: 'RETARD', label: 'Ancienneté du retard', impact: 'NEGATIF', poids_pct: 20, detail: 'Retard > 60 jours — probabilité de régularisation spontanée faible' },
  { code: 'CONTACT', label: 'Réactivité aux relances', impact: 'NEGATIF', poids_pct: 15, detail: '2 visites sans paiement, promesses non honorées' },
  { code: 'REV', label: 'Capacité financière déclarée', impact: 'NEGATIF', poids_pct: 15, detail: 'Revenus saisonniers en baisse vs. mensualité' },
  { code: 'MOMO', label: 'Flux Mobile Money', impact: 'NEUTRE', poids_pct: 10, detail: 'Activité MoMo irrégulière — pas de signal de trésorerie récent' },
  { code: 'GAR', label: 'Garanties / cautions', impact: 'POSITIF', poids_pct: 10, detail: 'Caution solidaire partielle encore mobilisable' },
  { code: 'SAISON', label: 'Saisonnalité activité', impact: 'NEGATIF', poids_pct: 5, detail: 'Période creuse secteur commerce de détail' },
]

function buildClient(
  id: string,
  nom: string,
  overrides: Partial<MauvaisPayeurDetail>,
): MauvaisPayeurDetail {
  return {
    id,
    nom,
    telephone: '+228 90 00 00 00',
    agence: 'Bè Kpota',
    agent_id: 'ag-kossi',
    agent: 'Kossi Adjavon',
    activite: 'Commerce',
    localite: 'Bè Kpota',
    montant_du: 420_000,
    retard_j: 95,
    score_recouvrement_ia: 28,
    probabilite_remboursement_pct: 22,
    classe_bceao: 'DOUTEUX',
    credits: [],
    echanges: [],
    facteurs_score: FACTEURS_DEFAUT,
    analyse_ia_recouvrement: '',
    actions_recommandees: [],
    rang_reseau: 0,
    analyse_ia_mauvais_payeur: '',
    causes_principales: [],
    historique_retards: [],
    ...overrides,
  }
}

export const MAUVAIS_PAYEURS_ROC: MauvaisPayeurDetail[] = [
  {
    ...buildClient('rc-mp-001', 'Mawuli Atsu', {
      telephone: '+228 91 44 22 11',
      agence: 'Bè Kpota',
      agent_id: 'ag-kossi',
      agent: 'Kossi Adjavon',
      activite: 'Revendeur téléphones & accessoires',
      montant_du: 420_000,
      retard_j: 95,
      score_recouvrement_ia: 28,
      probabilite_remboursement_pct: 18,
      classe_bceao: 'DOUTEUX',
      credits: [{
        reference: 'PRT-2019-0442',
        montant_initial: 600_000,
        encours: 420_000,
        mensualite: 52_000,
        echeances_impayees: 4,
        date_decaissement: '12/08/2024',
      }],
      echanges: [
        { date: '22/05/2026', heure: '09:15', canal: 'VISITE', type: 'REFUS', agent: 'Kossi Adjavon', resume: 'Client invoque baisse ventes — refuse échéance, demande report 30j' },
        { date: '18/05/2026', heure: '14:02', canal: 'WHATSAPP', type: 'PROMESSE', montant: 100_000, agent: 'Kossi Adjavon', resume: 'Promesse paiement vendredi — non honorée', promesse_date: '20/05/2026', promesse_honoree: false },
        { date: '10/05/2026', heure: '11:30', canal: 'MOMO', type: 'PARTIEL', montant: 25_000, agent: 'Système', resume: 'Paiement partiel MoMo — 25k sur 52k dus' },
        { date: '02/05/2026', heure: '16:45', canal: 'APPEL', type: 'INJOIGNABLE', agent: 'Kossi Adjavon', resume: '3 tentatives — pas de réponse' },
      ],
      rang_reseau: 1,
      causes_principales: [
        'Retard chronique > 90 jours (4 échéances cumulées)',
        'Promesses de paiement non honorées (2 sur 3 derniers mois)',
        'Baisse activité constatée en visite — stock invendu',
        'Absence de flux MoMo régulier depuis 6 semaines',
      ],
      historique_retards: [
        { mois: 'Fév 26', jours_max: 45, montant_impaye: 156_000 },
        { mois: 'Mar 26', jours_max: 62, montant_impaye: 208_000 },
        { mois: 'Avr 26', jours_max: 78, montant_impaye: 312_000 },
        { mois: 'Mai 26', jours_max: 95, montant_impaye: 420_000 },
      ],
      analyse_ia_mauvais_payeur:
        'Mawuli Atsu est classé mauvais payeur réseau (#1) car le comportement de remboursement est structurellement défaillant : retard > 90j, promesses non tenues, et capacité de paiement dégradée (activité commerce électronique en contraction). La probabilité de remboursement intégral sans action coercitive est estimée à 18%. Recommandation : visite conjointe ROC + restructuration (allongement 3 mois) ou mise en demeure avant passage contentieux.',
      analyse_ia_recouvrement:
        'Priorité P1 recouvrement. Envisager saisie caution solidaire restante (120k) et plan de rattrapage 3 échéances avant fin juin.',
      actions_recommandees: [
        'Visite terrain ROC + agent sous 48h',
        'Proposition restructuration : 3 mensualités de 140k',
        'Activation procédure contentieux si pas de paiement sous 15j',
      ],
      derniere_visite: '22/05/2026',
    }),
  },
  {
    ...buildClient('rc-mp-002', 'Kossi Dovi', {
      agence: 'Bè Kpota',
      agent_id: 'ag-kossi',
      montant_du: 380_000,
      retard_j: 72,
      score_recouvrement_ia: 32,
      probabilite_remboursement_pct: 26,
      rang_reseau: 2,
      causes_principales: ['Retard > 60j', 'Client déménagé — adresse activité non confirmée', '1 seul paiement partiel en 8 semaines'],
      historique_retards: [
        { mois: 'Mar 26', jours_max: 35, montant_impaye: 104_000 },
        { mois: 'Avr 26', jours_max: 58, montant_impaye: 260_000 },
        { mois: 'Mai 26', jours_max: 72, montant_impaye: 380_000 },
      ],
      analyse_ia_mauvais_payeur:
        'Kossi Dovi cumule retard prolongé et opacité sur la localisation de l\'activité (déménagement signalé par voisins). Le risque de fuite est élevé. Score recouvrement 32/100.',
      analyse_ia_recouvrement: 'Vérifier nouvelle adresse via chef de quartier. Bloquer nouveau crédit.',
      actions_recommandees: ['Enquête localisation', 'Mise en demeure écrite'],
      echanges: [
        { date: '20/05/2026', heure: '10:00', canal: 'VISITE', type: 'INJOIGNABLE', agent: 'Kossi Adjavon', resume: 'Étal fermé — voisin indique déménagement' },
      ],
      credits: [{ reference: 'PRT-2020-0311', montant_initial: 450_000, encours: 380_000, mensualite: 48_000, echeances_impayees: 3, date_decaissement: '03/02/2025' }],
    }),
  },
  {
    ...buildClient('rc-mp-003', 'Edem Sodji', {
      client_id: 'MP-rc-mp-003',
      agence: 'Lomé Centre',
      agent_id: 'ag-mensah',
      agent: 'Mensah Kodjo',
      montant_du: 350_000,
      retard_j: 64,
      score_recouvrement_ia: 35,
      probabilite_remboursement_pct: 31,
      rang_reseau: 3,
      causes_principales: ['Agent sous-performant sur la zone', 'Activité restaurant — trésorerie volatile', '2 promesses partiellement honorées'],
      historique_retards: [{ mois: 'Mai 26', jours_max: 64, montant_impaye: 350_000 }],
      analyse_ia_mauvais_payeur:
        'Edem Sodji : retard modéré mais aggravé par le faible suivi agent (Mensah Kodjo — taux recouvrement 48%). Le client a une capacité résiduelle si pression de recouvrement renforcée.',
      analyse_ia_recouvrement: 'Réaffecter suivi à agent senior ou visite ROC.',
      actions_recommandees: ['Coaching agent Mensah', 'Plan de rattrapage 2 échéances'],
      echanges: [
        { date: '19/05/2026', heure: '08:45', canal: 'GUICHET', type: 'PARTIEL', montant: 50_000, agent: 'Mensah Kodjo', resume: 'Versement guichet partiel' },
      ],
      credits: [{ reference: 'PRT-2021-0188', montant_initial: 500_000, encours: 350_000, mensualite: 55_000, echeances_impayees: 2, date_decaissement: '15/06/2025' }],
    }),
  },
  {
    ...buildClient('rc-mp-004', 'Adjoa Honoukpe', {
      agence: 'Bè Kpota',
      agent_id: 'ag-kossi',
      montant_du: 280_000,
      retard_j: 58,
      score_recouvrement_ia: 38,
      probabilite_remboursement_pct: 34,
      rang_reseau: 4,
      causes_principales: ['Retard > 45j', 'Dépendance tontine externe pour rembourser'],
      historique_retards: [{ mois: 'Mai 26', jours_max: 58, montant_impaye: 280_000 }],
      analyse_ia_mauvais_payeur: 'Adjoa Honoukpe : mauvais payeur par dépendance à l\'endettement informel (tontines) — risque de cascade de défauts.',
      analyse_ia_recouvrement: 'Cartographier tontines actives avant restructuration.',
      actions_recommandees: ['Entretien approfondi endettement', 'Proposition échelonnement'],
      echanges: [],
      credits: [{ reference: 'PRT-2022-0099', montant_initial: 320_000, encours: 280_000, mensualite: 38_000, echeances_impayees: 2, date_decaissement: '20/03/2026' }],
    }),
  },
  {
    ...buildClient('rc-mp-005', 'Folly Kpedzu', {
      agence: 'Tsévié',
      agent_id: 'ag-sena',
      agent: 'Sena Dossou',
      montant_du: 240_000,
      retard_j: 45,
      score_recouvrement_ia: 42,
      probabilite_remboursement_pct: 41,
      rang_reseau: 5,
      causes_principales: ['Saisonnalité agriculture', 'Retard post-récolte'],
      historique_retards: [{ mois: 'Mai 26', jours_max: 45, montant_impaye: 240_000 }],
      analyse_ia_mauvais_payeur: 'Folly Kpedzu : retard lié à la saison agricole — profil récupérable si attente alignée sur flux récolte (juin).',
      analyse_ia_recouvrement: 'Reporter échéance de 30j avec accord écrit.',
      actions_recommandees: ['Calendrier aligné récolte', 'Visite post-récolte'],
      echanges: [
        { date: '17/05/2026', heure: '07:30', canal: 'VISITE', type: 'PROMESSE', montant: 120_000, agent: 'Sena Dossou', resume: 'Paiement après récolte mi-juin', promesse_date: '20/06/2026' },
      ],
      credits: [{ reference: 'PRT-2023-0440', montant_initial: 280_000, encours: 240_000, mensualite: 32_000, echeances_impayees: 1, date_decaissement: '10/01/2026' }],
    }),
  },
  {
    ...buildClient('rc-mp-006', 'Yawa Akakpo', {
      client_id: 'MP-rc-mp-006',
      agence: 'Lomé Centre',
      agent_id: 'ag-mensah',
      agent: 'Mensah Kodjo',
      montant_du: 200_000,
      retard_j: 38,
      score_recouvrement_ia: 44,
      probabilite_remboursement_pct: 45,
      rang_reseau: 6,
      causes_principales: ['Retard récent', 'Premier incident — historique antérieur bon'],
      historique_retards: [{ mois: 'Mai 26', jours_max: 38, montant_impaye: 200_000 }],
      analyse_ia_mauvais_payeur: 'Yawa Akakpo : entrée récente dans les mauvais payeurs — ancienneté de bon payeur. Risque de contagion si non traité sous 15j.',
      analyse_ia_recouvrement: 'Relance standard + rappel historique positif.',
      actions_recommandees: ['Appel + SMS sous 24h', 'Proposer paiement MoMo'],
      echanges: [
        { date: '21/05/2026', heure: '13:00', canal: 'SMS', type: 'PROMESSE', agent: 'Système', resume: 'Réponse SMS : paiement mardi prochain' },
      ],
      credits: [{ reference: 'PRT-2024-0122', montant_initial: 250_000, encours: 200_000, mensualite: 28_000, echeances_impayees: 1, date_decaissement: '05/09/2025' }],
    }),
  },
  {
    ...buildClient('rc-mp-007', 'Togbui Apedo', {
      client_id: 'CL-1003',
      telephone: '+228 91 22 33 44',
      agence: 'Lomé Centre',
      agent_id: 'ag-mensah',
      agent: 'Mensah Kodjo',
      activite: 'Commerce électronique',
      localite: 'Tokoin',
      montant_du: 175_000,
      retard_j: 62,
      score_recouvrement_ia: 31,
      probabilite_remboursement_pct: 22,
      classe_bceao: 'DOUTEUX',
      rang_reseau: 7,
      causes_principales: [
        'Plan de restructuration non respecté (J+62)',
        'Profil similaire à 3 défauts contentieux passés',
        'Fractionnement paiements suspect — DS CENTIF transmise',
      ],
      historique_retards: [
        { mois: 'Mar 26', jours_max: 28, montant_impaye: 52_000 },
        { mois: 'Avr 26', jours_max: 45, montant_impaye: 104_000 },
        { mois: 'Mai 26', jours_max: 62, montant_impaye: 175_000 },
      ],
      analyse_ia_mauvais_payeur:
        'Togbui Apedo : restructuré mais plan non respecté depuis 62 jours. Probabilité de défaut élevée (78 %). Recommandation : révision du plan sur 3 mois ou passage contentieux.',
      analyse_ia_recouvrement: 'Convoquer client sous 48h — arbitrage RA requis.',
      actions_recommandees: ['Restructuration ou contentieux', 'Visite terrain conjointe RA + agent'],
      echanges: [
        { date: '17/05/2026', heure: '11:00', canal: 'VISITE', type: 'REFUS', agent: 'Mensah Kodjo', resume: 'Plan restructuration non respecté — refuse nouvel échéancier' },
        { date: '10/05/2026', heure: '09:30', canal: 'APPEL', type: 'INJOIGNABLE', agent: 'Mensah Kodjo', resume: 'Pas de réponse — 2e tentative' },
      ],
      credits: [{ reference: 'PRT-2019-0888', montant_initial: 350_000, encours: 175_000, mensualite: 33_333, echeances_impayees: 3, date_decaissement: '01/10/2024' }],
      derniere_visite: '17/05/2026',
    }),
  },
  {
    ...buildClient('rc-mp-008', 'Komi Akléssoé', {
      client_id: 'MP-rc-mp-008',
      agence: 'Lomé Centre',
      agent_id: 'ag-mensah',
      agent: 'Mensah Kodjo',
      activite: 'Artisanat — couture',
      localite: 'Adidogomé',
      montant_du: 250_000,
      retard_j: 8,
      score_recouvrement_ia: 52,
      probabilite_remboursement_pct: 58,
      classe_bceao: 'SOUS_SURVEILLANCE',
      rang_reseau: 8,
      causes_principales: ['Retard récent J+8', 'Compte épargne dormant — trésorerie faible', 'Premier incident après régularité'],
      historique_retards: [{ mois: 'Mai 26', jours_max: 8, montant_impaye: 250_000 }],
      analyse_ia_mauvais_payeur:
        'Komi Akléssoé : entrée récente dans les impayés — profil encore récupérable si visite terrain immédiate. Épargne dormante à réactiver comme levier.',
      analyse_ia_recouvrement: 'Visite terrain aujourd\'hui — proposer paiement MoMo ou DAT garanti.',
      actions_recommandees: ['Visite terrain aujourd\'hui', 'Relance MoMo + proposition DAT 8,5 %'],
      echanges: [
        { date: '26/05/2026', heure: '15:00', canal: 'WHATSAPP', type: 'PROMESSE', montant: 80_000, agent: 'Mensah Kodjo', resume: 'Promesse paiement fin de semaine', promesse_date: '30/05/2026' },
      ],
      credits: [{ reference: 'PRT-2023-0555', montant_initial: 320_000, encours: 250_000, mensualite: 42_000, echeances_impayees: 1, date_decaissement: '12/03/2025' }],
    }),
  },
  {
    ...buildClient('rc-mp-009', 'M. Agbodan Kossi', {
      client_id: 'MP-rc-mp-009',
      agence: 'Lomé Centre',
      agent_id: 'ag-yawo',
      agent: 'Yawo Adjavon',
      activite: 'PME — commerce détail',
      localite: 'Lomé Centre',
      montant_du: 320_000,
      retard_j: 15,
      score_recouvrement_ia: 22,
      probabilite_remboursement_pct: 22,
      classe_bceao: 'DOUTEUX',
      rang_reseau: 9,
      causes_principales: [
        'Probabilité de défaut IA = 78 %',
        'Encours 320k FCFA — retards répétés',
        'Garanties insuffisantes (45 % couverture)',
      ],
      historique_retards: [
        { mois: 'Avr 26', jours_max: 5, montant_impaye: 55_000 },
        { mois: 'Mai 26', jours_max: 15, montant_impaye: 320_000 },
      ],
      analyse_ia_mauvais_payeur:
        'M. Agbodan Kossi : profil à haut risque (78 % probabilité de défaut). Escalade RA requise — renforcement garanties ou restructuration avant contentieux.',
      analyse_ia_recouvrement: 'Escalade RA + demande garanties complémentaires sous 7j.',
      actions_recommandees: ['Escalade RA + garanties', 'Visite Yawo Adjavon + arbitrage montant'],
      echanges: [
        { date: '24/05/2026', heure: '10:30', canal: 'VISITE', type: 'PROMESSE', montant: 100_000, agent: 'Yawo Adjavon', resume: 'Promesse partielle — garantie famille évoquée', promesse_date: '01/06/2026' },
      ],
      credits: [{ reference: 'PRT-2022-0333', montant_initial: 400_000, encours: 320_000, mensualite: 48_000, echeances_impayees: 2, date_decaissement: '08/06/2024' }],
      derniere_visite: '24/05/2026',
    }),
  },
]

const DOSSIERS_BLOQUES_ROC: DossierBloqueRocDetail[] = [
  {
    reference: 'DOS-2026-0228',
    client: 'Folly Mensah',
    client_id: 'CL-787',
    agence: 'Tabligbo',
    agent: 'Ama Fiagbé',
    montant: 400_000,
    etape: 'EN_ANALYSE_ROC',
    bloque_depuis_h: 48,
    blocage_raison: 'En attente validation ROC',
    date_soumission: '06/05/2026',
    date_blocage: '12/05/2026',
    charge_credit: 'Elom Adjavon',
    score_cbi: 76,
    classe_bceao: 'PERFORMANT',
    dossier_analyse_id: 'DOS-2026-0228',
    historique: [
      { date: '06/05/2026', etape: 'SOUMIS', acteur: 'Agent Ama Fiagbé', commentaire: 'Dossier créé — maraîchage tomates' },
      { date: '10/05/2026', etape: 'EN_ANALYSE', acteur: 'Charge CC', commentaire: 'Analyse favorable — score 71' },
      { date: '12/05/2026', etape: 'EN_ANALYSE_ROC', acteur: 'Système', commentaire: 'Transmis ROC — SLA 48h dépassé' },
    ],
    analyse_ia_blocage:
      'Dossier sain (score 76, PERFORMANT) mais bloqué en file ROC depuis 48h. Aucun motif de refus technique — décaissement retardé par charge de travail ROC. Risque : mécontentement client fidèle (4 crédits antérieurs remboursés). Action : valider ou demander garantie complémentaire sous 24h.',
    actions_roc: ['Valider décaissement 400k', 'Ou demander caution complémentaire si file chargée'],
  },
  {
    reference: 'DOS-2026-0244',
    client: 'Komi Atsu',
    agence: 'Kpalimé',
    agent: 'Elom Adjavon',
    montant: 850_000,
    etape: 'EN_ANALYSE_ROC',
    bloque_depuis_h: 56,
    blocage_raison: 'En attente validation ROC',
    date_soumission: '08/05/2026',
    date_blocage: '10/05/2026',
    score_cbi: 71,
    classe_bceao: 'SOUS_SURVEILLANCE',
    historique: [
      { date: '08/05/2026', etape: 'SOUMIS', acteur: 'Elom Adjavon', commentaire: 'Atelier menuiserie — 850k' },
      { date: '10/05/2026', etape: 'EN_ANALYSE_ROC', acteur: 'CC', commentaire: 'Avis favorable avec réserve garanties' },
    ],
    pieces_manquantes: ['Devis machine (scan flou)'],
    analyse_ia_blocage:
      'Montant élevé (850k) + classe SOUS_SURVEILLANCE + SLA 56h. Garanties à 70% — sous seuil 80%. Le blocage est justifié tant que le devis n\'est pas clarifié.',
    actions_roc: ['Demander devis lisible', 'Valider réduit 700k si garanties OK'],
  },
  {
    reference: 'DOS-2026-0214',
    client: 'Akossiwa Téfé',
    agence: 'Bè Kpota',
    agent: 'Kossi Adjavon',
    montant: 320_000,
    etape: 'EN_ANALYSE',
    bloque_depuis_h: 72,
    blocage_raison: 'Pièces complémentaires manquantes',
    date_soumission: '01/05/2026',
    date_blocage: '03/05/2026',
    historique: [
      { date: '03/05/2026', etape: 'EN_ANALYSE', acteur: 'CC', commentaire: 'CNI verso manquant + justificatif domicile' },
    ],
    pieces_manquantes: ['CNI verso', 'Justificatif domicile < 3 mois'],
    analyse_ia_blocage: 'Blocage administratif — pas de décision ROC requise tant que pièces non fournies. Relance agent prioritaire.',
    actions_roc: ['Suivi agent — relance client', 'Escalade si > 96h'],
  },
  {
    reference: 'DOS-2026-0219',
    client: 'Yao Mawu',
    agence: 'Lomé Centre',
    agent: 'Mensah Kodjo',
    montant: 280_000,
    etape: 'EN_ANALYSE',
    bloque_depuis_h: 96,
    blocage_raison: 'Caution coopérative non fournie',
    date_soumission: '28/04/2026',
    date_blocage: '30/04/2026',
    historique: [
      { date: '30/04/2026', etape: 'EN_ANALYSE', acteur: 'CC', commentaire: 'Groupe cautionnement incomplet (3/5 membres)' },
    ],
    analyse_ia_blocage: 'Blocage lié à la solidarité groupe — 96h. Risque churn groupe entier si non débloqué.',
    actions_roc: ['Convocation membres manquants', 'Ou réduire montant avec 2 cautions fortes'],
  },
  {
    reference: 'DOS-2026-0223',
    client: 'Mensah Fovi',
    agence: 'Bè Kpota',
    agent: 'Kossi Adjavon',
    montant: 150_000,
    etape: 'DOSSIER_COMPLET',
    bloque_depuis_h: 60,
    blocage_raison: 'Client injoignable',
    date_soumission: '02/05/2026',
    date_blocage: '04/05/2026',
    historique: [
      { date: '04/05/2026', etape: 'DOSSIER_COMPLET', acteur: 'Agent', commentaire: '3 appels sans réponse — RDV reporté' },
    ],
    analyse_ia_blocage: 'Dossier petit montant mais client injoignable — vérifier volonté réelle avant décaissement.',
    actions_roc: ['Valider seulement après contact confirmé'],
  },
  {
    reference: 'DOS-2026-0231',
    client: 'Adjoa Adoga',
    agence: 'Tsévié',
    agent: 'Sena Dossou',
    montant: 220_000,
    etape: 'EN_ANALYSE',
    bloque_depuis_h: 50,
    blocage_raison: 'Vérification activité économique',
    date_soumission: '05/05/2026',
    date_blocage: '07/05/2026',
    historique: [
      { date: '07/05/2026', etape: 'EN_ANALYSE', acteur: 'CC', commentaire: 'Visite terrain activité non réalisée' },
    ],
    analyse_ia_blocage: 'Attente visite terrain — standard pour nouveau client. Débloquer après rapport visite.',
    actions_roc: ['Planifier visite sous 72h'],
  },
]

const AGENTS_RECOUVREMENT: AgentRecouvrementDetail[] = [
  {
    id: 'ag-kossi',
    nom: 'Kossi Adjavon',
    zone: 'Bè Kpota',
    clients_actifs: 38,
    visites_jour: 12,
    visites_obj: 14,
    collecte_jour: 285_000,
    retards_j7: 9,
    taux_recouvrement: 71,
    portefeuille_fcfa: 4_200_000,
    statut: 'NORMAL',
    analyse_ia_equipe:
      'Kossi maintient un taux de 71% mais concentre 3 des 6 pires payeurs réseau (Mawuli, Kossi Dovi, Adjoa Honoukpe). La collecte du jour est correcte mais le portefeuille à risque (Bè Kpota PAR élevé) exige un plan de recouvrement renforcé sur 5 clients prioritaires.',
    points_forts: ['Bon taux de visites (12/14)', 'Connaissance terrain quartier'],
    points_faibles: ['3 mauvais payeurs top 10', 'Promesses non suivies'],
    clients_portefeuille: [
      { client_id: 'rc-mp-001', nom: 'Mawuli Atsu', encours: 420_000, retard_j: 95, score_ia: 28, probabilite_pct: 18, dernier_echange: '22/05 — REFUS' },
      { client_id: 'rc-mp-002', nom: 'Kossi Dovi', encours: 380_000, retard_j: 72, score_ia: 32, probabilite_pct: 26, dernier_echange: '20/05 — INJOIGNABLE' },
      { client_id: 'rc-mp-004', nom: 'Adjoa Honoukpe', encours: 280_000, retard_j: 58, score_ia: 38, probabilite_pct: 34, dernier_echange: '15/05 — PROMESSE' },
    ],
    evolution_collecte: [
      { jour: 'Lun', collecte: 310_000, objectif: 400_000 },
      { jour: 'Mar', collecte: 290_000, objectif: 400_000 },
      { jour: 'Mer', collecte: 285_000, objectif: 400_000 },
    ],
  },
  {
    id: 'ag-mensah',
    nom: 'Mensah Kodjo',
    zone: 'Lomé Centre',
    clients_actifs: 42,
    visites_jour: 6,
    visites_obj: 15,
    collecte_jour: 180_000,
    retards_j7: 14,
    taux_recouvrement: 48,
    portefeuille_fcfa: 5_800_000,
    statut: 'DEGRADE',
    analyse_ia_equipe:
      'Mensah Kodjo est en alerte recouvrement : 48% de taux (vs objectif 75%), seulement 6 visites sur 15 prévues. 14 retards J+7 — sous-performance structurelle. Recommandation ROC : coaching immédiat + réaffectation temporaire de 4 dossiers critiques à un agent senior.',
    points_forts: ['Portefeuille volumineux', 'Bonne relation clients fidèles'],
    points_faibles: ['Visites insuffisantes', 'Taux recouvrement critique', '2 mauvais payeurs non traités'],
    clients_portefeuille: [
      { client_id: 'rc-mp-003', nom: 'Edem Sodji', encours: 350_000, retard_j: 64, score_ia: 35, probabilite_pct: 31, dernier_echange: '19/05 — PARTIEL' },
      { client_id: 'rc-mp-006', nom: 'Yawa Akakpo', encours: 200_000, retard_j: 38, score_ia: 44, probabilite_pct: 45, dernier_echange: '21/05 — PROMESSE' },
    ],
    evolution_collecte: [
      { jour: 'Lun', collecte: 220_000, objectif: 450_000 },
      { jour: 'Mar', collecte: 195_000, objectif: 450_000 },
      { jour: 'Mer', collecte: 180_000, objectif: 450_000 },
    ],
  },
  {
    id: 'ag-sena',
    nom: 'Sena Dossou',
    zone: 'Tsévié',
    clients_actifs: 34,
    visites_jour: 11,
    visites_obj: 12,
    collecte_jour: 220_000,
    retards_j7: 5,
    taux_recouvrement: 78,
    portefeuille_fcfa: 3_900_000,
    statut: 'BON',
    analyse_ia_equipe: 'Sena Dossou : profil solide — 78% recouvrement, visites quasi à l\'objectif. Modèle à répliquer sur Bè Kpota.',
    points_forts: ['Régularité visites', 'Faible PAR zone'],
    points_faibles: ['1 client saisonnier à suivre (Folly Kpedzu)'],
    clients_portefeuille: [
      { client_id: 'rc-mp-005', nom: 'Folly Kpedzu', encours: 240_000, retard_j: 45, score_ia: 42, probabilite_pct: 41, dernier_echange: '17/05 — PROMESSE récolte' },
    ],
    evolution_collecte: [
      { jour: 'Lun', collecte: 240_000, objectif: 280_000 },
      { jour: 'Mar', collecte: 225_000, objectif: 280_000 },
      { jour: 'Mer', collecte: 220_000, objectif: 280_000 },
    ],
  },
  {
    id: 'ag-elom',
    nom: 'Elom Komlavi',
    zone: 'Tabligbo',
    clients_actifs: 28,
    visites_jour: 10,
    visites_obj: 10,
    collecte_jour: 195_000,
    retards_j7: 3,
    taux_recouvrement: 82,
    portefeuille_fcfa: 2_900_000,
    statut: 'BON',
    analyse_ia_equipe: 'Elom Komlavi : meilleur taux du réseau sur sa zone — peu de retards, objectif visites atteint.',
    points_forts: ['82% recouvrement', 'Discipline visites'],
    points_faibles: [],
    clients_portefeuille: [],
    evolution_collecte: [
      { jour: 'Mer', collecte: 195_000, objectif: 220_000 },
    ],
  },
  {
    id: 'ag-akoue',
    nom: 'Akoue Yawa',
    zone: 'Kpalimé',
    clients_actifs: 24,
    visites_jour: 9,
    visites_obj: 10,
    collecte_jour: 165_000,
    retards_j7: 4,
    taux_recouvrement: 76,
    portefeuille_fcfa: 2_400_000,
    statut: 'NORMAL',
    analyse_ia_equipe: 'Akoue Yawa : performance stable — maintenir le rythme sur Kpalimé.',
    points_forts: ['Équilibre visites / collecte'],
    points_faibles: ['Dossier Komi Atsu (850k) en attente ROC'],
    clients_portefeuille: [],
    evolution_collecte: [{ jour: 'Mer', collecte: 165_000, objectif: 200_000 }],
  },
]

export function getMauvaisPayeurById(id: string): MauvaisPayeurDetail | undefined {
  return MAUVAIS_PAYEURS_ROC.find(m => m.id === id)
}

export function getMauvaisPayeurIdByNom(nom: string): string | undefined {
  const exact = MAUVAIS_PAYEURS_ROC.find(m => m.nom === nom)
  if (exact) return exact.id
  const normalized = nom.trim().toLowerCase()
  const partial = MAUVAIS_PAYEURS_ROC.find(m => {
    const mn = m.nom.toLowerCase()
    return mn.includes(normalized) || normalized.includes(mn.split(' ').slice(-1)[0] ?? '')
      || (normalized.startsWith('m.') && mn.includes(normalized.replace(/^m\.\s*/, '')))
  })
  return partial?.id
}

export function getMauvaisPayeursByAgence(agence: string): MauvaisPayeurDetail[] {
  return MAUVAIS_PAYEURS_ROC
    .filter(m => m.agence === agence)
    .sort((a, b) => b.retard_j - a.retard_j)
}

export function getClientRecouvrementById(id: string): ClientRecouvrementDetail | undefined {
  const mp = MAUVAIS_PAYEURS_ROC.find(m => m.id === id)
  if (mp) return mp
  return undefined
}

export function getDossierBloqueRocByRef(ref: string): DossierBloqueRocDetail | undefined {
  return DOSSIERS_BLOQUES_ROC.find(d => d.reference === ref)
}

export function getAllDossiersBloquesRoc(): DossierBloqueRocDetail[] {
  return DOSSIERS_BLOQUES_ROC
}

export function getAgentRecouvrementById(id: string): AgentRecouvrementDetail | undefined {
  return AGENTS_RECOUVREMENT.find(a => a.id === id)
}

export function getAgentRecouvrementIdByNom(nom: string): string | undefined {
  return AGENTS_RECOUVREMENT.find(a => a.nom === nom)?.id
}

export function getEquipeRecouvrementRoc(): EquipeRecouvrementRoc {
  const agents = AGENTS_RECOUVREMENT
  const degrade = agents.filter(a => a.statut === 'DEGRADE').length
  return {
    analyse_ia_reseau:
      `Analyse recouvrement réseau (ROC) : collecte jour à 52% de l'objectif (1,24M / 2,4M FCFA). ${degrade} agent(s) en statut dégradé — priorité Mensah Kodjo (Lomé Centre, 48% tx, 6/15 visites). 6 mauvais payeurs cumulent 1,87M FCFA d'impayés ; 3 sont sur Bè Kpota (sous-responsabilité Kossi Adjavon). Recommandation : mission recouvrement renforcée Bè Kpota jeudi + coaching Mensah avant vendredi.`,
    synthese: [
      { label: 'Collecte jour', valeur: '1 240 000 / 2 400 000 FCFA', alerte: true },
      { label: 'Agents dégradés', valeur: String(degrade), alerte: degrade > 0 },
      { label: 'Impayés top 6', valeur: '1 870 000 FCFA', alerte: true },
      { label: 'Promesses honorées', valeur: '64%', alerte: false },
    ],
    agents,
    priorites_jour: [
      'Visite conjointe Mawuli Atsu (Bè Kpota) — P1',
      'Coaching Mensah Kodjo + rattrapage visites (6→12 min.)',
      'Débloquer DOS-2026-0228 et DOS-2026-0244 (ROC)',
    ],
  }
}
