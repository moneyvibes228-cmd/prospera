/**
 * Analyse distances réseau — entrepôts, enseignes, partenaires.
 * Calculs haversine sur les coordonnées cartographiées (lat/lng).
 */
import type { EntrepotCarteDG } from './zones-pilotage-dg'
import type { MagasinCarteDG } from './magasins-pilotage-dg'
import { formatFcfa } from './utils'

const R_EARTH_KM = 6371

export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R_EARTH_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export interface DistanceMagasinEntrepot {
  magasin_id: string
  magasin_nom: string
  type_magasin: MagasinCarteDG['type_magasin']
  zone_id: string
  zone: string
  ca_mois: number
  livraisons_mois: number
  entrepot_id: string
  entrepot_nom: string
  distance_km: number
  distance_enseigne_km: number | null
  enseigne_proche_nom: string | null
}

export interface ClusterEloigne {
  id: string
  zone_id: string
  zone_nom: string
  lat: number
  lng: number
  radius_km: number
  partenaires_count: number
  ca_total_fcfa: number
  distance_entrepot_km: number
  entrepot_nom: string
  top_clients: { nom: string; ca_mois: number; distance_km: number }[]
}

export interface SuggestionImplantation {
  id: string
  type: 'MICRO_DEPOT' | 'HUB_PARTENAIRE' | 'TOURNEE_GROUPEE'
  severite: 'CRITIQUE' | 'HAUTE' | 'MODEREE'
  titre: string
  detail: string
  action: string
  lat: number
  lng: number
  radius_km: number
  zone_ids: string[]
  ca_couvert_fcfa: number
  points_count: number
}

export interface AnalyseDistanceReseau {
  stats: {
    distance_moy_entrepot_km: number
    distance_max_entrepot_km: number
    distance_moy_partenaire_enseigne_km: number
    partenaires_loin_entrepot: number
    partenaires_loin_enseigne: number
    ca_eloigne_fcfa: number
    pct_ca_eloigne: number
  }
  distances: DistanceMagasinEntrepot[]
  top_eloignes: DistanceMagasinEntrepot[]
  clusters: ClusterEloigne[]
  suggestions: SuggestionImplantation[]
}

function nearestEnseigne(
  mag: MagasinCarteDG,
  enseignes: MagasinCarteDG[],
): { km: number; nom: string } | null {
  if (mag.type_magasin === 'PROPRE') return null
  let best: { km: number; nom: string } | null = null
  for (const e of enseignes) {
    const km = haversineKm(mag.lat, mag.lng, e.lat, e.lng)
    if (!best || km < best.km) best = { km, nom: e.nom }
  }
  return best
}

function weightedCentroid(points: { lat: number; lng: number; weight: number }[]) {
  const total = points.reduce((s, p) => s + p.weight, 0)
  if (total <= 0) return null
  return {
    lat: points.reduce((s, p) => s + p.lat * p.weight, 0) / total,
    lng: points.reduce((s, p) => s + p.lng * p.weight, 0) / total,
  }
}

function detectClustersFromMagasins(
  magasins: MagasinCarteDG[],
  entrepots: EntrepotCarteDG[],
  distances: DistanceMagasinEntrepot[],
  seuilKm: number,
): ClusterEloigne[] {
  const magMap = new Map(magasins.map(m => [m.id, m]))
  const entrepotMap = new Map(entrepots.map(e => [e.id, e]))
  const loin = distances.filter(d => d.type_magasin === 'PARTENAIRE' && d.distance_km >= seuilKm)
  const used = new Set<string>()
  const clusters: ClusterEloigne[] = []
  let clusterIdx = 0

  for (const seed of [...loin].sort((a, b) => b.ca_mois - a.ca_mois)) {
    if (used.has(seed.magasin_id)) continue
    const seedMag = magMap.get(seed.magasin_id)
    if (!seedMag) continue

    const group: DistanceMagasinEntrepot[] = []
    for (const p of loin) {
      if (used.has(p.magasin_id)) continue
      const pMag = magMap.get(p.magasin_id)
      if (!pMag) continue
      if (haversineKm(seedMag.lat, seedMag.lng, pMag.lat, pMag.lng) <= 1.8) {
        group.push(p)
        used.add(p.magasin_id)
      }
    }

    if (group.length < 2) continue

    const coords = group.map(g => {
      const m = magMap.get(g.magasin_id)!
      return { lat: m.lat, lng: m.lng, weight: g.ca_mois }
    })
    const centroid = weightedCentroid(coords)!
    const caTotal = group.reduce((s, g) => s + g.ca_mois, 0)
    const ent = entrepotMap.get(group[0].entrepot_id)
    const distEntrepot = ent
      ? haversineKm(centroid.lat, centroid.lng, ent.lat, ent.lng)
      : group[0].distance_km

    clusterIdx++
    clusters.push({
      id: `cluster-${clusterIdx}`,
      zone_id: group[0].zone_id,
      zone_nom: group[0].zone,
      lat: centroid.lat,
      lng: centroid.lng,
      radius_km: 1.2,
      partenaires_count: group.length,
      ca_total_fcfa: caTotal,
      distance_entrepot_km: Math.round(distEntrepot * 10) / 10,
      entrepot_nom: group[0].entrepot_nom,
      top_clients: [...group]
        .sort((a, b) => b.ca_mois - a.ca_mois)
        .slice(0, 4)
        .map(g => ({ nom: g.magasin_nom, ca_mois: g.ca_mois, distance_km: g.distance_km })),
    })
  }

  return clusters.sort((a, b) => b.ca_total_fcfa - a.ca_total_fcfa).slice(0, 4)
}

