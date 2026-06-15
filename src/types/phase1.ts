/** Types alignés sur API_MICROFINANCE_PHASE1.md */

export type ApiBackendRole =
  | 'DIRECTEUR_GENERAL'
  | 'RESPONSABLE_AGENCE'
  | 'RESPONSABLE_OPERATION_CREDIT'
  | 'RESPONSABLE_COMMERCIAL_COLLECTE'
  | 'GESTIONNAIRE_PORTEFEUILLE'
  | 'AGENT_TERRAIN'
  | 'CHARGE_CREDIT'
  | 'COMPTABLE'
  | 'COLLECTRICE'

export interface AgenceApi {
  id: string
  nom: string
  ville: string
  zone?: string | null
  adresse?: string | null
  telephone?: string | null
  createdAt?: string
  equipe?: ApiUser[]
  objectifs?: ObjectifAgenceMois[]
}

export interface ObjectifAgenceMois {
  annee: number
  mois: number
  objectif_clients_mois: number
  objectif_collecte_fcfa: number
  objectif_prospects_mois: number
  objectif_visites_mois: number
  notes?: string | null
}

export interface ApiUser {
  id: string
  nom: string
  prenom: string
  email: string
  telephone?: string | null
  role: ApiBackendRole | string
  agenceId?: string | null
  agence?: { id: string; nom: string; ville?: string } | null
  actif?: boolean
  createdAt?: string
}

export interface CreateUserPayload {
  nom: string
  prenom: string
  email: string
  telephone?: string
  password: string
  role: ApiBackendRole | string
  agenceId?: string
}

export interface CreateAgencePayload {
  nom: string
  ville: string
  zone?: string
  adresse?: string
  telephone?: string
}

export interface GeoJsonPolygon {
  type: 'Polygon'
  coordinates: number[][][]
}

export interface ZoneTerrainApi {
  libelle: string
  geojson?: GeoJsonPolygon | null
  centre_lat?: number | null
  centre_lng?: number | null
  couleur?: string | null
  description?: string | null
}

export interface AgentZoneApi {
  id: string
  nom: string
  prenom: string
  agence: { id: string; nom: string; ville?: string }
  zone_affectee: ZoneTerrainApi | null
  stats?: { nb_clients: number; nb_visites: number }
}

export interface CreateProspectPayload {
  nom: string
  prenom: string
  telephone: string
  sexe?: 'FEMININ' | 'MASCULIN'
  age?: number
  zone?: string
  activite?: string
  secteur_activite?: string
}

/** Corps POST /auth/login — email ou téléphone */
export interface LoginPayload {
  identifiant: string
  password: string
}

export interface LoginApiResponse {
  access_token: string
  user: ApiUser & { role: string }
}

export interface VisiteListItem {
  id: string
  lat: number
  lng: number
  statut: string
  objet_visite?: string
  date?: string
  clientId?: string | null
  nom_prospect?: string | null
}
