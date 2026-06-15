/**
 * Adaptateur mock → forme workflow API (analyse sans backend).
 */
import { getAllDossiersAnalyse } from '@/lib/credit-pipeline-roc'
import {
  getDemoDossier,
  getDemoDossiers,
  getDemoStageOverride,
} from '@/lib/credit-pipeline-demo-store'
import type {
  DossierCreditDetail,
  DossierCreditListItem,
  DossierStatutBd,
  DossierWorkflowResponse,
  SectionsVisibles,
  WorkflowAction,
  WorkflowTimelineStep,
} from '@/types/credit-api'

const TIMELINE_TEMPLATE: Omit<WorkflowTimelineStep, 'statut'>[] = [
  { etape: 'SOUMISSION', label: 'Soumission', statuts_bd: ['SOUMIS', 'RDV_PROGRAMME', 'EN_ATTENTE_DOCUMENTS'] },
  { etape: 'DOSSIER', label: 'Dossier complet', statuts_bd: ['DOSSIER_COMPLET', 'VISITES_PLANIFIEES'] },
  { etape: 'ANALYSE_CC', label: 'Analyse CC', statuts_bd: ['EN_ANALYSE', 'VALIDE_CHARGE', 'REFUSE_CHARGE'] },
  { etape: 'ROC', label: 'ROC / Comité', statuts_bd: ['EN_ANALYSE_ROC', 'EN_COMITE_CREDIT', 'REFUSE'] },
  { etape: 'GESTION', label: 'Gestion PF', statuts_bd: ['EN_GESTION', 'CLOTURE'] },
]

function statutToEtapeLabel(statut: string): string {
  const map: Record<string, string> = {
    SOUMIS: 'Soumis',
    RDV_PROGRAMME: 'RDV programmé',
    EN_ATTENTE_DOCUMENTS: 'Documents manquants',
    DOSSIER_COMPLET: 'Dossier complet',
    VISITES_PLANIFIEES: 'Visites planifiées',
    EN_ANALYSE: 'En analyse CC',
    VALIDE_CHARGE: 'Validé charge',
    REFUSE_CHARGE: 'Refusé CC',
    EN_ANALYSE_ROC: 'Analyse ROC',
    EN_COMITE_CREDIT: 'Comité crédit',
    REFUSE: 'Refusé',
    EN_GESTION: 'En gestion',
    CLOTURE: 'Clôturé',
    ANNULE: 'Annulé',
  }
  return map[statut] ?? statut
}

function timelineForStatut(statut: string): WorkflowTimelineStep[] {
  const refused = statut === 'REFUSE' || statut === 'REFUSE_CHARGE' || statut === 'ANNULE'
  let passedCurrent = false
  return TIMELINE_TEMPLATE.map((step) => {
    const inStep = step.statuts_bd.includes(statut)
    let s: WorkflowTimelineStep['statut'] = 'A_VENIR'
    if (refused && step.etape === 'ROC' && (statut === 'REFUSE' || statut === 'REFUSE_CHARGE')) {
      s = 'REFUSE'
    } else if (inStep) {
      s = 'EN_COURS'
      passedCurrent = true
    } else if (!passedCurrent) {
      s = 'TERMINE'
    }
    return { ...step, statut: s }
  })
}

function actionsForStatut(statut: string, role = 'CHARGE_CREDIT'): WorkflowAction[] {
  const base: WorkflowAction[] = ['VOIR_RAPPORT_CC', 'VOIR_SCORE_DOSSIER']
  switch (statut) {
    case 'EN_ANALYSE':
      if (role === 'CHARGE_CREDIT' || role === 'CC') return [...base, 'DONNER_AVIS_CC']
      break
    case 'VALIDE_CHARGE':
    case 'EN_ANALYSE_ROC':
      if (role === 'ROC' || role === 'ROP_CREDIT') return [...base, 'VOIR_RAPPORT_ROC', 'DECISION_ROC']
      return [...base, 'VOIR_RAPPORT_ROC']
    case 'EN_COMITE_CREDIT':
      if (role === 'DG' || role === 'COMITE') return [...base, 'VALIDER_COMITE']
      break
    case 'EN_GESTION':
      if (role === 'GESTIONNAIRE_PORTEFEUILLE' || role === 'GP') {
        return ['PAYER_ECHEANCE', 'ENVOYER_RELANCE_EMAIL', 'CREER_PROMESSE_PAIEMENT']
      }
      return ['VOIR_RAPPORT_CC', 'PAYER_ECHEANCE']
    default:
      break
  }
  return base
}

function resolveStatut(dossierId: string, fallback: string): string {
  return getDemoStageOverride(dossierId) ?? fallback
}

function sectionsForStatut(statut: string, role = 'CHARGE_CREDIT'): SectionsVisibles {
  const analyse = ['EN_ANALYSE', 'VALIDE_CHARGE', 'REFUSE_CHARGE', 'EN_ANALYSE_ROC', 'EN_COMITE_CREDIT', 'REFUSE'].includes(statut)
  const gestion = statut === 'EN_GESTION' || statut === 'CLOTURE'
  const isGp = role === 'GESTIONNAIRE_PORTEFEUILLE' || role === 'GP'
  const isCc = role === 'CHARGE_CREDIT' || role === 'CC'
  const preAnalyse = statut === 'SOUMIS' || statut === 'DOSSIER_COMPLET' || statut === 'EN_ATTENTE_DOCUMENTS'
  return {
    fiche_client: true,
    cautionnaires: !gestion,
    visites_dossier: !gestion && !preAnalyse,
    rapport_cc: analyse || gestion,
    rapport_roc: analyse,
    comite: statut === 'EN_COMITE_CREDIT',
    echeancier: gestion,
    recouvrement: gestion && isGp,
    instruction_cc: !gestion && isCc && statut === 'EN_ANALYSE',
    scoring_ia: isCc ? statut === 'EN_ANALYSE' : analyse,
    pieces: true,
    historique_statuts: true,
  }
}

