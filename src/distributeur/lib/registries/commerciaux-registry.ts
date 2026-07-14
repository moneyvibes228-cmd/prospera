import type { CommercialKpi, TypeCommercial } from '@distributeur/types'

/**
 * Registre brut des commerciaux — salariés et freelances.
 *
 * N'y figurent que les vendeurs porteurs d'un portefeuille. Les managers
 * (Responsable des Ventes, Superviseur de Zone) n'ont pas de portefeuille
 * en propre : ils encadrent, ils ne vendent pas. Leur rattachement vit dans
 * `zones-registry` (zone.superviseur / region.resp_ventes).
 */
export interface CommercialRegistryEntry extends CommercialKpi {
  email: string
  /** Superviseur de zone dont dépend le commercial — `—` pour la cellule prospection, rattachée au DC. */
  superviseur: string
  /** Freelance : peut fixer ses prix client indépendamment du tarif société */
  grille_client_personnalisee?: boolean
}

export const REGISTRE_COMMERCIAUX: CommercialRegistryEntry[] = [
  { id: 'c-1', nom: 'Komlan Tetteh', email: 'commercial@demo.prospera.tg', zone: 'Lomé Nord', superviseur: 'Efua Koffi', type: 'SALARIE', visites_jour: 28, visites_objectif: 25, commandes_jour: 14, ca_jour: 2_840_000, score_ia: 91 },
  { id: 'c-2', nom: 'Massan Agbodjan', email: 'massan.agbodjan@demo.prospera.tg', zone: 'Kara', superviseur: 'Abra Tchalla', type: 'SALARIE', visites_jour: 22, visites_objectif: 20, commandes_jour: 11, ca_jour: 4_120_000, score_ia: 87 },
  { id: 'c-3', nom: 'Mawuena Ahi', email: 'prospection@demo.prospera.tg', zone: 'Prospection', superviseur: '—', type: 'SALARIE', visites_jour: 15, visites_objectif: 18, commandes_jour: 3, ca_jour: 420_000, score_ia: 68 },
  { id: 'c-4', nom: 'Kofi Agbessi', email: 'freelance@demo.prospera.tg', zone: 'Lomé Sud', superviseur: 'Akouvi Bediako', type: 'FREELANCE', visites_jour: 18, visites_objectif: 15, commandes_jour: 9, ca_jour: 535_000, marge_jour: 150_000, score_ia: 84, grille_client_personnalisee: true },
  { id: 'c-5', nom: 'Yaovi Amouzou', email: 'yaovi.amouzou@demo.prospera.tg', zone: 'Lomé Centre', superviseur: 'Selom Amevor', type: 'SALARIE', visites_jour: 24, visites_objectif: 22, commandes_jour: 12, ca_jour: 3_680_000, score_ia: 86 },
  { id: 'c-6', nom: 'Adjoa Mensah', email: 'adjoa.mensah@demo.prospera.tg', zone: 'Lomé Est', superviseur: 'Rachidou Bawa', type: 'SALARIE', visites_jour: 20, visites_objectif: 20, commandes_jour: 8, ca_jour: 2_120_000, score_ia: 79 },
  { id: 'c-7', nom: 'Edem Koffi', email: 'edem.koffi@demo.prospera.tg', zone: 'Lomé Sud', superviseur: 'Akouvi Bediako', type: 'SALARIE', visites_jour: 26, visites_objectif: 24, commandes_jour: 13, ca_jour: 3_240_000, score_ia: 88 },
  { id: 'c-8', nom: 'Ama Tetteh', email: 'ama.tetteh@demo.prospera.tg', zone: 'Lomé Nord', superviseur: 'Efua Koffi', type: 'SALARIE', visites_jour: 21, visites_objectif: 22, commandes_jour: 10, ca_jour: 2_560_000, score_ia: 82 },
  { id: 'c-9', nom: 'Sena Dzobo', email: 'sena.dzobo@demo.prospera.tg', zone: 'Kara', superviseur: 'Abra Tchalla', type: 'SALARIE', visites_jour: 19, visites_objectif: 18, commandes_jour: 9, ca_jour: 3_890_000, score_ia: 85 },
  { id: 'c-10', nom: 'Yao Ahi', email: 'yao.ahi@demo.prospera.tg', zone: 'Centrale', superviseur: 'Bassirou Kanté', type: 'SALARIE', visites_jour: 17, visites_objectif: 18, commandes_jour: 7, ca_jour: 1_980_000, score_ia: 76 },
  { id: 'c-11', nom: 'Kossi Fiagbe', email: 'kossi.fiagbe@demo.prospera.tg', zone: 'Lomé Centre', superviseur: 'Selom Amevor', type: 'SALARIE', visites_jour: 23, visites_objectif: 22, commandes_jour: 11, ca_jour: 2_980_000, score_ia: 83 },
  { id: 'c-12', nom: 'Elom Doheto', email: 'elom.doheto@demo.prospera.tg', zone: 'Lomé Nord', superviseur: 'Efua Koffi', type: 'FREELANCE', visites_jour: 16, visites_objectif: 14, commandes_jour: 8, ca_jour: 680_000, marge_jour: 185_000, score_ia: 81, grille_client_personnalisee: true },
  { id: 'c-13', nom: 'Afi Adjavon', email: 'afi.adjavon@demo.prospera.tg', zone: 'Lomé Est', superviseur: 'Rachidou Bawa', type: 'SALARIE', visites_jour: 18, visites_objectif: 19, commandes_jour: 6, ca_jour: 1_740_000, score_ia: 74 },
  { id: 'c-14', nom: 'Komi Amegah', email: 'komi.amegah@demo.prospera.tg', zone: 'Lomé Sud', superviseur: 'Akouvi Bediako', type: 'FREELANCE', visites_jour: 14, visites_objectif: 12, commandes_jour: 7, ca_jour: 520_000, marge_jour: 142_000, score_ia: 80, grille_client_personnalisee: true },
  { id: 'c-15', nom: 'Dzifa Soglo', email: 'dzifa.soglo@demo.prospera.tg', zone: 'Kara', superviseur: 'Abra Tchalla', type: 'SALARIE', visites_jour: 20, visites_objectif: 19, commandes_jour: 10, ca_jour: 3_420_000, score_ia: 84 },
  { id: 'c-16', nom: 'Koffi Boco', email: 'koffi.boco@demo.prospera.tg', zone: 'Centrale', superviseur: 'Bassirou Kanté', type: 'SALARIE', visites_jour: 16, visites_objectif: 17, commandes_jour: 6, ca_jour: 1_650_000, score_ia: 72 },
  { id: 'c-17', nom: 'Komlan Lawson', email: 'komlan.lawson@demo.prospera.tg', zone: 'Lomé Nord', superviseur: 'Efua Koffi', type: 'SALARIE', visites_jour: 25, visites_objectif: 23, commandes_jour: 12, ca_jour: 3_100_000, score_ia: 89 },
  { id: 'c-18', nom: 'Efua Abalo', email: 'efua.abalo@demo.prospera.tg', zone: 'Lomé Sud', superviseur: 'Akouvi Bediako', type: 'SALARIE', visites_jour: 22, visites_objectif: 21, commandes_jour: 10, ca_jour: 2_780_000, score_ia: 86 },
  { id: 'c-19', nom: 'Mawuena Kpodo', email: 'mawuena.kpodo@demo.prospera.tg', zone: 'Prospection', superviseur: '—', type: 'SALARIE', visites_jour: 14, visites_objectif: 16, commandes_jour: 4, ca_jour: 580_000, score_ia: 71 },
  { id: 'c-20', nom: 'Kodjo Mensah', email: 'kodjo.mensah@demo.prospera.tg', zone: 'Lomé Est', superviseur: 'Rachidou Bawa', type: 'FREELANCE', visites_jour: 12, visites_objectif: 12, commandes_jour: 5, ca_jour: 410_000, marge_jour: 118_000, score_ia: 77, grille_client_personnalisee: true },
  { id: 'c-21', nom: 'Adjoa Koffi', email: 'adjoa.koffi@demo.prospera.tg', zone: 'Lomé Centre', superviseur: 'Selom Amevor', type: 'SALARIE', visites_jour: 19, visites_objectif: 20, commandes_jour: 9, ca_jour: 2_450_000, score_ia: 80 },
  { id: 'c-22', nom: 'Edem Tetteh', email: 'edem.tetteh@demo.prospera.tg', zone: 'Kara', superviseur: 'Abra Tchalla', type: 'SALARIE', visites_jour: 18, visites_objectif: 18, commandes_jour: 8, ca_jour: 2_890_000, score_ia: 83 },
]

/** Commerciaux d'une zone — l'équipe directe d'un superviseur. */
export function getCommerciauxParZone(zones: readonly string[]): CommercialRegistryEntry[] {
  return REGISTRE_COMMERCIAUX.filter(c => zones.includes(c.zone))
}

/** Équipe directe d'un superviseur, par rattachement hiérarchique. */
export function getEquipeDuSuperviseur(nom: string): CommercialRegistryEntry[] {
  return REGISTRE_COMMERCIAUX.filter(c => c.superviseur === nom)
}

export function getCommercialByNom(nom: string): CommercialRegistryEntry | undefined {
  return REGISTRE_COMMERCIAUX.find(c => c.nom === nom)
}

export function getCommercialByEmail(email: string): CommercialRegistryEntry | undefined {
  return REGISTRE_COMMERCIAUX.find(c => c.email === email)
}
