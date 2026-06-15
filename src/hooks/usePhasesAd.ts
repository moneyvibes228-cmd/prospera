'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { API_PHASES_AD_ENABLED } from '@/lib/api-config'
import { useAuth } from '@/contexts/AuthContext'
import { phasesAd } from '@/lib/api-phases-ad'
import {
  buildPipelineStagesFromApi,
  getMockPipelineStages,
  pipelineCompteursLabel,
} from '@/lib/credit-pipeline-api'
import {
  mergeCcHub,
  mergeGpHub,
  mergeRaHub,
  mergeRccHub,
  mergeRecouvrementHub,
  mergeReseauHub,
  mergeRocDashboard,
} from '@/lib/phases-ad-merge'
import { MOCK_TERRAIN_HOME } from '@/lib/mockMicrofinance'
import type {
  CollecteAgregatsApi,
  CreditPipelineApi,
  DashboardTerrainApi,
  KpiAgentApi,
  OperationsHubApi,
  TransactionStatsCaisse,
  TransactionStatsMomo,
} from '@/types/phases-ad'
import type { RecouvrementHubData } from '@/lib/roc-recouvrement-hub'
import type { RocPipelineStage } from '@/lib/credit-pipeline-roc'
import type { ContactMethod, Visit } from '@/types'

function unwrap<T>(payload: T | { data: T }): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data
  }
  return payload as T
}

function unwrapList<T>(payload: T[] | { data: T[] }): T[] {
  if (Array.isArray(payload)) return payload
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const d = (payload as { data: T[] }).data
    return Array.isArray(d) ? d : []
  }
  return []
}

export type PhasesAdLoadState = 'idle' | 'loading' | 'ok' | 'error'

const EMPTY_RECORD = (): Record<string, unknown> => ({})

export function usePhasesAdQuery<T>(
  fetcher: () => Promise<{ data: T | { data: T } }>,
  mockFallback: () => T,
  enabled?: boolean,
) {
  const { sessionSource } = useAuth()
  const apiEnabled =
    (enabled ?? true) && API_PHASES_AD_ENABLED && sessionSource === 'api'
  const [data, setData] = useState<T | null>(null)
  const [state, setState] = useState<PhasesAdLoadState>('idle')
  const [source, setSource] = useState<'mock' | 'api'>('mock')
  const [error, setError] = useState<string | null>(null)

  const fetcherRef = useRef(fetcher)
  const mockFallbackRef = useRef(mockFallback)
  fetcherRef.current = fetcher
  mockFallbackRef.current = mockFallback

  const reload = useCallback(async () => {
    setState('loading')
    setError(null)
    if (apiEnabled) {
      try {
        const res = await fetcherRef.current()
        setData(unwrap(res.data))
        setSource('api')
        setState('ok')
        return
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur de chargement')
      }
    }
    setData(mockFallbackRef.current())
    setSource('mock')
    setState('ok')
  }, [apiEnabled])

  useEffect(() => {
    void reload()
  }, [reload])

  return { data, state, source, error, reload, apiEnabled }
}

// —— Dashboards ——

export function useDashboardTerrain() {
  return usePhasesAdQuery<DashboardTerrainApi>(
    () => phasesAd.dashboard.terrain(),
    () => MOCK_TERRAIN_HOME as unknown as DashboardTerrainApi,
  )
}

export function useDashboardChargeCredit() {
  const q = usePhasesAdQuery<Record<string, unknown>>(
    () => phasesAd.dashboard.chargeCredit(),
    () => ({}),
  )
  const hub = useMemo(() => mergeCcHub(q.data), [q.data])
  return { ...q, hub }
}

export function useDashboardRoc() {
  const q = usePhasesAdQuery<Record<string, unknown>>(
    () => phasesAd.dashboard.roc(),
    () => ({}),
  )
  const hub = useMemo(() => mergeRocDashboard(q.data), [q.data])
  return { ...q, hub }
}

export function useDashboardGp() {
  const q = usePhasesAdQuery<Record<string, unknown>>(
    () => phasesAd.dashboard.gestionnairePortefeuille(),
    () => ({}),
  )
  const hub = useMemo(() => mergeGpHub(q.data), [q.data])
  return { ...q, hub }
}

export function useDashboardRa(agenceId?: string) {
  const q = usePhasesAdQuery<Record<string, unknown>>(
    () => phasesAd.dashboard.responsableAgence(agenceId),
    () => ({}),
  )
  const hub = useMemo(() => mergeRaHub(q.data), [q.data])
  return { ...q, hub }
}

