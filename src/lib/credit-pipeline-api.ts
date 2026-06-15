import type { CreditPipelineApi, PipelineDossierItem } from '@/types/phases-ad'
import {
  buildRocPipelineStages,
  type RocPipelineCard,
  type RocPipelineStage,
  type RocPipelineStageId,
  ROC_STAGE_LABELS,
} from '@/lib/credit-pipeline-roc'

const STATUT_TO_STAGE: Record<string, RocPipelineStageId> = {
  BROUILLON: 'SOUMIS',
  SOUMIS: 'SOUMIS',
  RDV_PROGRAMME: 'SOUMIS',
  EN_ATTENTE_DOCUMENTS: 'SOUMIS',
  DOSSIER_COMPLET: 'DOSSIER_COMPLET',
  VISITES_PLANIFIEES: 'DOSSIER_COMPLET',
  EN_ANALYSE: 'EN_ANALYSE',
  VALIDE_CHARGE: 'VALIDE_CHARGE',
  REFUSE_CHARGE: 'EN_ANALYSE',
  EN_ANALYSE_ROC: 'EN_ANALYSE_ROC',
  EN_COMITE_CREDIT: 'EN_COMITE_CREDIT',
  EN_COMITE: 'EN_COMITE_CREDIT',
  ACCORDE: 'APPROUVE',
  APPROUVE: 'APPROUVE',
  REFUSE: 'EN_ANALYSE',
  EN_GESTION: 'EN_GESTION',
  CLOTURE: 'EN_GESTION',
  SOLDE: 'EN_GESTION',
  EN_DEFAUT: 'EN_GESTION',
  DECAISSEMENT: 'DECAISSEMENT',
}

function itemToCard(item: PipelineDossierItem, stageId: RocPipelineStageId): RocPipelineCard {
  const ref = item.reference ?? item.reference_dossier ?? item.id
  const clientName = item.client
    ? `${item.client.prenom ?? ''} ${item.client.nom ?? ''}`.trim()
    : 'Client'
  const preAnalyse = stageId === 'SOUMIS' || stageId === 'DOSSIER_COMPLET'
  const score = preAnalyse ? 0 : (item.score_consolide ?? item.score ?? 50)
  return {
    id: item.id,
    reference: ref,
    dossier_id: item.id,
    client: clientName,
    activite: item.client?.activite ?? '—',
    objet: item.resume ?? 'Dossier crédit',
    agence: item.agence?.nom ?? '—',
    agent: item.agent ? `${item.agent.prenom ?? ''} ${item.agent.nom ?? ''}`.trim() : '—',
    montant: item.montant_accorde ?? item.montant_demande ?? 0,
    score,
    etoiles: preAnalyse ? 2 : (score >= 75 ? 3 : score >= 55 ? 2 : 1),
    resume: preAnalyse
      ? stageId === 'SOUMIS'
        ? `Demande soumise · ${(item.resume ?? 'Dossier crédit').slice(0, 72)}`
        : 'Pièces complètes · en attente de passage en analyse CC'
      : (item.resume ?? `${ref} — ${clientName}`),
    sentiment: preAnalyse ? 'NEUTRE' : (score >= 75 ? 'POSITIF' : score >= 55 ? 'NEUTRE' : 'NEGATIF'),
    priorite: (item.priorite as RocPipelineCard['priorite']) ?? 'NORMALE',
    attente_h: item.jours_attente != null ? item.jours_attente * 24 : undefined,
  }
}

/** Construit les colonnes kanban depuis la réponse API pipeline */
export function buildPipelineStagesFromApi(data: CreditPipelineApi): RocPipelineStage[] | null {
  const grouped: Record<string, PipelineDossierItem[]> = {}

  if (data.par_statut) {
    Object.assign(grouped, data.par_statut)
  } else if (data.dossiers?.length) {
    for (const d of data.dossiers) {
      const st = d.statut ?? 'EN_ANALYSE'
      if (!grouped[st]) grouped[st] = []
      grouped[st].push(d)
    }
  } else {
    return null
  }

  const stageIds: RocPipelineStageId[] = [
    'SOUMIS',
    'DOSSIER_COMPLET',
    'EN_ANALYSE',
    'VALIDE_CHARGE',
    'EN_ANALYSE_ROC',
    'EN_COMITE_CREDIT',
    'APPROUVE',
    'DECAISSEMENT',
    'EN_GESTION',
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

  const cardsByStage: Record<RocPipelineStageId, RocPipelineCard[]> = {
    SOUMIS: [],
    DOSSIER_COMPLET: [],
    EN_ANALYSE: [],
    VALIDE_CHARGE: [],
    EN_ANALYSE_ROC: [],
    EN_COMITE_CREDIT: [],
    APPROUVE: [],
    DECAISSEMENT: [],
    EN_GESTION: [],
  }

  for (const [statut, items] of Object.entries(grouped)) {
    const stage = STATUT_TO_STAGE[statut] ?? 'EN_ANALYSE'
    for (const item of items) {
      cardsByStage[stage].push(itemToCard(item, stage))
    }
  }

  return stageIds.map((id) => ({
    id,
    label: ROC_STAGE_LABELS[id],
    accent: accents[id],
    cards: cardsByStage[id],
  }))
}

export function pipelineCompteursLabel(data: CreditPipelineApi): string {
  if (!data.compteurs) return ''
  return Object.entries(data.compteurs)
    .map(([k, v]) => `${k}: ${v}`)
    .join(' · ')
}

export function getMockPipelineStages(): RocPipelineStage[] {
  return buildRocPipelineStages()
}
