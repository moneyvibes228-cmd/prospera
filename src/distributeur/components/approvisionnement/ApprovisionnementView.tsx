'use client'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Sparkles, Truck, Building2, Settings2 } from 'lucide-react'
import { PageHeader } from '@distributeur/components/shared/PageHeader'
import { WorkflowToast } from '@distributeur/components/shared/WorkflowToast'
import { cn, formatFcfa } from '@distributeur/lib/utils'
import { useAuth } from '@distributeur/contexts/AuthContext'
import { useStockWorkflow } from '@distributeur/contexts/StockWorkflowContext'
import type { UserRole } from '@distributeur/types'
import { ReapproIAPanel } from './ReapproIAPanel'
import { CommandesFournisseursView } from './CommandesFournisseursView'
import { FournisseursView } from './FournisseursView'
import { ReglesReapproView } from './ReglesReapproView'
import { buildSyntheseApprovisionnement } from '@distributeur/lib/fournisseurs-hub'

type OngletAppro = 'reappro' | 'commandes' | 'fournisseurs' | 'regles'

const ONGLETS: { id: OngletAppro; label: string; icon: React.ElementType }[] = [
  { id: 'reappro', label: 'Réappro IA', icon: Sparkles },
  { id: 'commandes', label: 'Commandes fournisseurs', icon: Truck },
  { id: 'fournisseurs', label: 'Fournisseurs', icon: Building2 },
  { id: 'regles', label: 'Règles d\'automatisation', icon: Settings2 },
]

/** L'onglet d'entrée dépend du poste : chacun arrive sur l'écran qui est le sien. */
const ONGLET_PAR_ROLE: Partial<Record<UserRole, OngletAppro>> = {
  RESP_STOCK: 'reappro',
  GEST_ENTREPOT: 'commandes',
  DAF: 'fournisseurs',
  DG: 'reappro',
  COMPTABLE: 'fournisseurs',
  MARKETING: 'fournisseurs',
}

export function ApprovisionnementView() {
  const { user } = useAuth()
  const { lastAction, clearLastAction } = useStockWorkflow()
  const params = useSearchParams()
  const tabParam = params.get('tab') as OngletAppro | null

  const defaut = tabParam ?? (user ? ONGLET_PAR_ROLE[user.role] ?? 'reappro' : 'reappro')
  const [onglet, setOnglet] = useState<OngletAppro>(defaut)

  const synthese = buildSyntheseApprovisionnement()

  return (
    <div className="p-6 max-w-7xl space-y-5">
      <PageHeader
        title="Approvisionnement"
        subtitle="Réappro automatique · commandes fournisseurs · dette & échéancier · règles d'automatisation"
        badge={`${synthese.commandes_auto_attente} à valider`}
      />

      {/* Bandeau KPI */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Produits sous seuil', value: String(synthese.produits_sous_seuil), color: 'text-red-600' },
          { label: 'Cmd auto à valider', value: String(synthese.commandes_auto_attente), color: 'text-amber-700' },
          { label: 'Dette fournisseurs', value: formatFcfa(synthese.dette_totale), color: 'text-slate-900' },
          { label: 'dont échue', value: formatFcfa(synthese.dette_echue), color: 'text-red-600' },
          { label: 'Délai réappro moyen', value: `${synthese.delai_reappro_moyen_j} j`, color: 'text-slate-800' },
          { label: 'Taux service fournisseur', value: `${synthese.taux_service_fournisseur_pct}%`, color: 'text-emerald-600' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
            <div className="text-[10px] text-slate-400 font-medium">{k.label}</div>
            <div className={cn('text-sm font-black mt-0.5', k.color)}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Onglets */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-px">
        {ONGLETS.map(o => {
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

      {onglet === 'reappro' && <ReapproIAPanel />}
      {onglet === 'commandes' && <CommandesFournisseursView />}
      {onglet === 'fournisseurs' && <FournisseursView />}
      {onglet === 'regles' && <ReglesReapproView />}

      <WorkflowToast action={lastAction} onClose={clearLastAction} />
    </div>
  )
}
