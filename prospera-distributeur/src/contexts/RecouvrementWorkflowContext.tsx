'use client'

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react'
import {
  buildEvent,
  etatDossier,
  loadRecouvrementEvents,
  saveRecouvrementEvents,
  type DossierRecouvrementState,
  type EvenementRecouvrement,
  type EvenementRecouvrementType,
} from '@/lib/recouvrement-workflow'

type ActionExtra = Partial<Pick<EvenementRecouvrement, 'canal' | 'montant' | 'echeance' | 'note'>>

interface RecouvrementWorkflowContextValue {
  events: EvenementRecouvrement[]
  etat: (dossierId: string) => DossierRecouvrementState
  ajouterEvenement: (
    dossierId: string,
    type: EvenementRecouvrementType,
    auteur: string,
    extra?: ActionExtra,
  ) => void
  annulerDernier: (dossierId: string) => void
  lastAction: { type: string; message: string } | null
  clearLastAction: () => void
}

const RecouvrementWorkflowContext = createContext<RecouvrementWorkflowContextValue | null>(null)

const MESSAGES: Record<EvenementRecouvrementType, string> = {
  RELANCE: 'Relance envoyée et journalisée.',
  PAIEMENT: 'Paiement enregistré (lettrage 411 à venir).',
  PROMESSE: 'Promesse de paiement enregistrée.',
  ESCALADE: 'Dossier escaladé en contentieux.',
  BLOCAGE_CREDIT: 'Crédit client bloqué.',
  DEBLOCAGE_CREDIT: 'Crédit client débloqué.',
  CLOTURE: 'Dossier clôturé.',
}

export function RecouvrementWorkflowProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<EvenementRecouvrement[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [lastAction, setLastAction] = useState<{ type: string; message: string } | null>(null)

  useEffect(() => {
    setEvents(loadRecouvrementEvents())
    setHydrated(true)
  }, [])

  useEffect(() => { if (hydrated) saveRecouvrementEvents(events) }, [events, hydrated])

  const etat = useCallback(
    (dossierId: string) => etatDossier(events, dossierId),
    [events],
  )

  const ajouterEvenement = useCallback((
    dossierId: string,
    type: EvenementRecouvrementType,
    auteur: string,
    extra: ActionExtra = {},
  ) => {
    setEvents(prev => [...prev, buildEvent(dossierId, type, auteur, extra)])
    setLastAction({ type: type.toLowerCase(), message: MESSAGES[type] })
  }, [])

  const annulerDernier = useCallback((dossierId: string) => {
    setEvents(prev => {
      const idx = [...prev].reverse().findIndex(e => e.dossierId === dossierId)
      if (idx < 0) return prev
      const realIdx = prev.length - 1 - idx
      return prev.filter((_, i) => i !== realIdx)
    })
    setLastAction({ type: 'annule', message: 'Dernière action annulée.' })
  }, [])

  const value = useMemo<RecouvrementWorkflowContextValue>(() => ({
    events,
    etat,
    ajouterEvenement,
    annulerDernier,
    lastAction,
    clearLastAction: () => setLastAction(null),
  }), [events, etat, ajouterEvenement, annulerDernier, lastAction])

  return (
    <RecouvrementWorkflowContext.Provider value={value}>
      {children}
    </RecouvrementWorkflowContext.Provider>
  )
}

export function useRecouvrementWorkflow() {
  const ctx = useContext(RecouvrementWorkflowContext)
  if (!ctx) throw new Error('useRecouvrementWorkflow must be used within RecouvrementWorkflowProvider')
  return ctx
}
