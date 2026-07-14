'use client'

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react'
import {
  creerProspectRecense,
  loadRecensement,
  saveRecensement,
  loadTransferts,
  saveTransferts,
  type ProspectRecense,
  type TransfertsMap,
} from '@/lib/prospection-workflow'

interface ProspectionWorkflowContextValue {
  recensement: ProspectRecense[]
  recenser: (input: {
    nom: string
    lat: number
    lng: number
    type_commerce?: string
    commercial: string
  }) => ProspectRecense
  supprimer: (id: string) => void
  /** Transferts d'ouvertures au commercial de secteur (id ouverture → nom). */
  transferts: TransfertsMap
  transferer: (input: { ouvertureId: string; pdvNom: string; secteur: string }) => void
  annulerTransfert: (ouvertureId: string) => void
  lastAction: { type: string; message: string } | null
  clearLastAction: () => void
}

const ProspectionWorkflowContext = createContext<ProspectionWorkflowContextValue | null>(null)

export function ProspectionWorkflowProvider({ children }: { children: React.ReactNode }) {
  const [recensement, setRecensement] = useState<ProspectRecense[]>([])
  const [transferts, setTransferts] = useState<TransfertsMap>({})
  const [hydrated, setHydrated] = useState(false)
  const [lastAction, setLastAction] = useState<{ type: string; message: string } | null>(null)

  useEffect(() => {
    setRecensement(loadRecensement())
    setTransferts(loadTransferts())
    setHydrated(true)
  }, [])

  useEffect(() => { if (hydrated) saveRecensement(recensement) }, [recensement, hydrated])
  useEffect(() => { if (hydrated) saveTransferts(transferts) }, [transferts, hydrated])

  const recenser = useCallback<ProspectionWorkflowContextValue['recenser']>((input) => {
    const prospect = creerProspectRecense(input)
    setRecensement(prev => [prospect, ...prev])
    setLastAction({ type: 'recensement', message: `« ${prospect.nom} » recensé et géolocalisé.` })
    return prospect
  }, [])

  const supprimer = useCallback((id: string) => {
    setRecensement(prev => prev.filter(p => p.id !== id))
    setLastAction({ type: 'annule', message: 'Prospect recensé retiré.' })
  }, [])

  const transferer = useCallback<ProspectionWorkflowContextValue['transferer']>(({ ouvertureId, pdvNom, secteur }) => {
    setTransferts(prev => ({ ...prev, [ouvertureId]: secteur }))
    setLastAction({ type: 'transfert', message: `« ${pdvNom} » transféré à ${secteur}.` })
  }, [])

  const annulerTransfert = useCallback((ouvertureId: string) => {
    setTransferts(prev => {
      const next = { ...prev }
      delete next[ouvertureId]
      return next
    })
    setLastAction({ type: 'annule', message: 'Transfert annulé.' })
  }, [])

  const value = useMemo<ProspectionWorkflowContextValue>(() => ({
    recensement,
    recenser,
    supprimer,
    transferts,
    transferer,
    annulerTransfert,
    lastAction,
    clearLastAction: () => setLastAction(null),
  }), [recensement, recenser, supprimer, transferts, transferer, annulerTransfert, lastAction])

  return (
    <ProspectionWorkflowContext.Provider value={value}>
      {children}
    </ProspectionWorkflowContext.Provider>
  )
}

export function useProspectionWorkflow() {
  const ctx = useContext(ProspectionWorkflowContext)
  if (!ctx) throw new Error('useProspectionWorkflow must be used within ProspectionWorkflowProvider')
  return ctx
}
