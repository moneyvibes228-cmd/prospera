// Hub Chargé de Crédit — analyse dossiers (pas de portefeuille clients)

import type { RapportIA } from '@/lib/mockMicrofinance'
import { DOSSIERS_ANALYSE_CC, MOCK_CC_HOME } from '@/lib/mockMicrofinance'
import { buildRapportIACc } from '@/lib/mock-persona-builders'

export { AGENCE_PIPELINE_STAGE_IDS, AGENCE_PIPELINE_LABELS, CC_PIPELINE_STAGE_IDS, CC_PIPELINE_LABELS } from '@/lib/credit-pipeline-roc'

export const CC_AGENT = {
  id: 'cc-ea',
  nom: 'Elom Adjavon',
  agence: 'Siège — Lomé',
}

export const RAPPORT_IA_CC: RapportIA = buildRapportIACc(DOSSIERS_ANALYSE_CC)

export interface EvenementCalendrierCC {
  id: string
  /** Date ISO (YYYY-MM-DD) */
  date: string
  /** HH:mm */
  heure: string
  /** Durée en minutes (affichage grille) */
  duree_min: number
  titre: string
  sous_titre: string
  type: 'RDV' | 'ECHEANCE' | 'DOSSIER' | 'RELANCE' | 'COMITE' | 'BUREAU'
  priorite: 'CRITIQUE' | 'HAUTE' | 'NORMALE'
  statut?: 'PLANIFIE' | 'EN_COURS' | 'TERMINE'
  dossier_ref?: string
  lieu?: string
}

/** Référence « aujourd'hui » démo — alignée mocks CC */
export const CC_CALENDRIER_REFERENCE = '2026-05-27'

