/**
 * Moteur d'expédition — du bon de préparation au camion chargé.
 *
 * Un distributeur ne perd pas son argent sur le prix d'achat, il le perd sur des camions
 * à moitié vides. Une tournée coûte le même prix qu'elle parte pleine ou remplie à 40 % :
 * le coût de mise en route est fixe. Chaque point de remplissage gagné est de la marge nette.
 *
 * Le moteur fait donc un « bin packing » à deux contraintes — le poids ET le volume, car
 * ce n'est jamais la même qui sature (les boissons saturent le poids, le papier hygiénique
 * sature le volume) — puis ordonne les arrêts et chiffre la tournée.
 */

import type { BonPreparation } from './picking-engine'
import { getPdvById } from './registries/pdv-registry'
import {
  camionsDisponibles, getTopologie, type Camion,
} from './registries/entrepot-logistique-registry'

/** Sous ce remplissage, la tournée coûte plus cher qu'elle ne rapporte : on regroupe. */
export const SEUIL_REMPLISSAGE_RENTABLE = 65

export interface ArretTournee {
  ordre: number
  pdv_id: string
  pdv_nom: string
  zone: string
  commande_ref: string
  poids_kg: number
  volume_m3: number
  palettes: number
  distance_km: number
  /** Heure d'arrivée estimée — ce qu'on annonce au client. */
  eta: string
  /** Le chauffeur doit-il encaisser à la livraison ? */
  encaissement_attendu?: number
}

export interface Tournee {
  id: string
  camion: Camion
  entrepot: string
  arrets: ArretTournee[]
  poids_kg: number
  volume_m3: number
  /** Taux de remplissage retenu = la contrainte la plus saturée des deux. */
  remplissage_pct: number
  remplissage_poids_pct: number
  remplissage_volume_pct: number
  /** La contrainte qui sature en premier — dit au planificateur quoi corriger. */
  contrainte_saturante: 'POIDS' | 'VOLUME'
  distance_km: number
  cout_fcfa: number
  /** Coût de transport ramené au colis livré — le vrai indicateur de productivité. */
  cout_par_palette: number
  depart: string
  retour_estime: string
  rentable: boolean
  recommandation?: string
}

export interface PlanExpedition {
  entrepot: string
  tournees: Tournee[]
  /** Bons qu'aucun camion disponible ne peut prendre aujourd'hui. */
  non_charges: BonPreparation[]
  cout_total: number
  remplissage_moyen_pct: number
  /** Économie réalisée par le regroupement vs une tournée par commande. */
  economie_regroupement: number
  alertes: string[]
}

/* ------------------------------------------------------------------ */
/* Distances                                                           */
/* ------------------------------------------------------------------ */

const RAYON_TERRE_KM = 6371

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  // Route réelle ≈ 1,35 × la distance à vol d'oiseau au Togo — sinon on sous-estime le coût.
  return Math.round(2 * RAYON_TERRE_KM * Math.asin(Math.sqrt(h)) * 1.35 * 10) / 10
}

/** Point de départ et de retour de toute tournée. */
const POSITION_ENTREPOT: Record<string, { lat: number; lng: number }> = {
  'Lomé Port': { lat: 6.1319, lng: 1.2228 },
  Kara: { lat: 9.5511, lng: 1.1861 },
}

function positionEntrepot(entrepot: string): { lat: number; lng: number } {
  return POSITION_ENTREPOT[entrepot] ?? POSITION_ENTREPOT['Lomé Port']
}

