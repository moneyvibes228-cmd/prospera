'use client'

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react'
import type { ComboStockIA } from '@distributeur/lib/marketing-combo-stock-builder'
import {
  comboToCampagne,
  getComboWorkflowStatut,
  isEligibleForMarketing,
  loadCampagnesFromCombos,
  loadComboQueue,
  needsDgValidation,
  saveCampagnesFromCombos,
  saveComboQueue,
  upsertQueueEntry,
  type CampagneFromCombo,
  type ComboQueueEntry,
  type ComboWorkflowStatut,
} from '@distributeur/lib/combo-stock-workflow'

interface ComboStockWorkflowContextValue {
  queue: ComboQueueEntry[]
  campagnesFromCombos: CampagneFromCombo[]
  getEntry: (comboId: string) => ComboQueueEntry | undefined
  getStatut: (combo: ComboStockIA) => ComboWorkflowStatut | 'AUTO_DISPONIBLE'
  validerEtTransmettre: (combo: ComboStockIA) => void
  creerCampagne: (combo: ComboStockIA) => CampagneFromCombo | null
  combosEligiblesMarketing: (combos: ComboStockIA[]) => ComboStockIA[]
  /** Ajoute une campagne construite hors combo (ex. promo fournisseur) — visible dans l'onglet Campagnes. */
  ajouterCampagne: (campagne: CampagneFromCombo) => CampagneFromCombo
  retirerCampagne: (sourceId: string) => void
  getCampagneBySource: (sourceId: string) => CampagneFromCombo | undefined
  lastAction: { type: string; message: string } | null
  clearLastAction: () => void
}

const ComboStockWorkflowContext = createContext<ComboStockWorkflowContextValue | null>(null)

export function ComboStockWorkflowProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<ComboQueueEntry[]>([])
  const [campagnesFromCombos, setCampagnesFromCombos] = useState<CampagneFromCombo[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [lastAction, setLastAction] = useState<{ type: string; message: string } | null>(null)

  useEffect(() => {
    setQueue(loadComboQueue())
    setCampagnesFromCombos(loadCampagnesFromCombos())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) saveComboQueue(queue)
  }, [queue, hydrated])

  useEffect(() => {
    if (hydrated) saveCampagnesFromCombos(campagnesFromCombos)
  }, [campagnesFromCombos, hydrated])

  const getEntry = useCallback(
    (comboId: string) => queue.find(e => e.comboId === comboId),
    [queue],
  )

  const getStatut = useCallback(
    (combo: ComboStockIA) => getComboWorkflowStatut(combo, getEntry(combo.id)),
    [getEntry],
  )

  const validerEtTransmettre = useCallback((combo: ComboStockIA) => {
    const now = new Date().toISOString()
    setQueue(prev => upsertQueueEntry(prev, combo.id, {
      statut: 'VALIDEE',
      validatedAt: now,
      validatedBy: needsDgValidation(combo) ? 'DG' : 'AUTO',
    }))
    setLastAction({
      type: 'validate',
      message: needsDgValidation(combo)
        ? `« ${combo.nom} » validé et transmis au marketing.`
        : `« ${combo.nom} » transmis au marketing (seuil auto).`,
    })
  }, [])

  const creerCampagne = useCallback((combo: ComboStockIA): CampagneFromCombo | null => {
    const entry = getEntry(combo.id)
    if (!isEligibleForMarketing(combo, entry)) return null
    if (entry?.statut === 'CAMPAGNE_CREEE' && entry.campagneId) {
      return campagnesFromCombos.find(c => c.id === entry.campagneId) ?? null
    }

    const campagne = comboToCampagne(combo)
    const now = new Date().toISOString()

    setCampagnesFromCombos(prev => [...prev, campagne])
    setQueue(prev => upsertQueueEntry(prev, combo.id, {
      statut: 'CAMPAGNE_CREEE',
      validatedAt: entry?.validatedAt ?? now,
      validatedBy: entry?.validatedBy ?? (needsDgValidation(combo) ? 'DG' : 'AUTO'),
      campagneId: campagne.id,
      campagneCreeeAt: now,
    }))
    setLastAction({
      type: 'campaign',
      message: `Campagne « ${campagne.nom} » créée (statut PLANIFIÉE).`,
    })
    return campagne
  }, [campagnesFromCombos, getEntry])

  const combosEligiblesMarketing = useCallback(
    (combos: ComboStockIA[]) => combos.filter(c => isEligibleForMarketing(c, getEntry(c.id))),
    [getEntry],
  )

  const ajouterCampagne = useCallback((campagne: CampagneFromCombo): CampagneFromCombo => {
    setCampagnesFromCombos(prev => {
      if (prev.some(c => c.source_combo_id === campagne.source_combo_id)) return prev
      return [...prev, campagne]
    })
    setLastAction({
      type: 'campaign',
      message: `Campagne « ${campagne.nom} » créée (statut PLANIFIÉE).`,
    })
    return campagne
  }, [])

  const retirerCampagne = useCallback((sourceId: string) => {
    setCampagnesFromCombos(prev => prev.filter(c => c.source_combo_id !== sourceId))
  }, [])

  const getCampagneBySource = useCallback(
    (sourceId: string) => campagnesFromCombos.find(c => c.source_combo_id === sourceId),
    [campagnesFromCombos],
  )

  const value = useMemo(() => ({
    queue,
    campagnesFromCombos,
    getEntry,
    getStatut,
    validerEtTransmettre,
    creerCampagne,
    combosEligiblesMarketing,
    ajouterCampagne,
    retirerCampagne,
    getCampagneBySource,
    lastAction,
    clearLastAction: () => setLastAction(null),
  }), [
    queue, campagnesFromCombos, getEntry, getStatut,
    validerEtTransmettre, creerCampagne, combosEligiblesMarketing,
    ajouterCampagne, retirerCampagne, getCampagneBySource, lastAction,
  ])

  return (
    <ComboStockWorkflowContext.Provider value={value}>
      {children}
    </ComboStockWorkflowContext.Provider>
  )
}

export function useComboStockWorkflow() {
  const ctx = useContext(ComboStockWorkflowContext)
  if (!ctx) throw new Error('useComboStockWorkflow must be used within ComboStockWorkflowProvider')
  return ctx
}
