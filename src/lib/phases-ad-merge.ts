/**
 * Fusion mock ↔ réponses API Phases A–D (structure hub UI inchangée).
 */
import { getCcHubData } from '@/lib/cc-credit-hub'
import { getGpHubData } from '@/lib/gp-portefeuille-hub'
import { getRaHubData } from '@/lib/ra-agence-hub'
import { getRccHubData } from '@/lib/rcc-commercial-hub'
import { getRecouvrementHubData, type RecouvrementHubData } from '@/lib/roc-recouvrement-hub'
import { getReseauHubData } from '@/lib/roc-reseau-hub'
import { MOCK_ROC_HOME } from '@/lib/mockMicrofinance'
import { entityLabel } from '@/lib/utils'

function isObject(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v)
}

/** Fusion récursive légère : l’API écrase les champs présents */
export function mergeDeep<T>(mock: T, api: unknown): T {
  if (!api || !isObject(api)) return mock
  if (!isObject(mock)) return api as T

  const out = { ...mock } as Record<string, unknown>
  const src = api as Record<string, unknown>

  for (const key of Object.keys(src)) {
    const mv = (mock as Record<string, unknown>)[key]
    const av = src[key]
    if (isObject(mv) && isObject(av)) {
      out[key] = mergeDeep(mv, av)
    } else if (av !== undefined && av !== null) {
      out[key] = av
    }
  }
  return out as T
}

export function mergeCcHub(api: Record<string, unknown> | null) {
  return mergeDeep(getCcHubData(), api)
}

export function mergeGpHub(api: Record<string, unknown> | null) {
  return mergeDeep(getGpHubData(), api)
}

export function mergeRaHub(api: Record<string, unknown> | null) {
  return mergeDeep(getRaHubData(), api)
}

type RccEquipeRow = ReturnType<typeof getRccHubData>['equipe'][number]

function normalizeRccEquipeRow(
  raw: Record<string, unknown>,
  fallback?: RccEquipeRow,
): RccEquipeRow {
  const perf = Number(
    raw.perf_pct ??
      raw.performance_pct ??
      raw.taux_objectif_collecte_semaine_pct ??
      fallback?.perf_pct ??
      0,
  )
  const statutRaw = raw.statut ?? raw.statut_agent
  const statut =
    typeof statutRaw === 'string' && statutRaw.length > 0
      ? statutRaw
      : perf >= 80
        ? 'BON'
        : perf >= 60
          ? 'NORMAL'
          : perf >= 40
            ? 'SOUS_PERF'
            : 'INACTIF'

  return {
    agent: String(raw.agent ?? raw.nom ?? fallback?.agent ?? 'Agent'),
    collecte: Number(
      raw.collecte ?? raw.collecte_semaine_fcfa ?? raw.collecte_jour ?? fallback?.collecte ?? 0,
    ),
    prospection: Number(raw.prospection ?? raw.prospects_semaine ?? fallback?.prospection ?? 0),
    conversion: Number(raw.conversion ?? fallback?.conversion ?? 0),
    retard: Number(raw.retard ?? raw.retards ?? fallback?.retard ?? 0),
    perf_pct: perf,
    statut: statut as RccEquipeRow['statut'],
    badge: (raw.badge ?? fallback?.badge) as RccEquipeRow['badge'],
  }
}

export function mergeRccHub(api: Record<string, unknown> | null) {
  const mock = getRccHubData()
  if (!api) return mock
  const merged = mergeDeep(mock, api)
  if (Array.isArray(api.equipe) && api.equipe.length > 0) {
    merged.equipe = (api.equipe as Record<string, unknown>[]).map((row, i) =>
      normalizeRccEquipeRow(row, mock.equipe[i] ?? mock.equipe[0]),
    )
  }
  return merged
}

type RocHome = typeof MOCK_ROC_HOME

function ensureArray<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) ? (value as T[]) : fallback
}

const ROC_ARRAY_KEYS = [
  'kpis_reseau',
  'file_validation',
  'alertes_priorisees',
  'pipeline_dossiers',
  'top_mauvais_payeurs',
  'performance_agents',
  'heatmap_par_agences',
  'dossiers_bloques',
] as const satisfies readonly (keyof RocHome)[]

