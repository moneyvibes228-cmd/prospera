/**
 * Pilotage zones DG grossiste — progression, ruptures, impayés, demande, cartographie.
 */
import { ZONES_DISTRIBUTION, type ZoneDistribution } from './registries/zones-registry'
import { ENTREPOTS_DISTRIBUTION } from './registries/entrepots-registry'
import { REGISTRE_PDV } from './registries/pdv-registry'

export interface ZoneGeo {
  lat: number
  lng: number
  radius_m: number
}

export interface ZonePilotageDG {
  zone: ZoneDistribution
  geo: ZoneGeo
  progression_mois_pct: number
  nouveaux_clients_mois: number
  nouvelles_boutiques_mois: number
  demande_mois_cmd: number
  demande_mois_fcfa: number
  livraisons_zone_mois: number
  boutiques_livrees_mois: number
  entrepot_rattache: string
}

export interface BoutiqueDemandeDG {
  id: string
  nom: string
  zone: string
  zone_id: string
  lat: number
  lng: number
  demande_mois_fcfa: number
  commandes_mois: number
  creance: number
  creance_jours: number
  pipeline: string
}

export interface EntrepotCarteDG {
  id: string
  nom: string
  lat: number
  lng: number
  type: 'PRINCIPAL' | 'REGIONAL'
  livraisons_jour: number
  zones_rattachees: string[]
}

export interface AnalyseZoneIA {
  type: 'IMPAYES' | 'RUPTURES' | 'SATURATION' | 'OPPORTUNITE'
  severite: 'CRITIQUE' | 'HAUTE' | 'MODEREE'
  titre: string
  detail: string
  zone_ids: string[]
  action: string
}

const ZONE_GEO: Record<string, ZoneGeo> = {
  'zn-lome-nord':   { lat: 6.158, lng: 1.198, radius_m: 2800 },
  'zn-lome-sud':    { lat: 6.118, lng: 1.232, radius_m: 2400 },
  'zn-lome-centre': { lat: 6.137, lng: 1.218, radius_m: 1800 },
  'zn-lome-est':    { lat: 6.126, lng: 1.248, radius_m: 2000 },
  'zn-kara':        { lat: 9.551, lng: 1.186, radius_m: 3500 },
  'zn-centrale':    { lat: 8.983, lng: 1.133, radius_m: 4000 },
}

const ZONE_PROGRESSION: Record<string, {
  progression: number
  nouveaux_clients: number
  nouvelles_boutiques: number
  demande_cmd: number
  livraisons: number
  boutiques_livrees: number
}> = {
  'zn-lome-nord':   { progression: 8.4,  nouveaux_clients: 14, nouvelles_boutiques: 6,  demande_cmd: 842,  livraisons: 186, boutiques_livrees: 142 },
  'zn-lome-sud':    { progression: 12.1, nouveaux_clients: 22, nouvelles_boutiques: 11, demande_cmd: 524,  livraisons: 98,  boutiques_livrees: 78 },
  'zn-lome-centre': { progression: -14.2, nouveaux_clients: 3,  nouvelles_boutiques: 1,  demande_cmd: 312,  livraisons: 74,  boutiques_livrees: 58 },
  'zn-lome-est':    { progression: -6.8,  nouveaux_clients: 5,  nouvelles_boutiques: 2,  demande_cmd: 198,  livraisons: 41,  boutiques_livrees: 34 },
  'zn-kara':        { progression: 6.9,  nouveaux_clients: 9,  nouvelles_boutiques: 4,  demande_cmd: 356,  livraisons: 52,  boutiques_livrees: 44 },
  'zn-centrale':    { progression: -3.1,  nouveaux_clients: 2,  nouvelles_boutiques: 0,  demande_cmd: 112,  livraisons: 28,  boutiques_livrees: 22 },
}

const ENTREPOT_GEO: Record<string, { lat: number; lng: number }> = {
  'ent-lome-port': { lat: 6.134, lng: 1.225 },
  'ent-kara':      { lat: 9.548, lng: 1.190 },
}

