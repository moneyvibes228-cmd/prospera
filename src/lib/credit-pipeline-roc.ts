// Pipeline ROC — source unique alignée sur DOSSIERS_ANALYSE_CC + enrichissement

import { DOSSIERS_ANALYSE_CC, type RapportCC, type EtapeScore } from '@/lib/mockMicrofinance'
import { getEnrichissement, type SentimentDossier } from '@/lib/dossier-enrichissement'
import {
  demoEntryToCard,
  getDemoDossiers,
  getDemoStageOverride,
} from '@/lib/credit-pipeline-demo-store'

export type RocPipelineStageId =
  | 'SOUMIS'
  | 'DOSSIER_COMPLET'
  | 'EN_ANALYSE'
  | 'VALIDE_CHARGE'
  | 'EN_ANALYSE_ROC'
  | 'EN_COMITE_CREDIT'
  | 'APPROUVE'
  | 'DECAISSEMENT'
  | 'EN_GESTION'

export type AgencePipelineStageId = 'SOUMIS' | 'DOSSIER_COMPLET' | 'EN_ANALYSE' | 'VALIDE_CHARGE'

export interface RocPipelineCard {
  id: string
  reference: string
  dossier_id: string
  client: string
  activite: string
  objet: string
  agence: string
  agent: string
  montant: number
  score: number
  etoiles: 1 | 2 | 3
  resume: string
  sentiment: SentimentDossier
  avis_cc?: string
  priorite: 'URGENT' | 'HAUTE' | 'NORMALE'
  attente_h?: number
  classe_bceao?: string
  tags?: string[]
}

export interface RocPipelineStage {
  id: RocPipelineStageId
  label: string
  accent: string
  cards: RocPipelineCard[]
}

export const ROC_STAGE_LABELS: Record<RocPipelineStageId, string> = {
  SOUMIS:         'Soumis',
  DOSSIER_COMPLET:'Docs OK',
  EN_ANALYSE:     'Analyse CC',
  VALIDE_CHARGE:  'Validé CC',
  EN_ANALYSE_ROC: 'Validation ROC',
  EN_COMITE_CREDIT: 'Comité crédit',
  APPROUVE:       'Approuvé',
  DECAISSEMENT:   'Décaissement',
  EN_GESTION:     'En gestion',
}

const AGENCE_STAGE_SET = new Set<AgencePipelineStageId>([
  'SOUMIS', 'DOSSIER_COMPLET', 'EN_ANALYSE', 'VALIDE_CHARGE',
])

const PLACEMENT: Record<string, RocPipelineStageId> = {
  'DOS-2026-0241': 'EN_ANALYSE',
  'DOS-2026-0243': 'EN_ANALYSE',
  'DOS-2026-0245': 'EN_ANALYSE',
  'DOS-2026-0250': 'EN_ANALYSE',
  'DOS-2026-0235': 'VALIDE_CHARGE',
  'DOS-2026-0228': 'EN_ANALYSE_ROC',
  'DOS-2026-0244': 'EN_ANALYSE_ROC',
  'DOS-2026-0249': 'EN_ANALYSE_ROC',
  'DOS-2026-0252': 'EN_ANALYSE_ROC',
  'DOS-2026-0238': 'EN_COMITE_CREDIT',
  'DOS-2026-0240': 'APPROUVE',
  'DOS-2026-0232': 'DECAISSEMENT',
  'DOS-2026-0229': 'DECAISSEMENT',
  'DOS-2025-1180': 'EN_GESTION',
  'DOS-2025-1092': 'EN_GESTION',
}

