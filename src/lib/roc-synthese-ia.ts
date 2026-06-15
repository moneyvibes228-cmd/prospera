// Rapport IA ROC — synthèse direction crédit & opérations (format DG)

import type { RapportIA } from '@/lib/mockMicrofinance'
import { AGENCES } from '@/lib/agences'
import { buildRapportIARoc } from '@/lib/mock-persona-builders'

export interface DossierROCSynthese {
  reference: string
  client: string
  montant: number
  attente_h: number
  etape: string
  classe_bceao?: string
  score?: number
  analyse_ia: string
  action_suggeree: string
  suggestion_ia: 'APPROUVER' | 'APPROUVER_REDUIT' | 'DEMANDER_GARANTIES' | 'REFUSER'
  lien: string
}

export interface RecouvrementAgenceSynthese {
  agence_id: string
  nom: string
  taux_pct: number
  objectif_pct: number
  collecte_jour_fcfa: number
  impayes_fcfa: number
  strategie_ia: string
}

export interface OperationAgenceSynthese {
  agence_id: string
  nom: string
  resume: string
  transactions_jour?: number
  incidents?: number
  cash_statut?: 'NORMAL' | 'TENSION' | 'CRITIQUE'
}

export interface ROCSyntheseComplement {
  recouvrement_global: {
    taux_pct: number
    objectif_pct: number
    ecart_pts: number
    collecte_jour_fcfa: number
    objectif_jour_fcfa: number
    strategie_ia: string
  }
  recouvrement_agences: RecouvrementAgenceSynthese[]
  dossiers_a_traiter: DossierROCSynthese[]
  operations: {
    resume_global: string
    agences: OperationAgenceSynthese[]
  }
}

function agenceNom(id: string): string {
  return AGENCES.find(a => a.id === id)?.nom_court ?? id
}

function buildSyntheseAgencesRoc() {
  return AGENCES.map(a => ({
    agence_id: a.id,
    nom: a.nom_court,
    statut_bceao: (a.par_courant >= 10 ? 'NON_CONFORME' : 'CONFORME') as 'CONFORME' | 'NON_CONFORME',
    score_sante: Math.round(Math.max(40, 100 - a.par_courant * 4)),
    tendance: (a.par_courant >= 10 ? 'ALERTE' : a.par_courant <= 6 ? 'POSITIF' : 'STABLE') as 'POSITIF' | 'STABLE' | 'ALERTE',
    resume: `PAR 30 ${a.par_courant}% · encours ${(a.encours_fcfa / 1_000_000).toFixed(1)}M FCFA · ${a.emprunteurs_actifs} prêts actifs · remb. ${a.taux_remboursement}%.`,
  }))
}

export const RAPPORT_IA_ROC: RapportIA = {
  ...buildRapportIARoc(),
  synthese_agences: buildSyntheseAgencesRoc(),
}

