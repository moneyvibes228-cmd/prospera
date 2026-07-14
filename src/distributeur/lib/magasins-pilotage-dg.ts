/**
 * Pilotage magasins DG — boutiques propres vs partenaires, flux entrepôt, évolution produits.
 */
import type { TypeMagasin } from '@distributeur/types'
import { REGISTRE_PDV } from './registries/pdv-registry'
import { REGISTRE_STOCK } from './registries/stock-registry'
import { hashString, randInt, seededRandom } from './generators/mock-seed'
import { ENTREPOTS_DISTRIBUTION } from './registries/entrepots-registry'
import { ZONES_DISTRIBUTION } from './registries/zones-registry'

const ZONE_NOM_TO_ID: Record<string, string> = {
  'Lomé Nord': 'zn-lome-nord',
  'Lomé Sud': 'zn-lome-sud',
  'Lomé Centre': 'zn-lome-centre',
  'Lomé Est': 'zn-lome-est',
  'Kara': 'zn-kara',
  'Centrale': 'zn-centrale',
}

const ENTREPOT_NOM_TO_ID: Record<string, string> = {
  'Lomé Port': 'ent-lome-port',
  'Kara': 'ent-kara',
}

export interface ProduitEvolutionMagasin {
  reference: string
  nom: string
  categorie: string
  quantite_mois: number
  unite: string
  evolution_pct: number
  stock_magasin: number
  jours_couverture: number
  rupture: boolean
}

export interface MagasinCarteDG {
  id: string
  nom: string
  type_magasin: TypeMagasin
  zone: string
  zone_id: string
  lat: number
  lng: number
  entrepot_id: string
  entrepot_nom: string
  ca_mois: number
  livraisons_mois: number
  creance: number
  creance_jours: number
  produits: ProduitEvolutionMagasin[]
}

export interface FluxEntrepotMagasinDG {
  entrepot_id: string
  entrepot_nom: string
  magasin_id: string
  magasin_nom: string
  type_magasin: TypeMagasin
  zone_id: string
  volume_mois_fcfa: number
  livraisons_mois: number
}

export interface ZoneMixMagasinsDG {
  zone_id: string
  zone_nom: string
  magasins_propres: number
  partenaires: number
  bl_propres_mois: number
  bl_partenaires_mois: number
  part_partenaires_pct: number
  alerte_saturation_partenaires: boolean
  entrepot_principal: string
}

export interface AnalyseMagasinIA {
  type: 'SATURATION_PARTENAIRES' | 'MAGASIN_PROPRE' | 'PRODUIT_ZONE' | 'FLUX_ENTREPOT'
  severite: 'CRITIQUE' | 'HAUTE' | 'MODEREE'
  titre: string
  detail: string
  zone_ids: string[]
  action: string
}

