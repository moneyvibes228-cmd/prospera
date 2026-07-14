'use client'

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react'
import {
  buildDecision,
  loadValidationDecisions,
  saveValidationDecisions,
  type DecisionValidation,
  type ValidationDecisionEntry,
} from '@distributeur/lib/validations-workflow'

interface ValidationsWorkflowContextValue {
  decisions: Record<string, ValidationDecisionEntry>
  getDecision: (demandeId: string) => ValidationDecisionEntry | undefined
  decider: (
    demandeId: string,
    decision: DecisionValidation,
    decidedBy: string,
    niveau: string,
    motif?: string,
  ) => void
  annuler: (demandeId: string) => void
  lastAction: { type: string; message: string } | null
  clearLastAction: () => void
}

const ValidationsWorkflowContext = createContext<ValidationsWorkflowContextValue | null>(null)

export function ValidationsWorkflowProvider({ children }: { children: React.ReactNode }) {
  const [decisions, setDecisions] = useState<Record<string, ValidationDecisionEntry>>({})
  const [hydrated, setHydrated] = useState(false)
  const [lastAction, setLastAction] = useState<{ type: string; message: string } | null>(null)

  useEffect(() => {
    setDecisions(loadValidationDecisions())
    setHydrated(true)
  }, [])

  useEffect(() => { if (hydrated) saveValidationDecisions(decisions) }, [decisions, hydrated])

  const getDecision = useCallback(
    (demandeId: string) => decisions[demandeId],
    [decisions],
  )

  const decider = useCallback((
    demandeId: string,
    decision: DecisionValidation,
    decidedBy: string,
    niveau: string,
    motif?: string,
  ) => {
    setDecisions(prev => ({
      ...prev,
      [demandeId]: buildDecision(demandeId, decision, decidedBy, niveau, motif),
    }))
    setLastAction({
      type: decision.toLowerCase(),
      message: decision === 'VALIDEE' ? 'Demande validée et tracée.' : 'Demande refusée et tracée.',
    })
  }, [])

  const annuler = useCallback((demandeId: string) => {
    setDecisions(prev => {
      const next = { ...prev }
      delete next[demandeId]
      return next
    })
    setLastAction({ type: 'annule', message: 'Décision annulée — la demande revient en attente.' })
  }, [])

  const value = useMemo<ValidationsWorkflowContextValue>(() => ({
    decisions,
    getDecision,
    decider,
    annuler,
    lastAction,
    clearLastAction: () => setLastAction(null),
  }), [decisions, getDecision, decider, annuler, lastAction])

  return (
    <ValidationsWorkflowContext.Provider value={value}>
      {children}
    </ValidationsWorkflowContext.Provider>
  )
}

export function useValidationsWorkflow() {
  const ctx = useContext(ValidationsWorkflowContext)
  if (!ctx) throw new Error('useValidationsWorkflow must be used within ValidationsWorkflowProvider')
  return ctx
}