export function mergeRocDashboard(api: Record<string, unknown> | null): RocHome {
  const mock = MOCK_ROC_HOME
  if (!api) return mock
  const merged = mergeDeep(mock, api) as RocHome

  for (const key of ROC_ARRAY_KEYS) {
    ;(merged as Record<string, unknown>)[key] = ensureArray(api[key], mock[key] as unknown[])
  }

  if (api.kpis_credit_etendus && isObject(api.kpis_credit_etendus)) {
    merged.kpis_credit_etendus = {
      ...mock.kpis_credit_etendus,
      ...(api.kpis_credit_etendus as typeof mock.kpis_credit_etendus),
    }
  }
  if (api.kpis_operations && isObject(api.kpis_operations)) {
    merged.kpis_operations = {
      ...mock.kpis_operations,
      ...(api.kpis_operations as typeof mock.kpis_operations),
    }
  }

  if (Array.isArray(merged.file_validation)) {
    merged.file_validation = merged.file_validation.map((row, i) => {
      const raw = (api.file_validation as Record<string, unknown>[] | undefined)?.[i]
      const r = (raw && isObject(raw) ? raw : row) as Record<string, unknown>
      const fb = mock.file_validation[i] ?? mock.file_validation[0]
      return {
        ...fb,
        ...row,
        reference: String(r.reference ?? r.reference_dossier ?? row.reference ?? fb.reference),
        client: entityLabel(r.client ?? r.cliente, entityLabel(row.client, fb.client)),
        agence: entityLabel(r.agence, entityLabel(row.agence, fb.agence)),
        activite: String(r.activite ?? row.activite ?? fb.activite),
        suggestion_ia: (r.suggestion_ia ?? row.suggestion_ia ?? fb.suggestion_ia) as typeof fb.suggestion_ia,
      }
    })
  }

  if (Array.isArray(merged.top_mauvais_payeurs)) {
    merged.top_mauvais_payeurs = merged.top_mauvais_payeurs.map((row, i) => {
      const raw = (api.top_mauvais_payeurs as Record<string, unknown>[] | undefined)?.[i]
      const r = raw && isObject(raw) ? raw : (row as unknown as Record<string, unknown>)
      const fb = mock.top_mauvais_payeurs[i] ?? mock.top_mauvais_payeurs[0]
      const nom = entityLabel(r.nom ?? r.client, entityLabel(row.nom, fb.nom))
      return { ...fb, ...row, nom, agence: entityLabel(r.agence, entityLabel(row.agence, fb.agence)) }
    })
  }

  if (Array.isArray(merged.performance_agents)) {
    merged.performance_agents = merged.performance_agents.map((row, i) => {
      const raw = (api.performance_agents as Record<string, unknown>[] | undefined)?.[i]
      const r = raw && isObject(raw) ? raw : (row as unknown as Record<string, unknown>)
      const fb = mock.performance_agents[i] ?? mock.performance_agents[0]
      return {
        ...fb,
        ...row,
        agent: entityLabel(r.agent ?? r.nom, entityLabel(row.agent, fb.agent)),
        zone: entityLabel(r.zone, entityLabel(row.zone, fb.zone)),
      }
    })
  }

  if (Array.isArray(merged.dossiers_bloques)) {
    merged.dossiers_bloques = merged.dossiers_bloques.map((row, i) => {
      const raw = (api.dossiers_bloques as Record<string, unknown>[] | undefined)?.[i]
      const r = raw && isObject(raw) ? raw : (row as unknown as Record<string, unknown>)
      const fb = mock.dossiers_bloques[i] ?? mock.dossiers_bloques[0]
      return {
        ...fb,
        ...row,
        reference: String(r.reference ?? row.reference ?? fb.reference),
        client: entityLabel(r.client ?? r.cliente, entityLabel(row.client, fb.client)),
        agence: entityLabel(r.agence, entityLabel(row.agence, fb.agence)),
      }
    })
  }

  if (Array.isArray(merged.heatmap_par_agences)) {
    merged.heatmap_par_agences = merged.heatmap_par_agences.map((row, i) => {
      const raw = (api.heatmap_par_agences as Record<string, unknown>[] | undefined)?.[i]
      const r = raw && isObject(raw) ? raw : (row as unknown as Record<string, unknown>)
      const fb = mock.heatmap_par_agences[i] ?? mock.heatmap_par_agences[0]
      return {
        ...fb,
        ...row,
        agence_id: String(r.agence_id ?? row.agence_id ?? fb.agence_id),
        agence: entityLabel(r.agence ?? r.nom, entityLabel(row.agence, fb.agence)),
      }
    })
  }

  return merged
}

export function mergeReseauHub(api: Record<string, unknown> | null) {
  const mock = getReseauHubData()
  const merged = mergeDeep(mock, api)
  if (api?.agences && Array.isArray(api.agences)) {
    return { ...merged, agences: api.agences }
  }
  return merged
}

export function mergeRecouvrementHub(api: Record<string, unknown> | null): RecouvrementHubData {
  const mock = getRecouvrementHubData()
  const merged = mergeDeep(mock, api)
  if (typeof api?.synthese_ia === 'string') merged.synthese_ia = api.synthese_ia
  if (api?.kpis && isObject(api.kpis)) {
    merged.kpis = { ...merged.kpis, ...(api.kpis as RecouvrementHubData['kpis']) }
  }
  if (Array.isArray(api?.agences)) merged.agences = api.agences as RecouvrementHubData['agences']
  if (Array.isArray(api?.agents_en_souci)) {
    merged.agents_en_souci = api.agents_en_souci as RecouvrementHubData['agents_en_souci']
  }
  if (Array.isArray(api?.plan_strategique)) {
    merged.plan_strategique = api.plan_strategique as RecouvrementHubData['plan_strategique']
  }
  if (Array.isArray(api?.evolution_semaine)) {
    merged.evolution_semaine = api.evolution_semaine as RecouvrementHubData['evolution_semaine']
  }
  return merged
}

/** Extrait KPIs plats pour ModuleKpiGrid */
export function kpisFromApi(
  api: Record<string, unknown> | null | undefined,
  prefix = 'kpis',
): Record<string, number | string> {
  if (!api) return {}
  const k = (api[prefix] ?? api) as Record<string, number | string>
  return isObject(k) ? k : {}
}
