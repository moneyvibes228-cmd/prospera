'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Package, BookOpen, Warehouse, Repeat, HeartPulse, Bot } from 'lucide-react'
import { cn } from '@distributeur/lib/utils'
import { useAuth } from '@distributeur/contexts/AuthContext'
import { useStockWorkflow } from '@distributeur/contexts/StockWorkflowContext'
import { getPerimetreLogistique } from '@distributeur/lib/perimetre-logistique'
import { WorkflowToast } from '@distributeur/components/shared/WorkflowToast'
import { StockView } from './StockView'
import { StockEntrepotView } from './StockEntrepotView'
import { CatalogueView } from '@distributeur/components/catalogue/CatalogueView'
import { EntrepotSortiesHistoriquePanel } from '@distributeur/components/stock/EntrepotSortiesHistoriquePanel'
import { TransfertsPanel } from '@distributeur/components/logistique/TransfertsPanel'
import { SanteStockPanel } from '@distributeur/components/logistique/SanteStockPanel'
import { JournalAutomatisationPanel } from '@distributeur/components/logistique/JournalAutomatisationPanel'

type Section = 'stock' | 'transferts' | 'sante' | 'automatisation' | 'sorties' | 'catalogue'

const SECTIONS: { id: Section; label: string; icon: typeof Package }[] = [
  { id: 'stock', label: 'Stock & logistique', icon: Package },
  { id: 'transferts', label: 'Transferts inter-entrepôts', icon: Repeat },
  { id: 'sante', label: 'Santé du stock', icon: HeartPulse },
  { id: 'automatisation', label: 'Journal d\'automatisation', icon: Bot },
  { id: 'sorties', label: 'Sorties entrepôt', icon: Warehouse },
  { id: 'catalogue', label: 'Catalogue produits', icon: BookOpen },
]

/**
 * `/stock` servait la même « Vue DG » à tout le monde — marge, rentabilité produit et
 * réseau PDV national compris, y compris au gestionnaire d'entrepôt qui n'a aucune
 * décision à prendre avec ces chiffres.
 *
 * Désormais l'écran suit le poste :
 *   Gestionnaire d'entrepôt — le stock de SON site : emplacements, réservé, disponible réel.
 *   Responsable stock       — le pilotage réseau : transferts, capital dormant, automatisation.
 *   Direction               — tout, marge comprise.
 */
export function StockLogistiqueView() {
  const { user } = useAuth()
  const { lastAction, clearLastAction } = useStockWorkflow()
  const perimetre = getPerimetreLogistique(user)
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')

  const sectionsVisibles = SECTIONS.filter(s => {
    // Les arbitrages réseau supposent de voir les deux entrepôts et d'engager de l'argent.
    if (s.id === 'transferts' || s.id === 'automatisation') return perimetre.peutEngager
    if (s.id === 'sante') return perimetre.voitValeurAchat
    return true
  })

  const [section, setSection] = useState<Section>(
    sectionsVisibles.some(s => s.id === tabParam) ? (tabParam as Section) : 'stock',
  )

  useEffect(() => {
    if (tabParam && sectionsVisibles.some(s => s.id === tabParam)) {
      setSection(tabParam as Section)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabParam])

  // Le gestionnaire d'entrepôt n'a qu'un écran de stock : le sien, sans onglets superflus.
  if (perimetre.niveau === 'ENTREPOT') {
    return <StockEntrepotView entrepot={perimetre.entrepots[0]} />
  }

  return (
    <div>
      <div className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur border-b border-slate-200 px-6 pt-4 pb-0">
        <div className="max-w-7xl flex flex-wrap gap-2">
          {sectionsVisibles.map(s => {
            const Icon = s.icon
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSection(s.id)}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold transition-colors border border-b-0',
                  section === s.id
                    ? 'bg-white text-amber-800 border-slate-200 shadow-sm'
                    : 'bg-slate-100 text-slate-500 border-transparent hover:bg-slate-200 hover:text-slate-700',
                )}
              >
                <Icon size={14} />
                {s.label}
              </button>
            )
          })}
        </div>
      </div>

      {section === 'stock' && <StockView />}
      {section === 'transferts' && (
        <div className="px-6 py-5 max-w-7xl">
          <TransfertsPanel />
        </div>
      )}
      {section === 'sante' && (
        <div className="px-6 py-5 max-w-7xl">
          <SanteStockPanel entrepots={perimetre.entrepots} />
        </div>
      )}
      {section === 'automatisation' && (
        <div className="px-6 py-5 max-w-7xl">
          <JournalAutomatisationPanel entrepots={perimetre.entrepots} />
        </div>
      )}
      {section === 'sorties' && (
        <div className="px-6 py-4 max-w-7xl">
          <EntrepotSortiesHistoriquePanel />
        </div>
      )}
      {section === 'catalogue' && <CatalogueView />}

      <WorkflowToast action={lastAction} onClose={clearLastAction} />
    </div>
  )
}
