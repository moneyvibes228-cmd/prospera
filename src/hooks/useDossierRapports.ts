'use client'

import { useCallback, useEffect, useState } from 'react'
import { API_CREDIT_PHASE2_ENABLED } from '@/lib/api-config'
import { creditPhase2 } from '@/lib/api-credit-phase2'
import { mapApiRapportCcToRapportCC, mockRapportCcToRocApi } from '@/lib/credit-rapport-mapper'
import { getAllDossiersAnalyse } from '@/lib/credit-pipeline-roc'
import type { DossierCreditDetail } from '@/types/credit-api'
import type { RapportCcApi, RapportRocApi, DossierScoreApi } from '@/types/credit-rapports-api'
import type { RapportCC } from '@/lib/mockMicrofinance'

export type RapportTab = 'rapport_cc' | 'rapport_roc' | 'scoring' | 'echeancier'

type LoadState = 'idle' | 'loading' | 'ok' | 'error'

function unwrap<T>(data: T | { data: T }): T {
  if (data && typeof data === 'object' && 'data' in data && (data as { data: T }).data !== undefined) {
    return (data as { data: T }).data
  }
  return data as T
}

export function useDossierRapports(
  dossierId: string,
  activeTab: RapportTab | string,
  dossier: DossierCreditDetail | null,
  options?: { mockOnly?: boolean },
) {
  const useApi = API_CREDIT_PHASE2_ENABLED && !options?.mockOnly
  const mockBase = getAllDossiersAnalyse().find((d) => d.dossier_id === dossierId) ?? null

  const [rapportCc, setRapportCc] = useState<RapportCC | null>(mockBase)
  const [rapportRoc, setRapportRoc] = useState<RapportRocApi | null>(null)
  const [score, setScore] = useState<DossierScoreApi | null>(null)
  const [echeancier, setEcheancier] = useState<{ lignes: unknown[] } | null>(null)

  const [ccState, setCcState] = useState<LoadState>(mockBase ? 'ok' : 'idle')
  const [rocState, setRocState] = useState<LoadState>('idle')
  const [scoreState, setScoreState] = useState<LoadState>('idle')
  const [echState, setEchState] = useState<LoadState>('idle')

  const [ccSource, setCcSource] = useState<'mock' | 'api'>('mock')
  const [rocSource, setRocSource] = useState<'mock' | 'api'>('mock')
  const [errors, setErrors] = useState<Partial<Record<RapportTab, string>>>({})

  const loadCc = useCallback(async () => {
    setCcState('loading')
    setErrors((e) => ({ ...e, rapport_cc: undefined }))
    if (useApi) {
      try {
        const res = await creditPhase2.dossiers.rapportCc(dossierId)
        const raw = unwrap<RapportCcApi>(res.data as RapportCcApi | { data: RapportCcApi })
        setRapportCc(mapApiRapportCcToRapportCC(raw, dossierId, dossier, mockBase))
        setCcSource('api')
        setCcState('ok')
        return
      } catch (err) {
        setErrors((e) => ({
          ...e,
          rapport_cc: err instanceof Error ? err.message : 'Erreur rapport CC',
        }))
      }
    }
    if (mockBase) {
      setRapportCc(mockBase)
      setCcSource('mock')
      setCcState('ok')
    } else {
      setCcState('error')
    }
  }, [dossierId, dossier, mockBase])

  const loadRoc = useCallback(async () => {
    setRocState('loading')
    setErrors((e) => ({ ...e, rapport_roc: undefined }))
    if (useApi) {
      try {
        const res = await creditPhase2.dossiers.rapportRoc(dossierId)
        setRapportRoc(unwrap<RapportRocApi>(res.data as RapportRocApi | { data: RapportRocApi }))
        setRocSource('api')
        setRocState('ok')
        return
      } catch (err) {
        setErrors((e) => ({
          ...e,
          rapport_roc: err instanceof Error ? err.message : 'Erreur rapport ROC',
        }))
      }
    }
    const base = mockBase ?? rapportCc
    if (base) {
      setRapportRoc(mockRapportCcToRocApi(base))
      setRocSource('mock')
      setRocState('ok')
    } else {
      setRocState('error')
    }
  }, [dossierId, mockBase, rapportCc])

  const loadScore = useCallback(async () => {
    setScoreState('loading')
    setErrors((e) => ({ ...e, scoring: undefined }))
    if (useApi) {
      try {
        const res = await creditPhase2.dossiers.score(dossierId)
        setScore(unwrap<DossierScoreApi>(res.data as DossierScoreApi | { data: DossierScoreApi }))
        setScoreState('ok')
        return
      } catch (err) {
        setErrors((e) => ({
          ...e,
          scoring: err instanceof Error ? err.message : 'Erreur score',
        }))
      }
    }
    const base = mockBase ?? rapportCc
    if (base) {
      setScore({
        score_actuel: {
          score_consolide: base.score_consolide,
          score_cbi: base.score_cbi,
          ajustement_claude: base.ajustement_prospera_ia,
          classe_bceao: base.classe_bceao,
          probabilite_defaut_pct: base.probabilite_defaut_pct,
          etape: base.etape_courante,
        },
        historique: base.evolution_score.map((e) => ({
          etape: e.etape,
          score_consolide: e.score_consolide,
          date: e.date,
        })),
        alertes_actives: base.alertes_actives,
      })
      setScoreState('ok')
    } else {
      setScoreState('error')
    }
  }, [dossierId, mockBase, rapportCc])

  const loadEcheancier = useCallback(async () => {
    setEchState('loading')
    if (useApi) {
      try {
        const res = await creditPhase2.dossiers.echeancier(dossierId)
        const data = res.data as { lignes?: unknown[] } | { data: { lignes?: unknown[] } }
        const body = unwrap(data)
        setEcheancier({ lignes: body.lignes ?? [] })
        setEchState('ok')
        return
      } catch {
        setEchState('error')
        return
      }
    }
    setEcheancier({ lignes: [] })
    setEchState('ok')
  }, [dossierId])

  useEffect(() => {
    if (activeTab === 'rapport_cc') void loadCc()
    if (activeTab === 'rapport_roc') void loadRoc()
    if (activeTab === 'scoring') void loadScore()
    if (activeTab === 'echeancier') void loadEcheancier()
  }, [activeTab, loadCc, loadRoc, loadScore, loadEcheancier])

  return {
    rapportCc,
    rapportRoc,
    score,
    echeancier,
    ccState,
    rocState,
    scoreState,
    echState,
    ccSource,
    rocSource,
    errors,
    reloadCc: loadCc,
    reloadRoc: loadRoc,
  }
}
