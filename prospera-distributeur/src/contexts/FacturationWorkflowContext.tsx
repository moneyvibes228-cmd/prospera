'use client'

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react'
import type { Proforma, CanalEnvoiProforma } from '@/types'
import { useAuth } from './AuthContext'
import {
  findEvent,
  genererReference,
  loadDocEvents,
  loadProformasCreees,
  removeEvent,
  saveDocEvents,
  saveProformasCreees,
  upsertEvent,
  type DocEvent,
} from '@/lib/facturation-workflow'

const CANAL_LABEL_COURT: Record<CanalEnvoiProforma, string> = {
  WHATSAPP: 'WhatsApp',
  EMAIL: 'e-mail',
  SMS: 'SMS',
  IMPRESSION: 'impression',
}

interface ConversionResultat {
  commande_ref: string
  facture_ref: string
}

interface FacturationWorkflowContextValue {
  proformasCreees: Proforma[]
  docEvents: DocEvent[]
  creerProforma: (proforma: Proforma) => void
  convertir: (proforma: Proforma) => ConversionResultat
  getConversion: (proformaId: string) => ConversionResultat | null
  estConvertie: (proforma: Proforma) => boolean
  relancer: (proforma: Proforma, canal: CanalEnvoiProforma) => void
  getRelanceCount: (proforma: Proforma) => number
  retransmettre: (factureId: string, numero: string) => void
  estRetransmise: (factureId: string) => boolean
  lastAction: { type: string; message: string } | null
  clearLastAction: () => void
}

const FacturationWorkflowContext = createContext<FacturationWorkflowContextValue | null>(null)

export function FacturationWorkflowProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [proformasCreees, setProformasCreees] = useState<Proforma[]>([])
  const [docEvents, setDocEvents] = useState<DocEvent[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [lastAction, setLastAction] = useState<{ type: string; message: string } | null>(null)

  useEffect(() => {
    setProformasCreees(loadProformasCreees())
    setDocEvents(loadDocEvents())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) saveProformasCreees(proformasCreees)
  }, [proformasCreees, hydrated])

  useEffect(() => {
    if (hydrated) saveDocEvents(docEvents)
  }, [docEvents, hydrated])

  const who = user?.nom ?? 'Opérateur'

  const creerProforma = useCallback((proforma: Proforma) => {
    setProformasCreees(prev => {
      if (prev.some(p => p.id === proforma.id)) return prev
      return [proforma, ...prev]
    })
    setLastAction({ type: 'proforma', message: `Proforma ${proforma.numero} envoyée à ${proforma.pdv_nom}.` })
  }, [])

  const getConversion = useCallback((proformaId: string): ConversionResultat | null => {
    const ev = findEvent(docEvents, 'CONVERSION', proformaId)
    if (!ev?.payload) return null
    return {
      commande_ref: String(ev.payload.commande_ref ?? ''),
      facture_ref: String(ev.payload.facture_ref ?? ''),
    }
  }, [docEvents])

  const estConvertie = useCallback(
    (proforma: Proforma) => proforma.statut === 'CONVERTIE' || !!findEvent(docEvents, 'CONVERSION', proforma.id),
    [docEvents],
  )

  const convertir = useCallback((proforma: Proforma): ConversionResultat => {
    const existante = getConversion(proforma.id)
    if (existante) return existante

    const seq = 210 + docEvents.filter(e => e.kind === 'CONVERSION').length + 1
    const resultat: ConversionResultat = {
      commande_ref: genererReference('CMD', seq),
      facture_ref: genererReference('FAC', seq),
    }
    setDocEvents(prev => upsertEvent(prev, 'CONVERSION', proforma.id, {
      by: who,
      payload: { ...resultat, pdv_nom: proforma.pdv_nom, montant_ttc: proforma.montant_ttc },
    }))
    setProformasCreees(prev => prev.map(p => p.id === proforma.id
      ? { ...p, statut: 'CONVERTIE', commande_ref: resultat.commande_ref, facture_ref: resultat.facture_ref }
      : p))
    setLastAction({
      type: 'conversion',
      message: `${proforma.numero} convertie → commande ${resultat.commande_ref} · facture ${resultat.facture_ref}.`,
    })
    return resultat
  }, [docEvents, getConversion, who])

  const getRelanceCount = useCallback((proforma: Proforma) => {
    const ev = findEvent(docEvents, 'RELANCE', proforma.id)
    const supplementaires = ev?.payload ? Number(ev.payload.count ?? 0) : 0
    return proforma.relances_envoyees + supplementaires
  }, [docEvents])

  const relancer = useCallback((proforma: Proforma, canal: CanalEnvoiProforma) => {
    const ev = findEvent(docEvents, 'RELANCE', proforma.id)
    const count = (ev?.payload ? Number(ev.payload.count ?? 0) : 0) + 1
    setDocEvents(prev => upsertEvent(prev, 'RELANCE', proforma.id, {
      by: who,
      payload: { count, canal },
    }))
    setLastAction({
      type: 'relance',
      message: `Relance ${canal ? CANAL_LABEL_COURT[canal] : ''} envoyée à ${proforma.pdv_nom} (${count}).`,
    })
  }, [docEvents, who])

  const estRetransmise = useCallback(
    (factureId: string) => !!findEvent(docEvents, 'RETRANSMISSION', factureId),
    [docEvents],
  )

  const retransmettre = useCallback((factureId: string, numero: string) => {
    setDocEvents(prev => upsertEvent(prev, 'RETRANSMISSION', factureId, { by: who }))
    setLastAction({ type: 'retransmission', message: `${numero} corrigée et retransmise à la plateforme.` })
  }, [who])

  const value = useMemo(() => ({
    proformasCreees,
    docEvents,
    creerProforma,
    convertir,
    getConversion,
    estConvertie,
    relancer,
    getRelanceCount,
    retransmettre,
    estRetransmise,
    lastAction,
    clearLastAction: () => setLastAction(null),
  }), [
    proformasCreees, docEvents, creerProforma, convertir, getConversion, estConvertie,
    relancer, getRelanceCount, retransmettre, estRetransmise, lastAction,
  ])

  return (
    <FacturationWorkflowContext.Provider value={value}>
      {children}
    </FacturationWorkflowContext.Provider>
  )
}

export function useFacturationWorkflow() {
  const ctx = useContext(FacturationWorkflowContext)
  if (!ctx) throw new Error('useFacturationWorkflow must be used within FacturationWorkflowProvider')
  return ctx
}
