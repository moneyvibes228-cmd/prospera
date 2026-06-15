'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { phasesAd } from '@/lib/api-phases-ad'
import {
  mergeCcHub,
  mergeGpHub,
  mergeRaHub,
  mergeRccHub,
  mergeRecouvrementHub,
  mergeReseauHub,
  mergeRocDashboard,
  mergeDeep,
} from '@/lib/phases-ad-merge'
import { mergeTerrainDashboard } from '@/lib/phases-ad-terrain-merge'
import {
  buildPipelineStagesFromApi,
  pipelineCompteursLabel,
} from '@/lib/credit-pipeline-api'
import { getRelancesHub, type RelancesHub } from '@/lib/relances-hub'
import { getCreditCycleHub, type CreditCycleHub } from '@/lib/credit-cycle-hub'
import { getCoreBankingHub, type CoreBankingHub } from '@/lib/core-banking-hub'
import type {
  CollecteAgregatsApi,
  CreditPipelineApi,
  DashboardTerrainApi,
  KpiAgentApi,
  OperationsHubApi,
  TransactionStatsCaisse,
  TransactionStatsMomo,
} from '@/types/phases-ad'
import type { RocPipelineStage } from '@/lib/credit-pipeline-roc'
import type { PhasesAdLoadState } from '@/hooks/usePhasesAd'

function unwrap<T>(payload: T | { data: T }): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data
  }
  return payload as T
}

/** Requête Phases A–D — API strict (pas de fallback mock). Pour composants *WithApi. */
export function usePhasesAdQueryStrict<T>(fetcher: () => Promise<{ data: T | { data: T } }>) {
  const [data, setData] = useState<T | null>(null)
  const [state, setState] = useState<PhasesAdLoadState>('idle')
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setState('loading')
    setError(null)
    try {
      const res = await fetcher()
      setData(unwrap(res.data))
      setState('ok')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement')
      setData(null)
      setState('error')
    }
  }, [fetcher])

  useEffect(() => {
    void reload()
  }, [reload])

  return { data, state, error, reload }
}

export function useRecouvrementReseauStrict(agenceId?: string) {
  const fetcher = useCallback(
    () => phasesAd.recouvrement.reseau(agenceId),
    [agenceId],
  )
  const q = usePhasesAdQueryStrict<Record<string, unknown>>(fetcher)
  const hub = useMemo(() => mergeRecouvrementHub(q.data), [q.data])
  return { ...q, hub }
}

export function useReseauCreditStrict(agenceId?: string) {
  const fetcher = useCallback(
    () => phasesAd.recouvrement.reseau(agenceId),
    [agenceId],
  )
  const q = usePhasesAdQueryStrict<Record<string, unknown>>(fetcher)
  const hub = useMemo(() => mergeReseauHub(q.data), [q.data])
  return { ...q, hub }
}

export function useDashboardChargeCreditStrict() {
  const fetcher = useCallback(() => phasesAd.dashboard.chargeCredit(), [])
  const q = usePhasesAdQueryStrict<Record<string, unknown>>(fetcher)
  const hub = useMemo(() => mergeCcHub(q.data), [q.data])
  return { ...q, hub }
}

export function useDashboardRocStrict() {
  const fetcher = useCallback(() => phasesAd.dashboard.roc(), [])
  const q = usePhasesAdQueryStrict<Record<string, unknown>>(fetcher)
  const hub = useMemo(() => mergeRocDashboard(q.data), [q.data])
  return { ...q, hub }
}

export function useDashboardGpStrict() {
  const fetcher = useCallback(() => phasesAd.dashboard.gestionnairePortefeuille(), [])
  const q = usePhasesAdQueryStrict<Record<string, unknown>>(fetcher)
  const hub = useMemo(() => mergeGpHub(q.data), [q.data])
  return { ...q, hub }
}

export function useDashboardRaStrict() {
  const fetcher = useCallback(() => phasesAd.dashboard.responsableAgence(), [])
  const q = usePhasesAdQueryStrict<Record<string, unknown>>(fetcher)
  const hub = useMemo(() => mergeRaHub(q.data), [q.data])
  return { ...q, hub }
}

export function useDashboardRccStrict() {
  const fetcher = useCallback(() => phasesAd.dashboard.responsableCommercial(), [])
  const q = usePhasesAdQueryStrict<Record<string, unknown>>(fetcher)
  const hub = useMemo(() => mergeRccHub(q.data), [q.data])
  return { ...q, hub }
}

export function useTransactionStatsCaisseStrict() {
  return usePhasesAdQueryStrict<TransactionStatsCaisse>(() => phasesAd.transactions.statsCaisse())
}

