'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, MapPin, GitBranch, Bell,
  ShieldAlert, Trophy, Receipt, Search, Megaphone,
  Settings, LogOut, FileSearch, Landmark, Columns3, Building2, Banknote,
  AlertTriangle, Wallet, Eye, BookOpen, Calendar, PiggyBank,
  UsersRound, FileCheck, WifiOff, Coins, Package, Scale, Vault, FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProsperaLogoMark } from '@/components/brand/ProsperaLogoMark'
import { useAuth } from '@/contexts/AuthContext'
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/auth'
import { resolveRedirectForSession } from '@/lib/api-ui-switch'
import { useAlertes } from '@/hooks/useAlertes'
import type { UserRole } from '@/types'

type NavItem = {
  href: string
  label: string
  icon: React.ElementType
  showBadge?: boolean
  roles?: UserRole[]
}
type NavGroup = {
  group: string
  items: NavItem[]
}

const ALL_NAV: NavGroup[] = [
  {
    group: 'Principal',
    items: [
      { href: '/dashboard',    label: 'Tableau de bord',  icon: LayoutDashboard },
      { href: '/emprunteurs',  label: 'Emprunteurs',      icon: Users,
        roles: ['GESTIONNAIRE','GESTIONNAIRE_PORTEFEUILLE','AGENT_TERRAIN','COMMERCIAL','COLLECTRICE','RESPONSABLE_COMMERCIAL','CREDIT','RESPONSABLE_CREDIT','RISQUE'] },
      // Terrain — pour ceux qui font du terrain (RA superviseur, GP gère ses clients, AT/CMR/COLL terrain)
      { href: '/terrain',      label: 'Terrain / Visites',icon: MapPin,
        roles: ['GESTIONNAIRE','GESTIONNAIRE_PORTEFEUILLE','AGENT_TERRAIN','COMMERCIAL','COLLECTRICE','RESPONSABLE_COMMERCIAL','AUDITEUR'] },
      // Pilotage portefeuille + opérations — RA + ROC pour pilotage agence/réseau
      { href: '/credit',       label: 'Crédit & Opérations', icon: GitBranch,
        roles: ['GESTIONNAIRE','RESPONSABLE_CREDIT','RISQUE'] },
      // Workspace analyse dossier — CC central, ROC accès secondaire pour drill-down
      { href: '/credit/dossiers', label: 'Dossiers crédit', icon: FileSearch,
        roles: ['CREDIT','RESPONSABLE_CREDIT','RISQUE'] },
      { href: '/credit/analyse', label: 'Analyse Dossiers', icon: FileSearch,
        roles: ['CREDIT','RESPONSABLE_CREDIT'] },
      { href: '/credit/pipeline', label: 'Pipeline Crédit', icon: Columns3,
        roles: ['RESPONSABLE_CREDIT','CREDIT','RISQUE'] },
      // Relances — pour ceux qui recouvrent (GP + AT + COLL + RESP_COMMERCIAL très concernés)
      { href: '/relances',     label: 'Relances',         icon: Bell, showBadge: true,
        roles: ['GESTIONNAIRE','GESTIONNAIRE_PORTEFEUILLE','AGENT_TERRAIN','COLLECTRICE','RESPONSABLE_COMMERCIAL','RELANCE','CREDIT'] },
      { href: '/epargne',      label: 'Épargne',          icon: PiggyBank,
        roles: ['GESTIONNAIRE','GESTIONNAIRE_PORTEFEUILLE','COLLECTRICE','COMMERCIAL','COMPTABLE','DAF','MANAGER'] },
      { href: '/operations-bancaires', label: 'Opérations bancaires', icon: Coins,
        roles: ['CREDIT','RESPONSABLE_CREDIT','GESTIONNAIRE','COMMERCIAL','COMPTABLE','DAF'] },
      { href: '/groupes',      label: 'Groupes & solidarité', icon: UsersRound,
        roles: ['COLLECTRICE','RESPONSABLE_COMMERCIAL','GESTIONNAIRE','CREDIT','COMMERCIAL'] },
      { href: '/kyc',          label: 'KYC & documents',  icon: FileCheck,
        roles: ['COMMERCIAL','COLLECTRICE','CREDIT','AUDITEUR','GESTIONNAIRE'] },
      { href: '/terrain/offline', label: 'Hors-ligne',   icon: WifiOff,
        roles: ['AGENT_TERRAIN','COLLECTRICE','GESTIONNAIRE_PORTEFEUILLE','COMMERCIAL'] },
    ],
  },
  {
    group: 'Opérations IMF',
    items: [
      { href: '/produits', label: 'Catalogue produits', icon: Package,
        roles: ['MANAGER','RESPONSABLE_CREDIT','CREDIT','DAF','COMPTABLE','COMMERCIAL'] },
      { href: '/credit/cycle', label: 'Cycle de vie prêt', icon: GitBranch,
        roles: ['CREDIT','RESPONSABLE_CREDIT','GESTIONNAIRE','COMMERCIAL','RISQUE'] },
      { href: '/caisse', label: 'Caisse & trésorerie', icon: Vault,
        roles: ['GESTIONNAIRE','GESTIONNAIRE_PORTEFEUILLE','COLLECTRICE','COMPTABLE','DAF','RELANCE'] },
      { href: '/conformite', label: 'Conformité BCEAO', icon: Scale,
        roles: ['MANAGER','RISQUE','RESPONSABLE_CREDIT','AUDITEUR','DAF'] },
    ],
  },
  {
    group: 'Pilotage',
    items: [
      // Risque transverse — RA + ROC + analyste risque + Resp. Commercial (recouvrement préventif)
      { href: '/risque',       label: 'Risque & PAR',     icon: ShieldAlert,
        roles: ['GESTIONNAIRE','RESPONSABLE_COMMERCIAL','RISQUE','RESPONSABLE_CREDIT'] },
      // Performances commerciales et équipe
      { href: '/equipe',       label: 'Équipe & Performance', icon: Trophy,
        roles: ['GESTIONNAIRE','RESPONSABLE_COMMERCIAL','PAIE'] },
      { href: '/zones',        label: 'Zones terrain',    icon: MapPin,
        roles: ['RESPONSABLE_COMMERCIAL','MANAGER','GESTIONNAIRE'] },
    ],
  },
  {
    group: 'Contrôle',
    items: [
      { href: '/finance',      label: 'Finance & Budget', icon: Landmark,
        roles: ['DAF'] },
      { href: '/comptabilite', label: 'Comptabilité',     icon: Receipt,
        roles: ['COMPTABLE','DAF'] },
      { href: '/audit',        label: 'Audit financier', icon: Search,
        roles: ['DAF'] },
      { href: '/audit',        label: 'Audit & Conformité', icon: Search,
        roles: ['AUDITEUR'] },
      { href: '/marketing',    label: 'Communication',    icon: Megaphone,
        roles: ['COMMUNICATION'] },
    ],
  },
  {
    group: 'Admin',
    items: [
      { href: '/utilisateurs', label: 'Utilisateurs',     icon: Settings,
        roles: ['MANAGER','DAF'] },
    ],
  },
]

