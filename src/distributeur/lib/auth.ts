import type { UserRole } from '@distributeur/types'
import { ENTREPRISE_REGISTRY } from './registries/entreprise-registry'

export interface AuthUser {
  id: string
  nom: string
  email: string
  role: UserRole
  /** Libellé affichable du rattachement. */
  zone: string
  /**
   * Rattachement de secours pour les rôles territoriaux, si l'utilisateur
   * n'est pas encore dans l'organigramme (`zones-registry`). Le registre
   * fait foi quand il connaît la personne — voir `getPerimetre`.
   */
  zones?: string[]
  /**
   * Entrepôt de rattachement des postes logistiques mono-site. Un gestionnaire
   * d'entrepôt ne pilote pas « la logistique », il pilote SON quai — voir
   * `getPerimetreLogistique`. Absent ⇒ le poste couvre le réseau.
   */
  entrepot?: string
  initiales: string
  entreprise: string
}

export const DEMO_USERS: (AuthUser & { password: string })[] = [
  {
    id: '1', nom: 'Koffi Mensah', email: 'dg@demo.prospera.tg', password: 'password123',
    role: 'DG', zone: 'Réseau — Togo', initiales: 'KM', entreprise: ENTREPRISE_REGISTRY.nom,
  },
  {
    id: '2', nom: 'Ama Dzobo', email: 'dc@demo.prospera.tg', password: 'password123',
    role: 'DC', zone: 'Commercial — Toutes zones', initiales: 'AD', entreprise: ENTREPRISE_REGISTRY.nom,
  },
  {
    id: '3', nom: 'Kodjo Agbeko', email: 'ventes@demo.prospera.tg', password: 'password123',
    role: 'RESP_VENTES', zone: 'Région Grand Lomé', initiales: 'KA', entreprise: ENTREPRISE_REGISTRY.nom,
    zones: ['Lomé Nord', 'Lomé Sud', 'Lomé Centre', 'Lomé Est'],
  },
  {
    id: '4', nom: 'Efua Koffi', email: 'superviseur@demo.prospera.tg', password: 'password123',
    role: 'SUPERVISEUR', zone: 'Zone Lomé Nord', initiales: 'EK', entreprise: ENTREPRISE_REGISTRY.nom,
    zones: ['Lomé Nord'],
  },
  {
    id: '5', nom: 'Komlan Tetteh', email: 'commercial@demo.prospera.tg', password: 'password123',
    role: 'COMMERCIAL', zone: 'Marché Bé — Lomé', initiales: 'KT', entreprise: ENTREPRISE_REGISTRY.nom,
  },
  {
    id: '5b', nom: 'Kofi Agbessi', email: 'freelance@demo.prospera.tg', password: 'password123',
    role: 'FREELANCE', zone: 'Portefeuille indépendant — Lomé Sud', initiales: 'KA', entreprise: ENTREPRISE_REGISTRY.nom,
  },
  {
    id: '6', nom: 'Mawuena Ahi', email: 'prospection@demo.prospera.tg', password: 'password123',
    role: 'PROSPECTION', zone: 'Zones blanches — Kara', initiales: 'MA', entreprise: ENTREPRISE_REGISTRY.nom,
  },
  {
    id: '7', nom: 'Yao Mensah', email: 'stock@demo.prospera.tg', password: 'password123',
    role: 'RESP_STOCK', zone: 'Entrepôts Lomé + Kara', initiales: 'YM', entreprise: ENTREPRISE_REGISTRY.nom,
  },
  {
    id: '8', nom: 'Edem Kpodo', email: 'entrepot@demo.prospera.tg', password: 'password123',
    role: 'GEST_ENTREPOT', zone: 'Entrepôt Lomé Port', entrepot: 'Lomé Port',
    initiales: 'EKP', entreprise: ENTREPRISE_REGISTRY.nom,
  },
  {
    id: '9', nom: 'Sena Fiagbe', email: 'daf@demo.prospera.tg', password: 'password123',
    role: 'DAF', zone: 'Direction Financière', initiales: 'SF', entreprise: ENTREPRISE_REGISTRY.nom,
  },
  {
    id: '10', nom: 'Adjoa Mensah', email: 'comptable@demo.prospera.tg', password: 'password123',
    role: 'COMPTABLE', zone: 'Comptabilité — Siège', initiales: 'AM', entreprise: ENTREPRISE_REGISTRY.nom,
  },
  {
    id: '11', nom: 'Kossi Doheto', email: 'marketing@demo.prospera.tg', password: 'password123',
    role: 'MARKETING', zone: 'Marketing & Campagnes', initiales: 'KD', entreprise: ENTREPRISE_REGISTRY.nom,
  },
  {
    id: '12', nom: 'Elom Adjavon', email: 'recouvrement@demo.prospera.tg', password: 'password123',
    role: 'RECOUVREMENT', zone: 'Créances & Impayés', initiales: 'EA', entreprise: ENTREPRISE_REGISTRY.nom,
  },
]

const COOKIE_NAME = 'prospera_dist_auth'
const STORAGE_KEY = 'prospera_dist_user'

export const ROLE_LABELS: Record<UserRole, string> = {
  DG: 'Directeur Général',
  DC: 'Directeur Commercial',
  RESP_VENTES: 'Responsable des Ventes',
  SUPERVISEUR: 'Superviseur de Zone',
  COMMERCIAL: 'Commercial Terrain',
  FREELANCE: 'Commercial Freelance',
  PROSPECTION: 'Chargé de Prospection',
  RESP_STOCK: 'Responsable Stock & Logistique',
  GEST_ENTREPOT: 'Gestionnaire Entrepôt',
  DAF: 'Directeur Administratif & Financier',
  COMPTABLE: 'Comptable',
  MARKETING: 'Responsable Marketing',
  RECOUVREMENT: 'Responsable Recouvrement',
}

export const ROLE_COLORS: Record<UserRole, string> = {
  DG: 'bg-slate-700',
  DC: 'bg-teal-600',
  RESP_VENTES: 'bg-blue-600',
  SUPERVISEUR: 'bg-indigo-600',
  COMMERCIAL: 'bg-emerald-600',
  FREELANCE: 'bg-lime-600',
  PROSPECTION: 'bg-cyan-600',
  RESP_STOCK: 'bg-orange-600',
  GEST_ENTREPOT: 'bg-amber-600',
  DAF: 'bg-violet-600',
  COMPTABLE: 'bg-purple-600',
  MARKETING: 'bg-pink-600',
  RECOUVREMENT: 'bg-red-600',
}

export function setAuthCookie(userId: string) {
  const expires = new Date()
  expires.setDate(expires.getDate() + 7)
  document.cookie = `${COOKIE_NAME}=${userId}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`
}

export function clearAuthCookie() {
  document.cookie = `${COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
}

export function saveUser(user: AuthUser) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  }
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

export function clearUser() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY)
  }
  clearAuthCookie()
}
