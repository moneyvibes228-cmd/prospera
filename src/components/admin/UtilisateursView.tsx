'use client'
import { useState } from 'react'
import { Shield, UserPlus, Key, Search } from 'lucide-react'
import { getUtilisateursHub, getRoleLabel } from '@/lib/utilisateurs-hub'
import { ROLE_COLORS } from '@/lib/auth'
import { ModuleSyntheseIA } from '@/components/modules/ModuleSyntheseIA'
import { ModuleKpiGrid } from '@/components/modules/ModuleKpiGrid'
import { ApiPhase1Banner } from '@/components/phase1/ApiPhase1Banner'
import { UserCreateModal } from '@/components/phase1/UserCreateModal'
import { useAgencesApi, useUsersApi } from '@/hooks/usePhase1'
import { useAuth } from '@/contexts/AuthContext'
import { mapApiRoleToFront } from '@/lib/api-role-map'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types'

const STATUT_STYLE = {
  ACTIF: 'bg-emerald-100 text-emerald-800',
  INACTIF: 'bg-slate-100 text-slate-600',
  SUSPENDU: 'bg-red-100 text-red-800',
}

export function UtilisateursView() {
  const hub = getUtilisateursHub()
  const { user } = useAuth()
  const { data: usersData } = useUsersApi({ actif: true })
  const { data: agencesData } = useAgencesApi()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  const canCreate =
    user?.role === 'MANAGER' || user?.role === 'GESTIONNAIRE'

  const apiUsers = usersData?.users ?? []
  const useApiList = usersData?.source === 'api' && apiUsers.length > 0

  const rows = useApiList
    ? apiUsers.map(u => ({
        id: u.id,
        nom: `${u.prenom} ${u.nom}`.trim(),
        email: u.email,
        role: mapApiRoleToFront(u.role) as UserRole,
        agence: u.agence?.nom ?? '—',
        statut: (u.actif !== false ? 'ACTIF' : 'INACTIF') as keyof typeof STATUT_STYLE,
        mfa: true,
      }))
    : hub.utilisateurs.map(u => ({
        id: u.id,
        nom: u.nom,
        email: u.email,
        role: u.role,
        agence: u.agence,
        statut: u.statut,
        mfa: u.mfa,
      }))

  const filtered = rows.filter(
    u =>
      !search ||
      u.nom.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <>
      <ApiPhase1Banner />
      <ModuleSyntheseIA texte={hub.synthese_ia} variant="blue" titre="Synthèse IA — Administration & sécurité" />
      <ModuleKpiGrid
        cols={5}
        items={[
          { label: 'Utilisateurs', value: String(useApiList ? apiUsers.length : hub.kpis.total) },
          { label: 'Actifs', value: String(hub.kpis.actifs), highlight: 'teal' },
          { label: 'Suspendus', value: String(hub.kpis.suspendus), highlight: 'red' },
          { label: 'Sans MFA', value: String(hub.kpis.sans_mfa), highlight: 'orange' },
          { label: 'Connexions jour', value: String(hub.kpis.connexions_jour) },
        ]}
      />

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Rechercher nom ou email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
          />
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
          >
            <UserPlus size={16} />
            Nouvel utilisateur
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
          {useApiList && (
            <p className="text-xs text-emerald-700 bg-emerald-50 px-4 py-2 border-b border-emerald-100">
              Utilisateurs du réseau
            </p>
          )}
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Utilisateur</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Rôle</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Agence</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Statut</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">MFA</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{u.nom}</div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs font-bold text-white px-2 py-0.5 rounded', ROLE_COLORS[u.role])}>
                      {getRoleLabel(u.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.agence}</td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs font-bold px-2 py-0.5 rounded', STATUT_STYLE[u.statut])}>
                      {u.statut}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.mfa ? (
                      <Shield size={16} className="text-emerald-600" />
                    ) : (
                      <Key size={16} className="text-amber-600" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Journal d&apos;accès récent</h3>
          <div className="space-y-3">
            {hub.journal.map(j => (
              <div key={j.id} className="text-xs border-b border-slate-100 pb-2">
                <div className="font-medium text-slate-800">{j.action}</div>
                <div className="text-slate-500">
                  {j.utilisateur} · {j.date}
                </div>
                <span className={cn('font-bold', j.statut === 'OK' ? 'text-emerald-600' : 'text-red-600')}>
                  {j.statut}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {user && (
        <UserCreateModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          creatorRole={user.role}
          agences={agencesData?.data}
        />
      )}
    </>
  )
}