export function useDashboardRcc() {
  const q = usePhasesAdQuery<Record<string, unknown>>(
    () => phasesAd.dashboard.responsableCommercial(),
    () => ({}),
  )
  const hub = useMemo(() => mergeRccHub(q.data), [q.data])
  return { ...q, hub }
}

// —— Pipeline ——

export function useCreditPipeline(agenceId?: string) {
  const { sessionSource } = useAuth()
  const apiEnabled = API_PHASES_AD_ENABLED && sessionSource === 'api'
  const [stages, setStages] = useState<RocPipelineStage[]>(() => getMockPipelineStages())
  const [compteursLabel, setCompteursLabel] = useState('')
  const [state, setState] = useState<PhasesAdLoadState>('idle')
  const [source, setSource] = useState<'mock' | 'api'>('mock')
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setState('loading')
    setError(null)
    if (apiEnabled) {
      try {
        const res = await phasesAd.pipeline.credit(agenceId)
        const body = unwrap<CreditPipelineApi>(res.data)
        const built = buildPipelineStagesFromApi(body)
        if (built) {
          setStages(built)
          setCompteursLabel(pipelineCompteursLabel(body))
          setSource('api')
          setState('ok')
          return
        }
        setCompteursLabel(pipelineCompteursLabel(body))
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur pipeline')
      }
    }
    setStages(getMockPipelineStages())
    setCompteursLabel('')
    setSource('mock')
    setState('ok')
  }, [agenceId, apiEnabled])

  useEffect(() => {
    void reload()
  }, [reload])

  return { stages, compteursLabel, state, source, error, reload, apiEnabled }
}

// —— Recouvrement réseau ——

export function useRecouvrementReseau(agenceId?: string) {
  const q = usePhasesAdQuery<Record<string, unknown>>(
    () => phasesAd.recouvrement.reseau(agenceId),
    () => ({}),
  )
  const hub = useMemo(() => mergeRecouvrementHub(q.data), [q.data])
  return { ...q, hub }
}

export function useReseauCredit(agenceId?: string) {
  const q = usePhasesAdQuery<Record<string, unknown>>(
    () => phasesAd.recouvrement.reseau(agenceId),
    () => ({}),
  )
  const hub = useMemo(() => mergeReseauHub(q.data), [q.data])
  return { ...q, hub }
}

export function useRecouvrementDrilldown(
  type: 'agence' | 'agent' | 'client' | 'dossier',
  id: string | null,
) {
  const fetcher = useCallback(() => {
    if (!id) return Promise.resolve({ data: {} })
    switch (type) {
      case 'agence':
        return phasesAd.recouvrement.reseauAgence(id)
      case 'agent':
        return phasesAd.recouvrement.reseauAgent(id)
      case 'client':
        return phasesAd.recouvrement.reseauClient(id)
      case 'dossier':
        return phasesAd.recouvrement.reseauDossier(id)
    }
  }, [type, id])

  return usePhasesAdQuery<Record<string, unknown>>(fetcher, EMPTY_RECORD, !!id)
}

// —— Collecte ——

export function useCollecteAgregats(agenceId?: string) {
  return usePhasesAdQuery<CollecteAgregatsApi>(
    () => phasesAd.collecte.agregats(agenceId),
    () => ({}),
  )
}

// —— Transactions ——

export function useTransactionStatsMomo(agenceId?: string) {
  return usePhasesAdQuery<TransactionStatsMomo>(
    () => phasesAd.transactions.statsMomo(agenceId),
    () => ({
      operateur: 'FLOOZ_MIXX',
      libelle: 'Flooz / Mixx by Yas',
      en_attente: 3,
      valides_jour: 5,
      rejetes_jour: 0,
      montant_valide_jour_fcfa: 42_500,
      transactions_recentes: [],
    }),
  )
}

export function useTransactionStatsCaisse(agenceId?: string) {
  return usePhasesAdQuery<TransactionStatsCaisse>(
    () => phasesAd.transactions.statsCaisse(agenceId),
    () => ({
      type: 'AGENCE',
      libelle: 'Guichet agence',
      depots_jour: 4,
      retraits_jour: 1,
      montant_depots_jour_fcfa: 42_000,
      montant_retraits_jour_fcfa: 8_000,
      solde_net_jour_fcfa: 34_000,
      transactions_recentes: [],
    }),
  )
}

export function useTransactionsList(params?: {
  type?: string
  statut?: string
  agence_id?: string
}) {
  return usePhasesAdQuery<unknown[]>(
    () => phasesAd.transactions.list(params),
    () => [],
  )
}

