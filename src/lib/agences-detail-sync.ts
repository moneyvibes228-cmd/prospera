/**
 * Aligne AGENCES_DATA avec AGENCES et commercial-dc-hub (KPIs, alertes, historique PAR).
 */
import { PERFORMANCE_AGENCES_COMMERCIAL, COMMERCIAL_DC_TOTAUX } from '@/lib/commercial-dc-hub'
import type { Agence, AgenceDetaillee } from '@/lib/agences'

function tauxRetention(emprunteurs: number, perdus: number): number {
  if (emprunteurs <= 0) return 100
  return Math.round(((emprunteurs - perdus) / emprunteurs) * 1000) / 10
}

function patchAlertes(
  alertes: AgenceDetaillee['alertes'],
  agence: Agence,
  clientsPerdus: number,
): AgenceDetaillee['alertes'] {
  const retention = tauxRetention(agence.emprunteurs_actifs, clientsPerdus)
  return alertes.map(a => {
    if (a.type === 'Attrition clients') {
      return {
        ...a,
        detail: `${clientsPerdus} départ${clientsPerdus > 1 ? 's' : ''} enregistré${clientsPerdus > 1 ? 's' : ''} ce mois — taux de rétention ${retention} %. Analyser les raisons de départ.`,
      }
    }
    return a
  })
}

export function syncAgenceDetail(raw: AgenceDetaillee, agence: Agence): AgenceDetaillee {
  const perf = PERFORMANCE_AGENCES_COMMERCIAL.find(p => p.agence_id === agence.id)
  const nouveaux = perf?.nouveaux_mois ?? agence.nouveaux_clients_mois
  const leads = perf?.leads_mois ?? raw.kpis.leads_entrants
  const conv = perf?.conv_leads_pct ?? raw.kpis.taux_conversion_leads
  const clientsPerdus = raw.kpis.clients_perdus

  return {
    ...raw,
    kpis: {
      ...raw.kpis,
      par_30j: agence.par_courant,
      taux_remboursement: agence.taux_remboursement,
      encours: agence.encours_fcfa,
      collecte_mois: agence.collecte_mois,
      collecte_objectif: agence.collecte_objectif,
      nouveaux_clients: nouveaux,
      leads_entrants: leads,
      taux_conversion_leads: conv,
    },
    alertes: patchAlertes(raw.alertes, agence, clientsPerdus),
    par_historique: raw.par_historique.map((h, i, arr) =>
      i === arr.length - 1
        ? { ...h, par_30j: agence.par_courant, remboursement: agence.taux_remboursement }
        : h,
    ),
  }
}

export function buildSyncedAgencesData(
  agences: Agence[],
  raw: Record<string, AgenceDetaillee>,
): Record<string, AgenceDetaillee> {
  return Object.fromEntries(
    agences.map(a => [a.id, syncAgenceDetail(raw[a.id]!, a)]),
  )
}

/** Classement réseau — dérivé des fiches agence synchronisées */
export function buildReseauAgentsPerformance(
  data: Record<string, AgenceDetaillee>,
): AgenceDetaillee['agents_performance'] {
  return Object.values(data)
    .flatMap(d => d.agents_performance.map(a => ({ ...a, agence: d.id })))
    .sort((a, b) => b.score - a.score)
    .map((a, i) => ({ ...a, rang: i + 1 }))
}

export function reseauLeadsEtConversion() {
  return {
    leads_mois: COMMERCIAL_DC_TOTAUX.leads,
    taux_conversion_reseau: COMMERCIAL_DC_TOTAUX.taux_conversion_pct,
    nouveaux_clients: COMMERCIAL_DC_TOTAUX.nouveaux_clients,
  }
}

export function reseauClientsPerdus(data: Record<string, AgenceDetaillee>): number {
  return Object.values(data).reduce((s, d) => s + d.kpis.clients_perdus, 0)
}