export function mockListDossiersCredit(): DossierCreditListItem[] {
  const staticList = getAllDossiersAnalyse().map((d) => ({
    id: d.dossier_id || d.reference_dossier,
    reference: d.reference_dossier,
    statut: resolveStatut(d.dossier_id, (d.statut_dossier ?? d.etape_courante) as string) as DossierStatutBd,
    montant_demande: d.montant_demande,
    date_soumission: d.date_creation,
    client: {
      id: d.client.id,
      nom: d.client.nom,
      prenom: d.client.prenom,
      telephone: d.client.telephone,
      activite: d.client.activite,
      secteur: d.client.secteur,
    },
    agent: { id: 'mock-agent', nom: 'Agent', prenom: 'Terrain' },
    agence: { id: 'AG-01', nom: 'Lomé Centre' },
  })).filter(d => Boolean(d.id))

  const demoList = getDemoDossiers().map((d) => ({
    id: d.dossier_id || d.reference,
    reference: d.reference,
    statut: (getDemoStageOverride(d.dossier_id) ?? d.stage) as DossierStatutBd,
    montant_demande: d.montant,
    date_soumission: new Date().toISOString().slice(0, 10),
    client: {
      id: d.dossier_id,
      nom: d.client_nom,
      prenom: d.client_prenom,
      telephone: '',
      activite: d.activite,
      secteur: d.activite,
    },
    agent: { id: 'mock-agent', nom: d.agent.split(' ').slice(-1)[0] ?? 'Terrain', prenom: d.agent.split(' ')[0] ?? 'Agent' },
    agence: { id: 'AG-01', nom: d.agence },
  })).filter(d => Boolean(d.id))

  const byId = new Map<string, DossierCreditListItem>()
  for (const item of staticList) {
    if (!byId.has(item.id)) byId.set(item.id, item)
  }
  for (const item of demoList) {
    if (!byId.has(item.id)) byId.set(item.id, item)
  }
  return Array.from(byId.values())
}

export function mockGetDossierCredit(id: string): DossierCreditDetail | null {
  const demo = getDemoDossier(id)
  if (demo) {
    return {
      id: demo.dossier_id,
      reference: demo.reference,
      statut: (getDemoStageOverride(demo.dossier_id) ?? demo.stage) as DossierStatutBd,
      montant_demande: demo.montant,
      duree_mois: 12,
      objet_credit: demo.objet,
      date_soumission: new Date().toISOString().slice(0, 10),
      client: {
        id: demo.dossier_id,
        nom: demo.client_nom,
        prenom: demo.client_prenom,
        telephone: '',
        activite: demo.activite,
        secteur: demo.activite,
      },
      agent: { id: 'mock-agent', nom: demo.agent, prenom: '' },
      agence: { id: 'AG-01', nom: demo.agence },
    }
  }

  const d = getAllDossiersAnalyse().find((x) => x.dossier_id === id || x.reference_dossier === id)
  if (!d) return null
  return {
    id: d.dossier_id,
    reference: d.reference_dossier,
    statut: resolveStatut(d.dossier_id, (d.statut_dossier ?? d.etape_courante) as string) as DossierStatutBd,
    montant_demande: d.montant_demande,
    duree_mois: d.duree_mois,
    objet_credit: d.objet_credit,
    date_soumission: d.date_creation,
    client: {
      id: d.client.id,
      nom: d.client.nom,
      prenom: d.client.prenom,
      telephone: d.client.telephone,
      activite: d.client.activite,
      secteur: d.client.secteur,
    },
    agent: { id: 'mock-agent', nom: 'Agent', prenom: 'Terrain' },
    agence: { id: 'AG-01', nom: 'Lomé Centre' },
  }
}

export function mockGetDossierWorkflow(
  dossierId: string,
  roleConnecte = 'CHARGE_CREDIT',
): DossierWorkflowResponse | null {
  const demo = getDemoDossier(dossierId)
  const d = getAllDossiersAnalyse().find((x) => x.dossier_id === dossierId || x.reference_dossier === dossierId)
  const statut = demo
    ? (getDemoStageOverride(demo.dossier_id) ?? demo.stage)
    : d
      ? resolveStatut(d.dossier_id, (d.statut_dossier ?? d.etape_courante) as string)
      : 'EN_ANALYSE'
  return {
    statut_bd: statut,
    etape_metier: statut,
    etape_label: statutToEtapeLabel(statut),
    timeline: timelineForStatut(statut),
    jalons: [
      { cle: 'soumission', date: d?.date_creation ?? null, label: 'Soumission' },
      { cle: 'analyse', date: null, label: 'Analyse CC' },
      ...(demo?.elements.length
        ? demo.elements.map((el, i) => ({
            cle: `demo-${el.type}-${i}`,
            date: el.date,
            label: el.label,
          }))
        : []),
    ],
    actions_disponibles: actionsForStatut(statut, roleConnecte),
    sections_visibles: sectionsForStatut(statut, roleConnecte),
    role_connecte: roleConnecte,
  }
}
