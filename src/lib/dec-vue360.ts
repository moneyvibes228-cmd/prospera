// Données enrichies pour l'onglet Crédit DEC — fiches dossiers bloqués & clients à risque

import { resolveClientRisqueDynamic } from '@/lib/client-risque-registry'
import { enrichClientAffectation } from '@/lib/agences'
import {
  REGISTRE_CLIENTS_RISQUE,
  REGISTRE_DOSSIERS_BLOQUES,
  getRegistreDossierById,
  type DossierBloqueSeed,
} from '@/lib/mock-risque-registry'

export interface HistoriqueEtapeDossier {
  date: string
  etape: string
  acteur: string
  commentaire?: string
}

export interface PieceDossier {
  nom: string
  statut: 'OK' | 'MANQUANT' | 'EN_REVUE'
  date_depot?: string
}

export interface DossierBloqueDetail {
  id: string
  client_id?: string
  client: string
  type_client: 'INDIVIDUEL' | 'GROUPE' | 'PME' | 'COOPERATIVE'
  montant: number
  duree_mois: number
  taux: number
  objet: string
  etape: string
  statut_workflow: string
  bloque_depuis_h: number
  raison: string
  agent: string
  agence: string
  charge_credit?: string
  date_soumission: string
  date_blocage: string
  score_cbi?: number
  classe_bceao?: string
  garanties: string
  revenus_mensuels?: number
  telephone?: string
  activite?: string
  localite?: string
  historique_etapes: HistoriqueEtapeDossier[]
  pieces: PieceDossier[]
  actions_recommandees: string[]
  dossiers_lies?: { id: string; libelle: string; montant: number; statut: string }[]
}

export interface PaiementRecent {
  date: string
  montant: number
  type: 'REMBOURSEMENT' | 'PARTIEL' | 'MANQUE'
  canal: string
}

export interface CreditClient {
  reference: string
  montant: number
  encours: number
  statut: string
  date_decaissement: string
}

export interface ClientRisqueDetail {
  id: string
  nom: string
  telephone: string
  agence: string
  agence_id?: string
  /** Commercial terrain — visites & prospection */
  agent: string
  agent_commercial?: string
  /** GP — suivi crédit, échéances, relances */
  agent_gp?: string
  /** RA — pilotage agence (0 visite client) */
  responsable_agence?: string
  activite: string
  secteur: string
  localite: string
  encours: number
  score_ia: number
  pd_pct: number
  el: number
  jours_retard: number
  action: string
  classe_bceao: string
  mensualite: number
  echeances_impayees: number
  dernier_contact: string
  score_evolution: { mois: string; score: number }[]
  credits: CreditClient[]
  paiements_recents: PaiementRecent[]
  visites: { date: string; agent: string; statut: string; commentaire: string }[]
  alertes_ia: { severite: string; message: string; action: string; date: string }[]
  analyse_dec: string
  dossiers_en_cours?: { id: string; montant: number; etape: string }[]
}