/** Menu épuré DG — 4 entrées stratégiques uniquement */
const DG_NAV: NavGroup[] = [
  {
    group: '',
    items: [
      { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
      { href: '/agences', label: 'Agences', icon: Building2 },
      { href: '/zones', label: 'Zones terrain', icon: MapPin },
      { href: '/epargne', label: 'Épargne réseau', icon: PiggyBank },
      { href: '/operations-bancaires', label: 'Opérations bancaires', icon: Coins },
      { href: '/produits', label: 'Produits', icon: Package },
      { href: '/conformite', label: 'Conformité BCEAO', icon: Scale },
      { href: '/caisse', label: 'Trésorerie réseau', icon: Vault },
      { href: '/utilisateurs', label: 'Utilisateurs', icon: Settings },
      { href: '/equipe', label: 'Équipe & Performance', icon: Trophy },
      { href: '/risque', label: 'PAR & Risque', icon: ShieldAlert },
    ],
  },
]

/** Menu CC — Chargé de crédit : tableau de bord, dossiers, pipeline, KYC, calendrier */
const CC_NAV: NavGroup[] = [
  {
    group: '',
    items: [
      { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
      { href: '/credit/dossiers', label: 'Dossiers crédit', icon: FileSearch },
      { href: '/credit/pipeline', label: 'Pipeline crédit', icon: Columns3 },
      { href: '/kyc', label: 'KYC & documents', icon: FileCheck },
      { href: '/calendrier', label: 'Calendrier', icon: Calendar },
    ],
  },
]

/** Menu GP — portefeuille personnel (dashboard · clients · relances · terrain) */
const GP_NAV: NavGroup[] = [
  {
    group: '',
    items: [
      { href: '/dashboard',   label: 'Tableau de bord',  icon: LayoutDashboard },
      { href: '/emprunteurs', label: 'Mes clients',      icon: Users },
      { href: '/relances',    label: 'Relances',         icon: Bell, showBadge: true },
      { href: '/terrain',     label: 'Terrain / Visites', icon: MapPin },
    ],
  },
]

/** Menu Agent Collecte — dashboard + clients uniquement */
const COLL_NAV: NavGroup[] = [
  {
    group: '',
    items: [
      { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
      { href: '/clients',    label: 'Mes clients',   icon: Users },
      { href: '/epargne',    label: 'Épargne',       icon: PiggyBank },
      { href: '/groupes',    label: 'Tontines & groupes', icon: UsersRound },
      { href: '/kyc',        label: 'KYC',           icon: FileCheck },
      { href: '/terrain/offline', label: 'Hors-ligne', icon: WifiOff },
    ],
  },
]

/** Menu RCC — dashboard unique (carte & calendrier intégrés) */
const RCC_NAV: NavGroup[] = [
  {
    group: '',
    items: [
      { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    ],
  },
]

/** Menu RA — pilotage agence Lomé Centre */
const RA_NAV: NavGroup[] = [
  {
    group: '',
    items: [
      { href: '/dashboard',    label: 'Tableau de bord',     icon: LayoutDashboard },
      { href: '/emprunteurs',  label: 'Emprunteurs',         icon: Users },
      { href: '/terrain',      label: 'Terrain / Visites',   icon: MapPin },
      { href: '/credit',       label: 'Crédit & Opérations', icon: GitBranch },
      { href: '/credit/pipeline', label: 'Pipeline crédit', icon: Columns3 },
      { href: '/caisse',       label: 'Caisse agence',     icon: Vault },
      { href: '/equipe',       label: 'Équipe & Performance',icon: Trophy },
    ],
  },
]

/** Menu Auditeur — dashboard + pages détail */
const AUDIT_NAV: NavGroup[] = [
  {
    group: '',
    items: [
      { href: '/dashboard',         label: 'Tableau de bord',    icon: LayoutDashboard },
      { href: '/audit/anomalies',   label: 'Fraude & Anomalies', icon: AlertTriangle },
      { href: '/audit/credit',      label: 'Contrôle crédit',    icon: FileSearch },
      { href: '/audit/agences',     label: 'Audit agences',      icon: Building2 },
      { href: '/audit/caisse',      label: 'Caisse & Compta',    icon: Wallet },
      { href: '/audit/tracabilite', label: 'Traçabilité',        icon: Eye },
      { href: '/audit/bceao',       label: 'Conformité BCEAO',   icon: BookOpen },
    ],
  },
]

/** Menu ROC — aligné sur les blocs du tableau de bord */
const ROC_NAV: NavGroup[] = [
  {
    group: '',
    items: [
      { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
      { href: '/credit/pipeline', label: 'Pipeline crédit', icon: Columns3 },
      { href: '/operations-bancaires', label: 'Opérations bancaires', icon: Coins },
      { href: '/produits', label: 'Catalogue produits', icon: Package },
      { href: '/conformite', label: 'Conformité BCEAO', icon: Scale },
      { href: '/risque', label: 'PAR & Risque', icon: ShieldAlert },
      { href: '/credit/recouvrement', label: 'Recouvrement', icon: Banknote },
      { href: '/credit/reseau', label: 'Agences & opérations', icon: Building2 },
      { href: '/groupes', label: 'Groupes & solidarité', icon: UsersRound },
    ],
  },
]

function getNavForRole(role: UserRole): NavGroup[] {
  if (role === 'MANAGER') return DG_NAV
  if (role === 'RESPONSABLE_CREDIT') return ROC_NAV
  if (role === 'GESTIONNAIRE') return RA_NAV
  if (role === 'GESTIONNAIRE_PORTEFEUILLE') return GP_NAV
  if (role === 'CREDIT') return CC_NAV
  if (role === 'AUDITEUR') return AUDIT_NAV
  if (role === 'RESPONSABLE_COMMERCIAL') return RCC_NAV
  if (role === 'COLLECTRICE') return COLL_NAV
  return ALL_NAV.map(group => ({
    ...group,
    items: group.items.filter(item => !item.roles || item.roles.includes(role)),
  })).filter(group => group.items.length > 0)
}

function SessionNavLink({
  href,
  className,
  children,
}: {
  href: string
  className?: string
  children: React.ReactNode
}) {
  const { sessionSource } = useAuth()
  const target = resolveRedirectForSession(href, sessionSource ?? 'mock')
  return (
    <Link href={target} className={className}>
      {children}
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout, sessionSource } = useAuth()
  const { data: alertes } = useAlertes('CRITIQUE')
  const alertesCount = alertes?.length ?? 0

  const navGroups = user ? getNavForRole(user.role) : ALL_NAV

  return (
    <aside className="fixed top-0 left-0 h-full w-60 bg-slate-900 flex flex-col z-30">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800 flex items-center gap-3">
        <ProsperaLogoMark size="sm" />
        <div className="min-w-0">
          <div className="font-bold text-white text-lg tracking-tight leading-tight">Prospera</div>
          <div className="text-slate-400 text-xs mt-0.5">by Money Vibes</div>
        </div>
      </div>

      {/* Navigation filtrée par rôle */}
      <nav className="sidebar-nav-scroll flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-5">
        {navGroups.map((group) => (
          <div key={group.group || 'main'}>
            {group.group ? (
              <div className="text-slate-500 text-xs font-medium uppercase tracking-wider px-2 mb-1.5">
                {group.group}
              </div>
            ) : null}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  || pathname === resolveRedirectForSession(item.href, sessionSource ?? 'mock')
                  || pathname.startsWith(resolveRedirectForSession(item.href, sessionSource ?? 'mock') + '/')
                return (
                  <li key={item.href}>
                    <SessionNavLink
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150',
                        isActive
                          ? 'bg-slate-700 text-white border-l-2 border-teal-400 pl-[10px]'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      )}
                    >
                      <item.icon size={17} className="flex-shrink-0" />
                      <span className="flex-1 leading-none">{item.label}</span>
                      {item.showBadge && alertesCount > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-none">
                          {alertesCount}
                        </span>
                      )}
                    </SessionNavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Profil utilisateur */}
      {user && (
        <div className="border-t border-slate-800 p-3">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg mb-1">
            <div className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0',
              ROLE_COLORS[user.role]
            )}>
              {user.initiales}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-slate-100 text-sm font-medium truncate leading-tight">{user.nom}</div>
              <div className="text-slate-400 text-xs truncate">{ROLE_LABELS[user.role]}</div>
            </div>
          </div>
          <div className="px-2 py-1 mb-2">
            <div className="flex items-center gap-1.5">
              <MapPin size={11} className="text-slate-500 flex-shrink-0" />
              <span className="text-slate-500 text-xs truncate">{user.zone}</span>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-slate-400 hover:bg-red-900/30 hover:text-red-400 transition-colors text-sm"
          >
            <LogOut size={15} />
            <span>Se déconnecter</span>
          </button>
        </div>
      )}
    </aside>
  )
}
