/**
 * Store démo pipeline agence — sessionStorage
 * Permet d'ajouter des dossiers et des éléments à chaque étape (présentation processus crédit).
 */

export type DemoAgenceStage = 'SOUMIS' | 'DOSSIER_COMPLET' | 'EN_ANALYSE' | 'VALIDE_CHARGE'

export const DEMO_AGENCE_STAGES: DemoAgenceStage[] = [
  'SOUMIS', 'DOSSIER_COMPLET', 'EN_ANALYSE', 'VALIDE_CHARGE',
]

export const DEMO_STAGE_LABELS: Record<DemoAgenceStage, string> = {
  SOUMIS: 'Soumis',
  DOSSIER_COMPLET: 'Docs OK',
  EN_ANALYSE: 'Analyse CC',
  VALIDE_CHARGE: 'Validé CC',
}

export interface DemoPipelineCard {
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
  sentiment: 'POSITIF' | 'NEUTRE' | 'NEGATIF' | 'CRITIQUE'
  avis_cc?: string
  priorite: 'URGENT' | 'HAUTE' | 'NORMALE'
  attente_h?: number
  classe_bceao?: string
  tags?: string[]
}

export type DemoElementType = 'DEMANDE' | 'PIECE' | 'RDV' | 'VISITE' | 'ANALYSE' | 'AVIS_CC'

export interface DemoDossierElement {
  id: string
  type: DemoElementType
  label: string
  date: string
  meta?: string
}

export interface DemoDossierEntry {
  dossier_id: string
  reference: string
  stage: DemoAgenceStage
  client_prenom: string
  client_nom: string
  activite: string
  montant: number
  objet: string
  agence: string
  agent: string
  elements: DemoDossierElement[]
  score?: number
  avis_cc?: string
  is_demo_only: boolean
}

export const DEMO_STAGE_ELEMENT_OPTIONS: Record<
  DemoAgenceStage,
  { type: DemoElementType; label: string; defaultLabel: string }[]
> = {
  SOUMIS: [
    { type: 'DEMANDE', label: 'Demande agent', defaultLabel: 'Demande crédit saisie par agent terrain' },
  ],
  DOSSIER_COMPLET: [
    { type: 'PIECE', label: 'Pièce KYC', defaultLabel: 'CNI + justificatif domicile' },
    { type: 'PIECE', label: 'Pièce activité', defaultLabel: 'Registre commerce / attestation' },
    { type: 'RDV', label: 'RDV client', defaultLabel: 'RDV prise en agence' },
  ],
  EN_ANALYSE: [
    { type: 'VISITE', label: 'Visite terrain', defaultLabel: 'Visite domicile + activité effectuée' },
    { type: 'ANALYSE', label: 'Grille CBI', defaultLabel: 'Analyse CC — scoring 5C + 8 dimensions' },
  ],
  VALIDE_CHARGE: [
    { type: 'AVIS_CC', label: 'Avis CC', defaultLabel: 'Avis favorable — transmission ROC' },
  ],
}

const STORAGE_KEY = 'prospera-pipeline-demo-v1'

function todayFr(): string {
  return new Date().toLocaleDateString('fr-FR')
}

function loadState(): { dossiers: DemoDossierEntry[]; stageOverrides: Record<string, DemoAgenceStage> } {
  if (typeof window === 'undefined') return { dossiers: [], stageOverrides: {} }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return { dossiers: [], stageOverrides: {} }
    return JSON.parse(raw) as { dossiers: DemoDossierEntry[]; stageOverrides: Record<string, DemoAgenceStage> }
  } catch {
    return { dossiers: [], stageOverrides: {} }
  }
}

function saveState(state: ReturnType<typeof loadState>) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

let memory = loadState()

export function refreshDemoStoreFromSession() {
  memory = loadState()
}

export function getDemoStageOverride(dossierId: string): DemoAgenceStage | undefined {
  return memory.stageOverrides[dossierId]
}

export function getDemoDossiers(): DemoDossierEntry[] {
  return memory.dossiers
}

export function getDemoDossier(id: string): DemoDossierEntry | undefined {
  return memory.dossiers.find(d => d.dossier_id === id || d.reference === id)
}