const DOSSIERS_BLOQUES_DETAILS: DossierBloqueDetail[] = [
  {
    id: 'DOS-2407',
    client: 'Coop. Kpalimé Sud',
    type_client: 'COOPERATIVE',
    montant: 3_200_000,
    duree_mois: 18,
    taux: 12,
    objet: 'Renouvellement stock agricole — 42 membres actifs',
    etape: 'Comité crédit',
    statut_workflow: 'EN_ATTENTE_COMITE',
    bloque_depuis_h: 72,
    raison: 'Membre comité absent',
    agent: 'Ama Fiagbé',
    agence: 'Kpalimé',
    charge_credit: 'Kofi Mensah',
    date_soumission: '14/05/2026',
    date_blocage: '18/05/2026',
    score_cbi: 68,
    classe_bceao: 'SOUS_SURVEILLANCE',
    garanties: 'Caution solidaire 42 membres + dépôt groupe 320 000 FCFA',
    revenus_mensuels: 8_400_000,
    telephone: '+228 91 22 33 44',
    activite: 'Coopérative agricole — maïs, soja, niébé',
    localite: 'Kpalimé — zone agricole sud',
    historique_etapes: [
      { date: '14/05/2026', etape: 'Soumis', acteur: 'Ama Fiagbé', commentaire: 'Dossier groupe renouvellement annuel' },
      { date: '15/05/2026', etape: 'Docs OK', acteur: 'Système', commentaire: 'PV AG + liste membres validés' },
      { date: '16/05/2026', etape: 'Analyse CC', acteur: 'Kofi Mensah', commentaire: 'Score 68 — historique positif 3 cycles' },
      { date: '17/05/2026', etape: 'Visite terrain', acteur: 'Ama Fiagbé', commentaire: 'Entrepôt et stocks vérifiés' },
      { date: '18/05/2026', etape: 'Comité crédit', acteur: 'Système', commentaire: 'Bloqué — quorum non atteint (2/3 absents)' },
    ],
    pieces: [
      { nom: 'PV assemblée générale', statut: 'OK', date_depot: '14/05/2026' },
      { nom: 'Liste membres signée', statut: 'OK', date_depot: '14/05/2026' },
      { nom: 'États financiers groupe', statut: 'OK', date_depot: '15/05/2026' },
      { nom: 'Procès-verbal comité', statut: 'MANQUANT' },
    ],
    actions_recommandees: [
      'Convoquer comité en visio — validation déléguée possible',
      'Préparer PV comité provisoire avec 2 membres présents',
      'Relancer président coopérative pour signature caution renouvelée',
    ],
    dossiers_lies: [
      { id: 'DOS-2389', libelle: 'Renouvellement 2025', montant: 2_800_000, statut: 'CLOTURE' },
    ],
  },
  {
    id: 'DOS-2412',
    client: 'GIE Femmes Marché',
    type_client: 'GROUPE',
    montant: 2_400_000,
    duree_mois: 12,
    taux: 11,
    objet: 'Achat stock tissus wax — saison fêtes',
    etape: 'Validation Direction',
    statut_workflow: 'EN_ATTENTE_DEC',
    bloque_depuis_h: 96,
    raison: 'DEC en mission',
    agent: 'Edem Kpélim',
    agence: 'Lomé Centre',
    charge_credit: 'Akua Mensah',
    date_soumission: '16/05/2026',
    date_blocage: '17/05/2026',
    score_cbi: 74,
    classe_bceao: 'PERFORMANT',
    garanties: 'Caution solidaire 8 femmes + dépôt 240 000 FCFA',
    revenus_mensuels: 4_200_000,
    telephone: '+228 90 55 66 77',
    activite: 'Commerce tissus — marché de Lomé',
    localite: 'Lomé Centre — Assivito',
    historique_etapes: [
      { date: '16/05/2026', etape: 'Soumis', acteur: 'Edem Kpélim' },
      { date: '16/05/2026', etape: 'Docs OK', acteur: 'Système' },
      { date: '17/05/2026', etape: 'Analyse CC', acteur: 'Akua Mensah', commentaire: 'Recommandation APPROUVER — score 74' },
      { date: '17/05/2026', etape: 'Validé ROC', acteur: 'ROC Lomé', commentaire: 'Conformité OK — dérogation plafond en cours' },
      { date: '17/05/2026', etape: 'Validation Direction', acteur: 'Système', commentaire: 'En attente signature DEC — mission Kpalimé' },
    ],
    pieces: [
      { nom: 'Statuts GIE', statut: 'OK', date_depot: '16/05/2026' },
      { nom: 'Relevé MoMo groupe', statut: 'OK', date_depot: '16/05/2026' },
      { nom: 'Photos étal marché', statut: 'OK', date_depot: '17/05/2026' },
      { nom: 'Dérogation plafond', statut: 'EN_REVUE', date_depot: '17/05/2026' },
    ],
    actions_recommandees: [
      'Validation déléguée au ROC adjoint (urgence 96h)',
      'Finaliser dérogation plafond 400k avant décaissement',
      'Confirmer date décaissement avec présidente GIE',
    ],
  },
  {
    id: 'DOS-2418',
    client: 'Mawuena PME',
    type_client: 'PME',
    montant: 1_800_000,
    duree_mois: 24,
    taux: 13,
    objet: 'Extension atelier menuiserie — 2 machines supplémentaires',
    etape: 'Pièces complémentaires',
    statut_workflow: 'DOCS_INCOMPLETS',
    bloque_depuis_h: 54,
    raison: 'Doc cadastre manquant',
    agent: 'Akua Lawson',
    agence: 'Lomé Centre',
    charge_credit: 'Kofi Mensah',
    date_soumission: '18/05/2026',
    date_blocage: '19/05/2026',
    score_cbi: 61,
    classe_bceao: 'SOUS_SURVEILLANCE',
    garanties: 'Hypothèque matériel + caution personnelle dirigeant',
    revenus_mensuels: 2_800_000,
    telephone: '+228 91 88 99 00',
    activite: 'Menuiserie & ébénisterie',
    localite: 'Lomé Centre — Adidogomé',
    historique_etapes: [
      { date: '18/05/2026', etape: 'Soumis', acteur: 'Akua Lawson' },
      { date: '18/05/2026', etape: 'Analyse CC', acteur: 'Kofi Mensah', commentaire: 'Activité solide — garantie immobilière requise' },
      { date: '19/05/2026', etape: 'Pièces complémentaires', acteur: 'Système', commentaire: 'Titre foncier / cadastre non reçu' },
    ],
    pieces: [
      { nom: 'RCCM & NIF', statut: 'OK', date_depot: '18/05/2026' },
      { nom: 'Devis machines', statut: 'OK', date_depot: '18/05/2026' },
      { nom: 'Relevés bancaires 6 mois', statut: 'OK', date_depot: '18/05/2026' },
      { nom: 'Titre foncier / cadastre', statut: 'MANQUANT' },
      { nom: 'Photos atelier', statut: 'OK', date_depot: '19/05/2026' },
    ],
    actions_recommandees: [
      'Relance client — délai 72h pour cadastre',
      'Visite terrain atelier pour évaluer garantie matériel en alternative',
      'Escalade CC si pas de réponse sous 48h',
    ],
  },
  {
    id: 'DOS-2421',
    client: 'Yao Tetevi',
    type_client: 'INDIVIDUEL',
    montant: 650_000,
    duree_mois: 10,
    taux: 14,
    objet: 'Achat moto-taxi — activité transport',
    etape: 'Visite domicile',
    statut_workflow: 'EN_VISITE',
    bloque_depuis_h: 60,
    raison: 'Client injoignable',
    agent: 'Elom Komlavi',
    agence: 'Hédzranawoé',
    charge_credit: 'Akua Mensah',
    date_soumission: '19/05/2026',
    date_blocage: '20/05/2026',
    score_cbi: 55,
    classe_bceao: 'SOUS_SURVEILLANCE',
    garanties: 'Nantissement moto + caution frère',
    revenus_mensuels: 420_000,
    telephone: '+228 90 33 44 55',
    activite: 'Transport moto-taxi',
    localite: 'Hédzranawoé — zone industrielle',
    historique_etapes: [
      { date: '19/05/2026', etape: 'Soumis', acteur: 'Komi Atsu' },
      { date: '19/05/2026', etape: 'Docs OK', acteur: 'Système' },
      { date: '20/05/2026', etape: 'Visite domicile', acteur: 'Elom Komlavi', commentaire: '3 tentatives — client injoignable' },
    ],
    pieces: [
      { nom: 'CNI', statut: 'OK', date_depot: '19/05/2026' },
      { nom: 'Permis conduire', statut: 'OK', date_depot: '19/05/2026' },
      { nom: 'Devis moto', statut: 'OK', date_depot: '19/05/2026' },
      { nom: 'Attestation domicile', statut: 'EN_REVUE' },
    ],
    actions_recommandees: [
      'Appel via contact caution (frère)',
      'Visite domicile avec voisin référent',
      'Mettre en pause si injoignable J+7 — archiver dossier',
    ],
    dossiers_lies: [
      { id: 'DOS-2298', libelle: 'Crédit moto 2024', montant: 480_000, statut: 'EN_GESTION' },
    ],
  },
]

