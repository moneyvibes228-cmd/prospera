'use client'

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react'
import { useAuth } from './AuthContext'
import {
  clearCibleStatut,
  findAutomationEntry,
  loadAutomationJournalWF,
  saveAutomationJournalWF,
  setCibleStatut,
  toggleRegleOff,
  type AutomationEntry,
  type CibleStatut,
} from '@/lib/automation-workflow'

interface AutomationWorkflowContextValue {
  journal: AutomationEntry[]
  regleActive: (regleId: string) => boolean
  basculerRegle: (regleId: string, nom: string) => void
  cibleStatut: (cibleId: string) => CibleStatut | undefined
  traiterCible: (cibleId: string, choix: CibleStatut, input: { label: string; message?: string }) => void
  annulerCible: (cibleId: string) => void
  lastAction: { type: string; message: string } | null
  clearLastAction: () => void
}

const AutomationWorkflowContext = createContext<AutomationWorkflowContextValue | null>(null)

export function AutomationWorkflowProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [journal, setJournal] = useState<AutomationEntry[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [lastAction, setLastAction] = useState<{ type: string; message: string } | null>(null)

  useEffect(() => {
    setJournal(loadAutomationJournalWF())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) saveAutomationJournalWF(journal)
  }, [journal, hydrated])

  const regleActive = useCallback(
    (regleId: string) => !findAutomationEntry(journal, 'REGLE_OFF', regleId),
    [journal],
  )

  const basculerRegle = useCallback((regleId: string, nom: string) => {
    setJournal(prev => {
      const { journal: next, desactivee } = toggleRegleOff(prev, regleId, user?.nom ?? 'Opérateur', `Règle « ${nom} »`)
      setLastAction({
        type: desactivee ? 'annule' : 'active',
        message: desactivee ? `Règle « ${nom} » désactivée.` : `Règle « ${nom} » réactivée.`,
      })
      return next
    })
  }, [user?.nom])

  const cibleStatut = useCallback(
    (cibleId: string) => findAutomationEntry(journal, 'CIBLE_TRAITEE', cibleId)?.choix,
    [journal],
  )

  const traiterCible = useCallback((cibleId: string, choix: CibleStatut, input: { label: string; message?: string }) => {
    setJournal(prev => setCibleStatut(prev, cibleId, choix, user?.nom ?? 'Opérateur', input.label))
    setLastAction({ type: choix === 'IGNOREE' ? 'annule' : 'active', message: input.message ?? input.label })
  }, [user?.nom])

  const annulerCible = useCallback((cibleId: string) => {
    setJournal(prev => clearCibleStatut(prev, cibleId))
    setLastAction({ type: 'annule', message: 'Action annulée.' })
  }, [])

  const value = useMemo(() => ({
    journal,
    regleActive,
    basculerRegle,
    cibleStatut,
    traiterCible,
    annulerCible,
    lastAction,
    clearLastAction: () => setLastAction(null),
  }), [journal, regleActive, basculerRegle, cibleStatut, traiterCible, annulerCible, lastAction])

  return (
    <AutomationWorkflowContext.Provider value={value}>
      {children}
    </AutomationWorkflowContext.Provider>
  )
}

export function useAutomationWorkflow() {
  const ctx = useContext(AutomationWorkflowContext)
  if (!ctx) throw new Error('useAutomationWorkflow must be used within AutomationWorkflowProvider')
  return ctx
}