/** Évolution produit par magasin — mock réaliste grossiste. */
const PRODUITS_PAR_MAGASIN: Record<string, ProduitEvolutionMagasin[]> = {
  'mag-1': [
    { reference: 'PRD-EAU-1.5L', nom: 'Eau 1,5L pack 12', categorie: 'Boissons', quantite_mois: 420, unite: 'packs', evolution_pct: 14, stock_magasin: 180, jours_couverture: 5, rupture: false },
    { reference: 'PRD-COCA-33CL', nom: 'Soda 33cl pack 24', categorie: 'Boissons', quantite_mois: 210, unite: 'packs', evolution_pct: 9, stock_magasin: 95, jours_couverture: 6, rupture: false },
    { reference: 'PRD-HUILE-5L', nom: 'Huile 5L', categorie: 'Alimentaire', quantite_mois: 88, unite: 'cartons', evolution_pct: 22, stock_magasin: 12, jours_couverture: 2, rupture: true },
  ],
  'mag-2': [
    { reference: 'PRD-EAU-1.5L', nom: 'Eau 1,5L pack 12', categorie: 'Boissons', quantite_mois: 280, unite: 'packs', evolution_pct: -4, stock_magasin: 140, jours_couverture: 8, rupture: false },
    { reference: 'PRD-HUILE-5L', nom: 'Huile 5L', categorie: 'Alimentaire', quantite_mois: 64, unite: 'cartons', evolution_pct: 18, stock_magasin: 8, jours_couverture: 2, rupture: true },
    { reference: 'PRD-RIZ-25KG', nom: 'Riz 25 kg', categorie: 'Alimentaire', quantite_mois: 45, unite: 'sacs', evolution_pct: 6, stock_magasin: 22, jours_couverture: 7, rupture: false },
  ],
  'mag-3': [
    { reference: 'PRD-EAU-1.5L', nom: 'Eau 1,5L pack 12', categorie: 'Boissons', quantite_mois: 310, unite: 'packs', evolution_pct: 11, stock_magasin: 200, jours_couverture: 6, rupture: false },
    { reference: 'PRD-COCA-33CL', nom: 'Soda 33cl pack 24', categorie: 'Boissons', quantite_mois: 175, unite: 'packs', evolution_pct: 15, stock_magasin: 88, jours_couverture: 5, rupture: false },
    { reference: 'PRD-SAVON-PACK', nom: 'Savon carton 48', categorie: 'Hygiène', quantite_mois: 42, unite: 'cartons', evolution_pct: 3, stock_magasin: 18, jours_couverture: 9, rupture: false },
  ],
  'mag-4': [
    { reference: 'PRD-EAU-1.5L', nom: 'Eau 1,5L pack 12', categorie: 'Boissons', quantite_mois: 380, unite: 'packs', evolution_pct: 8, stock_magasin: 220, jours_couverture: 7, rupture: false },
    { reference: 'PRD-SAVON-PACK', nom: 'Savon carton 48', categorie: 'Hygiène', quantite_mois: 58, unite: 'cartons', evolution_pct: -2, stock_magasin: 14, jours_couverture: 4, rupture: false },
    { reference: 'PRD-RIZ-25KG', nom: 'Riz 25 kg', categorie: 'Alimentaire', quantite_mois: 72, unite: 'sacs', evolution_pct: 12, stock_magasin: 35, jours_couverture: 8, rupture: false },
  ],
  'pdv-1': [
    { reference: 'PRD-EAU-1.5L', nom: 'Eau 1,5L pack 12', categorie: 'Boissons', quantite_mois: 180, unite: 'packs', evolution_pct: 7, stock_magasin: 45, jours_couverture: 4, rupture: false },
    { reference: 'PRD-HUILE-5L', nom: 'Huile 5L', categorie: 'Alimentaire', quantite_mois: 32, unite: 'cartons', evolution_pct: 28, stock_magasin: 4, jours_couverture: 2, rupture: true },
  ],
  'pdv-2': [
    { reference: 'PRD-EAU-1.5L', nom: 'Eau 1,5L pack 12', categorie: 'Boissons', quantite_mois: 95, unite: 'packs', evolution_pct: 5, stock_magasin: 28, jours_couverture: 5, rupture: false },
    { reference: 'PRD-COCA-33CL', nom: 'Soda 33cl pack 24', categorie: 'Boissons', quantite_mois: 48, unite: 'packs', evolution_pct: -8, stock_magasin: 12, jours_couverture: 4, rupture: false },
  ],
  'pdv-3': [
    { reference: 'PRD-HUILE-5L', nom: 'Huile 5L', categorie: 'Alimentaire', quantite_mois: 12, unite: 'cartons', evolution_pct: -35, stock_magasin: 2, jours_couverture: 8, rupture: false },
    { reference: 'PRD-EAU-1.5L', nom: 'Eau 1,5L pack 12', categorie: 'Boissons', quantite_mois: 28, unite: 'packs', evolution_pct: -22, stock_magasin: 8, jours_couverture: 12, rupture: false },
  ],
  'pdv-4': [
    { reference: 'PRD-EAU-1.5L', nom: 'Eau 1,5L pack 12', categorie: 'Boissons', quantite_mois: 220, unite: 'packs', evolution_pct: 10, stock_magasin: 90, jours_couverture: 6, rupture: false },
    { reference: 'PRD-RIZ-25KG', nom: 'Riz 25 kg', categorie: 'Alimentaire', quantite_mois: 38, unite: 'sacs', evolution_pct: 6, stock_magasin: 15, jours_couverture: 5, rupture: false },
  ],
  'pdv-7': [
    { reference: 'PRD-COCA-33CL', nom: 'Soda 33cl pack 24', categorie: 'Boissons', quantite_mois: 88, unite: 'packs', evolution_pct: 18, stock_magasin: 22, jours_couverture: 3, rupture: false },
    { reference: 'PRD-EAU-1.5L', nom: 'Eau 1,5L pack 12', categorie: 'Boissons', quantite_mois: 120, unite: 'packs', evolution_pct: 14, stock_magasin: 18, jours_couverture: 2, rupture: true },
  ],
}

function defaultProduits(magasinId: string, ca: number, pipeline?: string): ProduitEvolutionMagasin[] {
  const rng = seededRandom(hashString(`prod-${magasinId}`))
  const count = randInt(rng, 2, 5)
  const produits = [...REGISTRE_STOCK].sort(() => rng() - 0.5).slice(0, count)
  return produits.map(p => {
    const quantite_mois = Math.max(8, Math.round(ca / randInt(rng, 28_000, 75_000)))
    const stock_magasin = randInt(rng, 6, 140)
    const jours_couverture = randInt(rng, 2, 14)
    const rupture = pipeline === 'A_RISQUE'
      ? rng() < 0.18
      : jours_couverture <= 3 && rng() < 0.35
    return {
      reference: p.reference,
      nom: p.nom,
      categorie: p.categorie,
      quantite_mois,
      unite: p.categorie === 'Alimentaire' ? 'cartons' : 'packs',
      evolution_pct: randInt(rng, -28, 32),
      stock_magasin,
      jours_couverture,
      rupture,
    }
  })
}