const CLIENTS_RISQUE_DETAILS: ClientRisqueDetail[] = [
  {
    id: 'CL-1042',
    nom: 'Komlan Attivor',
    telephone: '+228 90 44 55 66',
    agence: 'Bè Kpota',
    agent: 'Edem Kpélim',
    activite: 'Vente vêtements & accessoires — marché Bè Kpota',
    secteur: 'Commerce',
    localite: 'Bè Kpota — Adidogomé',
    encours: 850_000,
    score_ia: 38,
    pd_pct: 62,
    el: 421_400,
    jours_retard: 87,
    action: 'Mise en demeure J+30',
    classe_bceao: 'DOUTEUX',
    mensualite: 94_444,
    echeances_impayees: 3,
    dernier_contact: '12/05/2026 — appel sans réponse',
    score_evolution: [
      { mois: 'Déc', score: 72 }, { mois: 'Jan', score: 68 }, { mois: 'Fév', score: 58 },
      { mois: 'Mar', score: 52 }, { mois: 'Avr', score: 44 }, { mois: 'Mai', score: 38 },
    ],
    credits: [
      { reference: 'CR-2024-089', montant: 600_000, encours: 850_000, statut: 'EN_RETARD', date_decaissement: '08/2024' },
      { reference: 'CR-2023-044', montant: 400_000, encours: 0, statut: 'CLOTURE', date_decaissement: '03/2023' },
    ],
    paiements_recents: [
      { date: '15/02/2026', montant: 47_222, type: 'PARTIEL', canal: 'MTN MoMo' },
      { date: '15/01/2026', montant: 0, type: 'MANQUE', canal: '—' },
      { date: '15/12/2025', montant: 94_444, type: 'REMBOURSEMENT', canal: 'Espèces' },
    ],
    visites: [
      { date: '10/05/2026', agent: 'Edem Kpélim', statut: 'NEGATIVE', commentaire: 'Domicile fermé — voisins indiquent déménagement temporaire' },
      { date: '22/04/2026', agent: 'Edem Kpélim', statut: 'SANS_REPONSE', commentaire: 'Client absent — promesse de rappel non tenue' },
    ],
    alertes_ia: [
      { severite: 'CRITIQUE', message: 'Retard J+87 — probabilité défaut 62%', action: 'Mise en demeure + contentieux', date: '21/05/2026' },
      { severite: 'HAUTE', message: 'Score IA chute -34 pts en 6 mois', action: 'Escalade superviseur agence', date: '18/05/2026' },
    ],
    analyse_dec: 'Profil en dégradation rapide. 3 échéances impayées consécutives. Localisation incertaine depuis 10/05. Recommandation : mise en demeure formelle sous 48h, puis orientation contentieux si pas de régularisation sous 15 jours.',
  },
  {
    id: 'CL-1018',
    nom: 'Yawa Dossou',
    telephone: '+228 91 11 22 33',
    agence: 'Bè Kpota',
    agent: 'Afi Lawson',
    activite: 'Vente produits cosmétiques',
    secteur: 'Commerce',
    localite: 'Bè Kpota — marché',
    encours: 620_000,
    score_ia: 42,
    pd_pct: 58,
    el: 287_280,
    jours_retard: 64,
    action: 'Restructuration proposée',
    classe_bceao: 'DOUTEUX',
    mensualite: 68_889,
    echeances_impayees: 2,
    dernier_contact: '18/05/2026 — visite terrain',
    score_evolution: [
      { mois: 'Déc', score: 68 }, { mois: 'Jan', score: 62 }, { mois: 'Fév', score: 55 },
      { mois: 'Mar', score: 50 }, { mois: 'Avr', score: 46 }, { mois: 'Mai', score: 42 },
    ],
    credits: [
      { reference: 'CR-2025-012', montant: 620_000, encours: 620_000, statut: 'EN_RETARD', date_decaissement: '01/2025' },
    ],
    paiements_recents: [
      { date: '20/03/2026', montant: 34_444, type: 'PARTIEL', canal: 'Orange Money' },
      { date: '20/02/2026', montant: 0, type: 'MANQUE', canal: '—' },
      { date: '20/01/2026', montant: 68_889, type: 'REMBOURSEMENT', canal: 'Espèces' },
    ],
    visites: [
      { date: '18/05/2026', agent: 'Edem Kpélim', statut: 'POSITIVE', commentaire: 'Accepte plan restructuration — baisse activité confirmée' },
    ],
    alertes_ia: [
      { severite: 'HAUTE', message: 'Éligible restructuration — bonne volonté client', action: 'Proposer étalement 18 mois', date: '19/05/2026' },
    ],
    analyse_dec: 'Cliente coopérative lors de la visite du 18/05. Baisse d\'activité liée à concurrence. Restructuration recommandée plutôt que contentieux — historique 1 crédit remboursé intégralement en 2023.',
  },
  {
    id: 'CL-1067',
    nom: 'Edem Bessan',
    telephone: '+228 90 77 88 99',
    agence: 'Hédzranawoé',
    agent: 'Mawu Hotor',
    activite: 'Élevage porcin',
    secteur: 'Agriculture',
    localite: 'Hédzranawoé — Tokoin nord',
    encours: 480_000,
    score_ia: 45,
    pd_pct: 54,
    el: 207_360,
    jours_retard: 48,
    action: 'Visite urgente',
    classe_bceao: 'SOUS_SURVEILLANCE',
    mensualite: 53_333,
    echeances_impayees: 2,
    dernier_contact: '15/05/2026 — WhatsApp',
    score_evolution: [
      { mois: 'Déc', score: 65 }, { mois: 'Jan', score: 60 }, { mois: 'Fév', score: 54 },
      { mois: 'Mar', score: 50 }, { mois: 'Avr', score: 47 }, { mois: 'Mai', score: 45 },
    ],
    credits: [{ reference: 'CR-2025-067', montant: 480_000, encours: 480_000, statut: 'EN_RETARD', date_decaissement: '06/2025' }],
    paiements_recents: [
      { date: '10/04/2026', montant: 26_666, type: 'PARTIEL', canal: 'Espèces' },
      { date: '10/03/2026', montant: 0, type: 'MANQUE', canal: '—' },
    ],
    visites: [{ date: '01/05/2026', agent: 'Mawu Hotor', statut: 'POSITIVE', commentaire: 'Élevage opérationnel — mortalité porcelets explique retard' }],
    alertes_ia: [{ severite: 'HAUTE', message: 'Retard J+48 — secteur agricole saisonnier', action: 'Visite de suivi sous 72h', date: '20/05/2026' }],
    analyse_dec: 'Retard partiellement justifié (mortalité cheptel). Visite terrain confirme activité viable. Surveiller prochaine échéance — pas de contentieux immédiat.',
  },
  {
    id: 'CL-1003',
    nom: 'Togbui Apedo',
    telephone: '+228 91 55 66 77',
    agence: 'Bè Kpota',
    agent: 'Edem Kpélim',
    activite: 'Vente électronique & téléphones — Bè Kpota',
    secteur: 'Commerce',
    localite: 'Bè Kpota',
    encours: 1_200_000,
    score_ia: 47,
    pd_pct: 51,
    el: 489_600,
    jours_retard: 42,
    action: 'Contentieux à étudier',
    classe_bceao: 'DOUTEUX',
    mensualite: 133_333,
    echeances_impayees: 2,
    dernier_contact: '08/05/2026',
    score_evolution: [
      { mois: 'Déc', score: 70 }, { mois: 'Jan', score: 62 }, { mois: 'Fév', score: 55 },
      { mois: 'Mar', score: 52 }, { mois: 'Avr', score: 49 }, { mois: 'Mai', score: 47 },
    ],
    credits: [{ reference: 'CR-2024-156', montant: 1_200_000, encours: 1_200_000, statut: 'EN_RETARD', date_decaissement: '09/2024' }],
    paiements_recents: [
      { date: '05/04/2026', montant: 66_666, type: 'PARTIEL', canal: 'MTN MoMo' },
      { date: '05/03/2026', montant: 0, type: 'MANQUE', canal: '—' },
    ],
    visites: [{ date: '08/05/2026', agent: 'Edem Kpélim', statut: 'NEGATIVE', commentaire: 'Stock réduit — signale difficultés trésorerie fournisseurs' }],
    alertes_ia: [
      { severite: 'CRITIQUE', message: 'Dépôt pré-RDV suspect détecté (fraude)', action: 'Investigation croisée', date: '20/05/2026' },
      { severite: 'HAUTE', message: 'Encours élevé — EL 489k FCFA', action: 'Contentieux à étudier', date: '15/05/2026' },
    ],
    analyse_dec: 'Exposition significative (1.2M). Signal fraude pré-RDV en investigation. Contentieux à envisager si pas de régularisation sous 30j.',
  },
  {
    id: 'CL-1029',
    nom: 'Mensah Folly',
    telephone: '+228 90 22 33 44',
    agence: 'Lomé Centre',
    agent: 'Kofi Amavi',
    activite: 'Vente alimentaire — épicerie de quartier',
    secteur: 'Commerce',
    localite: 'Lomé Centre',
    encours: 540_000,
    score_ia: 51,
    pd_pct: 47,
    el: 200_880,
    jours_retard: 35,
    action: 'Plan apurement',
    classe_bceao: 'SOUS_SURVEILLANCE',
    mensualite: 60_000,
    echeances_impayees: 1,
    dernier_contact: '20/05/2026',
    score_evolution: [
      { mois: 'Déc', score: 68 }, { mois: 'Jan', score: 64 }, { mois: 'Fév', score: 60 },
      { mois: 'Mar', score: 56 }, { mois: 'Avr', score: 53 }, { mois: 'Mai', score: 51 },
    ],
    credits: [{ reference: 'CR-2025-034', montant: 540_000, encours: 540_000, statut: 'EN_RETARD', date_decaissement: '04/2025' }],
    paiements_recents: [{ date: '15/04/2026', montant: 30_000, type: 'PARTIEL', canal: 'Orange Money' }],
    visites: [{ date: '20/05/2026', agent: 'Kofi Amavi', statut: 'POSITIVE', commentaire: 'Salon actif — plan apurement accepté verbalement' }],
    alertes_ia: [{ severite: 'MOYENNE', message: 'Retard J+35 — bonne volonté', action: 'Formaliser plan apurement', date: '21/05/2026' }],
    analyse_dec: 'Retard modéré avec engagement client. Formaliser plan échelonné sur 3 mois.',
  },
  {
    id: 'CL-1088',
    nom: 'Mawuena Boutique',
    telephone: '+228 91 88 77 66',
    agence: 'Adidogomé',
    agent: 'Akua Lawson',
    activite: 'Vente produits cosmétiques — marché Adidogomé',
    secteur: 'Commerce',
    localite: 'Adidogomé — marché central',
    encours: 620_000,
    score_ia: 44,
    pd_pct: 55,
    el: 310_000,
    jours_retard: 35,
    action: 'Plan apurement',
    classe_bceao: 'SOUS_SURVEILLANCE',
    mensualite: 68_889,
    echeances_impayees: 2,
    dernier_contact: '22/05/2026 — relance WhatsApp',
    score_evolution: [
      { mois: 'Déc', score: 66 }, { mois: 'Jan', score: 62 }, { mois: 'Fév', score: 58 },
      { mois: 'Mar', score: 54 }, { mois: 'Avr', score: 48 }, { mois: 'Mai', score: 44 },
    ],
    credits: [{ reference: 'CR-2025-088', montant: 620_000, encours: 620_000, statut: 'EN_RETARD', date_decaissement: '02/2025' }],
    paiements_recents: [
      { date: '18/04/2026', montant: 34_444, type: 'PARTIEL', canal: 'Orange Money' },
      { date: '18/03/2026', montant: 0, type: 'MANQUE', canal: '—' },
      { date: '18/02/2026', montant: 68_889, type: 'REMBOURSEMENT', canal: 'Espèces' },
    ],
    visites: [
      { date: '22/05/2026', agent: 'Akua Lawson', statut: 'POSITIVE', commentaire: 'Boutique ouverte — promesse apurement sur 2 échéances' },
      { date: '05/05/2026', agent: 'Akua Lawson', statut: 'SANS_REPONSE', commentaire: 'Client absente — stock présent' },
    ],
    alertes_ia: [
      { severite: 'HAUTE', message: 'Retard J+35 — 2 échéances impayées', action: 'Formaliser plan apurement écrit', date: '23/05/2026' },
      { severite: 'MOYENNE', message: 'Secteur cosmétiques — concurrence forte Adidogomé', action: 'Surveiller marge client', date: '20/05/2026' },
    ],
    analyse_dec: 'Cliente présente sur le marché Adidogomé — activité confirmée. Bonne volonté au contact du 22/05. Prioriser plan apurement formalisé plutôt que contentieux immédiat.',
  },
  {
    id: 'CL-1058',
    nom: 'Adjoa Klutse',
    telephone: '+228 91 33 44 55',
    agence: 'Hédzranawoé',
    agent: 'Elom Komlavi',
    activite: 'Vente légumes au marché',
    secteur: 'Commerce',
    localite: 'Hédzranawoé — Adidogomé Est',
    encours: 380_000,
    score_ia: 54,
    pd_pct: 44,
    el: 134_064,
    jours_retard: 28,
    action: 'Relance WhatsApp',
    classe_bceao: 'SOUS_SURVEILLANCE',
    mensualite: 42_222,
    echeances_impayees: 1,
    dernier_contact: '19/05/2026',
    score_evolution: [
      { mois: 'Déc', score: 72 }, { mois: 'Jan', score: 68 }, { mois: 'Fév', score: 62 },
      { mois: 'Mar', score: 58 }, { mois: 'Avr', score: 56 }, { mois: 'Mai', score: 54 },
    ],
    credits: [{ reference: 'CR-2025-078', montant: 380_000, encours: 380_000, statut: 'EN_RETARD', date_decaissement: '07/2025' }],
    paiements_recents: [{ date: '20/04/2026', montant: 42_222, type: 'REMBOURSEMENT', canal: 'MTN MoMo' }],
    visites: [],
    alertes_ia: [{ severite: 'MOYENNE', message: 'Retard J+28 — premier incident', action: 'Relance WhatsApp', date: '20/05/2026' }],
    analyse_dec: 'Premier retard — profil historiquement sain. Relance douce prioritaire.',
  },
  {
    id: 'CL-1071',
    nom: 'Sika Adjovi',
    telephone: '+228 90 66 77 88',
    agence: 'Adidogomé',
    agent: 'Sena Dossou',
    activite: 'Couture & retouches',
    secteur: 'Artisanat',
    localite: 'Adidogomé — marché',
    encours: 720_000,
    score_ia: 56,
    pd_pct: 42,
    el: 241_920,
    jours_retard: 22,
    action: 'Visite suivi',
    classe_bceao: 'SOUS_SURVEILLANCE',
    mensualite: 80_000,
    echeances_impayees: 1,
    dernier_contact: '17/05/2026',
    score_evolution: [
      { mois: 'Déc', score: 74 }, { mois: 'Jan', score: 70 }, { mois: 'Fév', score: 66 },
      { mois: 'Mar', score: 62 }, { mois: 'Avr', score: 58 }, { mois: 'Mai', score: 56 },
    ],
    credits: [{ reference: 'CR-2025-045', montant: 720_000, encours: 720_000, statut: 'EN_RETARD', date_decaissement: '05/2025' }],
    paiements_recents: [{ date: '28/04/2026', montant: 40_000, type: 'PARTIEL', canal: 'Espèces' }],
    visites: [{ date: '17/05/2026', agent: 'Sena Dossou', statut: 'POSITIVE', commentaire: 'Atelier actif — commandes en cours' }],
    alertes_ia: [{ severite: 'MOYENNE', message: 'Retard J+22', action: 'Visite suivi', date: '18/05/2026' }],
    analyse_dec: 'Activité confirmée en visite. Retard probablement ponctuel — suivi standard.',
  },
  {
    id: 'CL-1093',
    nom: 'Mawuena Hotor',
    telephone: '+228 91 99 00 11',
    agence: 'Kpalimé',
    agent: 'Selom Agbeko',
    activite: 'Boulangerie artisanale',
    secteur: 'Agroalimentaire',
    localite: 'Kpalimé centre',
    encours: 290_000,
    score_ia: 58,
    pd_pct: 39,
    el: 90_480,
    jours_retard: 18,
    action: 'Relance téléphone',
    classe_bceao: 'SOUS_SURVEILLANCE',
    mensualite: 32_222,
    echeances_impayees: 1,
    dernier_contact: '16/05/2026',
    score_evolution: [
      { mois: 'Déc', score: 76 }, { mois: 'Jan', score: 72 }, { mois: 'Fév', score: 68 },
      { mois: 'Mar', score: 64 }, { mois: 'Avr', score: 60 }, { mois: 'Mai', score: 58 },
    ],
    credits: [{ reference: 'CR-2025-091', montant: 290_000, encours: 290_000, statut: 'EN_RETARD', date_decaissement: '08/2025' }],
    paiements_recents: [{ date: '02/05/2026', montant: 16_111, type: 'PARTIEL', canal: 'Orange Money' }],
    visites: [],
    alertes_ia: [{ severite: 'INFO', message: 'Retard J+18 — EL modérée', action: 'Relance téléphone', date: '19/05/2026' }],
    analyse_dec: 'Retard récent et modéré. EL contenue — relance standard suffisante.',
  },
  {
    id: 'CL-1112',
    nom: 'Akouvi Senou',
    telephone: '+228 90 11 22 99',
    agence: 'Kpalimé',
    agent: 'Ama Fiagbé',
    activite: 'Vente poisson fumé',
    secteur: 'Commerce',
    localite: 'Kpalimé — marché',
    encours: 410_000,
    score_ia: 61,
    pd_pct: 36,
    el: 118_080,
    jours_retard: 14,
    action: 'Surveillance',
    classe_bceao: 'SOUS_SURVEILLANCE',
    mensualite: 45_556,
    echeances_impayees: 1,
    dernier_contact: '14/05/2026',
    score_evolution: [
      { mois: 'Déc', score: 78 }, { mois: 'Jan', score: 74 }, { mois: 'Fév', score: 70 },
      { mois: 'Mar', score: 66 }, { mois: 'Avr', score: 63 }, { mois: 'Mai', score: 61 },
    ],
    credits: [{ reference: 'CR-2025-102', montant: 410_000, encours: 410_000, statut: 'EN_RETARD', date_decaissement: '09/2025' }],
    paiements_recents: [{ date: '06/05/2026', montant: 45_556, type: 'REMBOURSEMENT', canal: 'Espèces' }],
    visites: [],
    alertes_ia: [{ severite: 'INFO', message: 'Retard J+14 — tendance stable', action: 'Surveillance', date: '15/05/2026' }],
    analyse_dec: 'Profil stable malgré léger retard. Surveillance mensuelle suffisante.',
  },
  {
    id: 'CL-1124',
    nom: 'Kossi Dzigbodi',
    telephone: '+228 91 44 55 66',
    agence: 'Lomé Centre',
    agent: 'Mensah Kodjo',
    activite: 'Réparation électroménager',
    secteur: 'Services',
    localite: 'Lomé Centre — Bé',
    encours: 680_000,
    score_ia: 62,
    pd_pct: 35,
    el: 190_400,
    jours_retard: 11,
    action: 'Surveillance',
    classe_bceao: 'SOUS_SURVEILLANCE',
    mensualite: 75_556,
    echeances_impayees: 1,
    dernier_contact: '20/05/2026',
    score_evolution: [
      { mois: 'Déc', score: 80 }, { mois: 'Jan', score: 76 }, { mois: 'Fév', score: 72 },
      { mois: 'Mar', score: 68 }, { mois: 'Avr', score: 65 }, { mois: 'Mai', score: 62 },
    ],
    credits: [{ reference: 'CR-2025-118', montant: 680_000, encours: 680_000, statut: 'EN_RETARD', date_decaissement: '10/2025' }],
    paiements_recents: [{ date: '10/05/2026', montant: 75_556, type: 'REMBOURSEMENT', canal: 'Mixx By Yas' }],
    visites: [{ date: '20/05/2026', agent: 'Mensah Kodjo', statut: 'POSITIVE', commentaire: 'Atelier réparation actif' }],
    alertes_ia: [{ severite: 'INFO', message: 'Retard J+11 — paiement récent reçu', action: 'Surveillance', date: '21/05/2026' }],
    analyse_dec: 'Dernier paiement reçu — retard probablement résorbé. Surveillance standard.',
  },
]

