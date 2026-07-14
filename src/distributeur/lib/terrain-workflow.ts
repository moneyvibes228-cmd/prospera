/**
 * Workflow terrain — boucle « visite → commande → clôture » persistée.
 *
 * Répond aux boutons morts de l'audit (§3.5) :
 *  - `Y aller` / `Clôturer` (MonActiviteView) → transitions de statut de visite
 *  - `Ajouter` (DisponibiliteView) → panier de commande terrain
 *  - `Nouvelle commande terrain` (CommandesView) → création persistée
 *
 * Aucun backend : tout est persisté en localStorage (offline-first light),
 * sur le modèle du workflow Combos stock.
 */
import type { ResultatVisite, StatutVisite, Visite } from '@distributeur/types'
import { genId, loadJSON, nowIso, saveJSON } from './persistence'

export const STORAGE_VISITES = 'prospera-terrain-visites'
export const STORAGE_PANIER = 'prospera-terrain-panier'
export const STORAGE_COMMANDES = 'prospera-terrain-commandes'

/** Mutation locale appliquée par-dessus une visite du registre (lecture seule). */
export interface VisiteOverride {
  visiteId: string
  statut: StatutVisite
  demarreeAt?: string
  clotureeAt?: string
  resultat?: ResultatVisite
  montant_commande?: number
  montant_encaisse?: number
  commentaire?: string
}

export interface PanierLigne {
  reference: string
  nom: string
  prix: number
  quantite: number
}

export type CanalCommande = 'TERRAIN' | 'WHATSAPP' | 'TELEPHONE'

export interface CommandeTerrain {
  id: string
  pdv_nom: string
  createdAt: string
  createdBy: string
  canal: CanalCommande
  lignes: PanierLigne[]
  montant_total: number
  statut: 'BROUILLON' | 'TRANSMISE'
}

export function loadVisiteOverrides(): Record<string, VisiteOverride> {
  return loadJSON<Record<string, VisiteOverride>>(STORAGE_VISITES, {})
}
export function saveVisiteOverrides(v: Record<string, VisiteOverride>): void {
  saveJSON(STORAGE_VISITES, v)
}

export function loadPanier(): PanierLigne[] {
  return loadJSON<PanierLigne[]>(STORAGE_PANIER, [])
}
export function savePanier(p: PanierLigne[]): void {
  saveJSON(STORAGE_PANIER, p)
}

export function loadCommandesTerrain(): CommandeTerrain[] {
  return loadJSON<CommandeTerrain[]>(STORAGE_COMMANDES, [])
}
export function saveCommandesTerrain(c: CommandeTerrain[]): void {
  saveJSON(STORAGE_COMMANDES, c)
}

/** Applique les mutations locales par-dessus une liste de visites du registre. */
export function appliquerOverrides(
  visites: Visite[],
  overrides: Record<string, VisiteOverride>,
): Visite[] {
  return visites.map(v => {
    const o = overrides[v.id]
    if (!o) return v
    return {
      ...v,
      statut: o.statut,
      resultat: o.resultat ?? v.resultat,
      montant_commande: o.montant_commande ?? v.montant_commande,
      montant_encaisse: o.montant_encaisse ?? v.montant_encaisse,
      commentaire: o.commentaire ?? v.commentaire,
    }
  })
}

export function montantPanier(panier: PanierLigne[]): number {
  return panier.reduce((s, l) => s + l.prix * l.quantite, 0)
}

export function panierVersCommande(
  panier: PanierLigne[],
  pdv_nom: string,
  canal: CanalCommande,
  createdBy: string,
): CommandeTerrain {
  return {
    id: genId('cmd-terrain'),
    pdv_nom,
    createdAt: nowIso(),
    createdBy,
    canal,
    lignes: panier.map(l => ({ ...l })),
    montant_total: montantPanier(panier),
    statut: 'TRANSMISE',
  }
}
