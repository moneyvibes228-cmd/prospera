/**
 * Relances & Recouvrement DG — pipeline, automation, analyses IA.
 */
import type { Relance, RelanceStatut } from '@distributeur/types'
import {
  REGISTRE_RELANCES,
  REGLES_AUTOMATION_RELANCES,
  PIPELINE_ETAPES,
} from './registries/relances-registry'

export type VuePipelineDG = 'impayes' | 'reappro' | 'prospection' | 'tous'

export interface RelanceDG extends Relance {
  reste_creance: number
}

export interface ColonnePipeline {
  etape: RelanceStatut
  label: string
  couleur: string
  relances: RelanceDG[]
  montant_total: number
}

export interface SyntheseRelancesDG {
  total_relances: number
  en_cours: number
  resolues: number
  contentieux: number
  montant_en_jeu: number
  montant_recouvre_mois: number
  taux_reponse_pct: number
  taux_conversion_pct: number
  relances_auto_jour: number
  visites_planifiees: number
}

export interface AnalyseRelanceIA {
  severite: 'CRITIQUE' | 'HAUTE' | 'MODEREE'
  titre: string
  detail: string
  action: string
}

export const TYPE_RELANCES_LABEL = {
  IMPAYE: 'Impayé',
  REAPPRO: 'Réapprovisionnement',
  PROSPECTION: 'Prospection',
} as const

export const PRIORITE_STYLE: Record<string, { label: string; className: string }> = {
  CRITIQUE: { label: 'Critique', className: 'bg-red-100 text-red-700' },
  HAUTE: { label: 'Haute', className: 'bg-orange-100 text-orange-700' },
  NORMALE: { label: 'Normale', className: 'bg-slate-100 text-slate-600' },
  BASSE: { label: 'Basse', className: 'bg-sky-100 text-sky-700' },
}

export const CANAL_LABEL: Record<string, string> = {
  WHATSAPP: 'WhatsApp',
  SMS: 'SMS',
  VISITE: 'Visite',
  APPEL: 'Appel',
  EMAIL: 'Email',
}

export function buildRelancesDG(relances: Relance[] = REGISTRE_RELANCES): RelanceDG[] {
  return relances.map(r => ({
    ...r,
    reste_creance: r.montant ?? 0,
  }))
}

export function filterRelancesType(relances: RelanceDG[], vue: VuePipelineDG): RelanceDG[] {
  if (vue === 'tous') return relances
  if (vue === 'impayes') return relances.filter(r => r.type === 'IMPAYE')
  if (vue === 'reappro') return relances.filter(r => r.type === 'REAPPRO')
  return relances.filter(r => r.type === 'PROSPECTION')
}

export function buildPipelineColonnes(relances: RelanceDG[]): ColonnePipeline[] {
  const etapes = PIPELINE_ETAPES
  return etapes.map(e => {
    const items = relances.filter(r => r.statut === e.id)
    return {
      etape: e.id,
      label: e.label,
      couleur: e.couleur,
      relances: items,
      montant_total: items.reduce((s, r) => s + (r.montant ?? 0), 0),
    }
  })
}

export function buildSyntheseRelancesDG(relances: RelanceDG[]): SyntheseRelancesDG {
  const impayes = relances.filter(r => r.type === 'IMPAYE')
  const enCours = relances.filter(r => !['PAYEE', 'ECHEC'].includes(r.statut))
  const resolues = relances.filter(r => r.statut === 'PAYEE')
  const repondues = relances.filter(r => ['REPONDUE', 'ACCORD', 'VISITE', 'PAYEE'].includes(r.statut))
  const envoyees = relances.filter(r => ['ENVOYEE', 'REPONDUE', 'VISITE', 'ACCORD', 'PAYEE', 'ECHEC'].includes(r.statut))

  return {
    total_relances: relances.length,
    en_cours: enCours.length,
    resolues: resolues.length,
    contentieux: relances.filter(r => r.statut === 'ECHEC').length,
    montant_en_jeu: impayes.filter(r => r.statut !== 'PAYEE').reduce((s, r) => s + (r.montant ?? 0), 0),
    montant_recouvre_mois: resolues.reduce((s, r) => s + (r.montant ?? 0), 0),
    taux_reponse_pct: envoyees.length > 0 ? Math.round((repondues.length / envoyees.length) * 100) : 0,
    taux_conversion_pct: relances.length > 0 ? Math.round((resolues.length / relances.length) * 100) : 0,
    relances_auto_jour: relances.filter(r => r.automate && ['PLANIFIEE', 'ENVOYEE', 'DETECTION'].includes(r.statut)).length,
    visites_planifiees: relances.filter(r => r.statut === 'VISITE' || (r.statut === 'PLANIFIEE' && r.canal === 'VISITE')).length,
  }
}