// —— Ops hubs ——

export function useOperationsHub(
  hub: 'credit-cycle' | 'core-banking' | 'relances',
  agenceId?: string,
) {
  const fetcher = () => {
    if (hub === 'credit-cycle') return phasesAd.operations.creditCycle(agenceId)
    if (hub === 'core-banking') return phasesAd.operations.coreBanking(agenceId)
    return phasesAd.operations.relances(agenceId)
  }
  return usePhasesAdQuery<OperationsHubApi>(fetcher, () => ({}))
}

// —— KPIs & objectifs ——

export function useKpiAgents(agenceId?: string) {
  return usePhasesAdQuery<KpiAgentApi[]>(
    () => phasesAd.kpis.agents(agenceId),
    () => [],
  )
}

export function useKpiAgent(agentId: string | null) {
  return usePhasesAdQuery<KpiAgentApi>(
    () => phasesAd.kpis.agent(agentId!),
    () => ({
      agent_id: agentId ?? '',
      nom: '—',
      collecte_semaine_fcfa: 0,
      objectif_collecte_semaine_fcfa: 625_000,
      taux_objectif_collecte_semaine_pct: 0,
      visites_semaine: 0,
      objectif_visites_semaine: 40,
    }),
    !!agentId,
  )
}

export function useObjectifsAgent(agentId: string | null, annee?: number) {
  return usePhasesAdQuery<unknown>(
    () => phasesAd.objectifs.get(agentId!, annee),
    () => ({ objectifs: [] }),
    !!agentId,
  )
}

// —— Visites Phase A ——

function mapApiVisiteToVisit(v: Record<string, unknown>): Visit {
  return {
    id: String(v.id ?? ''),
    borrowerId: String(v.clientId ?? v.client_id ?? ''),
    borrowerNom: String(v.client_nom ?? v.cliente ?? 'Client'),
    agentId: String(v.agentId ?? v.agent_id ?? ''),
    agentNom: String(v.agent_nom ?? ''),
    adresse: String(v.adresse ?? ''),
    date: String(v.date ?? v.createdAt ?? new Date().toISOString()),
    lat: Number(v.lat ?? 0),
    lng: Number(v.lng ?? 0),
    statut: (v.statut as Visit['statut']) ?? 'POSITIVE',
    methode: (v.objet_visite ?? v.methode ?? 'VISITE_TERRAIN') as ContactMethod,
    commentaire: String(v.notes ?? v.compte_rendu ?? ''),
    distance_metres: v.distance_metres != null ? Number(v.distance_metres) : undefined,
  }
}

export function useVisitesPhasesAd(params?: Record<string, string>) {
  const q = usePhasesAdQuery<unknown[]>(
    () => phasesAd.visites.list(params),
    () => [],
  )
  const visits = useMemo(
    () =>
      (q.data ?? []).map((row) =>
        mapApiVisiteToVisit(row as Record<string, unknown>),
      ),
    [q.data],
  )
  return { ...q, visits }
}

export function useVisitesARevisiterPhasesAd() {
  const q = usePhasesAdQuery<unknown[]>(
    () => phasesAd.visites.aRevisiter(),
    () => [],
  )
  const visits = useMemo(
    () =>
      (q.data ?? []).map((row) =>
        mapApiVisiteToVisit(row as Record<string, unknown>),
      ),
    [q.data],
  )
  return { ...q, visits }
}

export function useVisitesNearbyPhasesAd(lat: number, lng: number, enabled: boolean) {
  const { sessionSource } = useAuth()
  const apiEnabled = API_PHASES_AD_ENABLED && sessionSource === 'api'
  const [visits, setVisits] = useState<Visit[]>([])
  const [state, setState] = useState<PhasesAdLoadState>('idle')
  const [source, setSource] = useState<'mock' | 'api'>('mock')

  useEffect(() => {
    if (!enabled || !lat || !lng) return
    void (async () => {
      setState('loading')
      if (apiEnabled) {
        try {
          const res = await phasesAd.visites.nearby(lat, lng)
          const list = unwrapList(res.data as unknown[] | { data: unknown[] })
          setVisits(list.map((r) => mapApiVisiteToVisit(r as Record<string, unknown>)))
          setSource('api')
          setState('ok')
          return
        } catch {
          /* fallback empty */
        }
      }
      setVisits([])
      setSource('mock')
      setState('ok')
    })()
  }, [lat, lng, enabled, apiEnabled])

  return { visits, state, source }
}
