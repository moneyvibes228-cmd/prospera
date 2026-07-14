'use client'
import { PageHeader } from '@/components/shared/PageHeader'
import { useAuth } from '@/contexts/AuthContext'
import { ROLE_LABELS } from '@/lib/auth'

export function DashboardGeneric() {
  const { user } = useAuth()
  return (
    <div className="p-6">
      <PageHeader title="Tableau de bord" subtitle={user ? `${ROLE_LABELS[user.role]} — ${user.zone}` : ''} />
      <div className="bg-white rounded-xl border border-slate-200 p-6 text-sm text-slate-600">
        Bienvenue sur Prospera Distribution. Utilisez le menu latéral pour accéder à vos modules.
      </div>
    </div>
  )
}
