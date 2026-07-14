'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'
import {
  LayoutDashboard, Store, MapPin, ShoppingCart, Package, FileText,
  Bell, Megaphone, Receipt, Trophy, LineChart, LogOut, Truck, CalendarDays, Route, Target, Compass,
  Share2, Bot, Warehouse,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProsperaLogoMark } from '@/components/brand/ProsperaLogoMark'
import { useAuth } from '@/contexts/AuthContext'
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/auth'
import { ROUTE_ACCESS } from '@/lib/route-access'
import { REGISTRE_RELANCES } from '@/lib/registries/relances-registry'
import { commandesEnAttenteValidation } from '@/lib/reappro-engine'
import { countProformasExpirantes } from '@/lib/registries/proformas-registry'
import { buildReglesMarketing } from '@/lib/automation/marketing-automations'
import { buildReglesRecouvrement } from '@/lib/automation/recouvrement-automations'
import { buildSyntheseAutomation } from '@/lib/automation/automation-types'
import { getPerimetreLogistique } from '@/lib/perimetre-logistique'
import { buildBonsPreparation } from '@/lib/picking-engine'
import type { UserRole } from '@/types'

type BadgeKey = 'RELANCES_CRITIQUES' | 'APPRO_A_VALIDER' | 'PROFORMAS_EXPIRANTES' | 'AUTO_A_VALIDER'
  | 'PREPARATION_DU_JOUR'
type NavItem = {
  href: string
  label: string
  icon: React.ElementType
  badge?: BadgeKey
  /** Le même écran ne se nomme pas pareil selon qui le regarde : « Points de vente » pour le siège, « Mes clients » pour le terrain. */
  labelParRole?: Partial<Record<UserRole, string>>
}
type NavGroup = { group: string; items: NavItem[] }

/**
 * Les rôles autorisés viennent de ROUTE_ACCESS — le menu n'est qu'une projection
 * de la table d'accès, jamais une seconde définition qui pourrait diverger.
 */
const NAV: NavGroup[] = [
  {
    group: 'Opérations',
    items: [
      { href: '/pilotage-financier', label: 'Pilotage financier', icon: LineChart },
      { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard,
        labelParRole: { COMMERCIAL: 'Ma journée', FREELANCE: 'Mon activité du jour' } },
      { href: '/mon-activite', label: 'Mon agenda', icon: CalendarDays },
      { href: '/tournees', label: 'Tournées & Cash', icon: Route },
      { href: '/commandes', label: 'Commandes', icon: ShoppingCart,
        labelParRole: { COMMERCIAL: 'Mes commandes', FREELANCE: 'Mes commandes', PROSPECTION: 'Mes commandes' } },
      { href: '/disponibilite', label: 'Disponibilité produits', icon: Package },
      { href: '/entrepot', label: 'Opérations entrepôt', icon: Warehouse, badge: 'PREPARATION_DU_JOUR',
        labelParRole: { GEST_ENTREPOT: 'Mon entrepôt' } },
      { href: '/stock', label: 'Stock & Logistique', icon: Package,
        labelParRole: { MARKETING: 'Produits à écouler', GEST_ENTREPOT: 'Stock de mon site' } },
      { href: '/approvisionnement', label: 'Approvisionnement', icon: Truck, badge: 'APPRO_A_VALIDER' },
      { href: '/facturation', label: 'Facturation & Proforma', icon: FileText, badge: 'PROFORMAS_EXPIRANTES',
        labelParRole: { COMMERCIAL: 'Mes proformas', FREELANCE: 'Mes proformas', PROSPECTION: 'Mes proformas' } },
      { href: '/relances', label: 'Relances & Impayés', icon: Bell, badge: 'RELANCES_CRITIQUES',
        labelParRole: { COMMERCIAL: 'Mes relances', RECOUVREMENT: 'Mes dossiers' } },
    ],
  },
  {
    group: 'Commercial',
    items: [
      { href: '/points-de-vente', label: 'Points de vente', icon: Store,
        labelParRole: {
          COMMERCIAL: 'Mes clients', FREELANCE: 'Mon portefeuille', PROSPECTION: 'Mes ouvertures',
          MARKETING: 'Mon audience', RECOUVREMENT: 'Clients débiteurs',
        } },
      { href: '/prospection', label: 'Conquête & Territoires', icon: Compass,
        labelParRole: { PROSPECTION: 'Ma conquête' } },
      { href: '/commercial', label: 'Commercial terrain', icon: MapPin },
      { href: '/marketing', label: 'Marketing & Campagnes', icon: Megaphone },
      { href: '/marketing/social', label: 'Studio réseaux sociaux', icon: Share2 },
    ],
  },
  {
    group: 'Automatisation',
    items: [
      { href: '/automatisations', label: 'Automatisations', icon: Bot, badge: 'AUTO_A_VALIDER' },
    ],
  },
  {
    group: 'Pilotage',
    items: [
      { href: '/objectifs', label: 'Objectifs & Quotas', icon: Target },
      { href: '/equipe', label: 'Équipe & Performance', icon: Trophy },
      { href: '/comptabilite', label: 'Comptabilité', icon: Receipt },
    ],
  },
]