const SYNTHETIC = [
  {
    dossier_id: 'DOS-2026-0247', reference_dossier: 'DOS-2026-0247',
    client: { id: 'CL-1321', nom: 'Afetogbo', prenom: 'Elinam', telephone: '+228 91 55 66 77', secteur: 'Commerce', activite: 'Cosmétiques', age: 34, localite: 'Lomé Centre' },
    montant_demande: 300_000, duree_mois: 12, objet_credit: 'Stock cosmétiques premium',
    date_creation: '17/05/2026', etape_courante: 'VALIDE_CHARGE' as EtapeScore, statut_dossier: 'VALIDE_CHARGE',
    score_consolide: 76, score_cbi: 74, ajustement_prospera_ia: 2, classe_bceao: 'PERFORMANT' as const, probabilite_defaut_pct: 9.0,
    evolution_score: [{ etape: 'VALIDE_CHARGE' as EtapeScore, score_consolide: 76, date: '17/05/2026' }],
    mapping_5c: { CHARACTER: 26, CAPACITY: 11, CAPITAL: 18, COLLATERAL: 7, CONDITIONS: 8 },
    detail_dimensions: [], alertes_actives: [],
    analyse_prospera_ia: { mode: 'PROSPERA_IA_API' as const, commentaire: 'Avis CC favorable — en attente transmission ROC.', questions_a_poser: [], points_a_verifier: [], decision_suggeree: 'APPROUVER' as const },
    rappels_etape: [], charge_credit: { nom: 'Elom Adjavon', agence: 'Siège — Lomé' },
  },
  {
    dossier_id: 'DOS-2026-0248', reference_dossier: 'DOS-2026-0248',
    client: { id: 'CL-1320', nom: 'Folly', prenom: 'Mensah', telephone: '+228 90 12 34 56', secteur: 'Services', activite: 'Salon beauté', age: 29, localite: 'Lomé Centre' },
    montant_demande: 450_000, duree_mois: 12, objet_credit: 'Équipement salon — extension',
    date_creation: '18/05/2026', etape_courante: 'DOSSIER_COMPLET' as EtapeScore, statut_dossier: 'DOSSIER_COMPLET',
    score_consolide: 0, score_cbi: 0, ajustement_prospera_ia: 0, classe_bceao: 'SOUS_SURVEILLANCE' as const, probabilite_defaut_pct: 0,
    evolution_score: [
      { etape: 'SOUMIS' as EtapeScore, score_consolide: 0, date: '15/05/2026' },
      { etape: 'DOSSIER_COMPLET' as EtapeScore, score_consolide: 0, date: '18/05/2026' },
    ],
    mapping_5c: { CHARACTER: 0, CAPACITY: 0, CAPITAL: 0, COLLATERAL: 0, CONDITIONS: 0 },
    detail_dimensions: [], alertes_actives: [],
    analyse_prospera_ia: { mode: 'PROSPERA_IA_API' as const, commentaire: 'Analyse CC non démarrée — dossier en attente de passage en analyse.', questions_a_poser: [], points_a_verifier: [], decision_suggeree: 'A_VOIR_ROC' as const },
    rappels_etape: ['Planifier visite terrain'], charge_credit: { nom: 'Elom Adjavon', agence: 'Siège — Lomé' },
  },
  {
    dossier_id: 'DOS-2026-0250', reference_dossier: 'DOS-2026-0250',
    client: { id: 'CL-1301', nom: 'Adjovi', prenom: 'Sika', telephone: '+228 97 11 22 33', secteur: 'Commerce', activite: 'Trading import textiles', age: 35, localite: 'Lomé Centre' },
    montant_demande: 1_200_000, duree_mois: 18, objet_credit: 'Achat stock import Chine — extension activité',
    date_creation: '20/05/2026', etape_courante: 'EN_ANALYSE' as EtapeScore, statut_dossier: 'EN_ANALYSE',
    score_consolide: 78, score_cbi: 76, ajustement_prospera_ia: 2, classe_bceao: 'SOUS_SURVEILLANCE' as const, probabilite_defaut_pct: 11.2,
    evolution_score: [
      { etape: 'SOUMIS' as EtapeScore, score_consolide: 58, date: '14/05/2026' },
      { etape: 'DOSSIER_COMPLET' as EtapeScore, score_consolide: 64, date: '16/05/2026' },
      { etape: 'EN_ANALYSE' as EtapeScore, score_consolide: 78, date: '20/05/2026' },
    ],
    mapping_5c: { CHARACTER: 26, CAPACITY: 11, CAPITAL: 18, COLLATERAL: 7, CONDITIONS: 8 },
    detail_dimensions: [], alertes_actives: [],
    analyse_prospera_ia: {
      mode: 'PROSPERA_IA_API' as const,
      commentaire: 'PME import stable. Dépôt récent justifié. Endettement externe à vérifier. Approbation réduite possible si garanties renforcées.',
      questions_a_poser: [], points_a_verifier: [], decision_suggeree: 'APPROUVER_REDUIT' as const,
    },
    rappels_etape: ['Vérifier facture proforma', 'Confirmer cautions associé'],
    charge_credit: { nom: 'Elom Adjavon', agence: 'Siège — Lomé' },
  },
  {
    dossier_id: 'DOS-2026-0243', reference_dossier: 'DOS-2026-0243',
    client: { id: 'CL-1310', nom: 'Central', prenom: 'GIE Marché', telephone: '+228 90 00 11 22', secteur: 'Groupe', activite: 'Groupe solidaire marché', age: 0, localite: 'Lomé Centre' },
    montant_demande: 2_400_000, duree_mois: 24, objet_credit: 'Renforcement fonds roulement groupe',
    date_creation: '17/05/2026', etape_courante: 'EN_ANALYSE' as EtapeScore, statut_dossier: 'EN_ANALYSE',
    score_consolide: 74, score_cbi: 72, ajustement_prospera_ia: 2, classe_bceao: 'SOUS_SURVEILLANCE' as const, probabilite_defaut_pct: 14.0,
    evolution_score: [{ etape: 'EN_ANALYSE' as EtapeScore, score_consolide: 74, date: '17/05/2026' }],
    mapping_5c: { CHARACTER: 24, CAPACITY: 10, CAPITAL: 20, COLLATERAL: 8, CONDITIONS: 7 },
    detail_dimensions: [], alertes_actives: [],
    analyse_prospera_ia: { mode: 'PROSPERA_IA_API' as const, commentaire: 'Groupe solidaire expérimenté.', questions_a_poser: [], points_a_verifier: [], decision_suggeree: 'A_VOIR_ROC' as const },
    rappels_etape: [], charge_credit: { nom: 'Elom Adjavon', agence: 'Siège — Lomé' },
  },
  {
    dossier_id: 'DOS-2026-0245', reference_dossier: 'DOS-2026-0245',
    client: { id: 'CL-1311', nom: 'Hotor', prenom: 'Mawuena', telephone: '+228 91 22 33 44', secteur: 'Artisanat', activite: 'Boulangerie artisanale', age: 38, localite: 'Tabligbo' },
    montant_demande: 290_000, duree_mois: 12, objet_credit: 'Four électrique + moule',
    date_creation: '18/05/2026', etape_courante: 'EN_ANALYSE' as EtapeScore, statut_dossier: 'EN_ANALYSE',
    score_consolide: 58, score_cbi: 60, ajustement_prospera_ia: -2, classe_bceao: 'SOUS_SURVEILLANCE' as const, probabilite_defaut_pct: 22.0,
    evolution_score: [{ etape: 'EN_ANALYSE' as EtapeScore, score_consolide: 58, date: '18/05/2026' }],
    mapping_5c: { CHARACTER: 18, CAPACITY: 8, CAPITAL: 14, COLLATERAL: 5, CONDITIONS: 6 },
    detail_dimensions: [], alertes_actives: [],
    analyse_prospera_ia: { mode: 'PROSPERA_IA_API' as const, commentaire: 'Activité récente, garanties faibles.', questions_a_poser: [], points_a_verifier: [], decision_suggeree: 'DEMANDER_GARANTIES' as const },
    rappels_etape: [], charge_credit: { nom: 'Elom Adjavon', agence: 'Siège — Lomé' },
  },
  {
    dossier_id: 'DOS-2026-0244', reference_dossier: 'DOS-2026-0244',
    client: { id: 'CL-1312', nom: 'Atsu', prenom: 'Komi', telephone: '+228 92 33 44 55', secteur: 'Artisanat', activite: 'Atelier menuiserie', age: 44, localite: 'Kpalimé' },
    montant_demande: 850_000, duree_mois: 15, objet_credit: 'Machines menuiserie',
    date_creation: '14/05/2026', etape_courante: 'EN_ANALYSE_ROC' as EtapeScore, statut_dossier: 'EN_ANALYSE_ROC',
    score_consolide: 71, score_cbi: 70, ajustement_prospera_ia: 1, classe_bceao: 'SOUS_SURVEILLANCE' as const, probabilite_defaut_pct: 13.5,
    evolution_score: [
      { etape: 'EN_ANALYSE' as EtapeScore, score_consolide: 68, date: '12/05/2026' },
      { etape: 'VALIDE_CHARGE' as EtapeScore, score_consolide: 70, date: '13/05/2026' },
      { etape: 'EN_ANALYSE_ROC' as EtapeScore, score_consolide: 71, date: '14/05/2026' },
    ],
    mapping_5c: { CHARACTER: 25, CAPACITY: 10, CAPITAL: 17, COLLATERAL: 6, CONDITIONS: 7 },
    detail_dimensions: [], alertes_actives: [],
    analyse_prospera_ia: { mode: 'PROSPERA_IA_API' as const, commentaire: 'CC favorable. Garanties à arbitrer.', questions_a_poser: [], points_a_verifier: [], decision_suggeree: 'APPROUVER' as const },
    rappels_etape: ['Arbitrer garanties'], charge_credit: { nom: 'Elom Adjavon', agence: 'Siège — Lomé' },
  },
  {
    dossier_id: 'DOS-2026-0249', reference_dossier: 'DOS-2026-0249',
    client: { id: 'CL-1313', nom: 'Klutse', prenom: 'Adjoa', telephone: '+228 93 44 55 66', secteur: 'Commerce', activite: 'Vente tissus wax', age: 41, localite: 'Lomé Centre' },
    montant_demande: 1_500_000, duree_mois: 18, objet_credit: 'Stock tissus premium',
    date_creation: '19/05/2026', etape_courante: 'EN_ANALYSE_ROC' as EtapeScore, statut_dossier: 'EN_ANALYSE_ROC',
    score_consolide: 68, score_cbi: 67, ajustement_prospera_ia: 1, classe_bceao: 'SOUS_SURVEILLANCE' as const, probabilite_defaut_pct: 16.0,
    evolution_score: [{ etape: 'EN_ANALYSE_ROC' as EtapeScore, score_consolide: 68, date: '19/05/2026' }],
    mapping_5c: { CHARACTER: 22, CAPACITY: 9, CAPITAL: 16, COLLATERAL: 6, CONDITIONS: 7 },
    detail_dimensions: [], alertes_actives: [],
    analyse_prospera_ia: { mode: 'PROSPERA_IA_API' as const, commentaire: 'Alerte garantie — vérification ROC requise.', questions_a_poser: [], points_a_verifier: [], decision_suggeree: 'APPROUVER_REDUIT' as const },
    rappels_etape: [], charge_credit: { nom: 'Elom Adjavon', agence: 'Siège — Lomé' },
  },
  {
    dossier_id: 'DOS-2026-0252', reference_dossier: 'DOS-2026-0252',
    client: { id: 'CL-1314', nom: 'Tetevi', prenom: 'Yao', telephone: '+228 94 55 66 77', secteur: 'Transport', activite: 'Transport moto', age: 32, localite: 'Bè Kpota' },
    montant_demande: 600_000, duree_mois: 12, objet_credit: 'Achat moto taxi',
    date_creation: '20/05/2026', etape_courante: 'EN_ANALYSE_ROC' as EtapeScore, statut_dossier: 'EN_ANALYSE_ROC',
    score_consolide: 52, score_cbi: 54, ajustement_prospera_ia: -2, classe_bceao: 'DOUTEUX' as const, probabilite_defaut_pct: 28.0,
    evolution_score: [{ etape: 'EN_ANALYSE_ROC' as EtapeScore, score_consolide: 52, date: '20/05/2026' }],
    mapping_5c: { CHARACTER: 14, CAPACITY: 6, CAPITAL: 12, COLLATERAL: 4, CONDITIONS: 5 },
    detail_dimensions: [], alertes_actives: [],
    analyse_prospera_ia: { mode: 'PROSPERA_IA_API' as const, commentaire: 'Avis CC défavorable — PAR agence élevé.', questions_a_poser: [], points_a_verifier: [], decision_suggeree: 'REFUSER' as const },
    rappels_etape: [], charge_credit: { nom: 'Elom Adjavon', agence: 'Siège — Lomé' },
  },
  {
    dossier_id: 'DOS-2026-0240', reference_dossier: 'DOS-2026-0240',
    client: { id: 'CL-1315', nom: 'Dzigbodi', prenom: 'Kossi', telephone: '+228 95 66 77 88', secteur: 'Services', activite: 'Réparation électroménager', age: 36, localite: 'Lomé Centre' },
    montant_demande: 680_000, duree_mois: 12, objet_credit: 'Outillage + stock pièces',
    date_creation: '16/05/2026', etape_courante: 'APPROUVE' as EtapeScore, statut_dossier: 'APPROUVE',
    score_consolide: 81, score_cbi: 79, ajustement_prospera_ia: 2, classe_bceao: 'PERFORMANT' as const, probabilite_defaut_pct: 7.0,
    evolution_score: [{ etape: 'EN_ANALYSE_ROC' as EtapeScore, score_consolide: 81, date: '16/05/2026' }],
    mapping_5c: { CHARACTER: 28, CAPACITY: 12, CAPITAL: 20, COLLATERAL: 8, CONDITIONS: 8 },
    detail_dimensions: [], alertes_actives: [],
    analyse_prospera_ia: { mode: 'PROSPERA_IA_API' as const, commentaire: 'Validé ROC.', questions_a_poser: [], points_a_verifier: [], decision_suggeree: 'APPROUVER' as const },
    rappels_etape: [], charge_credit: { nom: 'Elom Adjavon', agence: 'Siège — Lomé' },
  },
  {
    dossier_id: 'DOS-2026-0232', reference_dossier: 'DOS-2026-0232',
    client: { id: 'CL-1316', nom: 'Victoire', prenom: 'Groupe', telephone: '+228 96 77 88 99', secteur: 'Groupe', activite: 'Groupe femmes', age: 0, localite: 'Hédzranawoé' },
    montant_demande: 1_100_000, duree_mois: 18, objet_credit: 'Fonds roulement groupe',
    date_creation: '08/05/2026', etape_courante: 'DECAISSEMENT' as EtapeScore, statut_dossier: 'DECAISSEMENT',
    score_consolide: 76, score_cbi: 74, ajustement_prospera_ia: 2, classe_bceao: 'PERFORMANT' as const, probabilite_defaut_pct: 9.0,
    evolution_score: [], mapping_5c: { CHARACTER: 26, CAPACITY: 11, CAPITAL: 19, COLLATERAL: 8, CONDITIONS: 7 },
    detail_dimensions: [], alertes_actives: [],
    analyse_prospera_ia: { mode: 'PROSPERA_IA_API' as const, commentaire: 'Décaissement en cours.', questions_a_poser: [], points_a_verifier: [], decision_suggeree: 'APPROUVER' as const },
    rappels_etape: [], charge_credit: { nom: 'Elom Adjavon', agence: 'Siège — Lomé' },
  },
  {
    dossier_id: 'DOS-2026-0229', reference_dossier: 'DOS-2026-0229',
    client: { id: 'CL-1317', nom: 'Bessan', prenom: 'Edem', telephone: '+228 97 88 99 00', secteur: 'Agriculture', activite: 'Élevage porcin', age: 48, localite: 'Tsévié' },
    montant_demande: 480_000, duree_mois: 10, objet_credit: 'Aliments bétail',
    date_creation: '07/05/2026', etape_courante: 'DECAISSEMENT' as EtapeScore, statut_dossier: 'DECAISSEMENT',
    score_consolide: 79, score_cbi: 77, ajustement_prospera_ia: 2, classe_bceao: 'PERFORMANT' as const, probabilite_defaut_pct: 8.0,
    evolution_score: [], mapping_5c: { CHARACTER: 27, CAPACITY: 12, CAPITAL: 18, COLLATERAL: 8, CONDITIONS: 7 },
    detail_dimensions: [], alertes_actives: [],
    analyse_prospera_ia: { mode: 'PROSPERA_IA_API' as const, commentaire: 'MoMo prêt.', questions_a_poser: [], points_a_verifier: [], decision_suggeree: 'APPROUVER' as const },
    rappels_etape: [], charge_credit: { nom: 'Elom Adjavon', agence: 'Siège — Lomé' },
  },
  {
    dossier_id: 'DOS-2025-1180', reference_dossier: 'DOS-2025-1180',
    client: { id: 'CL-1318', nom: 'Apedo', prenom: 'Togbui', telephone: '+228 98 99 00 11', secteur: 'Commerce', activite: 'Commerce gros', age: 52, localite: 'Bè Kpota' },
    montant_demande: 1_200_000, duree_mois: 24, objet_credit: 'Stock gros', date_creation: '01/2025',
    etape_courante: 'EN_GESTION' as EtapeScore, statut_dossier: 'EN_GESTION',
    score_consolide: 65, score_cbi: 63, ajustement_prospera_ia: 2, classe_bceao: 'SOUS_SURVEILLANCE' as const, probabilite_defaut_pct: 18.0,
    evolution_score: [], mapping_5c: { CHARACTER: 20, CAPACITY: 8, CAPITAL: 15, COLLATERAL: 6, CONDITIONS: 6 },
    detail_dimensions: [], alertes_actives: [],
    analyse_prospera_ia: { mode: 'PROSPERA_IA_API' as const, commentaire: 'Retard J+42 en gestion.', questions_a_poser: [], points_a_verifier: [], decision_suggeree: 'REFUSER' as const },
    rappels_etape: [], charge_credit: { nom: 'Edem Kpélim', agence: 'Bè Kpota' },
  },
  {
    dossier_id: 'DOS-2025-1092', reference_dossier: 'DOS-2025-1092',
    client: { id: 'CL-1319', nom: 'Dossou', prenom: 'Yawa', telephone: '+228 99 00 11 22', secteur: 'Commerce', activite: 'Cosmétiques', age: 34, localite: 'Bè Kpota' },
    montant_demande: 620_000, duree_mois: 15, objet_credit: 'Stock cosmétiques', date_creation: '11/2024',
    etape_courante: 'EN_GESTION' as EtapeScore, statut_dossier: 'EN_GESTION',
    score_consolide: 70, score_cbi: 68, ajustement_prospera_ia: 2, classe_bceao: 'SOUS_SURVEILLANCE' as const, probabilite_defaut_pct: 15.0,
    evolution_score: [], mapping_5c: { CHARACTER: 22, CAPACITY: 9, CAPITAL: 16, COLLATERAL: 6, CONDITIONS: 7 },
    detail_dimensions: [], alertes_actives: [],
    analyse_prospera_ia: { mode: 'PROSPERA_IA_API' as const, commentaire: 'En gestion normale.', questions_a_poser: [], points_a_verifier: [], decision_suggeree: 'APPROUVER' as const },
    rappels_etape: [], charge_credit: { nom: 'Edem Kpélim', agence: 'Bè Kpota' },
  },
] as RapportCC[]

