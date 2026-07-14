/**
 * Optimisation d'itinéraire terrain (VRP simplifié).
 *
 * Un commercial reçoit sa tournée ordonnée par priorité métier (impayés, réclamations
 * d'abord). Ce module propose l'ordre le plus court en distance — le « meilleur trajet »
 * — pour comparer les deux et laisser l'humain choisir. Heuristique du plus proche voisin
 * (nearest-neighbor), suffisante et lisible pour un jeu de 5 à 15 arrêts.
 *
 * Aucune dépendance externe : distances à vol d'oiseau (haversine), ETA estimée en
 * milieu urbain. On reste sur des mocks — pas d'appel à une vraie API de routage.
 */
import { haversineKm } from './cartographie-distance-builder'

export interface StopGeo {
  id: string
  lat: number
  lng: number
  nom?: string
}

export interface Itineraire<T extends StopGeo> {
  ordre: T[]
  distance_km: number
  duree_min: number
}

/** Vitesse moyenne réaliste en distribution urbaine Togo (trafic, deux-roues). */
const VITESSE_KMH = 22
/** Temps passé en moyenne à chaque point de vente (déchargement, prise de commande). */
const ARRET_MIN = 12

function stopsValides<T extends StopGeo>(stops: T[]): T[] {
  return stops.filter(s => Number.isFinite(s.lat) && Number.isFinite(s.lng))
}

/** Distance cumulée d'un parcours dans l'ordre donné (km). */
export function distanceParcours(stops: StopGeo[]): number {
  let total = 0
  for (let i = 1; i < stops.length; i++) {
    total += haversineKm(stops[i - 1].lat, stops[i - 1].lng, stops[i].lat, stops[i].lng)
  }
  return Math.round(total * 10) / 10
}

/** Durée estimée d'un parcours : trajet + temps d'arrêt par point (min). */
export function dureeParcours(stops: StopGeo[]): number {
  if (stops.length === 0) return 0
  const km = distanceParcours(stops)
  const roulage = (km / VITESSE_KMH) * 60
  return Math.round(roulage + stops.length * ARRET_MIN)
}

/**
 * Ordonne les arrêts par plus proche voisin à partir d'un point de départ.
 * @param startId arrêt de départ imposé (ex. la visite en cours) ; sinon le premier fourni.
 */
export function optimiserItineraire<T extends StopGeo>(stops: T[], startId?: string): Itineraire<T> {
  const valides = stopsValides(stops)
  if (valides.length <= 2) {
    return { ordre: valides, distance_km: distanceParcours(valides), duree_min: dureeParcours(valides) }
  }

  const restants = [...valides]
  const depart = startId
    ? restants.findIndex(s => s.id === startId)
    : 0
  const startIdx = depart >= 0 ? depart : 0

  const ordre: T[] = [restants.splice(startIdx, 1)[0]]
  while (restants.length > 0) {
    const dernier = ordre[ordre.length - 1]
    let bestIdx = 0
    let bestKm = Infinity
    for (let i = 0; i < restants.length; i++) {
      const km = haversineKm(dernier.lat, dernier.lng, restants[i].lat, restants[i].lng)
      if (km < bestKm) {
        bestKm = km
        bestIdx = i
      }
    }
    ordre.push(restants.splice(bestIdx, 1)[0])
  }

  return { ordre, distance_km: distanceParcours(ordre), duree_min: dureeParcours(ordre) }
}

/**
 * Lien de navigation multi-arrêts (Google Maps).
 * origin = premier arrêt, destination = dernier, le reste en waypoints ordonnés.
 */
export function lienNavigationMulti(stops: StopGeo[]): string | null {
  const valides = stopsValides(stops)
  if (valides.length === 0) return null
  if (valides.length === 1) {
    return `https://www.google.com/maps/dir/?api=1&destination=${valides[0].lat},${valides[0].lng}`
  }
  const origin = valides[0]
  const destination = valides[valides.length - 1]
  const waypoints = valides.slice(1, -1).map(s => `${s.lat},${s.lng}`).join('|')
  const base = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`
  return waypoints ? `${base}&waypoints=${encodeURIComponent(waypoints)}` : base
}

/** Formatte une durée en minutes vers « 1 h 25 » / « 40 min ». */
export function formatDuree(min: number): string {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`
}
