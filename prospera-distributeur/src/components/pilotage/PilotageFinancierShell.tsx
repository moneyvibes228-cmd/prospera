'use client'

import { useAuth } from '@/contexts/AuthContext'
import { ComptabiliteDGView } from '@/components/comptabilite/ComptabiliteDGView'
import { PilotageDAFView } from './PilotageDAFView'

/**
 * `/pilotage-financier` n'est pas le même écran selon qui l'ouvre.
 *
 * Le DG *constate* et tranche les 5 décisions qu'on lui remonte.
 * Le DAF *arbitre* : il décide qui est payé cette semaine, à qui on ouvre du crédit,
 * quelle marge arrière est réclamée. Lui servir la vue DG revenait à lui retirer son métier.
 */
export function PilotageFinancierShell() {
  const { user } = useAuth()
  if (user?.role === 'DAF') return <PilotageDAFView />
  return <ComptabiliteDGView />
}