function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function buildCalendrierComplet(d: typeof MOCK_CC_HOME): EvenementCalendrierCC[] {
  const ref = CC_CALENDRIER_REFERENCE
  const lun = addDaysIso(ref, -2)

  const aujourdhui: EvenementCalendrierCC[] = [
    ...d.ma_file_aujourdhui
      .filter(f => f.priorite === 'CRITIQUE')
      .map((f, i) => ({
        id: `file-crit-${i}`,
        date: ref,
        heure: '08:00',
        duree_min: 90,
        titre: `Analyse dossier — ${f.client}`,
        sous_titre: `${f.reference} · ${f.prochaine_action}`,
        type: 'ECHEANCE' as const,
        priorite: 'CRITIQUE' as const,
        dossier_ref: f.reference,
        lieu: 'Bureau analyse',
        statut: 'PLANIFIE' as const,
      })),
    ...d.taches_jour.rdv_programmes.map((r, i) => ({
      id: `rdv-${i}`,
      date: ref,
      heure: r.heure,
      duree_min: r.heure === '13:00' ? 60 : r.heure === '15:00' ? 90 : 45,
      titre: r.client,
      sous_titre: r.type,
      type: 'RDV' as const,
      priorite: r.type.toLowerCase().includes('urgent') ? 'CRITIQUE' as const : 'NORMALE' as const,
      lieu: r.lieu,
      statut: 'PLANIFIE' as const,
    })),
    ...d.taches_jour.dossiers_a_completer.map((doc, i) => ({
      id: `doc-${i}`,
      date: ref,
      heure: i === 0 ? '09:30' : '11:00',
      duree_min: 45,
      titre: `Compléter pièces — ${doc.client}`,
      sous_titre: doc.pieces_manquantes.join(' · '),
      type: 'DOSSIER' as const,
      priorite: doc.delai_j <= 2 ? 'HAUTE' as const : 'NORMALE' as const,
      dossier_ref: doc.reference,
      lieu: 'Siège',
      statut: 'PLANIFIE' as const,
    })),
    ...d.taches_jour.dossiers_a_relancer.map((doc, i) => ({
      id: `rel-${i}`,
      date: ref,
      heure: i === 0 ? '10:30' : '16:00',
      duree_min: 30,
      titre: `Relance — ${doc.client}`,
      sous_titre: `${doc.etape} · J+${doc.relance_depuis_j}`,
      type: 'RELANCE' as const,
      priorite: doc.relance_depuis_j >= 5 ? 'HAUTE' as const : 'NORMALE' as const,
      dossier_ref: doc.reference,
      statut: 'PLANIFIE' as const,
    })),
    ...d.ma_file_aujourdhui
      .filter(f => f.priorite === 'HAUTE')
      .map((f, i) => ({
        id: `file-haute-${i}`,
        date: ref,
        heure: '14:30',
        duree_min: 60,
        titre: `Instruction — ${f.client}`,
        sous_titre: `${f.reference} · ${f.montant.toLocaleString('fr-FR')} FCFA`,
        type: 'ECHEANCE' as const,
        priorite: 'HAUTE' as const,
        dossier_ref: f.reference,
        statut: 'PLANIFIE' as const,
      })),
    {
      id: 'bureau-fin',
      date: ref,
      heure: '17:00',
      duree_min: 60,
      titre: 'Clôture file & transmission ROC',
      sous_titre: 'Synthèse décisions · dossiers validés',
      type: 'BUREAU',
      priorite: 'NORMALE',
      lieu: 'Siège',
      statut: 'PLANIFIE',
    },
  ]

  const semaine: EvenementCalendrierCC[] = [
    {
      id: 'lun-comite',
      date: lun,
      heure: '09:00',
      duree_min: 120,
      titre: 'Comité crédit interne',
      sous_titre: 'Préparation dossiers > 500k FCFA',
      type: 'COMITE',
      priorite: 'HAUTE',
      lieu: 'Salle réunion siège',
      statut: 'TERMINE',
    },
    {
      id: 'mar-roc',
      date: addDaysIso(ref, -1),
      heure: '10:00',
      duree_min: 45,
      titre: 'Point ROC — file validation',
      sous_titre: '3 dossiers en attente avis',
      type: 'BUREAU',
      priorite: 'NORMALE',
      lieu: 'Visio',
      statut: 'TERMINE',
    },
    {
      id: 'jeu-visite',
      date: addDaysIso(ref, 1),
      heure: '09:00',
      duree_min: 180,
      titre: 'Tournée visites domicile',
      sous_titre: 'DOS-0241 · DOS-0238 — zone Adidogomé',
      type: 'RDV',
      priorite: 'HAUTE',
      lieu: 'Adidogomé',
      statut: 'PLANIFIE',
    },
    {
      id: 'ven-comite',
      date: addDaysIso(ref, 2),
      heure: '14:00',
      duree_min: 90,
      titre: 'Comité crédit agence Lomé',
      sous_titre: 'Présentation DOS-0250',
      type: 'COMITE',
      priorite: 'HAUTE',
      lieu: 'Agence Lomé Centre',
      statut: 'PLANIFIE',
    },
  ]

  return [...semaine, ...aujourdhui].sort((a, b) => {
    const da = `${a.date}T${a.heure}`
    const db = `${b.date}T${b.heure}`
    return da.localeCompare(db)
  })
}

export function getCcHubData() {
  const d = MOCK_CC_HOME
  const calendrier = buildCalendrierComplet(d)

  return {
    agent: CC_AGENT,
    rapport: RAPPORT_IA_CC,
    ...d,
    objectifs_jour: {
      decisions_cible: 3,
      decisions_faites: d.mes_kpis.decisions_jour,
      delai_objectif_h: d.mes_kpis.delai_objectif_h,
      delai_actuel_h: d.mes_kpis.delai_moyen_perso_h,
      dossiers_prioritaires: d.mes_kpis.en_attente_prioritaires,
      alertes_cbi_critiques: d.mes_alertes_cbi.filter(a => a.severite === 'CRITICAL').length,
      transmissions_roc_prevues: d.ma_file_aujourdhui.filter(f => f.etape === 'VALIDE_CHARGE').length,
    },
    calendrier,
  }
}