const SLA_H: Record<string, number> = {
  'DOS-2026-0228': 48, 'DOS-2026-0244': 56, 'DOS-2026-0249': 18, 'DOS-2026-0252': 14,
}

const PRIORITE: Record<string, 'URGENT' | 'HAUTE' | 'NORMALE'> = {
  'DOS-2026-0228': 'URGENT', 'DOS-2026-0244': 'URGENT', 'DOS-2026-0249': 'HAUTE', 'DOS-2026-0252': 'HAUTE', 'DOS-2026-0250': 'HAUTE',
}

function resolveRapport(ref: string): RapportCC | undefined {
  return DOSSIERS_ANALYSE_CC.find(d => d.dossier_id === ref || d.reference_dossier === ref)
    ?? SYNTHETIC.find(d => d.dossier_id === ref)
}

function resolveAgenceStage(ref: string): AgencePipelineStageId | null {
  const demoStage = getDemoStageOverride(ref)
  if (demoStage) return demoStage

  const d = resolveRapport(ref)
  if (!d) return null
  if (AGENCE_STAGE_SET.has(d.etape_courante as AgencePipelineStageId)) {
    return d.etape_courante as AgencePipelineStageId
  }
  const placed = PLACEMENT[ref]
  if (placed && AGENCE_STAGE_SET.has(placed as AgencePipelineStageId)) {
    return placed as AgencePipelineStageId
  }
  return null
}

