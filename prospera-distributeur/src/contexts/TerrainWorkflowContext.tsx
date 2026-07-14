'use client'

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react'
import type { ResultatVisite, Visite } from '@/types'
import {
  appliquerOverrides,
  loadCommandesTerrain,
  loadPanier,
  loadVisiteOverrides,
  montantPanier,
  panierVersCommande,
  saveCommandesTerrain,
  savePanier,
  saveVisiteOverrides,
  type CanalCommande,
  type CommandeTerrain,
  type PanierLigne,
  type VisiteOverride,
} from '@/lib/terrain-workflow'
import { nowIso } from '@/lib/persistence'

export interface ClotureVisitePayload {
  resultat: ResultatVisite
  montant_commande?: number
  montant_encaisse?: number
  commentaire?: string
}

interface TerrainWorkflowContextValue {
  overrides: Record<string, VisiteOverride>
  panier: PanierLigne[]
  panierTotal: number
  panierCount: number
  commandes: CommandeTerrain[]
  appliquer: (visites: Visite[]) => Visite[]
  demarrerVisite: (visiteId: string) => void
  cloturerVisite: (visiteId: string, payload: ClotureVisitePayload) => void
  ajouterAuPanier: (ligne: Omit<PanierLigne, 'quantite'>, quantite?: number) => void
  changerQuantite: (reference: string, quantite: number) => void
  retirerDuPanier: (reference: string) => void
  viderPanier: () => void
  creerCommande: (pdv_nom: string, canal: CanalCommande, createdBy: string) => CommandeTerrain | null
  lastAction: { type: string; message: string } | null
  clearLastAction: () => void
}

const TerrainWorkflowContext = createContext<TerrainWorkflowContextValue | null>(null)

export function TerrainWorkflowProvider({ children }: { children: React.ReactNode }) {
  const [overrides, setOverrides] = useState<Record<string, VisiteOverride>>({})
  const [panier, setPanier] = useState<PanierLigne[]>([])
  const [commandes, setCommandes] = useState<CommandeTerrain[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [lastAction, setLastAction] = useState<{ type: string; message: string } | null>(null)

  useEffect(() => {
    setOverrides(loadVisiteOverrides())
    setPanier(loadPanier())
    setCommandes(loadCommandesTerrain())
    setHydrated(true)
  }, [])

  useEffect(() => { if (hydrated) saveVisiteOverrides(overrides) }, [overrides, hydrated])
  useEffect(() => { if (hydrated) savePanier(panier) }, [panier, hydrated])
  useEffect(() => { if (hydrated) saveCommandesTerrain(commandes) }, [commandes, hydrated])

  const appliquer = useCallback(
    (visites: Visite[]) => appliquerOverrides(visites, overrides),
    [overrides],
  )

  const demarrerVisite = useCallback((visiteId: string) => {
    setOverrides(prev => ({
      ...prev,
      [visiteId]: { ...prev[visiteId], visiteId, statut: 'EN_COURS', demarreeAt: nowIso() },
    }))
    setLastAction({ type: 'visite', message: 'Visite démarrée — bonne tournée !' })
  }, [])

  const cloturerVisite = useCallback((visiteId: string, payload: ClotureVisitePayload) => {
    setOverrides(prev => ({
      ...prev,
      [visiteId]: {
        ...prev[visiteId],
        visiteId,
        statut: 'FAITE',
        clotureeAt: nowIso(),
        resultat: payload.resultat,
        montant_commande: payload.montant_commande,
        montant_encaisse: payload.montant_encaisse,
        commentaire: payload.commentaire,
      },
    }))
    setLastAction({ type: 'visite', message: 'Visite clôturée et enregistrée.' })
  }, [])

  const ajouterAuPanier = useCallback((ligne: Omit<PanierLigne, 'quantite'>, quantite = 1) => {
    setPanier(prev => {
      const idx = prev.findIndex(l => l.reference === ligne.reference)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], quantite: next[idx].quantite + quantite }
        return next
      }
      return [...prev, { ...ligne, quantite }]
    })
    setLastAction({ type: 'panier', message: `« ${ligne.nom} » ajouté au panier.` })
  }, [])

  const changerQuantite = useCallback((reference: string, quantite: number) => {
    setPanier(prev => prev
      .map(l => (l.reference === reference ? { ...l, quantite: Math.max(0, quantite) } : l))
      .filter(l => l.quantite > 0))
  }, [])

  const retirerDuPanier = useCallback((reference: string) => {
    setPanier(prev => prev.filter(l => l.reference !== reference))
  }, [])

  const viderPanier = useCallback(() => setPanier([]), [])

  const creerCommande = useCallback(
    (pdv_nom: string, canal: CanalCommande, createdBy: string): CommandeTerrain | null => {
      if (panier.length === 0) return null
      const commande = panierVersCommande(panier, pdv_nom, canal, createdBy)
      setCommandes(prev => [commande, ...prev])
      setPanier([])
      setLastAction({
        type: 'commande',
        message: `Commande ${pdv_nom} transmise (${commande.lignes.length} lignes).`,
      })
      return commande
    },
    [panier],
  )

  const value = useMemo<TerrainWorkflowContextValue>(() => ({
    overrides,
    panier,
    panierTotal: montantPanier(panier),
    panierCount: panier.reduce((s, l) => s + l.quantite, 0),
    commandes,
    appliquer,
    demarrerVisite,
    cloturerVisite,
    ajouterAuPanier,
    changerQuantite,
    retirerDuPanier,
    viderPanier,
    creerCommande,
    lastAction,
    clearLastAction: () => setLastAction(null),
  }), [
    overrides, panier, commandes, appliquer, demarrerVisite, cloturerVisite,
    ajouterAuPanier, changerQuantite, retirerDuPanier, viderPanier, creerCommande, lastAction,
  ])

  return (
    <TerrainWorkflowContext.Provider value={value}>
      {children}
    </TerrainWorkflowContext.Provider>
  )
}

export function useTerrainWorkflow() {
  const ctx = useContext(TerrainWorkflowContext)
  if (!ctx) throw new Error('useTerrainWorkflow must be used within TerrainWorkflowProvider')
  return ctx
}
