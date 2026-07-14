/**
 * Périmètre de données — qui a le droit de voir quoi.
 *
 * Dans une société de distribution, le poste ne définit pas seulement un menu :
 * il définit une **assiette de données**. Le superviseur de zone ne pilote pas
 * un réseau, il pilote SA zone ; le responsable des ventes pilote SA région.
 * Sans cette notion, tout le monde regarde le tableau de bord du DG.
 *
 * Quatre assiettes :
 *   RESEAU       — direction et fonctions support : tout, consolidé.
 *   REGION       — Responsable des Ventes : n zones, via ses superviseurs.
 *   ZONE         — Superviseur : 1 zone, ses commerciaux nommés.
 *   PORTEFEUILLE — Commercial / Freelance / Prospection : ses propres clients.
 */

import type { UserRole } from '@distributeur/types'
import {
  ZONES_DISTRIBUTION,
  getZonesDuSuperviseur,
  getZonesDuRespVentes,
  type ZoneDistribution,
} from './registries/zones-registry'
import { REGISTRE_COMMERCIAUX } from './registries/commerciaux-registry'

export type TypePerimetre = 'RESEAU' | 'REGION' | 'ZONE' | 'PORTEFEUILLE'

export interface Perimetre {
  type: TypePerimetre
  /** Libellé affichable — « Zone Lomé Nord », « Région Grand Lomé », « Réseau — Togo ». */
  libelle: string
  /** Zones du périmètre (clés canoniques). Vide ⇒ réseau entier, aucun filtre. */
  zones: string[]
  /** Noms des commerciaux du périmètre. Vide ⇒ pas de restriction par vendeur. */
  equipe: string[]
  /** Le périmètre couvre-t-il tout le réseau ? */
  estReseau: boolean
  /**
   * Renseigné pour les fonctions transverses : leur territoire est le réseau,
   * mais leur matière est restreinte (audience pour le marketing, créances pour
   * le recouvrement). C'est ce qui les empêche d'hériter du tableau de bord du DG.
   */
  fonction?: FonctionMetier
}

/** Rôles dont l'assiette est le réseau entier : direction + fonctions support transverses. */
const ROLES_RESEAU: UserRole[] = [
  'DG', 'DC', 'DAF', 'COMPTABLE', 'RESP_STOCK', 'GEST_ENTREPOT', 'MARKETING', 'RECOUVREMENT',
]

/**
 * Fonctions transverses : leur territoire est bien le réseau entier — un
 * marketeur cible tout le pays, un chargé de recouvrement poursuit toutes les
 * créances — mais leur *matière* est un sous-ensemble strict des données.
 *
 * C'est la distinction qui manquait : ils partageaient l'assiette du DG parce
 * qu'ils partagent son territoire, et se retrouvaient donc avec son tableau de
 * bord. Le territoire ne fait pas le métier. Le marketing travaille sur une
 * audience (et n'a rien à faire dans la trésorerie) ; le recouvrement travaille
 * sur des créances (et n'a rien à faire dans la marge par produit).
 */
export type FonctionMetier = 'MARKETING' | 'RECOUVREMENT'

const FONCTIONS: Partial<Record<UserRole, { fonction: FonctionMetier; libelle: string }>> = {
  MARKETING: { fonction: 'MARKETING', libelle: 'Audience réseau — campagnes & acquisition' },
  RECOUVREMENT: { fonction: 'RECOUVREMENT', libelle: 'Créances réseau — encours & impayés' },
}

/** La fonction métier d'un rôle, si c'en est une. */
export function fonctionMetier(role?: UserRole): FonctionMetier | undefined {
  return role ? FONCTIONS[role]?.fonction : undefined
}

/** Rôles porteurs d'un portefeuille client en propre. */
const ROLES_PORTEFEUILLE: UserRole[] = ['COMMERCIAL', 'FREELANCE', 'PROSPECTION']

export function estRoleReseau(role?: UserRole): boolean {
  return role != null && ROLES_RESEAU.includes(role)
}

export function estRolePortefeuille(role?: UserRole): boolean {
  return role != null && ROLES_PORTEFEUILLE.includes(role)
}

/** Rôles managers scopés sur un territoire (et non sur un portefeuille). */
export function estRoleTerritoire(role?: UserRole): boolean {
  return role === 'RESP_VENTES' || role === 'SUPERVISEUR'
}

const TOUTES_LES_ZONES = ZONES_DISTRIBUTION.map(z => z.cle)

const PERIMETRE_RESEAU: Perimetre = {
  type: 'RESEAU',
  libelle: 'Réseau — Togo',
  zones: [],
  equipe: [],
  estReseau: true,
}

/**
 * Le champ `zone` des registres est du texte libre hérité (« Kara / Centrale »,
 * « Zone Lomé Nord »). On le ramène aux clés canoniques du registre des zones.
 * Un libellé peut couvrir plusieurs zones, d'où le tableau en retour.
 */
export function zonesDepuisLibelle(libelle?: string): string[] {
  if (!libelle) return []
  const l = libelle.toLowerCase()
  return TOUTES_LES_ZONES.filter(cle => l.includes(cle.toLowerCase()))
}

