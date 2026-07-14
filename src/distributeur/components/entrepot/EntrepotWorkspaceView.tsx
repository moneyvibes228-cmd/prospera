'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { PackageCheck, Truck, ArrowDownToLine, ClipboardCheck, Warehouse } from 'lucide-react'
import { PageHeader } from '@distributeur/components/shared/PageHeader'
import { WorkflowToast } from '@distributeur/components/shared/WorkflowToast'
import { cn } from '@distributeur/lib/utils'
import { useAuth } from '@distributeur/contexts/AuthContext'
import { useStockWorkflow } from '@distributeur/contexts/StockWorkflowContext'
import { getPerimetreLogistique } from '@distributeur/lib/perimetre-logistique'
import { getTopologie } from '@distributeur/lib/registries/entrepot-logistique-registry'
import { PreparationPanel } from './PreparationPanel'
import { ExpeditionPanel } from './ExpeditionPanel'
import { ReceptionPanel } from './ReceptionPanel'
import { InventairePanel } from './InventairePanel'

type Onglet = 'preparation' | 'expedition' | 'reception' | 'inventaire'

const ONGLETS: { id: Onglet; label: string; icon: React.ElementType }[] = [
  { id: 'preparation', label: 'Préparation', icon: PackageCheck },
  { id: 'expedition', label: 'Expéditions & chargement', icon: Truck },
  { id: 'reception', label: 'Réceptions', icon: ArrowDownToLine },
  { id: 'inventaire', label: 'Inventaire tournant', icon: ClipboardCheck },
]

/**
 * Le poste de travail de l'entrepôt — les quatre flux physiques de la journée.
 *
 * Ce n'est pas un tableau de bord : c'est un plan de travail. Tout ce qui est affiché ici
 * est une chose à faire, dans un ordre, par quelqu'un, avant une heure. Aucun franc de
 * chiffre d'affaires, aucune marge, aucun impayé : rien de tout cela ne change ce que
 * le magasinier doit sortir du quai avant 15 h 30.
 *
 * Un responsable stock qui vient ici voit l'entrepôt de son choix — il supervise. Le
 * gestionnaire, lui, ne voit que le sien : c'est son périmètre.
 */
export function EntrepotWorkspaceView() {
  const { user } = useAuth()
  const { lastAction, clearLastAction } = useStockWorkflow()
  const params = useSearchParams()
  const perimetre = getPerimetreLogistique(user)

  const [entrepot, setEntrepot] = useState(perimetre.entrepots[0] ?? 'Lomé Port')
  const [onglet, setOnglet] = useState<Onglet>((params.get('tab') as Onglet | null) ?? 'preparation')

  if (perimetre.entrepots.length === 0) {
    return (
      <div className="p-6">
        <PageHeader title="Entrepôt" subtitle="Aucun entrepôt n'est rattaché à votre poste." />
      </div>
    )
  }

  const topologie = getTopologie(entrepot)

  return (
    <div className="p-6 max-w-7xl space-y-5">
      <PageHeader
        title={perimetre.estReseau ? 'Opérations entrepôt' : `Entrepôt ${entrepot}`}
        subtitle={
          `${topologie.surface_m2.toLocaleString('fr-FR')} m² · ${topologie.emplacements_total.toLocaleString('fr-FR')} emplacements · `
          + `${topologie.quais} quai${topologie.quais > 1 ? 'x' : ''} · départ des camions à ${topologie.heure_cutoff}`
        }
        badge="Temps réel"
      />

      {/* Le responsable stock supervise plusieurs sites ; le gestionnaire n'en a qu'un. */}
      {perimetre.entrepots.length > 1 && (
        <div className="flex items-center gap-2">
          <Warehouse size={13} className="text-slate-400" />
          {perimetre.entrepots.map(e => (
            <button
              key={e}
              type="button"
              onClick={() => setEntrepot(e)}
              className={cn(
                'text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors',
                entrepot === e ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
              )}
            >
              {e}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-px">
        {ONGLETS.map(o => {
          const Icon = o.icon
          const actif = onglet === o.id
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => setOnglet(o.id)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors',
                actif
                  ? 'border-amber-500 text-amber-700 bg-amber-50/60'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50',
              )}
            >
              <Icon size={13} /> {o.label}
            </button>
          )
        })}
      </div>

      {onglet === 'preparation' && <PreparationPanel entrepot={entrepot} />}
      {onglet === 'expedition' && <ExpeditionPanel entrepot={entrepot} />}
      {onglet === 'reception' && <ReceptionPanel entrepot={entrepot} />}
      {onglet === 'inventaire' && <InventairePanel entrepot={entrepot} voitValeur={perimetre.voitValeurAchat} />}

      <WorkflowToast action={lastAction} onClose={clearLastAction} />
    </div>
  )
}
