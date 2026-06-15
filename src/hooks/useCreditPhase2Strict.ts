'use client'

import { useCallback, useEffect, useState } from 'react'
import { creditPhase2 } from '@/lib/api-credit-phase2'
import type {
  AvisChargePayload,
  ComiteCreditPayload,
  CreateDossierCreditPayload,
  DecisionRocPayload,
  DossierCreditDetail,
  DossierCreditListItem,
  DossierWorkflowResponse,
} from '@/types/credit-api'
import type { PortefeuilleGpDossier } from '@/types/gestion-portefeuille'
import { gestionPortefeuille } from '@/lib/api-gestion-portefeuille'

export type CreditLoadState = 'idle' | 'loading' | 'ok' | 'error'

function unwrapList<T>(payload: T[] | { data: T[] }): T[] {
  if (Array.isArray(payload)) return payload
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const d = (payload as { data: T[] }).data
    return Array.isArray(d) ? d : []
  }
  return []
}

/** Liste dossiers — API strict (pas de fallback mock). Pour pages `-with-api` uniquement. */
export function useDossiersCreditListStrict() {
  const [items, setItems] = useState<DossierCreditListItem[]>([])
  const [state, setState] = useState<CreditLoadState>('idle')
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setState('loading')
    setError(null)
    try {
      const res = await creditPhase2.dossiers.list()
      setItems(unwrapList(res.data as DossierCreditListItem[] | { data: DossierCreditListItem[] }))
      setState('ok')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de charger les dossiers')
      setItems([])
      setState('error')
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { items, state, error, reload }
}

/** Fiche dossier — API strict */
export function useDossierCreditStrict(id: string | null) {
  const [dossier, setDossier] = useState<DossierCreditDetail | null>(null)
  const [workflow, setWorkflow] = useState<DossierWorkflowResponse | null>(null)
  const [state, setState] = useState<CreditLoadState>('idle')
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!id) return
    setState('loading')
    setError(null)
    try {
      const [dRes, wRes] = await Promise.all([
        creditPhase2.dossiers.get(id),
        creditPhase2.dossiers.workflow(id),
      ])
      setDossier(dRes.data)
      setWorkflow(wRes.data)
      setState('ok')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Dossier introuvable')
      setDossier(null)
      setWorkflow(null)
      setState('error')
    }
  }, [id])

  useEffect(() => {
    void reload()
  }, [reload])

  const submitAvisCharge = useCallback(
    async (body: AvisChargePayload) => {
      if (!id) return
      await creditPhase2.dossiers.avisCharge(id, body)
      await reload()
    },
    [id, reload],
  )

  const submitDecisionRoc = useCallback(
    async (body: DecisionRocPayload) => {
      if (!id) return
      await creditPhase2.dossiers.decisionRoc(id, body)
      await reload()
    },
    [id, reload],
  )

  const submitComite = useCallback(
    async (body: ComiteCreditPayload) => {
      if (!id) return
      await creditPhase2.dossiers.comiteCredit(id, body)
      await reload()
    },
    [id, reload],
  )

  const createDossier = useCallback(async (body: CreateDossierCreditPayload) => {
    const res = await creditPhase2.dossiers.create(body)
    return res.data
  }, [])

  return {
    dossier,
    workflow,
    state,
    error,
    reload,
    submitAvisCharge,
    submitDecisionRoc,
    submitComite,
    createDossier,
  }
}

/** Portefeuille GP — API strict */
export function usePortefeuilleGpStrict(mode: 'tous' | 'mauvais' = 'tous') {
  const [items, setItems] = useState<PortefeuilleGpDossier[]>([])
  const [state, setState] = useState<CreditLoadState>('idle')
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setState('loading')
    setError(null)
    try {
      const res =
        mode === 'mauvais'
          ? await gestionPortefeuille.mauvaisPayeurs()
          : await gestionPortefeuille.portefeuille()
      setItems(
        unwrapList(res.data as PortefeuilleGpDossier[] | { data: PortefeuilleGpDossier[] }),
      )
      setState('ok')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de charger le portefeuille')
      setItems([])
      setState('error')
    }
  }, [mode])

  useEffect(() => {
    void reload()
  }, [reload])

  return { items, state, error, reload }
}
