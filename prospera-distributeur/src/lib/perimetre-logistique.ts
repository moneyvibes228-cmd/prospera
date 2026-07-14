/**
 * Périmètre logistique — l'assiette de données des postes de la chaîne physique.
 *
 * `perimetre.ts` découpe le monde en territoires commerciaux (zone, région, portefeuille).
 * Ce découpage-là ne dit rien des postes logistiques : il les range tous en « RESEAU »,
 * et c'est exactement pourquoi le gestionnaire d'entrepôt voyait le tableau de bord du DG.
 *
 * La logistique se découpe autrement — par **entrepôt**, et par **droit de voir l'argent** :
 *
 *   Responsable Stock & Logistique — pilote les 2 entrepôts. Il arbitre en coût d'achat
 *     (immobilisation, coût de rupture, coût de transfert). Il ne pilote pas la marge
 *     commerciale : ce n'est pas lui qui fixe les prix de vente.
 *
 *   Gestionnaire Entrepôt — pilote SON entrepôt, à la journée. Son unité de compte, c'est
 *     la ligne de picking, le kilo, la palette et l'heure de départ du camion. Lui montrer
 *     une marge produit ou un CA réseau, c'est du bruit — et une fuite d'information.
 */

import type { UserRole } from '@/types'
import type { AuthUser } from './auth'
import { TOPOLOGIE_ENTREPOTS } from './registries/entrepot-logistique-registry'

export type NiveauLogistique = 'RESEAU' | 'ENTREPOT' | 'AUCUN'

export interface PerimetreLogistique {
  niveau: NiveauLogistique
  /** Entrepôts que le poste a le droit de voir. Vide ⇒ aucun accès logistique. */
  entrepots: string[]
  libelle: string
  estReseau: boolean
  /**
   * Droit de voir la valeur d'achat du stock : immobilisation, coût de rupture, dette.
   * C'est la monnaie du responsable stock — pas celle du magasinier.
   */
  voitValeurAchat: boolean
  /** Droit de voir la valeur commerciale : prix de vente, marge, CA, rentabilité produit. */
  voitValeurCommerciale: boolean
  /** Droit d'engager de l'argent : valider une commande fournisseur, lancer un transfert. */
  peutEngager: boolean
  /** Droit de modifier la politique de stock : seuils, règles de réappro, niveau d'automatisation. */
  peutParametrerReappro: boolean
}

const TOUS_LES_ENTREPOTS = TOPOLOGIE_ENTREPOTS.map(t => t.entrepot)

/** Direction et finance : tout, y compris la marge. */
const ROLES_DIRECTION: UserRole[] = ['DG', 'DC', 'DAF']

/**
 * Rattachement d'un poste mono-entrepôt. En production ce champ viendrait de la fiche
 * agent ; en démo il est porté par le compte (`AuthUser.entrepot`) avec ce repli.
 */
const ENTREPOT_PAR_DEFAUT_ROLE: Partial<Record<UserRole, string>> = {
  GEST_ENTREPOT: 'Lomé Port',
}

export function getPerimetreLogistique(user?: Pick<AuthUser, 'role' | 'entrepot'> | null): PerimetreLogistique {
  const role = user?.role

  if (!role) return aucun()

  if (ROLES_DIRECTION.includes(role)) {
    return {
      niveau: 'RESEAU',
      entrepots: TOUS_LES_ENTREPOTS,
      libelle: 'Réseau logistique — Lomé Port + Kara',
      estReseau: true,
      voitValeurAchat: true,
      voitValeurCommerciale: true,
      peutEngager: true,
      peutParametrerReappro: role === 'DG',
    }
  }

  if (role === 'RESP_STOCK') {
    return {
      niveau: 'RESEAU',
      entrepots: TOUS_LES_ENTREPOTS,
      libelle: 'Réseau logistique — Lomé Port + Kara',
      estReseau: true,
      voitValeurAchat: true,
      // Il arbitre le stock, pas le prix de vente : la marge n'est pas son levier.
      voitValeurCommerciale: false,
      peutEngager: true,
      peutParametrerReappro: true,
    }
  }

  if (role === 'GEST_ENTREPOT') {
    const entrepot = user?.entrepot ?? ENTREPOT_PAR_DEFAUT_ROLE.GEST_ENTREPOT!
    return {
      niveau: 'ENTREPOT',
      entrepots: [entrepot],
      libelle: `Entrepôt ${entrepot}`,
      estReseau: false,
      voitValeurAchat: false,
      voitValeurCommerciale: false,
      // Il exécute le flux physique ; il n'engage pas la trésorerie de la société.
      peutEngager: false,
      peutParametrerReappro: false,
    }
  }

  // COMPTABLE, MARKETING, commerciaux… : le stock les concerne en lecture, pas la logistique.
  return aucun()
}

function aucun(): PerimetreLogistique {
  return {
    niveau: 'AUCUN',
    entrepots: [],
    libelle: 'Hors périmètre logistique',
    estReseau: false,
    voitValeurAchat: false,
    voitValeurCommerciale: false,
    peutEngager: false,
    peutParametrerReappro: false,
  }
}

/** Restreint une collection portant un `entrepot` au périmètre du poste. */
export function filtrerParEntrepot<T extends { entrepot?: string }>(
  items: readonly T[],
  p: PerimetreLogistique,
): T[] {
  if (p.estReseau) return [...items]
  if (p.entrepots.length === 0) return []
  return items.filter(i => i.entrepot != null && p.entrepots.includes(i.entrepot))
}