function nextDemoRef(): string {
  const year = new Date().getFullYear()
  const n = memory.dossiers.filter(d => d.is_demo_only).length + 1
  return `DOS-${year}-D${String(n).padStart(3, '0')}`
}

export function addDemoDossier(input: {
  client_prenom: string
  client_nom: string
  activite: string
  montant: number
  objet: string
  agence: string
  agent?: string
}): DemoDossierEntry {
  const ref = nextDemoRef()
  const entry: DemoDossierEntry = {
    dossier_id: ref,
    reference: ref,
    stage: 'SOUMIS',
    client_prenom: input.client_prenom,
    client_nom: input.client_nom,
    activite: input.activite,
    montant: input.montant,
    objet: input.objet,
    agence: input.agence,
    agent: input.agent ?? 'Agent terrain',
    elements: [{
      id: `el-${Date.now()}`,
      type: 'DEMANDE',
      label: 'Demande agent terrain',
      date: todayFr(),
      meta: input.objet.slice(0, 80),
    }],
    is_demo_only: true,
  }
  memory.dossiers.push(entry)
  memory.stageOverrides[ref] = 'SOUMIS'
  saveState(memory)
  return entry
}

export function setDemoStage(dossierId: string, stage: DemoAgenceStage) {
  memory.stageOverrides[dossierId] = stage
  const d = memory.dossiers.find(x => x.dossier_id === dossierId || x.reference === dossierId)
  if (d) d.stage = stage
  saveState(memory)
}

export function addDemoElement(
  dossierId: string,
  type: DemoElementType,
  label: string,
  meta?: string,
): DemoDossierElement | null {
  const d = memory.dossiers.find(x => x.dossier_id === dossierId || x.reference === dossierId)
  if (!d) {
    const entry: DemoDossierEntry = {
      dossier_id: dossierId,
      reference: dossierId,
      stage: memory.stageOverrides[dossierId] ?? 'SOUMIS',
      client_prenom: '',
      client_nom: '',
      activite: '',
      montant: 0,
      objet: '',
      agence: '',
      agent: '',
      elements: [],
      is_demo_only: false,
    }
    memory.dossiers.push(entry)
    return addDemoElement(dossierId, type, label, meta)
  }
  const el: DemoDossierElement = {
    id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    label,
    date: todayFr(),
    meta,
  }
  d.elements.push(el)
  if (type === 'ANALYSE') {
    d.score = meta ? parseInt(meta, 10) || 68 : 68
  }
  if (type === 'AVIS_CC') {
    d.avis_cc = meta ?? label
  }
  saveState(memory)
  return el
}

export function getElementsForStage(
  dossierId: string,
  stage: DemoAgenceStage,
): DemoDossierElement[] {
  const d = getDemoDossier(dossierId)
  if (!d) return []
  const types = new Set(DEMO_STAGE_ELEMENT_OPTIONS[stage].map(o => o.type))
  return d.elements.filter(e => types.has(e.type))
}

/** Règles minimales pour avancer à l'étape suivante (démo processus) */
export function canAdvanceToStage(
  dossierId: string,
  from: DemoAgenceStage,
  to: DemoAgenceStage,
): { ok: boolean; reason?: string } {
  const idxFrom = DEMO_AGENCE_STAGES.indexOf(from)
  const idxTo = DEMO_AGENCE_STAGES.indexOf(to)
  if (idxFrom === -1 || idxTo === -1) return { ok: true }
  if (idxTo < idxFrom) return { ok: true }
  if (idxTo > idxFrom + 1) {
    return { ok: false, reason: 'Avancez une étape à la fois pour respecter le processus.' }
  }
  if (idxTo === idxFrom) return { ok: true }

  const d = getDemoDossier(dossierId)
  const els = d?.elements ?? []

  if (!d) {
    if (idxTo < idxFrom) return { ok: true }
    return {
      ok: false,
      reason: `Ajoutez un élément à l'étape « ${DEMO_STAGE_LABELS[from]} » avant de faire avancer le dossier.`,
    }
  }

  if (from === 'SOUMIS' && to === 'DOSSIER_COMPLET') {
    if (!els.some(e => e.type === 'DEMANDE')) {
      return { ok: false, reason: 'Ajoutez la demande agent avant de passer en Docs OK.' }
    }
    return { ok: true }
  }
  if (from === 'DOSSIER_COMPLET' && to === 'EN_ANALYSE') {
    const pieces = els.filter(e => e.type === 'PIECE').length
    if (pieces < 1) {
      return { ok: false, reason: 'Ajoutez au moins une pièce justificative (Docs OK).' }
    }
    return { ok: true }
  }
  if (from === 'EN_ANALYSE' && to === 'VALIDE_CHARGE') {
    if (!els.some(e => e.type === 'ANALYSE')) {
      return { ok: false, reason: 'L\'analyse CC doit être enregistrée avant validation.' }
    }
    return { ok: true }
  }
  return { ok: true }
}