function rapportToCard(ref: string, stage: RocPipelineStageId): RocPipelineCard | null {
  const d = resolveRapport(ref)
  if (!d) return null
  const enrich = getEnrichissement(d.dossier_id, d)
  const preAnalyse = isPreCcAnalyseStage(stage)
  const valide = stage === 'VALIDE_CHARGE'

  return {
    id: `card-${d.dossier_id}`,
    reference: d.reference_dossier,
    dossier_id: d.dossier_id,
    client: `${d.client.prenom} ${d.client.nom}`.trim(),
    activite: d.client.activite,
    objet: d.objet_credit,
    agence: enrich.agence,
    agent: enrich.agent_terrain,
    montant: d.montant_demande,
    score: preAnalyse ? 0 : d.score_consolide,
    etoiles: preAnalyse ? 2 : enrich.etoiles,
    resume: preAnalyse
      ? stage === 'SOUMIS'
        ? `Demande soumise · ${d.objet_credit.length > 72 ? `${d.objet_credit.slice(0, 72)}…` : d.objet_credit}`
        : 'Pièces complètes · en attente de passage en analyse CC'
      : enrich.resume,
    sentiment: preAnalyse ? 'NEUTRE' : enrich.sentiment,
    avis_cc: valide
      ? (enrich.avis_cc?.commentaire ?? `Avis CC : ${d.analyse_prospera_ia.decision_suggeree?.replaceAll('_', ' ') ?? '—'}`)
      : undefined,
    priorite: PRIORITE[ref] ?? 'NORMALE',
    attente_h: SLA_H[ref],
    classe_bceao: preAnalyse ? undefined : d.classe_bceao,
    tags: SLA_H[ref] && SLA_H[ref] >= 48 ? ['SLA dépassé'] : undefined,
  }
}

