/**
 * Données synthèse agent — historique 6 mois, points forts / attention.
 */
import type { AgentDetailDG } from '@/lib/dg-vue360'
import type { AgentPerformance } from '@/lib/equipe-hub'

const MOIS_6 = ['Déc', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai'] as const

/** Courbe progressive sur 6 mois vers les valeurs du mois en cours */
export function buildHistorique6MoisAgent(
  collecteMai: number,
  recouvrementMai: number,
  visitesMai: number,
): AgentDetailDG['historique_6m'] {
  return MOIS_6.map((mois, i) => {
    const t = i / (MOIS_6.length - 1)
    const collecteFactor = 0.86 + t * 0.14
    const recoDelta = Math.min(recouvrementMai * 0.06, 6)
    const visitesFactor = 0.82 + t * 0.18
    return {
      mois,
      collecte: Math.round(collecteMai * collecteFactor),
      visites: Math.round(visitesMai * visitesFactor),
      recouvrement: Math.round((recouvrementMai - recoDelta * (1 - t)) * 10) / 10,
    }
  })
}

export function buildPointsFortsAgent(eq: AgentPerformance): string[] {
  const points: string[] = []

  if (eq.role === 'GP') {
    points.push(`${eq.clients_portefeuille} clients agence — suivi crédit unifié avec commerciaux`)
    if (eq.recouvrement_pct >= eq.objectif_recouvrement_pct - 2) {
      points.push(`Recouvrement ${eq.recouvrement_pct}% — proche objectif ${eq.objectif_recouvrement_pct}%`)
    } else if (eq.recouvrement_pct >= 80) {
      points.push(`Recouvrement ${eq.recouvrement_pct}% — niveau satisfaisant`)
    }
    if (eq.par_30_pct <= 8) {
      points.push(`PAR zone ${eq.par_30_pct}% — sous contrôle BCEAO`)
    }
    if (eq.gps_conformite_pct >= 95) {
      points.push(`Conformité GPS ${eq.gps_conformite_pct}% sur relances`)
    }
    const retention = eq.ia_resume.match(/rétention (\d+) %/i)
    if (retention) {
      points.push(`Taux rétention ${retention[1]} % — fidélisation efficace`)
    }
    if (eq.badge) {
      points.push(`Badge ${eq.badge} — performance reconnue réseau`)
    }
  } else if (eq.role === 'Commercial') {
    points.push(`${eq.clients_portefeuille} clients — couverture zone terrain`)
    if (eq.statut === 'BON') {
      points.push(`Statut ${eq.statut} — objectifs en bonne voie`)
    }
    if (eq.recouvrement_pct >= eq.objectif_recouvrement_pct - 3) {
      points.push(`Recouvrement ${eq.recouvrement_pct}% — proche objectif`)
    }
    if (eq.nouveaux_clients_mois >= 8) {
      points.push(`${eq.nouveaux_clients_mois} nouveaux clients ce mois — bonne prospection`)
    } else if (eq.nouveaux_clients_mois > 0) {
      points.push(`${eq.nouveaux_clients_mois} nouveaux clients acquis ce mois`)
    }
    if (eq.gps_conformite_pct >= 90) {
      points.push(`GPS conforme ${eq.gps_conformite_pct}% — visites traçables`)
    }
    if (eq.badge) {
      points.push(`Badge ${eq.badge} — top performer agence`)
    }
  } else {
    if (eq.recouvrement_pct >= 85) {
      points.push(`Recouvrement ${eq.recouvrement_pct}%`)
    }
    if (eq.visites_mois >= eq.visites_objectif * 0.9) {
      points.push(`Visites ${eq.visites_mois}/${eq.visites_objectif} — objectif quasi atteint`)
    }
  }

  if (points.length === 0) {
    points.push(`Score IA ${eq.score}/100 — suivi régulier recommandé`)
  }

  return points.slice(0, 4)
}

export function buildPointsAttentionAgent(eq: AgentPerformance): string[] {
  const points: string[] = []

  if (eq.clients_a_risque > 0) {
    points.push(`${eq.clients_a_risque} client(s) à risque — suivi prioritaire`)
  }
  if (eq.role === 'GP' && eq.visites_mois < eq.visites_objectif * 0.7) {
    points.push(`Relances ${Math.round((eq.visites_mois / eq.visites_objectif) * 100)}% (${eq.visites_mois}/${eq.visites_objectif}) — objectif non atteint`)
  }
  if (eq.role === 'Commercial' && eq.visites_mois < eq.visites_objectif * 0.6) {
    points.push(`Couverture terrain ${Math.round((eq.visites_mois / eq.visites_objectif) * 100)}% — coaching RA recommandé`)
  }
  if (eq.recouvrement_pct < eq.objectif_recouvrement_pct - 10) {
    points.push(`Recouvrement ${eq.recouvrement_pct}% vs objectif ${eq.objectif_recouvrement_pct}%`)
  }
  if (eq.par_30_pct > 10) {
    points.push(`PAR zone ${eq.par_30_pct}% — au-dessus du seuil interne 10%`)
  }
  if (eq.statut === 'DEGRADE') {
    points.push('Statut DÉGRADÉ — plan d\'action avec le RA')
  }

  return points.slice(0, 4)
}