export function demoEntryToCard(entry: DemoDossierEntry, stage: DemoAgenceStage): DemoPipelineCard {
  const preAnalyse = stage === 'SOUMIS' || stage === 'DOSSIER_COMPLET'
  const enAnalyse = stage === 'EN_ANALYSE'
  const valide = stage === 'VALIDE_CHARGE'
  const stageEls = getElementsForStage(entry.dossier_id, stage)

  return {
    id: `card-${entry.dossier_id}`,
    reference: entry.reference,
    dossier_id: entry.dossier_id,
    client: `${entry.client_prenom} ${entry.client_nom}`.trim(),
    activite: entry.activite,
    objet: entry.objet,
    agence: entry.agence,
    agent: entry.agent,
    montant: entry.montant,
    score: preAnalyse ? 0 : (entry.score ?? 68),
    etoiles: preAnalyse ? 2 : (entry.score ?? 68) >= 75 ? 3 : 2,
    resume: preAnalyse
      ? stage === 'SOUMIS'
        ? `Demande soumise · ${entry.objet.slice(0, 72)}`
        : `${stageEls.length} élément(s) doc. · en attente analyse CC`
      : enAnalyse
        ? `Analyse CC · ${stageEls.length} élément(s) saisi(s)`
        : entry.avis_cc ?? enrichResumeValide(entry),
    sentiment: preAnalyse ? 'NEUTRE' : (entry.score ?? 68) >= 75 ? 'POSITIF' : 'NEUTRE',
    avis_cc: valide ? (entry.avis_cc ?? 'Avis CC enregistré') : undefined,
    priorite: 'NORMALE',
    tags: stageEls.length > 0 ? [`${stageEls.length} élément(s)`] : undefined,
  }
}

function enrichResumeValide(entry: DemoDossierEntry): string {
  return `Validé CC · ${entry.client_prenom} ${entry.client_nom}`
}

export function getNextStage(stage: DemoAgenceStage): DemoAgenceStage | null {
  const i = DEMO_AGENCE_STAGES.indexOf(stage)
  return i >= 0 && i < DEMO_AGENCE_STAGES.length - 1
    ? DEMO_AGENCE_STAGES[i + 1]
    : null
}

export function stageAddHint(stage: DemoAgenceStage): string {
  const opts = DEMO_STAGE_ELEMENT_OPTIONS[stage]
  return opts.map(o => o.label).join(' · ')
}

export function ensureDemoTracking(
  dossierId: string,
  info: {
    reference: string
    client: string
    activite: string
    montant: number
    objet: string
    agence: string
    agent: string
  },
  stage: DemoAgenceStage,
) {
  let d = getDemoDossier(dossierId)
  if (!d) {
    const parts = info.client.split(' ')
    const prenom = parts[0] ?? ''
    const nom = parts.slice(1).join(' ') || info.client
    d = {
      dossier_id: dossierId,
      reference: info.reference,
      stage,
      client_prenom: prenom,
      client_nom: nom,
      activite: info.activite,
      montant: info.montant,
      objet: info.objet,
      agence: info.agence,
      agent: info.agent,
      elements: [],
      is_demo_only: false,
    }
    memory.dossiers.push(d)
  }
  setDemoStage(dossierId, stage)
  if (d) d.stage = stage
}
