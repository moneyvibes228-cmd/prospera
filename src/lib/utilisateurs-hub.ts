import type { UserRole } from '@/types'
import { ROLE_LABELS } from '@/lib/auth'

export interface UtilisateurImf {
  id: string
  nom: string
  email: string
  role: UserRole
  agence: string
  zone: string
  statut: 'ACTIF' | 'INACTIF' | 'SUSPENDU'
  derniere_connexion: string
  mfa: boolean
}

export interface JournalAcces {
  id: string
  utilisateur: string
  action: string
  ip: string
  date: string
  statut: 'OK' | 'ECHEC'
}

export interface UtilisateursHub {
  synthese_ia: string
  kpis: {
    total: number
    actifs: number
    suspendus: number
    sans_mfa: number
    connexions_jour: number
  }
  utilisateurs: UtilisateurImf[]
  repartition_roles: Array<{ role: UserRole; count: number }>
  journal: JournalAcces[]
}

const USERS: UtilisateurImf[] = [
  { id: '1', nom: 'Kodjo Mensah', email: 'directeur@imf-togo.com', role: 'MANAGER', agence: 'Siège', zone: 'Réseau', statut: 'ACTIF', derniere_connexion: '28/05/2026 08:42', mfa: true },
  { id: '5b', nom: 'Kafui Agbeko', email: 'roc@imf-togo.com', role: 'RESPONSABLE_CREDIT', agence: 'Siège', zone: 'Opérations', statut: 'ACTIF', derniere_connexion: '28/05/2026 07:15', mfa: true },
  { id: '2', nom: 'Yao Agbemabiawo', email: 'resp.agence@imf-togo.com', role: 'GESTIONNAIRE', agence: 'Lomé Centre', zone: 'Lomé', statut: 'ACTIF', derniere_connexion: '28/05/2026 09:01', mfa: false },
  { id: '2b', nom: 'Mawunya Kpodzo', email: 'gp@imf-togo.com', role: 'GESTIONNAIRE_PORTEFEUILLE', agence: 'Lomé Centre', zone: 'Portefeuille A', statut: 'ACTIF', derniere_connexion: '28/05/2026 08:55', mfa: false },
  { id: '5', nom: 'Elom Adjavon', email: 'credit@imf-togo.com', role: 'CREDIT', agence: 'Siège', zone: 'Analyse', statut: 'ACTIF', derniere_connexion: '27/05/2026 18:30', mfa: true },
  { id: '14', nom: 'Edem Kpélim', email: 'agent.collecte@imf-togo.com', role: 'COLLECTRICE', agence: 'Bè Kpota', zone: 'Collecte', statut: 'ACTIF', derniere_connexion: '28/05/2026 07:48', mfa: false },
  { id: '99', nom: 'Ancien Agent Test', email: 'test@imf-togo.com', role: 'AGENT_TERRAIN', agence: 'Kara', zone: 'Nord', statut: 'SUSPENDU', derniere_connexion: '12/03/2026', mfa: false },
]

export const UTILISATEURS_HUB: UtilisateursHub = {
  synthese_ia:
    '2 comptes sans MFA (RA Lomé Centre, GP) — activation recommandée sous 48h. 1 compte suspendu (Kara) à réviser. Pic connexions 08h–09h : prévoir capacité serveur. Aucune tentative brute-force détectée sur 7 jours.',
  kpis: {
    total: USERS.length,
    actifs: USERS.filter(u => u.statut === 'ACTIF').length,
    suspendus: USERS.filter(u => u.statut === 'SUSPENDU').length,
    sans_mfa: USERS.filter(u => !u.mfa && u.statut === 'ACTIF').length,
    connexions_jour: 34,
  },
  utilisateurs: USERS,
  repartition_roles: (['MANAGER', 'RESPONSABLE_CREDIT', 'GESTIONNAIRE', 'GESTIONNAIRE_PORTEFEUILLE', 'CREDIT', 'COLLECTRICE', 'AGENT_TERRAIN'] as UserRole[]).map(role => ({
    role,
    count: USERS.filter(u => u.role === role).length,
  })),
  journal: [
    { id: 'J1', utilisateur: 'Kodjo Mensah', action: 'Connexion réussie', ip: '196.168.*.*', date: '28/05/2026 08:42', statut: 'OK' },
    { id: 'J2', utilisateur: 'test@imf-togo.com', action: 'Tentative connexion', ip: '41.202.*.*', date: '28/05/2026 03:12', statut: 'ECHEC' },
    { id: 'J3', utilisateur: 'Mawunya Kpodzo', action: 'Export portefeuille PDF', ip: '196.168.*.*', date: '27/05/2026 17:20', statut: 'OK' },
    { id: 'J4', utilisateur: 'Elom Adjavon', action: 'Validation dossier DC-2912', ip: '196.168.*.*', date: '27/05/2026 16:45', statut: 'OK' },
  ],
}

export function getUtilisateursHub(): UtilisateursHub {
  return UTILISATEURS_HUB
}

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role]
}
