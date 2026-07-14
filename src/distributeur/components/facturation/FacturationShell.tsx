'use client'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { FileText, FileSignature, ShieldCheck } from 'lucide-react'
import { cn } from '@distributeur/lib/utils'
import { useAuth } from '@distributeur/contexts/AuthContext'
import type { UserRole } from '@distributeur/types'
import { FacturationView } from './FacturationView'
import { ProformasView } from './ProformasView'
import { EFactureView } from './EFactureView'

type OngletFacturation = 'factures' | 'proformas' | 'efacture'

const ONGLETS: { id: OngletFacturation; label: string; icon: React.ElementType; roles: UserRole[] }[] = [
  {
    id: 'factures', label: 'Factures & créances', icon: FileText,
    roles: ['DG', 'DC', 'DAF', 'COMPTABLE', 'RECOUVREMENT'],
  },
  {
    id: 'proformas', label: 'Proformas', icon: FileSignature,
    roles: ['DG', 'DC', 'RESP_VENTES', 'SUPERVISEUR', 'COMMERCIAL', 'FREELANCE', 'PROSPECTION', 'DAF', 'COMPTABLE'],
  },
  {
    id: 'efacture', label: 'E-facturation & avoirs', icon: ShieldCheck,
    roles: ['DG', 'DAF', 'COMPTABLE'],
  },
]

/**
 * Le cycle documentaire est un seul écran à onglets, mais chaque poste n'en voit
 * que sa part — et atterrit sur l'onglet qui est le sien : un commercial arrive
 * sur ses proformas, un comptable sur ses factures.
 */
export function FacturationShell() {
  const { user } = useAuth()
  const params = useSearchParams()

  const disponibles = ONGLETS.filter(o => !user || o.roles.includes(user.role))
  const tabParam = params.get('tab') as OngletFacturation | null
  const defaut = tabParam && disponibles.some(o => o.id === tabParam)
    ? tabParam
    : disponibles[0]?.id ?? 'factures'

  const [onglet, setOnglet] = useState<OngletFacturation>(defaut)

  if (disponibles.length === 0) return null

  return (
    <div>
      {disponibles.length > 1 && (
        <div className="px-6 pt-6">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-px">
            {disponibles.map(o => {
              const Icon = o.icon
              const actif = onglet === o.id
              return (
                <button key={o.id} type="button" onClick={() => setOnglet(o.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors',
                    actif
                      ? 'border-amber-500 text-amber-700 bg-amber-50/60'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50',
                  )}>
                  <Icon size={13} />
                  {o.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {onglet === 'factures' && <FacturationView />}
      {onglet === 'proformas' && (
        <div className="p-6 max-w-7xl">
          <ProformasView />
        </div>
      )}
      {onglet === 'efacture' && (
        <div className="p-6 max-w-7xl">
          <EFactureView />
        </div>
      )}
    </div>
  )
}
