import type { UserRole } from '@/types'
import { clearSessionSource } from '@/lib/session-source'

export interface AuthUser {
  id: string
  nom: string
  email: string
  role: UserRole
  zone: string
  initiales: string
}

export const DEMO_USERS: (AuthUser & { password: string })[] = [
  // ── Direction ─────────────────────────────────────────────────────────────
  {
    id: '1',  nom: 'Kodjo Mensah',    email: 'directeur@imf-togo.com',      password: 'password123',
    role: 'MANAGER',                  zone: 'Réseau — Toutes agences',       initiales: 'KM',
  },
  {
    id: '5b', nom: 'Kafui Agbeko',    email: 'roc@imf-togo.com',             password: 'password123',
    role: 'RESPONSABLE_CREDIT',       zone: 'Siège — Opérations & Crédit',   initiales: 'KAG',
  },
  {
    id: '13', nom: 'Komlan Afavi',    email: 'daf@imf-togo.com',             password: 'password123',
    role: 'DAF',                      zone: 'Siège — Direction Financière',   initiales: 'KAF',
  },
  {
    id: '9',  nom: 'Séna Fiagbé',    email: 'audit@imf-togo.com',           password: 'password123',
    role: 'AUDITEUR',                 zone: 'Toutes zones — Audit & Conformité', initiales: 'SF',
  },
  // ── Agences ───────────────────────────────────────────────────────────────
  {
    id: '2',  nom: 'Yao Agbemabiawo', email: 'resp.agence@imf-togo.com',    password: 'password123',
    role: 'GESTIONNAIRE',             zone: 'Agence Lomé Centre',            initiales: 'YA',
  },
  {
    id: '2b', nom: 'Mawunya Kpodzo',  email: 'gp@imf-togo.com',             password: 'password123',
    role: 'GESTIONNAIRE_PORTEFEUILLE',zone: 'Agence Lomé Centre — Portefeuille', initiales: 'MK',
  },
  {
    id: '5',  nom: 'Elom Adjavon',    email: 'credit@imf-togo.com',         password: 'password123',
    role: 'CREDIT',                   zone: 'Siège — Analyse Crédit',        initiales: 'EA',
  },
  // ── Commercial & Terrain ──────────────────────────────────────────────────
  {
    id: '3b', nom: 'Efua Mensah',     email: 'resp.commercial@imf-togo.com', password: 'password123',
    role: 'RESPONSABLE_COMMERCIAL',   zone: 'Lomé — Pôle Commercial & Collecte', initiales: 'EM',
  },
  {
    id: '12', nom: 'Kossi Doheto',    email: 'agent.terrain@imf-togo.com',  password: 'password123',
    role: 'AGENT_TERRAIN',            zone: 'Zone Vogan — Terrain & Tontines', initiales: 'KD',
  },
  {
    id: '14', nom: 'Edem Kpélim',     email: 'agent.collecte@imf-togo.com', password: 'password123',
    role: 'COLLECTRICE',              zone: 'Bè Kpota — Collecte & Tontines', initiales: 'EK',
  },
  // ── Communication ─────────────────────────────────────────────────────────
  {
    id: '11', nom: 'Adjoa Mensah',    email: 'communication@imf-togo.com',  password: 'password123',
    role: 'COMMUNICATION',            zone: 'Siège — Communication & Marketing', initiales: 'AM',
  },
]

const COOKIE_NAME = 'prospera_auth'
const STORAGE_KEY = 'prospera_user'

export function setAuthCookie(userId: string) {
  const expires = new Date()
  expires.setDate(expires.getDate() + 7)
  const secure =
    typeof window !== 'undefined' && window.location.protocol === 'https:'
      ? '; Secure'
      : ''
  document.cookie = `${COOKIE_NAME}=${userId}; path=/; expires=${expires.toUTCString()}; SameSite=Lax${secure}`
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
    localStorage.removeItem('prospera_token')
  }
  clearSessionSource()
  clearAuthCookie()
}

