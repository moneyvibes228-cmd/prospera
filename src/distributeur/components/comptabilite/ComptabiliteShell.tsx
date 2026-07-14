'use client'

import { useAuth } from '@distributeur/contexts/AuthContext'
import { ComptabiliteView } from './ComptabiliteView'
import { ComptabiliteComptableView } from './ComptabiliteComptableView'

/**
 * `/comptabilite` servait la même « Vue DAF » à tout le monde — bandeau « 5 décisions DG »
 * compris, alors que le comptable ne décide rien de tout ça.
 *
 * Le comptable a désormais son poste de travail : lettrage 411, remises de caisse terrain,
 * TVA, pièces à réclamer, clôture. Le DAF garde la vue analytique (balance, résultat, trésorerie).
 */
export function ComptabiliteShell() {
  const { user } = useAuth()
  if (user?.role === 'COMPTABLE') return <ComptabiliteComptableView />
  return <ComptabiliteView />
}