/** Le périmètre d'un utilisateur, déduit de son rôle et de son rattachement. */
export function getPerimetre(user?: { role?: UserRole; nom?: string; zones?: string[] }): Perimetre {
  if (!user?.role) return PERIMETRE_RESEAU

  const metier = FONCTIONS[user.role]
  if (metier) {
    return { ...PERIMETRE_RESEAU, libelle: metier.libelle, fonction: metier.fonction }
  }

  if (estRoleReseau(user.role)) return PERIMETRE_RESEAU

  if (estRolePortefeuille(user.role)) {
    const moi = REGISTRE_COMMERCIAUX.find(c => c.nom === user.nom)
    return {
      type: 'PORTEFEUILLE',
      libelle: moi ? `Portefeuille ${moi.nom}` : 'Mon portefeuille',
      zones: moi ? zonesDepuisLibelle(moi.zone) : [],
      equipe: user.nom ? [user.nom] : [],
      estReseau: false,
    }
  }

  if (user.role === 'SUPERVISEUR') {
    const zones = resoudreZones(user, nom => getZonesDuSuperviseur(nom))
    return {
      type: 'ZONE',
      libelle: zones.length === 1 ? `Zone ${zones[0]}` : `Zones ${zones.join(' · ')}`,
      zones,
      equipe: commerciauxDesZones(zones),
      estReseau: false,
    }
  }

  if (user.role === 'RESP_VENTES') {
    const zones = resoudreZones(user, nom => getZonesDuRespVentes(nom))
    return {
      type: 'REGION',
      libelle: libelleRegion(zones),
      zones,
      equipe: commerciauxDesZones(zones),
      estReseau: false,
    }
  }

  return PERIMETRE_RESEAU
}

/**
 * Le rattachement fait foi (registre des zones). `user.zones` ne sert que de
 * secours pour un compte non encore rattaché — sinon un utilisateur sans
 * rattachement se retrouverait avec le réseau entier, ce qui est exactement
 * le bug qu'on corrige.
 */
function resoudreZones(
  user: { nom?: string; zones?: string[] },
  lookup: (nom: string) => ZoneDistribution[],
): string[] {
  const rattachees = user.nom ? lookup(user.nom).map(z => z.cle) : []
  if (rattachees.length > 0) return rattachees
  return (user.zones ?? []).filter(z => TOUTES_LES_ZONES.includes(z))
}

function commerciauxDesZones(zones: string[]): string[] {
  return REGISTRE_COMMERCIAUX.filter(c => zones.includes(c.zone)).map(c => c.nom)
}

function libelleRegion(zones: string[]): string {
  const ids = new Set(ZONES_DISTRIBUTION.filter(z => zones.includes(z.cle)).map(z => z.region_id))
  if (ids.size === 1) {
    const zone = ZONES_DISTRIBUTION.find(z => z.region_id === [...ids][0])
    if (zone) {
      const region = zone.region_id === 'reg-grand-lome' ? 'Grand Lomé' : 'Nord'
      return `Région ${region}`
    }
  }
  return zones.length > 0 ? `Région — ${zones.join(' · ')}` : 'Région'
}

/** Les zones du périmètre, enrichies des agrégats du registre. */
export function zonesDuPerimetre(p: Perimetre): ZoneDistribution[] {
  if (p.estReseau) return [...ZONES_DISTRIBUTION]
  return ZONES_DISTRIBUTION.filter(z => p.zones.includes(z.cle))
}

/* ------------------------------------------------------------------ */
/* Filtres                                                             */
/* ------------------------------------------------------------------ */

/** Restreint une collection portant une `zone` au territoire du périmètre. */
export function filtrerParZone<T extends { zone?: string }>(items: readonly T[], p: Perimetre): T[] {
  if (p.estReseau || p.zones.length === 0) return [...items]
  return items.filter(i => i.zone != null && p.zones.includes(i.zone))
}

/** Restreint une collection portant un `commercial` à l'équipe du périmètre. */
export function filtrerParEquipe<T extends { commercial?: string }>(items: readonly T[], p: Perimetre): T[] {
  if (p.estReseau || p.equipe.length === 0) return [...items]
  return items.filter(i => i.commercial != null && p.equipe.includes(i.commercial))
}

/**
 * Filtre de référence pour les collections métier : on scope par zone quand
 * l'objet en porte une (le cas normal), sinon on retombe sur le commercial.
 * Un PDV de la zone reste visible même s'il n'a pas encore de commercial affecté —
 * c'est justement le PDV que le superviseur doit voir.
 */
export function filtrerParPerimetre<T extends { zone?: string; commercial?: string }>(
  items: readonly T[],
  p: Perimetre,
): T[] {
  if (p.estReseau) return [...items]

  if (p.type === 'PORTEFEUILLE') return filtrerParEquipe(items, p)

  return items.filter(i => {
    if (i.zone != null) return p.zones.includes(i.zone)
    if (i.commercial != null) return p.equipe.includes(i.commercial)
    return false
  })
}
