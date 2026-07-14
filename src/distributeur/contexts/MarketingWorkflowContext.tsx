'use client'

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react'
import { useAuth } from './AuthContext'
import {
  findMarketingAction,
  loadMarketingJournal,
  removeMarketingAction,
  saveMarketingJournal,
  upsertMarketingAction,
  type MarketingActionEntry,
  type MarketingActionKind,
} from '@distributeur/lib/marketing-workflow'

interface ExecuterInput {
  label: string
  detail?: string
  message?: string
  payload?: Record<string, unknown>
}

export interface MarketingWorkflowContextValue {
  journal: MarketingActionEntry[]
  isDone: (kind: MarketingActionKind, refId: string) => boolean
  getEntry: (kind: MarketingActionKind, refId: string) => MarketingActionEntry | undefined
  executer: (kind: MarketingActionKind, refId: string, input: ExecuterInput) => void
  annuler: (entryId: string) => void
  lastAction: { type: string; message: string } | null
  clearLastAction: () => void
}

const MarketingWorkflowContext = createContext<MarketingWorkflowContextValue | null>(null)

export function MarketingWorkflowProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [journal, setJournal] = useState<MarketingActionEntry[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [lastAction, setLastAction] = useState<{ type: string; message: string } | null>(null)

  useEffect(() => {
    setJournal(loadMarketingJournal())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) saveMarketingJournal(journal)
  }, [journal, hydrated])

  const getEntry = useCallback(
    (kind: MarketingActionKind, refId: string) => findMarketingAction(journal, kind, refId),
    [journal],
  )

  const isDone = useCallback(
    (kind: MarketingActionKind, refId: string) => !!findMarketingAction(journal, kind, refId),
    [journal],
  )

  const executer = useCallback((kind: MarketingActionKind, refId: string, input: ExecuterInput) => {
    setJournal(prev => upsertMarketingAction(prev, kind, refId, {
      label: input.label,
      detail: input.detail,
      by: user?.nom ?? 'Marketing',
      payload: input.payload,
    }))
    setLastAction({ type: kind, message: input.message ?? input.label })
  }, [user?.nom])

  const annuler = useCallback((entryId: string) => {
    setJournal(prev => removeMarketingAction(prev, entryId))
    setLastAction({ type: 'annulation', message: 'Action annulée.' })
  }, [])

  const value = useMemo(() => ({
    journal,
    isDone,
    getEntry,
    executer,
    annuler,
    lastAction,
    clearLastAction: () => setLastAction(null),
  }), [journal, isDone, getEntry, executer, annuler, lastAction])

  return (
    <MarketingWorkflowContext.Provider value={value}>
      {children}
    </MarketingWorkflowContext.Provider>
  )
}

export function useMarketingWorkflow() {
  const ctx = useContext(MarketingWorkflowContext)
  if (!ctx) throw new Error('useMarketingWorkflow must be used within MarketingWorkflowProvider')
  return ctx
}