export const AGENCE_PIPELINE_STAGE_IDS = ['SOUMIS', 'DOSSIER_COMPLET', 'EN_ANALYSE', 'VALIDE_CHARGE'] as const

export const AGENCE_PIPELINE_LABELS: Record<AgencePipelineStageId, string> = {
  SOUMIS:          'Soumis',
  DOSSIER_COMPLET: 'Docs OK',
  EN_ANALYSE:      'Analyse CC',
  VALIDE_CHARGE:   'Validé CC',
}

/** Étapes où le CC n'a pas encore (ou plus) à produire une analyse CBI */
export function isPreCcAnalyseStage(stage: RocPipelineStageId | AgencePipelineStageId): boolean {
  return stage === 'SOUMIS' || stage === 'DOSSIER_COMPLET'
}

export function isCcAnalyseStage(stage: RocPipelineStageId | AgencePipelineStageId): boolean {
  return stage === 'EN_ANALYSE'
}

export function canCcAnalyseEtape(etape: string): boolean {
  return etape === 'EN_ANALYSE'
}

/** @deprecated Utiliser AGENCE_PIPELINE_STAGE_IDS */
export const CC_PIPELINE_STAGE_IDS = AGENCE_PIPELINE_STAGE_IDS

/** @deprecated Utiliser AGENCE_PIPELINE_LABELS */
export const CC_PIPELINE_LABELS: Record<string, string> = AGENCE_PIPELINE_LABELS