function buildSuggestions(
  magasins: MagasinCarteDG[],
  entrepots: EntrepotCarteDG[],
  distances: DistanceMagasinEntrepot[],
  clusters: ClusterEloigne[],
): SuggestionImplantation[] {
  const suggestions: SuggestionImplantation[] = []
  const entrepotMap = new Map(entrepots.map(e => [e.id, e]))

  for (const cluster of clusters) {
    if (cluster.ca_total_fcfa < 2_500_000) continue
    const zoneMag = magasins.find(m => m.zone_id === cluster.zone_id)
    const ent = entrepotMap.get(zoneMag?.entrepot_id ?? 'ent-lome-port')
    const distEntrepot = ent
      ? haversineKm(cluster.lat, cluster.lng, ent.lat, ent.lng)
      : cluster.distance_entrepot_km

    suggestions.push({
      id: `sug-${cluster.id}`,
      type: 'MICRO_DEPOT',
      severite: distEntrepot >= 5 ? 'CRITIQUE' : distEntrepot >= 3.5 ? 'HAUTE' : 'MODEREE',
      titre: `Micro-dépôt suggéré — ${cluster.zone_nom}`,
      detail: `${cluster.partenaires_count} partenaires à ${distEntrepot.toFixed(1)} km de ${cluster.entrepot_nom} · CA agrégé ${formatFcfa(cluster.ca_total_fcfa)}/mois · top : ${cluster.top_clients.map(c => c.nom.split(' ').slice(0, 2).join(' ')).join(', ')}`,
      action: distEntrepot >= 5
        ? `Ouvrir un point de stockage satellite (${distEntrepot.toFixed(1)} km → < 1,5 km) : réappro 2×/semaine depuis ${cluster.entrepot_nom}, livraison quotidienne locale.`
        : 'Tester un hub partenaire relais (magasin enseigne le plus proche) avant investissement fixe.',
      lat: cluster.lat,
      lng: cluster.lng,
      radius_km: 1.5,
      zone_ids: [cluster.zone_id],
      ca_couvert_fcfa: cluster.ca_total_fcfa,
      points_count: cluster.partenaires_count,
    })
  }

  const partenaires = distances.filter(d => d.type_magasin === 'PARTENAIRE')
  const grosProchesEnseigne = partenaires
    .filter(p => p.ca_mois >= 1_800_000 && p.distance_enseigne_km !== null && p.distance_enseigne_km <= 1.2 && p.distance_km >= 3)
    .sort((a, b) => b.ca_mois - a.ca_mois)
    .slice(0, 2)

  for (const p of grosProchesEnseigne) {
    const mag = magasins.find(m => m.id === p.magasin_id)!
    suggestions.push({
      id: `sug-hub-${p.magasin_id}`,
      type: 'HUB_PARTENAIRE',
      severite: p.distance_km >= 4.5 ? 'HAUTE' : 'MODEREE',
      titre: `Hub relais — ${p.enseigne_proche_nom}`,
      detail: `${p.magasin_nom} (${formatFcfa(p.ca_mois)}/mois) à ${p.distance_km.toFixed(1)} km de ${p.entrepot_nom} mais seulement ${p.distance_enseigne_km!.toFixed(1)} km de ${p.enseigne_proche_nom} · ${p.livraisons_mois} BL/mois`,
      action: `Livrer via ${p.enseigne_proche_nom} (cross-docking) : 1 passage entrepôt → enseigne, tournée partenaires à pied/vélo sur le dernier km.`,
      lat: mag.lat,
      lng: mag.lng,
      radius_km: 0.8,
      zone_ids: [p.zone_id],
      ca_couvert_fcfa: p.ca_mois,
      points_count: 1,
    })
  }

  const byZone = new Map<string, DistanceMagasinEntrepot[]>()
  for (const p of partenaires.filter(p => p.distance_km >= 2.5 && p.distance_km < 5)) {
    const list = byZone.get(p.zone_id) ?? []
    list.push(p)
    byZone.set(p.zone_id, list)
  }
  for (const [zoneId, group] of byZone) {
    if (group.length < 4) continue
    const caTotal = group.reduce((s, g) => s + g.ca_mois, 0)
    const magList = group.map(g => magasins.find(m => m.id === g.magasin_id)!)
    const centroid = weightedCentroid(magList.map(m => ({ lat: m.lat, lng: m.lng, weight: m.ca_mois })))
    if (!centroid) continue

    suggestions.push({
      id: `sug-tournee-${zoneId}`,
      type: 'TOURNEE_GROUPEE',
      severite: group.length >= 8 ? 'HAUTE' : 'MODEREE',
      titre: `Tournée groupée — ${group[0].zone}`,
      detail: `${group.length} partenaires entre 2,5 et 5 km de l'entrepôt · ${formatFcfa(caTotal)} CA/mois · distance moy. ${(group.reduce((s, g) => s + g.distance_km, 0) / group.length).toFixed(1)} km`,
      action: 'Fusionner en 1 BL multi-clients / passage (max 5 stops) : réduire les allers-retours entrepôt de ~40%.',
      lat: centroid.lat,
      lng: centroid.lng,
      radius_km: 2,
      zone_ids: [zoneId],
      ca_couvert_fcfa: caTotal,
      points_count: group.length,
    })
  }

  const order = { CRITIQUE: 0, HAUTE: 1, MODEREE: 2 }
  return suggestions.sort((a, b) => order[a.severite] - order[b.severite]).slice(0, 5)
}