export function buildAnalysesRelancesIA(relances: RelanceDG[]): AnalyseRelanceIA[] {
  const analyses: AnalyseRelanceIA[] = []

  const kiosque = relances.find(r => r.pdv_nom === 'Kiosque Port' && r.statut === 'ECHEC')
  if (kiosque) {
    analyses.push({
      severite: 'CRITIQUE',
      titre: 'Kiosque Port — contentieux imminent',
      detail: `${(kiosque.montant! / 1_000_000).toFixed(1)} M impayés · ${kiosque.nb_tentatives} tentatives · 78j retard max · 0% probabilité paiement IA`,
      action: 'Mise en demeure demain · blocage livraison actif · dossier contentieux sous 7j si pas de régularisation.',
    })
  }

  const grossiste = relances.find(r => r.pdv_nom === 'Grossiste Adidogomé' && r.statut === 'VISITE')
  if (grossiste) {
    analyses.push({
      severite: 'HAUTE',
      titre: 'Grossiste Adidogomé — visite solvabilité demain',
      detail: `5,25 M impayés · 0 F encaissé · visite Mawuena 12/06 · ne pas relivrer sans acompte 50%`,
      action: 'Préparer grille tarifaire + contrat crédit avant visite.',
    })
  }

  const mama = relances.find(r => r.pdv_nom === 'Épicerie Mama T.' && r.statut === 'REPONDUE')
  if (mama) {
    analyses.push({
      severite: 'MODEREE',
      titre: 'Mama T. — échéancier 3x à valider',
      detail: 'Client a répondu — propose 3 mensualités de 1,1 M. Valider sous 24h pour convertir en ACCORD.',
      action: 'DG valide échéancier → basculer statut ACCORD → débloquer livraison CMD-4522 avec acompte.',
    })
  }

  const synthese = buildSyntheseRelancesDG(relances)
  analyses.push({
    severite: 'MODEREE',
    titre: `Automation — ${synthese.relances_auto_jour} relances auto aujourd'hui`,
    detail: `Taux réponse ${synthese.taux_reponse_pct}% · conversion ${synthese.taux_conversion_pct}% · ${synthese.visites_planifiees} visites planifiées`,
    action: 'WhatsApp J+3 et SMS J+7 actifs · revoir règle J+14 pour zone Kara (taux visite faible).',
  })

  const reappro = relances.filter(r => r.type === 'REAPPRO' && r.statut === 'REPONDUE')
  if (reappro.length) {
    analyses.push({
      severite: 'MODEREE',
      titre: 'Réappro → commande : 2 conversions cette semaine',
      detail: 'Superette Kara (6,2 M) + Kofi Trade — séquences auto réappro efficaces (88% succès moyen)',
      action: 'Étendre règle stock < 5j à tous les grossistes zone Lomé Nord.',
    })
  }

  return analyses
}

export function getReglesAutomation() {
  return REGLES_AUTOMATION_RELANCES
}

export function getRelancesAgingBuckets(relances: RelanceDG[]) {
  const impayes = relances.filter(r => r.type === 'IMPAYE' && !['PAYEE'].includes(r.statut))
  const bucket = (min: number, max: number) =>
    impayes.filter(r => (r.jours_retard ?? 0) >= min && (r.jours_retard ?? 0) <= max)

  return [
    { label: 'J+0 – 15', count: bucket(0, 15).length, volume: bucket(0, 15).reduce((s, r) => s + (r.montant ?? 0), 0), color: 'bg-amber-500' },
    { label: 'J+16 – 30', count: bucket(16, 30).length, volume: bucket(16, 30).reduce((s, r) => s + (r.montant ?? 0), 0), color: 'bg-orange-500' },
    { label: 'J+31 – 60', count: bucket(31, 60).length, volume: bucket(31, 60).reduce((s, r) => s + (r.montant ?? 0), 0), color: 'bg-red-500' },
    { label: 'J+60+', count: bucket(61, 999).length, volume: bucket(61, 999).reduce((s, r) => s + (r.montant ?? 0), 0), color: 'bg-red-700' },
  ]
}

export function getRelancesParZone(relances: RelanceDG[]) {
  const zones = [...new Set(relances.map(r => r.zone).filter(Boolean))] as string[]
  return zones
    .map(zone => ({
      zone,
      count: relances.filter(r => r.zone === zone).length,
      volume: relances.filter(r => r.zone === zone && r.type === 'IMPAYE').reduce((s, r) => s + (r.montant ?? 0), 0),
      critiques: relances.filter(r => r.zone === zone && r.priorite === 'CRITIQUE').length,
    }))
    .sort((a, b) => b.volume - a.volume)
}

export { PIPELINE_ETAPES }