/** @deprecated Utiliser AGENCE_PIPELINE_STAGE_IDS */
export const RA_PIPELINE_STAGE_IDS = AGENCE_PIPELINE_STAGE_IDS

/** @deprecated Utiliser AGENCE_PIPELINE_LABELS */
export const RA_PIPELINE_LABELS: Record<string, string> = AGENCE_PIPELINE_LABELS

const AGENCE_STAGE_ACCENTS: Record<AgencePipelineStageId, string> = {
  SOUMIS:          'bg-blue-500',
  DOSSIER_COMPLET: 'bg-indigo-500',
  EN_ANALYSE:      'bg-violet-500',
  VALIDE_CHARGE:   'bg-teal-500',
}

export function buildAgencePipelineStages(agenceNom?: string): RocPipelineStage[] {
  const cardsByStage: Record<AgencePipelineStageId, RocPipelineCard[]> = {
    SOUMIS: [],
    DOSSIER_COMPLET: [],
    EN_ANALYSE: [],
    VALIDE_CHARGE: [],
  }
  const seen = new Set<string>()

  for (const d of getAllDossiersAnalyse()) {
    const stage = resolveAgenceStage(d.dossier_id)
    if (!stage) continue
    const card = rapportToCard(d.dossier_id, stage)
    if (!card || seen.has(card.id)) continue
    if (agenceNom && card.agence !== agenceNom) continue
    seen.add(card.id)
    cardsByStage[stage].push(card)
  }

  for (const entry of getDemoDossiers()) {
    if (!entry.is_demo_only) continue
    const stage = getDemoStageOverride(entry.dossier_id) ?? entry.stage
    if (agenceNom && entry.agence !== agenceNom) continue
    const card = demoEntryToCard(entry, stage) as RocPipelineCard
    if (seen.has(card.id)) continue
    seen.add(card.id)
    cardsByStage[stage].push(card)
  }

  return AGENCE_PIPELINE_STAGE_IDS.map(id => ({
    id,
    label: AGENCE_PIPELINE_LABELS[id],
    accent: AGENCE_STAGE_ACCENTS[id],
    cards: cardsByStage[id],
  }))
}