export function useTransactionStatsMomoStrict() {
  return usePhasesAdQueryStrict<TransactionStatsMomo>(() => phasesAd.transactions.statsMomo())
}

export function useCollecteAgregatsStrict(agenceId?: string) {
  const fetcher = useCallback(
    () => phasesAd.collecte.agregats(agenceId),
    [agenceId],
  )
  return usePhasesAdQueryStrict<CollecteAgregatsApi>(fetcher)
}

export function useDashboardTerrainStrict() {
  const fetcher = useCallback(() => phasesAd.dashboard.terrain(), [])
  const q = usePhasesAdQueryStrict<DashboardTerrainApi>(fetcher)
  const hub = useMemo(
    () => (q.data ? mergeTerrainDashboard(q.data) : null),
    [q.data],
  )
  return { ...q, hub }
}

export function useCreditPipelineStrict(agenceId?: string) {
  const [stages, setStages] = useState<RocPipelineStage[]>([])
  const [compteursLabel, setCompteursLabel] = useState('')
  const [state, setState] = useState<PhasesAdLoadState>('idle')
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setState('loading')
    setError(null)
    try {
      const res = await phasesAd.pipeline.credit(agenceId)
      const body = unwrap<CreditPipelineApi>(res.data)
      const built = buildPipelineStagesFromApi(body)
      if (!built?.length) throw new Error('Pipeline API vide')
      setStages(built)
      setCompteursLabel(pipelineCompteursLabel(body))
      setState('ok')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur pipeline')
      setStages([])
      setCompteursLabel('')
      setState('error')
    }
  }, [agenceId])

  useEffect(() => {
    void reload()
  }, [reload])

  return { stages, compteursLabel, state, error, reload }
}

export function useCoreBankingHubStrict(agenceId?: string) {
  const fetcher = useCallback(() => phasesAd.operations.coreBanking(agenceId), [agenceId])
  const q = usePhasesAdQueryStrict<OperationsHubApi>(fetcher)
  const hub = useMemo((): CoreBankingHub | null => {
    if (!q.data) return null
    return mergeDeep(getCoreBankingHub(), q.data) as CoreBankingHub
  }, [q.data])
  return { ...q, hub, ops: q.data }
}

export function useCreditCycleHubStrict(agenceId?: string) {
  const fetcher = useCallback(() => phasesAd.operations.creditCycle(agenceId), [agenceId])
  const q = usePhasesAdQueryStrict<OperationsHubApi>(fetcher)
  const hub = useMemo((): CreditCycleHub | null => {
    if (!q.data) return null
    return mergeDeep(getCreditCycleHub(), q.data) as CreditCycleHub
  }, [q.data])
  return { ...q, hub, ops: q.data }
}

export function useRelancesHubStrict(agenceId?: string) {
  const fetcher = useCallback(() => phasesAd.operations.relances(agenceId), [agenceId])
  const q = usePhasesAdQueryStrict<OperationsHubApi>(fetcher)
  const hub = useMemo((): RelancesHub | null => {
    if (!q.data) return null
    return mergeDeep(getRelancesHub(), q.data) as RelancesHub
  }, [q.data])
  return { ...q, hub, ops: q.data }
}

/** @deprecated Préférer useCoreBankingHubStrict / useCreditCycleHubStrict / useRelancesHubStrict */
export function useOperationsHubStrict(
  hubKey: 'credit-cycle' | 'core-banking' | 'relances',
  agenceId?: string,
) {
  if (hubKey === 'credit-cycle') return useCreditCycleHubStrict(agenceId)
  if (hubKey === 'core-banking') return useCoreBankingHubStrict(agenceId)
  return useRelancesHubStrict(agenceId)
}

export function useKpiAgentsStrict(agenceId?: string) {
  const fetcher = useCallback(() => phasesAd.kpis.agents(agenceId), [agenceId])
  return usePhasesAdQueryStrict<KpiAgentApi[]>(fetcher)
}

export function useTransactionsListStrict(params?: {
  type?: string
  statut?: string
  agence_id?: string
}) {
  const fetcher = useCallback(() => phasesAd.transactions.list(params), [params])
  return usePhasesAdQueryStrict<unknown[]>(fetcher)
}

export function useRecouvrementDrilldownStrict(
  type: 'agence' | 'agent' | 'client' | 'dossier',
  id: string | null,
) {
  const fetcher = useCallback(() => {
    if (!id) return Promise.reject(new Error('ID requis'))
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

  return usePhasesAdQueryStrict<Record<string, unknown>>(fetcher)
}