export function buildMagasinsCarteDG(): MagasinCarteDG[] {
  return REGISTRE_PDV
    .filter(p => p.ca_mois > 0 || p.type_magasin === 'PROPRE')
    .map(p => ({
      id: p.id,
      nom: p.nom,
      type_magasin: p.type_magasin,
      zone: p.zone,
      zone_id: ZONE_NOM_TO_ID[p.zone] ?? '',
      lat: p.lat,
      lng: p.lng,
      entrepot_id: ENTREPOT_NOM_TO_ID[p.entrepot_source] ?? 'ent-lome-port',
      entrepot_nom: p.entrepot_source,
      ca_mois: p.ca_mois,
      livraisons_mois: p.type_magasin === 'PROPRE'
        ? Math.max(8, Math.round(p.ca_mois / 350_000))
        : Math.max(2, Math.round(p.ca_mois / 420_000)),
      creance: p.creance,
      creance_jours: p.creance_jours,
      produits: PRODUITS_PAR_MAGASIN[p.id] ?? defaultProduits(p.id, p.ca_mois, p.pipeline),
    }))
}

export function buildFluxEntrepotMagasins(magasins: MagasinCarteDG[]): FluxEntrepotMagasinDG[] {
  return magasins.map(m => ({
    entrepot_id: m.entrepot_id,
    entrepot_nom: m.entrepot_nom,
    magasin_id: m.id,
    magasin_nom: m.nom,
    type_magasin: m.type_magasin,
    zone_id: m.zone_id,
    volume_mois_fcfa: m.ca_mois,
    livraisons_mois: m.livraisons_mois,
  }))
}

export function buildZoneMixMagasins(magasins: MagasinCarteDG[]): ZoneMixMagasinsDG[] {
  return ZONES_DISTRIBUTION.map(z => {
    const inZone = magasins.filter(m => m.zone_id === z.id)
    const propres = inZone.filter(m => m.type_magasin === 'PROPRE')
    const partenaires = inZone.filter(m => m.type_magasin === 'PARTENAIRE')
    const blPropres = propres.reduce((s, m) => s + m.livraisons_mois, 0)
    const blPartenaires = partenaires.reduce((s, m) => s + m.livraisons_mois, 0)
    const total = blPropres + blPartenaires
    const partPct = total > 0 ? Math.round((blPartenaires / total) * 100) : 0
    const entrepot = ENTREPOTS_DISTRIBUTION.find(e => e.zones_rattachees.includes(z.id))

    return {
      zone_id: z.id,
      zone_nom: z.nom,
      magasins_propres: propres.length,
      partenaires: partenaires.length,
      bl_propres_mois: blPropres,
      bl_partenaires_mois: blPartenaires,
      part_partenaires_pct: partPct,
      alerte_saturation_partenaires: partPct >= 72 && partenaires.length >= 3,
      entrepot_principal: entrepot?.nom ?? '—',
    }
  })
}

export function getProduitsDisponiblesCarte(): { reference: string; nom: string; categorie: string }[] {
  return REGISTRE_STOCK.map(p => ({ reference: p.reference, nom: p.nom, categorie: p.categorie }))
}

export function getEvolutionProduitMagasin(magasin: MagasinCarteDG, produitRef: string): ProduitEvolutionMagasin | null {
  return magasin.produits.find(p => p.reference === produitRef) ?? null
}

export function getEvolutionProduitZone(magasins: MagasinCarteDG[], zoneId: string, produitRef: string) {
  const inZone = magasins.filter(m => m.zone_id === zoneId)
  const avecProduit = inZone
    .map(m => ({ magasin: m, produit: getEvolutionProduitMagasin(m, produitRef) }))
    .filter((x): x is { magasin: MagasinCarteDG; produit: ProduitEvolutionMagasin } => x.produit !== null)

  const totalQty = avecProduit.reduce((s, x) => s + x.produit.quantite_mois, 0)
  const propres = avecProduit.filter(x => x.magasin.type_magasin === 'PROPRE')
  const partenaires = avecProduit.filter(x => x.magasin.type_magasin === 'PARTENAIRE')
  const ruptures = avecProduit.filter(x => x.produit.rupture)

  return {
    zone_id: zoneId,
    produit_ref: produitRef,
    total_quantite: totalQty,
    magasins_count: avecProduit.length,
    propres_count: propres.length,
    partenaires_count: partenaires.length,
    ruptures_count: ruptures.length,
    evolution_moyenne: avecProduit.length
      ? Math.round(avecProduit.reduce((s, x) => s + x.produit.evolution_pct, 0) / avecProduit.length)
      : 0,
    details: avecProduit,
  }
}

