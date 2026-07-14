'use client'

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react'
import { useAuth } from './AuthContext'
import {
  findAction,
  loadStockJournal,
  removeAction,
  saveStockJournal,
  upsertAction,
  type StockActionEntry,
  type StockActionKind,
} from '@/lib/stock-workflow'

interface ExecuterInput {
  label: string
  detail?: string
  message?: string
  payload?: Record<string, unknown>
}

interface StockWorkflowContextValue {
  journal: StockActionEntry[]
  isDone: (kind: StockActionKind, refId: string) => boolean
  getEntry: (kind: StockActionKind, refId: string) => StockActionEntry | undefined
  executer: (kind: StockActionKind, refId: string, input: ExecuterInput) => void
  annuler: (entryId: string) => void
  lastAction: { type: string; message: string } | null
  clearLastAction: () => void
}

const StockWorkflowContext = createContext<StockWorkflowContextValue | null>(null)

export function StockWorkflowProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [journal, setJournal] = useState<StockActionEntry[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [lastAction, setLastAction] = useState<{ type: string; message: string } | null>(null)

  useEffect(() => {
    setJournal(loadStockJournal())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) saveStockJournal(journal)
  }, [journal, hydrated])

  const getEntry = useCallback(
    (kind: StockActionKind, refId: string) => findAction(journal, kind, refId),
    [journal],
  )

  const isDone = useCallback(
    (kind: StockActionKind, refId: string) => !!findAction(journal, kind, refId),
    [journal],
  )

  const executer = useCallback((kind: StockActionKind, refId: string, input: ExecuterInput) => {
    setJournal(prev => upsertAction(prev, kind, refId, {
      label: input.label,
      detail: input.detail,
      by: user?.nom ?? 'Opérateur',
      payload: input.payload,
    }))
    setLastAction({ type: kind, message: input.message ?? input.label })
  }, [user?.nom])

  const annuler = useCallback((entryId: string) => {
    setJournal(prev => removeAction(prev, entryId))
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
    <StockWorkflowContext.Provider value={value}>
      {children}
    </StockWorkflowContext.Provider>
  )
}

export function useStockWorkflow() {
  const ctx = useContext(StockWorkflowContext)
  if (!ctx) throw new Error('useStockWorkflow must be used within StockWorkflowProvider')
  return ctx
}