const ZONE_NOM_TO_ID: Record<string, string> = {
  'Lomé Nord': 'zn-lome-nord',
  'Lomé Sud': 'zn-lome-sud',
  'Lomé Centre': 'zn-lome-centre',
  'Lomé Est': 'zn-lome-est',
  'Kara': 'zn-kara',
  'Centrale': 'zn-centrale',
}

export function buildZonesPilotageDG(): ZonePilotageDG[] {
  return ZONES_DISTRIBUTION.map(z => {
    const extra = ZONE_PROGRESSION[z.id]
    const entrepot = ENTREPOTS_DISTRIBUTION.find(e => e.zones_rattachees.includes(z.id))
    return {
      zone: z,
      geo: ZONE_GEO[z.id],
      progression_mois_pct: extra.progression,
      nouveaux_clients_mois: extra.nouveaux_clients,
      nouvelles_boutiques_mois: extra.nouvelles_boutiques,
      demande_mois_cmd: extra.demande_cmd,
      demande_mois_fcfa: z.ca_mois,
      livraisons_zone_mois: extra.livraisons,
      boutiques_livrees_mois: extra.boutiques_livrees,
      entrepot_rattache: entrepot?.nom ?? '—',
    }
  })
}

export function buildBoutiquesDemandeDG(): BoutiqueDemandeDG[] {
  return REGISTRE_PDV
    .filter(p => p.ca_mois > 0 || p.creance > 0)
    .map(p => ({
      id: p.id,
      nom: p.nom,
      zone: p.zone,
      zone_id: ZONE_NOM_TO_ID[p.zone] ?? '',
      lat: p.lat,
      lng: p.lng,
      demande_mois_fcfa: p.ca_mois,
      commandes_mois: Math.max(1, Math.round(p.ca_mois / 280_000)),
      creance: p.creance,
      creance_jours: p.creance_jours,
      pipeline: p.pipeline,
    }))
    .sort((a, b) => b.demande_mois_fcfa - a.demande_mois_fcfa)
}

export function buildEntrepotsCarteDG(): EntrepotCarteDG[] {
  return ENTREPOTS_DISTRIBUTION.map(e => ({
    id: e.id,
    nom: e.nom,
    lat: ENTREPOT_GEO[e.id].lat,
    lng: ENTREPOT_GEO[e.id].lng,
    type: e.type,
    livraisons_jour: e.livraisons_jour,
    zones_rattachees: e.zones_rattachees,
  }))
}

