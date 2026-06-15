// Pipeline crédit ROC — colonnes type Odoo CRM

export type PipelineStageId =
  | 'SOUMIS'
  | 'DOSSIER_COMPLET'
  | 'EN_ANALYSE'
  | 'EN_ANALYSE_ROC'
  | 'APPROUVE'
  | 'DECAISSEMENT'
  | 'EN_GESTION'
  | 'REFUSE'

export interface PipelineCard {
  id: string
  reference: string
  client: string
  activite: string
  agence: string
  agent: string
  montant: number
  score?: number
  classe_bceao?: string
  priorite?: 'URGENT' | 'HAUTE' | 'NORMALE'
  attente_h?: number
  tags?: string[]
  dossier_analyse_id?: string // lien vers DOSSIERS_ANALYSE_CC si existe
}

export interface PipelineStage {
  id: PipelineStageId
  label: string
  couleur: string // tailwind header bg
  bordure: string
  cards: PipelineCard[]
}

export const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: 'SOUMIS',
    label: 'Nouvelle demande',
    couleur: 'bg-slate-100',
    bordure: 'border-slate-300',
    cards: [
      { id: 'c1', reference: 'DOS-2026-0255', client: 'Afi Lawson', activite: 'Tontine épargne', agence: 'Tsévié', agent: 'Komi Atsu', montant: 180_000, priorite: 'NORMALE' },
      { id: 'c2', reference: 'DOS-2026-0256', client: 'Kwami Ekpé', activite: 'Commerce détail', agence: 'Adidogomé', agent: 'Akua Lawson', montant: 350_000, priorite: 'NORMALE' },
      { id: 'c3', reference: 'DOS-2026-0257', client: 'Enyonam Kpade', activite: 'Coiffure', agence: 'Adidogomé', agent: 'Akua Lawson', montant: 220_000, priorite: 'NORMALE' },
    ],
  },
  {
    id: 'DOSSIER_COMPLET',
    label: 'Documents OK',
    couleur: 'bg-blue-50',
    bordure: 'border-blue-300',
    cards: [
      { id: 'c4', reference: 'DOS-2026-0250', client: 'Sika Adjovi', activite: 'Trading import', agence: 'Lomé Centre', agent: 'Edem Kpélim', montant: 1_200_000, score: 78, priorite: 'HAUTE', tags: ['PME'] },
      { id: 'c5', reference: 'DOS-2026-0248', client: 'Mensah Folly', activite: 'Salon beauté', agence: 'Lomé Centre', agent: 'Kofi Amavi', montant: 450_000, score: 82, priorite: 'NORMALE' },
      { id: 'c6', reference: 'DOS-2026-0246', client: 'Coop. Tabligbo', activite: 'Agriculture', agence: 'Tabligbo', agent: 'Ama Fiagbé', montant: 3_200_000, score: 68, priorite: 'HAUTE', tags: ['Groupe'] },
    ],
  },
  {
    id: 'EN_ANALYSE',
    label: 'Analyse CC',
    couleur: 'bg-indigo-50',
    bordure: 'border-indigo-300',
    cards: [
      { id: 'c7', reference: 'DOS-2026-0241', client: 'Akossiwa Mensah', activite: 'Commerce fruits', agence: 'Lomé Centre', agent: 'Akua Lawson', montant: 500_000, score: 72, classe_bceao: 'SOUS_SURVEILLANCE', priorite: 'NORMALE', dossier_analyse_id: 'DOS-2026-0241' },
      { id: 'c8', reference: 'DOS-2026-0243', client: 'GIE Marché Central', activite: 'Groupe solidaire', agence: 'Lomé Centre', agent: 'Edem Kpélim', montant: 2_400_000, score: 74, priorite: 'HAUTE', tags: ['Groupe'] },
      { id: 'c9', reference: 'DOS-2026-0245', client: 'Mawuena Hotor', activite: 'Boulangerie', agence: 'Tabligbo', agent: 'Ama Fiagbé', montant: 290_000, score: 58, classe_bceao: 'SOUS_SURVEILLANCE', priorite: 'NORMALE' },
    ],
  },
  {
    id: 'EN_ANALYSE_ROC',
    label: 'Validation ROC',
    couleur: 'bg-orange-50',
    bordure: 'border-orange-400',
    cards: [
      { id: 'c10', reference: 'DOS-2026-0228', client: 'Folly Mensah', activite: 'Maraîchage tomates', agence: 'Tabligbo', agent: 'Ama Fiagbé', montant: 400_000, score: 76, classe_bceao: 'PERFORMANT', priorite: 'URGENT', attente_h: 48, dossier_analyse_id: 'DOS-2026-0228', tags: ['SLA dépassé'] },
      { id: 'c11', reference: 'DOS-2026-0244', client: 'Komi Atsu', activite: 'Atelier menuiserie', agence: 'Kpalimé', agent: 'Elom Adjavon', montant: 850_000, score: 71, classe_bceao: 'SOUS_SURVEILLANCE', priorite: 'URGENT', attente_h: 56, dossier_analyse_id: 'DOS-2026-0244', tags: ['SLA dépassé'] },
      { id: 'c12', reference: 'DOS-2026-0249', client: 'Adjoa Klutse', activite: 'Vente tissus', agence: 'Lomé Centre', agent: 'Elom Adjavon', montant: 1_500_000, score: 68, classe_bceao: 'SOUS_SURVEILLANCE', priorite: 'HAUTE', attente_h: 18, tags: ['Alerte garantie'] },
      { id: 'c13', reference: 'DOS-2026-0252', client: 'Yao Tetevi', activite: 'Transport moto', agence: 'Bè Kpota', agent: 'Edem Kpélim', montant: 600_000, score: 52, classe_bceao: 'DOUTEUX', priorite: 'HAUTE', attente_h: 14, tags: ['Avis CC défavorable'] },
    ],
  },
  {
    id: 'APPROUVE',
    label: 'Approuvé',
    couleur: 'bg-teal-50',
    bordure: 'border-teal-300',
    cards: [
      { id: 'c14', reference: 'DOS-2026-0240', client: 'Kossi Dzigbodi', activite: 'Réparation électro', agence: 'Lomé Centre', agent: 'Edem Kpélim', montant: 680_000, score: 81, classe_bceao: 'PERFORMANT', priorite: 'NORMALE' },
      { id: 'c15', reference: 'DOS-2026-0238', client: 'Komlan Attivor', activite: 'Taxi-moto', agence: 'Lomé Centre', agent: 'Kofi Amavi', montant: 450_000, score: 74, priorite: 'NORMALE' },
    ],
  },
  {
    id: 'DECAISSEMENT',
    label: 'Décaissement',
    couleur: 'bg-green-50',
    bordure: 'border-green-300',
    cards: [
      { id: 'c16', reference: 'DOS-2026-0235', client: 'Akouvi Senou', activite: 'Poisson fumé', agence: 'Tabligbo', agent: 'Ama Fiagbé', montant: 410_000, score: 79, priorite: 'NORMALE', tags: ['MoMo prêt'] },
      { id: 'c17', reference: 'DOS-2026-0232', client: 'Groupe Victoire', activite: 'Groupe femmes', agence: 'Hédzranawoé', agent: 'Komi Atsu', montant: 1_100_000, priorite: 'NORMALE' },
      { id: 'c18', reference: 'DOS-2026-0229', client: 'Edem Bessan', activite: 'Élevage porcin', agence: 'Tsévié', agent: 'Komi Atsu', montant: 480_000, priorite: 'NORMALE' },
    ],
  },
  {
    id: 'EN_GESTION',
    label: 'En gestion',
    couleur: 'bg-purple-50',
    bordure: 'border-purple-200',
    cards: [
      { id: 'c19', reference: 'DOS-2025-1180', client: 'Togbui Apedo', activite: 'Commerce gros', agence: 'Bè Kpota', agent: 'Edem Kpélim', montant: 1_200_000, priorite: 'NORMALE', tags: ['Retard J+42'] },
      { id: 'c20', reference: 'DOS-2025-1092', client: 'Yawa Dossou', activite: 'Cosmétiques', agence: 'Bè Kpota', agent: 'Edem Kpélim', montant: 620_000, priorite: 'NORMALE' },
    ],
  },
  {
    id: 'REFUSE',
    label: 'Refusé (7j)',
    couleur: 'bg-red-50',
    bordure: 'border-red-200',
    cards: [
      { id: 'c21', reference: 'DOS-2026-0210', client: 'Anonyme #442', activite: 'Non vérifiable', agence: 'Lomé Centre', agent: 'Akua Lawson', montant: 800_000, priorite: 'NORMALE', tags: ['Revenus insuffisants'] },
      { id: 'c22', reference: 'DOS-2026-0208', client: 'M. Koffi', activite: 'Activité floue', agence: 'Bè Kpota', agent: 'Edem Kpélim', montant: 1_500_000, priorite: 'NORMALE', tags: ['Fraude suspecte'] },
    ],
  },
]

export function getPipelineTotals() {
  const totalCards = PIPELINE_STAGES.reduce((s, st) => s + st.cards.length, 0)
  const totalMontant = PIPELINE_STAGES.reduce(
    (s, st) => s + st.cards.reduce((a, c) => a + c.montant, 0),
    0,
  )
  const enAttenteRoc = PIPELINE_STAGES.find(st => st.id === 'EN_ANALYSE_ROC')?.cards.length ?? 0
  return { totalCards, totalMontant, enAttenteRoc }
}

export function getCardByReference(ref: string): PipelineCard | undefined {
  for (const stage of PIPELINE_STAGES) {
    const card = stage.cards.find(c => c.reference === ref)
    if (card) return card
  }
  return undefined
}