function dossierDetailFromSeed(seed: DossierBloqueSeed): DossierBloqueDetail {
  return {
    id: seed.id,
    client: seed.client,
    type_client: 'INDIVIDUEL',
    montant: seed.montant,
    duree_mois: 12,
    taux: 12,
    objet: seed.raison,
    etape: seed.etape,
    statut_workflow: seed.statut_workflow,
    bloque_depuis_h: seed.bloque_depuis_h,
    raison: seed.raison,
    agent: seed.agent,
    agence: seed.agence,
    date_soumission: '15/05/2026',
    date_blocage: '20/05/2026',
    garanties: 'À compléter',
    historique_etapes: [
      { date: '15/05/2026', etape: 'Soumis', acteur: seed.agent },
      { date: '20/05/2026', etape: seed.etape, acteur: 'Système', commentaire: seed.raison },
    ],
    pieces: [{ nom: 'Dossier crédit', statut: 'EN_REVUE' }],
    actions_recommandees: [`Lever le blocage : ${seed.raison}`],
  }
}

export function getDossierBloqueById(id: string): DossierBloqueDetail | undefined {
  return DOSSIERS_BLOQUES_DETAILS.find(d => d.id === id)
    ?? (() => {
      const seed = getRegistreDossierById(id)
      return seed ? dossierDetailFromSeed(seed) : undefined
    })()
}

export function getAllDossiersBloques(): DossierBloqueDetail[] {
  return REGISTRE_DOSSIERS_BLOQUES.map(seed =>
    DOSSIERS_BLOQUES_DETAILS.find(d => d.id === seed.id) ?? dossierDetailFromSeed(seed),
  )
}

export function getClientRisqueById(id: string): ClientRisqueDetail | undefined {
  const base = CLIENTS_RISQUE_DETAILS.find(c => c.id === id) ?? resolveClientRisqueDynamic(id)
  return base ? enrichClientAffectation(base) : undefined
}

export function getAllClientsRisque(): ClientRisqueDetail[] {
  return REGISTRE_CLIENTS_RISQUE.map(seed => {
    const detail = CLIENTS_RISQUE_DETAILS.find(c => c.id === seed.id)
    return detail ? enrichClientAffectation(detail) : resolveClientRisqueDynamic(seed.id)!
  }).filter(Boolean)
}
