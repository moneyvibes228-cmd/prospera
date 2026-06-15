// Hub agences & opérations ROC — synthèse IA + actions par agence

import {
  MOCK_ROC_HOME, CASH_PAR_AGENCE, type CashAgence,
} from '@/lib/mockMicrofinance'
import { ROC_SYNTHESE_COMPLEMENT, RAPPORT_IA_ROC } from '@/lib/roc-synthese-ia'

export interface ActionROC {
  priorite: number
  action: string
  impact: string
  delai: string
}

export interface AgenceFicheReseau {
  agence_id: string
  nom: string
  statut_par: string
  statut_bceao: 'CONFORME' | 'NON_CONFORME' | 'ATTENTION'
  score_sante: number
  tendance: 'POSITIF' | 'STABLE' | 'ALERTE'
  par: { j1: number; j7: number; j30: number; j90: number }
  encours: number
  cash: CashAgence
  transactions_jour: number
  incidents: number
  analyse_ia: string
  actions_ia: string[]
  liens: { label: string; href: string }[]
}

export interface ReseauHubData {
  synthese_ia: string
  chiffres_cles: typeof RAPPORT_IA_ROC.chiffres_cles
  alertes_immediates: string[]
  actions_prioritaires: ActionROC[]
  points_attention: typeof RAPPORT_IA_ROC.points_attention
  agences: AgenceFicheReseau[]
  controle: typeof MOCK_ROC_HOME.controle_quotidien
  controle_analyses: { label: string; ia: string; action: string }[]
  equipes: typeof MOCK_ROC_HOME.equipes
  activite: typeof MOCK_ROC_HOME.activite_op
  kpis_ops: typeof MOCK_ROC_HOME.kpis_operations
  cash_synthese: typeof MOCK_ROC_HOME.cash_synthese
}

const ACTIONS_PAR_AGENCE: Record<string, string[]> = {
  'AG-001': [
    'Coaching Mensah Kodjo — objectif 12 visites/j',
    'Traiter 2 dossiers incomplets signalés',
    'Relancer Edem Sodji et Yawa Akakpo (impayés Lomé C.)',
  ],
  'AG-002': [
    'Virement 1,5 M depuis siège si tension persiste demain',
    'Débloquer dossier pièces manquantes sous 72 h',
    'Respecter promesse Folly Kpedzu — pas de pression avant juin',
  ],
  'AG-003': [
    'URGENT : virement 2 M FCFA avant 10 h',
    'Mission recouvrement jeudi — Mawuli Atsu + 2 P1',
    'Suspendre nouveaux décaissements tant que PAR > 10 %',
    'Audit GPS agent Kossi Adjavon',
  ],
  'AG-004': [
    'Valider DOS-2026-0228 (client fidèle agriculture)',
    'Rapatrier 700 k excédent vers siège ou Bè Kpota',
    'Documenter bonnes pratiques Elom Komlavi',
  ],
  'AG-005': [
    'Arbitrer DOS-2026-0244 (garanties menuiserie)',
    'Évaluer rapatriement cash vers Bè Kpota',
    'Maintenir PAR < 6 %',
  ],
}

const LIENS_PAR_AGENCE: Record<string, { label: string; href: string }[]> = {
  'AG-001': [{ label: 'Recouvrement', href: '/credit/recouvrement#equipes' }],
  'AG-003': [
    { label: 'Recouvrement', href: '/credit/recouvrement#mauvais-payeurs' },
    { label: 'PAR & Risque', href: '/risque' },
  ],
  'AG-004': [{ label: 'Pipeline', href: '/credit/pipeline' }],
  'AG-005': [{ label: 'Analyse dossier', href: '/credit/analyse?ref=DOS-2026-0244' }],
}