export const ROC_SYNTHESE_COMPLEMENT: ROCSyntheseComplement = {
  recouvrement_global: {
    taux_pct: 52,
    objectif_pct: 75,
    ecart_pts: -23,
    collecte_jour_fcfa: 1_240_000,
    objectif_jour_fcfa: 2_400_000,
    strategie_ia:
      'Prioriser jeudi–vendredi : (1) mission conjointe ROC + Kossi Adjavon sur 3 impayés Bè Kpota (cible 400 k), (2) relance Lomé Centre sur Edem Sodji et Yawa Akakpo via MoMo, (3) honorer les 12 promesses actives (64 % déjà honorées — relancer les 4 restantes avant 12h). Objectif réaliste fin de semaine : 68–72 % si ces trois leviers sont exécutés.',
  },
  recouvrement_agences: [
    {
      agence_id: 'AG-003',
      nom: 'Bè Kpota',
      taux_pct: 58,
      objectif_pct: 80,
      collecte_jour_fcfa: 285_000,
      impayes_fcfa: 1_870_000,
      strategie_ia:
        'Zone rouge : visite ROC jeudi sur Mawuli Atsu (420 k) + restructuration 3 dossiers. Suspendre nouveaux décaissements jusqu\'à PAR < 10 %. Mobiliser caution solidaire restante sur top 2 impayés.',
    },
    {
      agence_id: 'AG-001',
      nom: 'Lomé Centre',
      taux_pct: 64,
      objectif_pct: 75,
      collecte_jour_fcfa: 360_000,
      impayes_fcfa: 550_000,
      strategie_ia:
        'Réaffecter suivi Edem Sodji et Yawa Akakpo à agent senior ou visite ROC. Coaching Mensah Kodjo obligatoire (6/15 visites). Cible +180 k avant vendredi.',
    },
    {
      agence_id: 'AG-002',
      nom: agenceNom('AG-002'),
      taux_pct: 78,
      objectif_pct: 75,
      collecte_jour_fcfa: 220_000,
      impayes_fcfa: 240_000,
      strategie_ia:
        'Objectif atteint — maintenir. Folly Kpedzu : respecter promesse récolte juin, pas de pression coercitive.',
    },
    {
      agence_id: 'AG-004',
      nom: agenceNom('AG-004'),
      taux_pct: 82,
      objectif_pct: 75,
      collecte_jour_fcfa: 195_000,
      impayes_fcfa: 120_000,
      strategie_ia:
        'Excédentaire — modèle à documenter. Valider DOS-2026-0228 pour renforcer relation client agriculture.',
    },
    {
      agence_id: 'AG-005',
      nom: 'Kpalimé',
      taux_pct: 76,
      objectif_pct: 75,
      collecte_jour_fcfa: 165_000,
      impayes_fcfa: 85_000,
      strategie_ia:
        'Stable. Finaliser DOS-2026-0244 ; si retard ROC > 72 h, proposer décaissement réduit 700 k avec garanties renforcées.',
    },
  ],
  dossiers_a_traiter: [
    {
      reference: 'DOS-2026-0228',
      client: 'Folly Mensah',
      montant: 400_000,
      attente_h: 48,
      etape: 'EN_ANALYSE_ROC',
      classe_bceao: 'PERFORMANT',
      score: 76,
      analyse_ia:
        'Dossier sain (score 76, 4 crédits antérieurs remboursés). Blocage uniquement charge ROC — aucun motif de refus technique. Risque : mécontentement client fidèle agriculture.',
      action_suggeree: 'Approuver décaissement 400 k sous 24 h',
      suggestion_ia: 'APPROUVER',
      lien: '/credit/recouvrement/dossiers/DOS-2026-0228',
    },
    {
      reference: 'DOS-2026-0244',
      client: 'Komi Atsu',
      montant: 850_000,
      attente_h: 56,
      etape: 'EN_ANALYSE_ROC',
      classe_bceao: 'SOUS_SURVEILLANCE',
      score: 71,
      analyse_ia:
        'Montant élevé, garanties à 70 % (seuil 80 %). Devis machine flou. Avis CC favorable avec réserve — arbitrage ROC : valider réduit 700 k ou exiger devis lisible.',
      action_suggeree: 'Demander devis + valider réduit si OK',
      suggestion_ia: 'DEMANDER_GARANTIES',
      lien: '/credit/recouvrement/dossiers/DOS-2026-0244',
    },
    {
      reference: 'DOS-2026-0246',
      client: 'Edem Bessan',
      montant: 1_200_000,
      attente_h: 72,
      etape: 'EN_ANALYSE',
      classe_bceao: 'DOUTEUX',
      score: 35,
      analyse_ia:
        'CRITIQUE : dépôt 200 k 48 h avant analyse — gonflement suspect. Taux effort 32,2 %, pas de cautions. Recommandation IA : refus ou crédit réduit 300 k salon existant uniquement.',
      action_suggeree: 'Bloquer — enquête dépôt suspect',
      suggestion_ia: 'REFUSER',
      lien: '/credit/analyse?dossier=DOS-2026-0246',
    },
    {
      reference: 'DOS-2026-0241',
      client: 'Akossiwa Mensah',
      montant: 500_000,
      attente_h: 18,
      etape: 'EN_ANALYSE',
      classe_bceao: 'SOUS_SURVEILLANCE',
      score: 72,
      analyse_ia:
        'Score 72, cautions à 70 %. CC recommande approbation réduite. Peut passer en file ROC sous 48 h si garanties complétées.',
      action_suggeree: 'Suivre complément caution',
      suggestion_ia: 'APPROUVER_REDUIT',
      lien: '/credit/analyse?dossier=DOS-2026-0241',
    },
  ],
  operations: {
    resume_global:
      'Journée opérationnelle globalement fluide : 247 transactions (3 échouées à réessayer), 4 décaissements pour 850 k FCFA, remboursements 1,24 M FCFA. 1 ticket P1 actif (réconciliation MoMo). Goulot principal : délai validation 4,2 j (étape analyse CC). Cash inter-agences déséquilibré — action trésorerie matinale prioritaire.',
    agences: [
      {
        agence_id: 'AG-003',
        nom: 'Bè Kpota',
        resume: 'Cash CRITIQUE (980 k / 1,2 M min). 1 transaction échouée MoMo. Agent sous pression recouvrement.',
        transactions_jour: 52,
        incidents: 1,
        cash_statut: 'CRITIQUE',
      },
      {
        agence_id: 'AG-001',
        nom: 'Lomé Centre',
        resume: 'Opérations normales. 2 dossiers incomplets signalés. Volume décaissements +18 % vs moyenne.',
        transactions_jour: 78,
        incidents: 0,
        cash_statut: 'NORMAL',
      },
      {
        agence_id: 'AG-002',
        nom: agenceNom('AG-002'),
        resume: 'Stable. 1 dossier bloqué pièces. Pas d\'incident cash.',
        transactions_jour: 41,
        cash_statut: 'NORMAL',
      },
      {
        agence_id: 'AG-004',
        nom: agenceNom('AG-004'),
        resume: 'Bonne discipline. Décaissement prévu post-validation ROC DOS-0228.',
        transactions_jour: 38,
        cash_statut: 'NORMAL',
      },
      {
        agence_id: 'AG-005',
        nom: 'Kpalimé',
        resume: 'Excédent cash — candidat rapatriement vers Bè Kpota. 0 incident.',
        transactions_jour: 38,
        cash_statut: 'NORMAL',
      },
    ],
  },
}
