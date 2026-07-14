import type { PointDeVente } from '@distributeur/types'
import { generatePdvBatch } from '@distributeur/lib/generators/generate-pdv'

/** Points de vente nommés — scénarios démo & rapports détaillés. */
export const REGISTRE_PDV_SEED: PointDeVente[] = [
  { id: 'mag-1', nom: 'Atlas Shop Bé', telephone: '+228 22 10 01 01', zone: 'Lomé Nord', adresse: 'Marché Bé — enseigne', score_ia: 91, pipeline: 'FIDELE', ca_mois: 4_820_000, creance: 0, creance_jours: 0, derniere_commande: '2026-06-10', commercial: '—', type_proprietaire: 'SALARIE', type_magasin: 'PROPRE', entrepot_source: 'Lomé Port', lat: 6.1345, lng: 1.2210 },
  { id: 'mag-2', nom: 'Atlas Shop Port', telephone: '+228 22 10 01 02', zone: 'Lomé Centre', adresse: 'Zone portuaire — enseigne', score_ia: 78, pipeline: 'ACTIF', ca_mois: 2_940_000, creance: 0, creance_jours: 0, derniere_commande: '2026-06-09', commercial: '—', type_proprietaire: 'SALARIE', type_magasin: 'PROPRE', entrepot_source: 'Lomé Port', lat: 6.1360, lng: 1.2285 },
  { id: 'mag-3', nom: 'Atlas Shop Agoè', telephone: '+228 22 10 01 03', zone: 'Lomé Sud', adresse: 'Carrefour Agoè — enseigne', score_ia: 85, pipeline: 'FIDELE', ca_mois: 3_560_000, creance: 0, creance_jours: 0, derniere_commande: '2026-06-10', commercial: '—', type_proprietaire: 'SALARIE', type_magasin: 'PROPRE', entrepot_source: 'Lomé Port', lat: 6.1205, lng: 1.2265 },
  { id: 'mag-4', nom: 'Atlas Shop Kara', telephone: '+228 22 10 02 01', zone: 'Kara', adresse: 'Centre-ville — enseigne', score_ia: 92, pipeline: 'FIDELE', ca_mois: 5_100_000, creance: 0, creance_jours: 0, derniere_commande: '2026-06-10', commercial: '—', type_proprietaire: 'SALARIE', type_magasin: 'PROPRE', entrepot_source: 'Kara', lat: 9.5495, lng: 1.1875 },
  { id: 'pdv-1', nom: 'Boutique Akossombo', telephone: '+228 90 12 34 56', zone: 'Lomé Nord', adresse: 'Marché Bé', score_ia: 82, pipeline: 'FIDELE', ca_mois: 2_450_000, creance: 0, creance_jours: 0, derniere_commande: '2026-06-08', commercial: 'Komlan Tetteh', type_proprietaire: 'SALARIE', type_magasin: 'PARTENAIRE', entrepot_source: 'Lomé Port', lat: 6.1319, lng: 1.2228 },
  { id: 'pdv-2', nom: 'Épicerie Mama T.', telephone: '+228 91 23 45 67', zone: 'Lomé Nord', adresse: 'Agoè', score_ia: 71, pipeline: 'ACTIF', ca_mois: 1_120_000, creance: 3_400_000, creance_jours: 12, derniere_commande: '2026-06-07', commercial: 'Komlan Tetteh', type_proprietaire: 'SALARIE', type_magasin: 'PARTENAIRE', entrepot_source: 'Lomé Port', lat: 6.1280, lng: 1.2150 },
  { id: 'pdv-7', nom: 'Dépôt Agoè Plage', telephone: '+228 97 11 22 33', zone: 'Lomé Sud', adresse: 'Agoè Plage', score_ia: 76, pipeline: 'ACTIF', ca_mois: 1_680_000, creance: 180_000, creance_jours: 8, derniere_commande: '2026-06-09', commercial: 'Kofi Agbessi', type_proprietaire: 'FREELANCE', type_magasin: 'PARTENAIRE', entrepot_source: 'Lomé Port', lat: 6.1180, lng: 1.2280 },
  { id: 'pdv-8', nom: 'Boutique Kofi Trade', telephone: '+228 96 22 33 44', zone: 'Lomé Sud', adresse: 'Bè', score_ia: 68, pipeline: 'FIDELE', ca_mois: 920_000, creance: 0, creance_jours: 0, derniere_commande: '2026-06-08', commercial: 'Kofi Agbessi', type_proprietaire: 'FREELANCE', type_magasin: 'PARTENAIRE', entrepot_source: 'Lomé Port', lat: 6.1220, lng: 1.2350 },
  { id: 'pdv-3', nom: 'Kiosque Port', telephone: '+228 92 34 56 78', zone: 'Lomé Centre', adresse: 'Zone portuaire', score_ia: 45, pipeline: 'A_RISQUE', ca_mois: 380_000, creance: 8_900_000, creance_jours: 45, derniere_commande: '2026-05-12', commercial: 'Komlan Tetteh', type_proprietaire: 'SALARIE', type_magasin: 'PARTENAIRE', entrepot_source: 'Lomé Port', lat: 6.1375, lng: 1.2300 },
  { id: 'pdv-4', nom: 'Superette Kara', telephone: '+228 93 45 67 89', zone: 'Kara', adresse: 'Centre-ville', score_ia: 88, pipeline: 'FIDELE', ca_mois: 3_200_000, creance: 0, creance_jours: 0, derniere_commande: '2026-06-09', commercial: 'Sena Dzobo', type_proprietaire: 'SALARIE', type_magasin: 'PARTENAIRE', entrepot_source: 'Kara', lat: 9.5511, lng: 1.1861 },
  { id: 'pdv-5', nom: 'Dépôt Sokodé', telephone: '+228 94 56 78 90', zone: 'Centrale', adresse: 'Grand marché', score_ia: 62, pipeline: 'ACTIF', ca_mois: 980_000, creance: 620_000, creance_jours: 5, derniere_commande: '2026-06-06', commercial: 'Yao Ahi', type_proprietaire: 'SALARIE', type_magasin: 'PARTENAIRE', entrepot_source: 'Kara', lat: 8.9833, lng: 1.1333 },
  { id: 'pdv-6', nom: 'Boutique Nouvelle', telephone: '+228 95 67 89 01', zone: 'Lomé Est', adresse: 'Bè Kpota', score_ia: 55, pipeline: 'PROSPECTION', ca_mois: 0, creance: 0, creance_jours: 0, derniere_commande: '—', commercial: 'Mawuena Ahi', type_proprietaire: 'SALARIE', type_magasin: 'PARTENAIRE', entrepot_source: 'Lomé Port', lat: 6.1250, lng: 1.2400 },
  { id: 'pdv-9', nom: 'Grossiste Adidogomé', telephone: '+228 98 88 77 66', zone: 'Lomé Nord', adresse: 'Marché Adidogomé', score_ia: 38, pipeline: 'A_RISQUE', ca_mois: 2_100_000, creance: 5_250_000, creance_jours: 20, derniere_commande: '2026-05-18', commercial: 'Mawuena Ahi', type_proprietaire: 'SALARIE', type_magasin: 'PARTENAIRE', entrepot_source: 'Lomé Port', lat: 6.1450, lng: 1.2100 },
]

const seedIds = new Set(REGISTRE_PDV_SEED.map(p => p.id))
const generated = generatePdvBatch(seedIds)

/** Registre complet — scénarios nommés + ~610 points générés (échantillon réseau 1 847 PDV). */
export const REGISTRE_PDV: PointDeVente[] = [...REGISTRE_PDV_SEED, ...generated]

export function getPdvById(id: string): PointDeVente | undefined {
  return REGISTRE_PDV.find(p => p.id === id)
}

export function getMagasinsPropres(): PointDeVente[] {
  return REGISTRE_PDV.filter(p => p.type_magasin === 'PROPRE')
}

export function getPartenaires(): PointDeVente[] {
  return REGISTRE_PDV.filter(p => p.type_magasin === 'PARTENAIRE')
}