export const ROLE_LABELS: Record<UserRole, string> = {
  MANAGER:                  'Directeur Général',
  GESTIONNAIRE:             'Responsable d\'Agence',
  GESTIONNAIRE_PORTEFEUILLE:'Gestionnaire de Portefeuille',
  AGENT_TERRAIN:            'Agent Terrain & Collecte',
  COMMERCIAL:               'Commercial Agence',
  COLLECTRICE:              'Tontinière / Agent Collecte',
  RESPONSABLE_COMMERCIAL:   'Responsable Commerciale & Collecte',
  CREDIT:                   'Chargé de Crédit',
  RESPONSABLE_CREDIT:       'Responsable Opération & Crédit',
  RISQUE:                   'Analyste Risque',
  RELANCE:                  'Finances & Recouvrement',
  COMPTABLE:                'Finances & Recouvrement',
  AUDITEUR:                 'Auditeur Interne',
  DAF:                      'Directeur Administratif & Financier',
  PAIE:                     'Gestionnaire Paie',
  COMMUNICATION:            'Responsable Communication & Marketing',
}

export const ROLE_COLORS: Record<UserRole, string> = {
  MANAGER:                  'bg-teal-600',
  GESTIONNAIRE:             'bg-blue-700',
  GESTIONNAIRE_PORTEFEUILLE:'bg-sky-600',
  AGENT_TERRAIN:            'bg-green-600',
  COMMERCIAL:               'bg-purple-600',
  COLLECTRICE:              'bg-pink-600',
  RESPONSABLE_COMMERCIAL:   'bg-fuchsia-700',
  CREDIT:                   'bg-indigo-600',
  RESPONSABLE_CREDIT:       'bg-red-700',
  RISQUE:                   'bg-indigo-500',
  RELANCE:                  'bg-orange-600',
  COMPTABLE:                'bg-slate-600',
  AUDITEUR:                 'bg-amber-700',
  DAF:                      'bg-cyan-800',
  PAIE:                     'bg-emerald-700',
  COMMUNICATION:            'bg-violet-600',
}

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  MANAGER:                  'Vue globale réseau · Toutes agences · Direction & stratégie',
  GESTIONNAIRE:             'Pilotage agence · Équipe · Trésorerie · Risque · Satisfaction',
  GESTIONNAIRE_PORTEFEUILLE:'Portefeuille personnel · Recouvrement · Aging · Segmentation · Terrain',
  AGENT_TERRAIN:            'Prospection · Collecte terrain · Tontines · Remboursements · GPS assistant',
  COMMERCIAL:               'Enregistrement client · Ouverture compte · Dossier crédit',
  COLLECTRICE:              'Tontines · Collecte épargne · Remboursements journaliers',
  RESPONSABLE_COMMERCIAL:   'Pipeline commercial · Collecte équipe · Performance agents · Alertes · Clients',
  CREDIT:                   'Analyse dossier · 5C · CBI v5 · Suggestion décision · Workspace CC',
  RESPONSABLE_CREDIT:       'Pilotage portefeuille · PAR/EL · Cash réseau · Validation finale dossiers',
  RISQUE:                   'Risque transverse · PAR · Provisions · Conformité BCEAO',
  RELANCE:                  'Recouvrement · Comptabilité · Mobile Money · Relances IA',
  COMPTABLE:                'Recouvrement · Comptabilité · Mobile Money · Relances IA',
  AUDITEUR:                 'Fraude · Anomalies · Contrôle crédit · Traçabilité · Conformité · Audit agences',
  DAF:                      'Trésorerie · Bilan · Comptabilité · Budget · Rentabilité · Contrôle de gestion',
  PAIE:                     'Commissions agents · Masse salariale · Primes performance',
  COMMUNICATION:            'Leads · Chatbot IA · Campagnes · Réputation · Budget · Présence digitale',
}