/** Impayés non soldés en priorité critique — pastille rouge du menu Relances. */
function countRelancesCritiques(): number {
  return REGISTRE_RELANCES.filter(
    r => r.type === 'IMPAYE' && r.priorite === 'CRITIQUE' && r.statut !== 'PAYEE',
  ).length
}

/**
 * Ce qui attend une décision humaine dans le moteur d'automatisation du poste.
 * Les règles en mode AUTO ne comptent pas : elles partent seules, elles ne sont
 * pas une dette de travail.
 */
function countAutomationsAValider(role: UserRole): number {
  const regles = role === 'RECOUVREMENT'
    ? buildReglesRecouvrement()
    : role === 'MARKETING'
      ? buildReglesMarketing()
      : [...buildReglesMarketing(), ...buildReglesRecouvrement()]

  return buildSyntheseAutomation(regles).actions_a_valider
}

/** Bons de préparation qui attendent l'entrepôt du poste — la dette de travail du jour. */
function countPreparationDuJour(role: UserRole): number {
  const { entrepots } = getPerimetreLogistique({ role })
  if (entrepots.length === 0) return 0
  return buildBonsPreparation(entrepots).filter(b => b.blocage === 'AUCUN').length
}

const BADGES: Record<BadgeKey, (role: UserRole) => number> = {
  RELANCES_CRITIQUES: countRelancesCritiques,
  APPRO_A_VALIDER: () => commandesEnAttenteValidation().length,
  PROFORMAS_EXPIRANTES: countProformasExpirantes,
  AUTO_A_VALIDER: countAutomationsAValider,
  PREPARATION_DU_JOUR: countPreparationDuJour,
}

function filterNav(role: UserRole): NavGroup[] {
  return NAV.map(g => ({
    ...g,
    items: g.items
      .filter(item => {
        const roles = ROUTE_ACCESS[item.href]
        return !roles || roles.includes(role)
      })
      .map(item => ({ ...item, label: item.labelParRole?.[role] ?? item.label })),
  })).filter(g => g.items.length > 0)
}

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  // Le moteur d'automatisation évalue toutes ses règles sur les registres : on ne
  // recalcule le compteur que lorsque le poste change, pas à chaque navigation.
  const role = user?.role
  const badges = useMemo(() => {
    if (!role) return {} as Record<BadgeKey, number>
    return Object.fromEntries(
      (Object.keys(BADGES) as BadgeKey[]).map(cle => [cle, BADGES[cle](role)]),
    ) as Record<BadgeKey, number>
  }, [role])

  if (!user) return null

  const nav = filterNav(user.role)

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-slate-900 text-white flex flex-col z-40">
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-2.5">
          <ProsperaLogoMark size="sm" />
          <div>
            <div className="font-bold text-sm">Prospera</div>
            <div className="text-[10px] text-slate-400">Distribution · Togo</div>
          </div>
        </div>
        <div className="mt-3 text-[10px] text-amber-400 font-medium">{user.entreprise}</div>
      </div>

      <nav className="sidebar-nav-scroll flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-3 px-2">
        {nav.map(group => (
          <div key={group.group} className="mb-4">
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider px-2 mb-1.5">{group.group}</div>
            {group.items.map(item => {
              const active = pathname === item.href
                || pathname.startsWith(item.href + '/')
                || (item.href === '/stock' && pathname === '/catalogue')
              const Icon = item.icon
              const badge = item.badge ? badges[item.badge] ?? 0 : 0
              return (
                <Link key={item.href} href={item.href}
                  className={cn('flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors mb-0.5',
                    active ? 'bg-amber-600/20 text-amber-300' : 'text-slate-300 hover:bg-slate-800 hover:text-white')}>
                  <Icon size={15} className="shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {badge > 0 ? (
                    <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{badge}</span>
                  ) : null}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-700">
        <div className="flex items-center gap-2 mb-2">
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold', ROLE_COLORS[user.role])}>
            {user.initiales}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate">{user.nom}</div>
            <div className="text-[10px] text-slate-400 truncate">{ROLE_LABELS[user.role]}</div>
          </div>
        </div>
        <button onClick={logout} className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
          <LogOut size={13} /> Déconnexion
        </button>
      </div>
    </aside>
  )
}
