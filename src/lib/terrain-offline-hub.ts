/** Hub mode hors-ligne terrain — file sync, visites en attente, collecte */

export type SyncStatut = 'SYNC' | 'EN_ATTENTE' | 'CONFLIT' | 'ERREUR'

export interface ActionOffline {
  id: string
  type: 'VISITE' | 'COLLECTE' | 'REMBOURSEMENT' | 'NOUVEAU_CLIENT' | 'PHOTO_KYC'
  libelle: string
  client?: string
  montant_fcfa?: number
  created_at: string
  statut: SyncStatut
  taille_ko?: number
}

export interface TerrainOfflineHub {
  synthese_ia: string
  mode_hors_ligne: boolean
  derniere_sync: string
  kpis: {
    actions_en_attente: number
    visites_non_sync: number
    collecte_en_attente_fcfa: number
    conflits: number
    stockage_utilise_mo: number
  }
  file_sync: ActionOffline[]
  historique_sync: Array<{ date: string; actions: number; duree_sec: number; statut: 'OK' | 'PARTIEL' | 'ECHEC' }>
  conseils_ia: string[]
}

export const TERRAIN_OFFLINE_HUB: TerrainOfflineHub = {
  synthese_ia:
    '4 actions en file (2 visites, 1 collecte 45 k, 1 photo KYC). Dernière sync il y a 2h — reconnectez-vous avant 18h pour éviter perte données. Zone Bè : couverture réseau faible 14h–16h, mode offline recommandé.',
  mode_hors_ligne: false,
  derniere_sync: '28/05/2026 11:42',
  kpis: {
    actions_en_attente: 4,
    visites_non_sync: 2,
    collecte_en_attente_fcfa: 165_000,
    conflits: 0,
    stockage_utilise_mo: 12.4,
  },
  file_sync: [
    { id: 'OFF-1', type: 'VISITE', libelle: 'Visite Dossi Kokuvi — impayé J+21', client: 'Dossi Kokuvi', created_at: '28/05/2026 10:15', statut: 'EN_ATTENTE', taille_ko: 240 },
    { id: 'OFF-2', type: 'COLLECTE', libelle: 'Collecte tontine Bè', client: 'Groupe Tontine Bè', montant_fcfa: 120_000, created_at: '28/05/2026 10:42', statut: 'EN_ATTENTE', taille_ko: 8 },
    { id: 'OFF-3', type: 'VISITE', libelle: 'Prospection marché Tokoin', created_at: '28/05/2026 11:05', statut: 'EN_ATTENTE', taille_ko: 180 },
    { id: 'OFF-4', type: 'PHOTO_KYC', libelle: 'Photo client Yawo Adjavon', client: 'Yawo Adjavon', created_at: '28/05/2026 11:28', statut: 'EN_ATTENTE', taille_ko: 890 },
  ],
  historique_sync: [
    { date: '28/05/2026 11:42', actions: 3, duree_sec: 12, statut: 'OK' },
    { date: '28/05/2026 08:15', actions: 5, duree_sec: 18, statut: 'OK' },
    { date: '27/05/2026 17:50', actions: 2, duree_sec: 45, statut: 'PARTIEL' },
  ],
  conseils_ia: [
    'Activer le mode hors-ligne avant les tournées zone Bè (14h–16h)',
    'Synchroniser avant chaque départ agence le matin',
    'Compresser les photos KYC (< 500 Ko) pour accélérer la sync',
  ],
}

export function getTerrainOfflineHub(): TerrainOfflineHub {
  return TERRAIN_OFFLINE_HUB
}