export function buildCcPipelineStages(): RocPipelineStage[] {
  return buildAgencePipelineStages()
}

export function getAgencePipelineTotals(stages: RocPipelineStage[]) {
  const totalCards = stages.reduce((s, st) => s + st.cards.length, 0)
  const totalMontant = stages.reduce((s, st) => s + st.cards.reduce((a, c) => a + c.montant, 0), 0)
  const byStage = Object.fromEntries(
    AGENCE_PIPELINE_STAGE_IDS.map(id => [
      id,
      stages.find(st => st.id === id)?.cards.length ?? 0,
    ]),
  ) as Record<AgencePipelineStageId, number>
  return {
    totalCards,
    totalMontant,
    soumis: byStage.SOUMIS,
    docsOk: byStage.DOSSIER_COMPLET,
    enAnalyse: byStage.EN_ANALYSE,
    validesCc: byStage.VALIDE_CHARGE,
  }
}

export function getCcPipelineTotals(stages: RocPipelineStage[]) {
  return getAgencePipelineTotals(stages)
}

export function buildRaPipelineStages(agenceNom?: string): RocPipelineStage[] {
  return buildAgencePipelineStages(agenceNom)
}

export function getRaPipelineTotals(stages: RocPipelineStage[]) {
  return getAgencePipelineTotals(stages)
}