export function buildAnalyseDistanceReseau(
  magasins: MagasinCarteDG[],
  entrepots: EntrepotCarteDG[],
): AnalyseDistanceReseau {
  const entrepotMap = new Map(entrepots.map(e => [e.id, e]))
  const enseignes = magasins.filter(m => m.type_magasin === 'PROPRE')

  const distances: DistanceMagasinEntrepot[] = magasins.map(m => {
    const ent = entrepotMap.get(m.entrepot_id)
    const distEntrepot = ent ? haversineKm(m.lat, m.lng, ent.lat, ent.lng) : 0
    const nearEns = nearestEnseigne(m, enseignes)

    return {
      magasin_id: m.id,
      magasin_nom: m.nom,
      type_magasin: m.type_magasin,
      zone_id: m.zone_id,
      zone: m.zone,
      ca_mois: m.ca_mois,
      livraisons_mois: m.livraisons_mois,
      entrepot_id: m.entrepot_id,
      entrepot_nom: m.entrepot_nom,
      distance_km: Math.round(distEntrepot * 10) / 10,
      distance_enseigne_km: nearEns ? Math.round(nearEns.km * 10) / 10 : null,
      enseigne_proche_nom: nearEns?.nom ?? null,
    }
  })

  const partenaires = distances.filter(d => d.type_magasin === 'PARTENAIRE')
  const seuilLoinEntrepot = 3.5
  const seuilLoinEnseigne = 2.5

  const caTotal = distances.reduce((s, d) => s + d.ca_mois, 0)
  const eloignes = partenaires.filter(p => p.distance_km >= seuilLoinEntrepot)
  const caEloigne = eloignes.reduce((s, p) => s + p.ca_mois, 0)

  const distMoyEntrepot = distances.length
    ? distances.reduce((s, d) => s + d.distance_km, 0) / distances.length
    : 0
  const distMaxEntrepot = Math.max(...distances.map(d => d.distance_km), 0)

  const distsEns = partenaires.filter(p => p.distance_enseigne_km !== null)
  const distMoyEns = distsEns.length
    ? distsEns.reduce((s, p) => s + p.distance_enseigne_km!, 0) / distsEns.length
    : 0

  const topEloignes = [...partenaires]
    .filter(p => p.ca_mois >= 800_000)
    .sort((a, b) => b.ca_mois * b.distance_km - a.ca_mois * a.distance_km)
    .slice(0, 6)

  const clusters = detectClustersFromMagasins(magasins, entrepots, distances, seuilLoinEntrepot)
  const suggestions = buildSuggestions(magasins, entrepots, distances, clusters)

  return {
    stats: {
      distance_moy_entrepot_km: Math.round(distMoyEntrepot * 10) / 10,
      distance_max_entrepot_km: Math.round(distMaxEntrepot * 10) / 10,
      distance_moy_partenaire_enseigne_km: Math.round(distMoyEns * 10) / 10,
      partenaires_loin_entrepot: eloignes.length,
      partenaires_loin_enseigne: partenaires.filter(p => (p.distance_enseigne_km ?? 99) >= seuilLoinEnseigne).length,
      ca_eloigne_fcfa: caEloigne,
      pct_ca_eloigne: caTotal > 0 ? Math.round((caEloigne / caTotal) * 100) : 0,
    },
    distances,
    top_eloignes: topEloignes,
    clusters,
    suggestions,
  }
}
