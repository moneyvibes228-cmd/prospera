'use client'

import { useCallback, useEffect, useState } from 'react'
import { API_CREDIT_PHASE2_ENABLED } from '@/lib/api-config'
import { creditPhase2 } from '@/lib/api-credit-phase2'
import {
  mockGetDossierCredit,
  mockGetDossierWorkflow,
  mockListDossiersCredit,
} from '@/lib/credit-mock-workflow'
import type {
  AvisChargePayload,
  ComiteCreditPayload,
  CreateDossierCreditPayload,
  DecisionRocPayload,
  DossierCreditDetail,
  DossierCreditListItem,
  DossierWorkflowResponse,
} from '@/types/credit-api'

export type CreditLoadState = 'idle' | 'loading' | 'ok' | 'error'

function useApiEnabled() {
  return API_CREDIT_PHASE2_ENABLED
}

export function useDossiersCreditList() {
  const apiMode = useApiEnabled()
  const [items, setItems] = useState<DossierCreditListItem[]>([])
  const [state, setState] = useState<CreditLoadState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<'mock' | 'api'>('mock')

  const reload = useCallback(async () => {
    setState('loading')
    setError(null)
    if (apiMode) {
      try {
        const res = await creditPhase2.dossiers.list()
        const data = Array.isArray(res.data) ? res.data : (res.data as { data?: DossierCreditListItem[] })?.data ?? []
        setItems(data)
        setSource('api')
        setState('ok')
        return
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur de chargement des dossiers')
      }
    }
    setItems(mockListDossiersCredit())
    setSource('mock')
    setState('ok')
  }, [apiMode])

  useEffect(() => {
    void reload()
  }, [reload])

  return { items, state, error, source, apiMode, reload }
}

export function useDossierCredit(id: string | null) {
  const apiMode = useApiEnabled()
  const [dossier, setDossier] = useState<DossierCreditDetail | null>(null)
  const [workflow, setWorkflow] = useState<DossierWorkflowResponse | null>(null)
  const [state, setState] = useState<CreditLoadState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<'mock' | 'api'>('mock')

  const reload = useCallback(async () => {
    if (!id) return
    setState('loading')
    setError(null)
    if (apiMode) {
      try {
        const [dRes, wRes] = await Promise.all([
          creditPhase2.dossiers.get(id),
          creditPhase2.dossiers.workflow(id),
        ])
        setDossier(dRes.data)
        setWorkflow(wRes.data)
        setSource('api')
        setState('ok')
        return
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur chargement dossier')
      }
    }
    const mockD = mockGetDossierCredit(id)
    const mockW = mockGetDossierWorkflow(id)
    if (!mockD) {
      setError('Dossier introuvable')
      setState('error')
      return
    }
    setDossier(mockD)
    setWorkflow(mockW)
    setSource('mock')
    setState('ok')
  }, [apiMode, id])

  useEffect(() => {
    void reload()
  }, [reload])

  const submitAvisCharge = useCallback(
    async (payload: AvisChargePayload) => {
      if (!id) return
      if (apiMode) {
        await creditPhase2.dossiers.avisCharge(id, payload)
      }
      await reload()
    },
    [apiMode, id, reload],
  )

  const submitDecisionRoc = useCallback(
    async (payload: DecisionRocPayload) => {
      if (!id) return
      if (apiMode) {
        await creditPhase2.dossiers.decisionRoc(id, payload)
      }
      await reload()
    },
    [apiMode, id, reload],
  )

  const submitComite = useCallback(
    async (payload: ComiteCreditPayload) => {
      if (!id) return
      if (apiMode) {
        await creditPhase2.dossiers.comiteCredit(id, payload)
      }
      await reload()
    },
    [apiMode, id, reload],
  )

  return {
    dossier,
    workflow,
    state,
    error,
    source,
    apiMode,
    reload,
    submitAvisCharge,
    submitDecisionRoc,
    submitComite,
  }
}

export async function createDossierCredit(
  payload: CreateDossierCreditPayload,
): Promise<{ dossier: DossierCreditDetail; source: 'api' | 'mock' }> {
  if (API_CREDIT_PHASE2_ENABLED) {
    const res = await creditPhase2.dossiers.create(payload)
    return { dossier: res.data, source: 'api' }
  }
  const mock: DossierCreditDetail = {
    id: `DOS-MOCK-${Date.now()}`,
    reference: `DOS-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    statut: 'SOUMIS',
    montant_demande: payload.montant_demande,
    duree_mois: payload.duree_mois,
    objet_credit: payload.objet_credit,
    date_soumission: new Date().toISOString().slice(0, 10),
    client: { id: payload.clientId, nom: '—', prenom: 'Nouveau dossier' },
  }
  return { dossier: mock, source: 'mock' }
}