export function buildRocPipelineStages(): RocPipelineStage[] {
  const rocStageIds: RocPipelineStageId[] = [
    'EN_ANALYSE', 'VALIDE_CHARGE', 'EN_ANALYSE_ROC', 'EN_COMITE_CREDIT', 'APPROUVE', 'DECAISSEMENT', 'EN_GESTION',
  ]
  const accents: Record<RocPipelineStageId, string> = {
    SOUMIS: 'bg-blue-500',
    DOSSIER_COMPLET: 'bg-indigo-500',
    EN_ANALYSE: 'bg-indigo-500',
    VALIDE_CHARGE: 'bg-violet-500',
    EN_ANALYSE_ROC: 'bg-orange-500',
    EN_COMITE_CREDIT: 'bg-purple-600',
    APPROUVE: 'bg-teal-500',
    DECAISSEMENT: 'bg-emerald-500',
    EN_GESTION: 'bg-slate-500',
  }

  return rocStageIds.map(id => ({
    id,
    label: ROC_STAGE_LABELS[id],
    accent: accents[id],
    cards: Object.entries(PLACEMENT)
      .filter(([, st]) => st === id)
      .map(([ref]) => rapportToCard(ref, id))
      .filter((c): c is RocPipelineCard => c !== null),
  }))
}

export function getRocPipelineTotals(stages: RocPipelineStage[]) {
  const totalCards = stages.reduce((s, st) => s + st.cards.length, 0)
  const totalMontant = stages.reduce((s, st) => s + st.cards.reduce((a, c) => a + c.montant, 0), 0)
  const enAttenteRoc = stages.find(st => st.id === 'EN_ANALYSE_ROC')?.cards.length ?? 0
  return { totalCards, totalMontant, enAttenteRoc }
}

export function getAllDossiersAnalyse(): RapportCC[] {
  const ids = new Set(DOSSIERS_ANALYSE_CC.map(d => d.dossier_id))
  const extra = SYNTHETIC.filter(s => !ids.has(s.dossier_id))
  return [...DOSSIERS_ANALYSE_CC, ...extra]
}

export function getDossierByRef(ref: string): RapportCC | undefined {
  return getAllDossiersAnalyse().find(d => d.reference_dossier === ref || d.dossier_id === ref)
}
