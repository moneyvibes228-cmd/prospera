'use client'

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react'
import { useAuth } from './AuthContext'
import {
  clearDecision,
  findDecision,
  loadDecisions,
  saveDecisions,
  setDecision,
  type DecisionEntry,
  type DecisionKind,
} from '@/lib/decisions-workflow'

interface DeciderInput {
  label: string
  detail?: string
  message?: string
}

interface DecisionsWorkflowContextValue {
  journal: DecisionEntry[]
  getChoix: (kind: DecisionKind, refId: string) => string | undefined
  getEntry: (kind: DecisionKind, refId: string) => DecisionEntry | undefined
  /** Pose une décision. Re-poser le même `choix` l'efface (toggle). */
  decider: (kind: DecisionKind, refId: string, choix: string, input: DeciderInput) => void
  effacer: (kind: DecisionKind, refId: string) => void
  lastAction: { type: string; message: string } | null
  clearLastAction: () => void
}

const DecisionsWorkflowContext = createContext<DecisionsWorkflowContextValue | null>(null)

export function DecisionsWorkflowProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [journal, setJournal] = useState<DecisionEntry[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [lastAction, setLastAction] = useState<{ type: string; message: string } | null>(null)

  useEffect(() => {
    setJournal(loadDecisions())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) saveDecisions(journal)
  }, [journal, hydrated])

  const getEntry = useCallback(
    (kind: DecisionKind, refId: string) => findDecision(journal, kind, refId),
    [journal],
  )

  const getChoix = useCallback(
    (kind: DecisionKind, refId: string) => findDecision(journal, kind, refId)?.choix,
    [journal],
  )

  const decider = useCallback((kind: DecisionKind, refId: string, choix: string, input: DeciderInput) => {
    setJournal(prev => {
      const actuel = findDecision(prev, kind, refId)
      if (actuel && actuel.choix === choix) {
        setLastAction({ type: 'annule', message: 'Décision annulée.' })
        return clearDecision(prev, kind, refId)
      }
      setLastAction({ type: kind, message: input.message ?? input.label })
      return setDecision(prev, kind, refId, choix, {
        label: input.label,
        detail: input.detail,
        by: user?.nom ?? 'Décideur',
      })
    })
  }, [user?.nom])

  const effacer = useCallback((kind: DecisionKind, refId: string) => {
    setJournal(prev => clearDecision(prev, kind, refId))
    setLastAction({ type: 'annule', message: 'Décision annulée.' })
  }, [])

  const value = useMemo(() => ({
    journal,
    getChoix,
    getEntry,
    decider,
    effacer,
    lastAction,
    clearLastAction: () => setLastAction(null),
  }), [journal, getChoix, getEntry, decider, effacer, lastAction])

  return (
    <DecisionsWorkflowContext.Provider value={value}>
      {children}
    </DecisionsWorkflowContext.Provider>
  )
}

export function useDecisionsWorkflow() {
  const ctx = useContext(DecisionsWorkflowContext)
  if (!ctx) throw new Error('useDecisionsWorkflow must be used within DecisionsWorkflowProvider')
  return ctx
}