function ajouterMinutes(heure: string, minutes: number): string {
  const [h, m] = heure.split(':').map(Number)
  const total = h * 60 + m + minutes
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

/* ------------------------------------------------------------------ */
/* Chargement                                                          */
/* ------------------------------------------------------------------ */

/**
 * Affectation des bons aux camions.
 *
 * On trie les bons du plus lourd au plus léger (heuristique « first-fit decreasing » :
 * caser les gros d'abord laisse les petits boucher les trous), et on privilégie le
 * remplissage d'un camion déjà entamé plutôt que d'en ouvrir un second — chaque camion
 * ouvert coûte immédiatement son forfait de tournée.
 */
export function buildPlanExpedition(entrepot: string, bons: BonPreparation[]): PlanExpedition {
  const aCharger = bons
    .filter(b => b.entrepot === entrepot && b.blocage === 'AUCUN' && b.poids_total_kg > 0)
    // Regrouper par zone avant tout : deux arrêts dans la même zone, c'est un seul détour.
    .sort((a, b) => a.zone.localeCompare(b.zone) || b.poids_total_kg - a.poids_total_kg)

  const camions = camionsDisponibles(entrepot)
  const topologie = getTopologie(entrepot)
  const origine = positionEntrepot(entrepot)

  const charges = new Map<string, BonPreparation[]>()
  const nonCharges: BonPreparation[] = []

  for (const bon of aCharger) {
    const camion = camions.find(c => {
      const deja = charges.get(c.id) ?? []
      const poids = deja.reduce((s, b) => s + b.poids_total_kg, 0) + bon.poids_total_kg
      const volume = deja.reduce((s, b) => s + b.volume_total_m3, 0) + bon.volume_total_m3
      return poids <= c.charge_utile_kg && volume <= c.volume_utile_m3
    })

    if (!camion) {
      nonCharges.push(bon)
      continue
    }
    charges.set(camion.id, [...(charges.get(camion.id) ?? []), bon])
  }

  const tournees: Tournee[] = []

  for (const camion of camions) {
    const lot = charges.get(camion.id) ?? []
    if (lot.length === 0) continue

    // Ordre des arrêts : plus proche voisin depuis l'entrepôt. Naïf, mais c'est déjà
    // 20 à 30 % de km en moins qu'un ordre de saisie, et un chauffeur sait le suivre.
    const restants = [...lot]
    const arrets: ArretTournee[] = []
    let position = origine
    let distance = 0
    let heure = '08:00'

    while (restants.length > 0) {
      const prochain = restants
        .map(b => {
          const pdv = getPdvById(b.pdv_id)
          const d = pdv ? distanceKm(position, pdv) : 12
          return { bon: b, pdv, d }
        })
        .sort((a, b) => a.d - b.d)[0]

      restants.splice(restants.indexOf(prochain.bon), 1)
      distance += prochain.d

      // 25 min de trajet moyen par tranche de 10 km en ville + 20 min de déchargement.
      heure = ajouterMinutes(heure, Math.round(prochain.d * 2.5) + 20)

      arrets.push({
        ordre: arrets.length + 1,
        pdv_id: prochain.bon.pdv_id,
        pdv_nom: prochain.bon.pdv_nom,
        zone: prochain.bon.zone,
        commande_ref: prochain.bon.commande_ref,
        poids_kg: prochain.bon.poids_total_kg,
        volume_m3: prochain.bon.volume_total_m3,
        palettes: prochain.bon.palettes_total,
        distance_km: prochain.d,
        eta: heure,
        encaissement_attendu: prochain.pdv && prochain.pdv.creance > 0 && prochain.pdv.creance_jours > 15
          ? prochain.pdv.creance
          : undefined,
      })

      if (prochain.pdv) position = prochain.pdv
    }

    // Le retour à l'entrepôt se paie aussi.
    const retour = distanceKm(position, origine)
    distance = Math.round((distance + retour) * 10) / 10

    const poids = Math.round(lot.reduce((s, b) => s + b.poids_total_kg, 0))
    const volume = Math.round(lot.reduce((s, b) => s + b.volume_total_m3, 0) * 100) / 100
    const remplPoids = Math.round((poids / camion.charge_utile_kg) * 100)
    const remplVolume = Math.round((volume / camion.volume_utile_m3) * 100)
    const remplissage = Math.max(remplPoids, remplVolume)
    const palettes = lot.reduce((s, b) => s + b.palettes_total, 0)
    const cout = Math.round(camion.cout_tournee_fcfa + distance * camion.cout_km_fcfa)
    const rentable = remplissage >= SEUIL_REMPLISSAGE_RENTABLE

    tournees.push({
      id: `tour-${camion.id}`,
      camion,
      entrepot,
      arrets,
      poids_kg: poids,
      volume_m3: volume,
      remplissage_pct: remplissage,
      remplissage_poids_pct: remplPoids,
      remplissage_volume_pct: remplVolume,
      contrainte_saturante: remplPoids >= remplVolume ? 'POIDS' : 'VOLUME',
      distance_km: distance,
      cout_fcfa: cout,
      cout_par_palette: palettes > 0 ? Math.round(cout / palettes) : cout,
      depart: '08:00',
      retour_estime: ajouterMinutes(heure, Math.round(retour * 2.5)),
      rentable,
      recommandation: rentable
        ? undefined
        : `Camion rempli à ${remplissage} % seulement — ${cout.toLocaleString('fr-FR')} F pour ${palettes} palette${palettes > 1 ? 's' : ''}. `
          + `Regrouper avec la tournée de demain sur la même zone, ou basculer sur un véhicule plus petit.`,
    })
  }

  const coutTotal = tournees.reduce((s, t) => s + t.cout_fcfa, 0)
  const remplissageMoyen = tournees.length > 0
    ? Math.round(tournees.reduce((s, t) => s + t.remplissage_pct, 0) / tournees.length)
    : 0

  // Sans regroupement, chaque commande sortirait dans son propre véhicule.
  const nbArrets = tournees.reduce((s, t) => s + t.arrets.length, 0)
  const coutSansRegroupement = tournees.reduce(
    (s, t) => s + t.arrets.length * t.camion.cout_tournee_fcfa + t.distance_km * t.camion.cout_km_fcfa,
    0,
  )
  const economie = Math.max(0, Math.round(coutSansRegroupement - coutTotal))

  const alertes: string[] = []
  if (nonCharges.length > 0) {
    const poidsNonCharge = Math.round(nonCharges.reduce((s, b) => s + b.poids_total_kg, 0))
    alertes.push(
      `${nonCharges.length} commande${nonCharges.length > 1 ? 's' : ''} sans camion (${poidsNonCharge.toLocaleString('fr-FR')} kg) — `
      + `capacité de la flotte saturée. Louer un porteur ou reporter à J+1 avant le cutoff de ${topologie.heure_cutoff}.`,
    )
  }
  for (const t of tournees.filter(t => !t.rentable)) {
    alertes.push(`${t.camion.immatriculation} part à ${t.remplissage_pct} % — ${t.cout_fcfa.toLocaleString('fr-FR')} F de tournée peu rentabilisés.`)
  }
  const indispo = camionsDisponibles(entrepot).length
  if (indispo === 0) alertes.push('Aucun camion disponible sur cet entrepôt — expéditions à l\'arrêt.')

  return {
    entrepot,
    tournees: tournees.sort((a, b) => b.remplissage_pct - a.remplissage_pct),
    non_charges: nonCharges,
    cout_total: coutTotal,
    remplissage_moyen_pct: remplissageMoyen,
    economie_regroupement: economie,
    alertes,
  }
}