export function buildAnalysesMagasinsIA(
  magasins: MagasinCarteDG[],
  mixZones: ZoneMixMagasinsDG[],
): AnalyseMagasinIA[] {
  const analyses: AnalyseMagasinIA[] = []

  const zonesSaturees = mixZones.filter(z => z.alerte_saturation_partenaires)
  for (const z of zonesSaturees) {
    const magasinsZone = magasins.filter(m => m.zone_id === z.zone_id)
    const propres = magasinsZone.filter(m => m.type_magasin === 'PROPRE')
    analyses.push({
      type: 'SATURATION_PARTENAIRES',
      severite: z.part_partenaires_pct >= 80 ? 'CRITIQUE' : 'HAUTE',
      titre: `Trop de livraisons partenaires — ${z.zone_nom}`,
      detail: `${z.part_partenaires_pct}% des BL vers partenaires (${z.bl_partenaires_mois} BL) vs ${z.bl_propres_mois} BL vers ${z.magasins_propres} magasin(s) enseigne · entrepôt ${z.entrepot_principal} · risque rupture stock partenaires en cascade`,
      zone_ids: [z.zone_id],
      action: `Prioriser le réassort des ${z.magasins_propres} magasin(s) enseigne, puis regrouper les BL partenaires sur 2 passages/semaine. Plafonner les livraisons huile/riz à 3 partenaires par micro-secteur.`,
    })
    if (propres.length > 0) {
      const propresRupture = propres.flatMap(m => m.produits.filter(p => p.rupture))
      if (propresRupture.length > 0) {
        analyses.push({
          type: 'MAGASIN_PROPRE',
          severite: 'HAUTE',
          titre: `Rupture en magasin enseigne — ${z.zone_nom}`,
          detail: `${propres.map(m => m.nom).join(', ')} : ${propresRupture.length} SKU en rupture malgré flux entrepôt direct · les partenaires voisins absorbent le volume (${z.part_partenaires_pct}% BL partenaires)`,
          zone_ids: [z.zone_id],
          action: 'Réserver 15% du stock entrepôt alimentaire aux magasins PROPRE avant dispatch partenaires de la zone.',
        })
      }
    }
  }

  const lomeCentre = mixZones.find(z => z.zone_id === 'zn-lome-centre')
  if (lomeCentre && lomeCentre.partenaires >= 2 && lomeCentre.magasins_propres >= 1) {
    const huileZone = getEvolutionProduitZone(magasins, 'zn-lome-centre', 'PRD-HUILE-5L')
    if (huileZone.partenaires_count >= 2 && huileZone.ruptures_count >= 1) {
      analyses.push({
        type: 'PRODUIT_ZONE',
        severite: 'CRITIQUE',
        titre: 'Huile 5L — saturation Lomé Centre',
        detail: `${huileZone.partenaires_count} partenaires + ${huileZone.propres_count} magasin enseigne en demande · ${huileZone.total_quantite} cartons/mois · ${huileZone.ruptures_count} point(s) en rupture · livraisons multiples même zone épuisent le stock en 2j`,
        zone_ids: ['zn-lome-centre'],
        action: 'Passer en tournée groupée : 1 BL multi-partenaires par secteur portuaire, réappro magasin Atlas Shop Port en priorité.',
      })
    }
  }

  const lomePort = ENTREPOTS_DISTRIBUTION.find(e => e.id === 'ent-lome-port')
  if (lomePort) {
    const fluxLome = magasins.filter(m => m.entrepot_id === 'ent-lome-port')
    const partenairesLome = fluxLome.filter(m => m.type_magasin === 'PARTENAIRE')
    const blPart = partenairesLome.reduce((s, m) => s + m.livraisons_mois, 0)
    const blProp = fluxLome.filter(m => m.type_magasin === 'PROPRE').reduce((s, m) => s + m.livraisons_mois, 0)
    analyses.push({
      type: 'FLUX_ENTREPOT',
      severite: blPart > blProp * 4 ? 'HAUTE' : 'MODEREE',
      titre: `Flux Lomé Port — ${fluxLome.length} points de livraison`,
      detail: `${blPart} BL/mois partenaires vs ${blProp} BL/mois magasins enseigne · ${lomePort.livraisons_jour} expéditions/j · taux service ${lomePort.taux_service_pct}%`,
      zone_ids: ['zn-lome-nord', 'zn-lome-sud', 'zn-lome-centre', 'zn-lome-est'],
      action: 'Cartographier les BL par micro-zone : si > 5 partenaires dans un rayon 1,5 km, fusionner en tournée unique.',
    })
  }

  return analyses
}