function buildAgences(): AgenceFicheReseau[] {
  const synthAgences = RAPPORT_IA_ROC.synthese_agences ?? []
  const opsAgences = ROC_SYNTHESE_COMPLEMENT.operations?.agences ?? []

  return MOCK_ROC_HOME.heatmap_par_agences.map(h => {
    const synth = synthAgences.find(a => a.agence_id === h.agence_id)
    const ops = opsAgences.find(a => a.agence_id === h.agence_id)
    const cash = CASH_PAR_AGENCE.find(c => c.agence_id === h.agence_id)!

    return {
      agence_id: h.agence_id,
      nom: h.agence,
      statut_par: h.statut,
      statut_bceao: synth?.statut_bceao ?? 'CONFORME',
      score_sante: synth?.score_sante ?? 75,
      tendance: synth?.tendance ?? 'STABLE',
      par: { j1: h.par_1, j7: h.par_7, j30: h.par_30, j90: h.par_90 },
      encours: h.encours,
      cash,
      transactions_jour: ops?.transactions_jour ?? 0,
      incidents: ops?.incidents ?? 0,
      analyse_ia: synth?.resume ?? ops?.resume ?? 'Analyse en cours.',
      actions_ia: ACTIONS_PAR_AGENCE[h.agence_id] ?? [],
      liens: LIENS_PAR_AGENCE[h.agence_id] ?? [{ label: 'Recouvrement', href: '/credit/recouvrement' }],
    }
  })
}

export function getReseauHubData(): ReseauHubData {
  const controle = MOCK_ROC_HOME.controle_quotidien

  return {
    synthese_ia: ROC_SYNTHESE_COMPLEMENT.operations?.resume_global
      ?? RAPPORT_IA_ROC.synthese_executive.slice(0, 400),

    chiffres_cles: RAPPORT_IA_ROC.chiffres_cles,
    alertes_immediates: RAPPORT_IA_ROC.alertes_immediates.map(a =>
      a.replace(/^🚨\s*/, '').replace(/^⚠\s*/, '')
    ),

    actions_prioritaires: [
      ...MOCK_ROC_HOME.recommandations_ia.map(r => ({
        priorite: r.priorite,
        action: r.action,
        impact: r.impact,
        delai: r.delai,
      })),
      ...RAPPORT_IA_ROC.recommandations
        .filter(r => !MOCK_ROC_HOME.recommandations_ia.some(m => m.action.includes(r.action.slice(0, 20))))
        .slice(0, 2)
        .map(r => ({
          priorite: r.priorite,
          action: r.action,
          impact: r.impact_estime,
          delai: r.delai,
        })),
    ].sort((a, b) => a.priorite - b.priorite),

    points_attention: RAPPORT_IA_ROC.points_attention,
    agences: buildAgences(),
    controle,
    controle_analyses: [
      {
        label: 'Transactions échouées',
        ia: `${controle.transactions_echouees} échecs sur ${controle.transactions_total} — taux ${((controle.transactions_echouees / controle.transactions_total) * 100).toFixed(1)} %. Probable problème MoMo intermittent. Réessai auto activé.`,
        action: 'Relancer les 3 transactions échouées avant clôture · Vérifier réconciliation MoMo',
      },
      {
        label: 'Opérations annulées',
        ia: `${controle.operations_annulees} annulations — 1 liée à cash insuffisant Bè Kpota, 1 erreur saisie agent.`,
        action: 'Former agent sur saisie · Confirmer virement cash avant nouvelles opérations Bè Kpota',
      },
      {
        label: 'Dossiers incomplets',
        ia: `${controle.dossiers_incomplets} dossiers bloqués pièces — goulot analyse CC. Délai moyen validation 4,2 j vs objectif 3 j.`,
        action: 'Réunion CC/ROC pour fluidifier · Relancer agents terrain sur pièces manquantes',
      },
      {
        label: 'Tickets incidents',
        ia: `${controle.tickets_incidents_ouverts} ticket(s) ouvert(s) dont ${controle.ticket_p1} P1 — réconciliation fin de journée MoMo.`,
        action: 'Traiter ticket P1 avant 18 h · Escalade DAF si non résolu',
      },
    ],
    equipes: MOCK_ROC_HOME.equipes,
    activite: MOCK_ROC_HOME.activite_op,
    kpis_ops: MOCK_ROC_HOME.kpis_operations,
    cash_synthese: MOCK_ROC_HOME.cash_synthese,
  }
}