export function buildAnalysesZonesIA(zones: ZonePilotageDG[]): AnalyseZoneIA[] {
  const analyses: AnalyseZoneIA[] = []

  const zoneImpayesMax = [...zones].sort((a, b) => b.zone.creances_retard - a.zone.creances_retard)[0]
  const pctReseau = zones.reduce((s, z) => s + z.zone.creances_retard, 0)
  const pctZone = pctReseau > 0 ? Math.round((zoneImpayesMax.zone.creances_retard / pctReseau) * 100) : 0

  if (zoneImpayesMax.zone.creances_pct >= 30) {
    analyses.push({
      type: 'IMPAYES',
      severite: 'CRITIQUE',
      titre: `Concentration impayés — ${zoneImpayesMax.zone.nom}`,
      detail: `${pctZone}% des impayés réseau (${(zoneImpayesMax.zone.creances_retard / 1_000_000).toFixed(1)} M FCFA) · ${zoneImpayesMax.zone.pdv_a_risque} clients à risque · taux retard ${zoneImpayesMax.zone.creances_pct}%`,
      zone_ids: [zoneImpayesMax.zone.id],
      action: 'Geler les nouvelles livraisons crédit sur les 12 plus gros débiteurs et lancer tournée recouvrement dédiée sous 48h.',
    })
  }

  const zonesRuptures = zones.filter(z => z.zone.ruptures_stock >= 3)
  for (const z of zonesRuptures) {
    const ratioLivraison = z.boutiques_livrees_mois / Math.max(1, z.livraisons_zone_mois)
    analyses.push({
      type: 'RUPTURES',
      severite: z.zone.ruptures_stock >= 4 ? 'CRITIQUE' : 'HAUTE',
      titre: `${z.zone.ruptures_stock} ruptures SKU — ${z.zone.nom}`,
      detail: `${z.livraisons_zone_mois} livraisons/mois vers ${z.boutiques_livrees_mois} boutiques · ratio ${ratioLivraison.toFixed(1)} boutique/BL · entrepôt ${z.entrepot_rattache}`,
      zone_ids: [z.zone.id],
      action: 'Réviser le plan de tournée : regrouper les livraisons alimentaires sur 2 passages/semaine au lieu de livraisons unitaires.',
    })
  }

  const lomeZones = zones.filter(z => z.entrepot_rattache === 'Lomé Port' && z.livraisons_zone_mois >= 40)
  const totalLivraisonsLome = lomeZones.reduce((s, z) => s + z.livraisons_zone_mois, 0)
  const totalBoutiquesLome = lomeZones.reduce((s, z) => s + z.boutiques_livrees_mois, 0)
  if (totalLivraisonsLome > 150) {
    analyses.push({
      type: 'SATURATION',
      severite: 'HAUTE',
      titre: 'Saturation logistique grand Lomé',
      detail: `${totalLivraisonsLome} BL/mois depuis Lomé Port vers ${totalBoutiquesLome} boutiques sur 4 zones · huile 5L et riz 25kg en tension · délai réappro client 4,2j vs 2,8j Kara`,
      zone_ids: lomeZones.map(z => z.zone.id),
      action: 'Fractionner les tournées par micro-secteur (Nord/Centre/Est) et imposer un minimum de commande par BL pour limiter les ruptures en cascade.',
    })
  }

  const topProgression = [...zones].sort((a, b) => b.progression_mois_pct - a.progression_mois_pct)[0]
  if (topProgression.progression_mois_pct > 10) {
    analyses.push({
      type: 'OPPORTUNITE',
      severite: 'MODEREE',
      titre: `Dynamique forte — ${topProgression.zone.nom}`,
      detail: `+${topProgression.progression_mois_pct}% vs M-1 · ${topProgression.nouvelles_boutiques_mois} nouvelles boutiques · ${topProgression.nouveaux_clients_mois} nouveaux clients · demande ${topProgression.demande_mois_cmd} cmd/mois`,
      zone_ids: [topProgression.zone.id],
      action: 'Renforcer le stock de sécurité boissons et alimentaire sur cet axe avant la saison des pluies.',
    })
  }

  return analyses
}

export function getZoneRankings(zones: ZonePilotageDG[]) {
  const sortedProg = [...zones].sort((a, b) => b.progression_mois_pct - a.progression_mois_pct)
  const sortedReg = [...zones].sort((a, b) => a.progression_mois_pct - b.progression_mois_pct)
  const sortedRuptures = [...zones].sort((a, b) => b.zone.ruptures_stock - a.zone.ruptures_stock)
  const sortedImpayes = [...zones].sort((a, b) => b.zone.creances_retard - a.zone.creances_retard)
  const sortedDemande = [...zones].sort((a, b) => b.demande_mois_cmd - a.demande_mois_cmd)
  const sortedNouveaux = [...zones].sort((a, b) =>
    (b.nouveaux_clients_mois + b.nouvelles_boutiques_mois) - (a.nouveaux_clients_mois + a.nouvelles_boutiques_mois),
  )

  return {
    progressions: sortedProg.filter(z => z.progression_mois_pct > 0).slice(0, 3),
    regressions: sortedReg.filter(z => z.progression_mois_pct < 0).slice(0, 3),
    ruptures: sortedRuptures.slice(0, 3),
    impayes: sortedImpayes.slice(0, 3),
    demande: sortedDemande.slice(0, 3),
    acquisition: sortedNouveaux.slice(0, 3),
    zone_impayes_max: sortedImpayes[0],
    totaux: {
      nouveaux_clients: zones.reduce((s, z) => s + z.nouveaux_clients_mois, 0),
      nouvelles_boutiques: zones.reduce((s, z) => s + z.nouvelles_boutiques_mois, 0),
      impayes_total: zones.reduce((s, z) => s + z.zone.creances_retard, 0),
      ruptures_total: zones.reduce((s, z) => s + z.zone.ruptures_stock, 0),
    },
  }
}
