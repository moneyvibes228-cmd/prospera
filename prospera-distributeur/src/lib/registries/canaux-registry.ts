/**
 * Canaux de distribution B2B — force de vente salariée, freelance, prospection.
 */
import { RESEAU_CONSOLIDE_DIST } from './zones-registry'
import { REGISTRE_COMMERCIAUX } from './commerciaux-registry'

export type StatutCanal = 'SAIN' | 'ATTENTION' | 'CRITIQUE'

export interface CanalDistribution {
  id: string
  nom: string
  description: string
  effectif: number
  ca_mois: number
  ca_objectif: number
  commandes_jour: number
  couverture_pct: number
  marge_pct?: number
  score_canal: number
  statut: StatutCanal
  referent: string
}

const salarie = REGISTRE_COMMERCIAUX.filter(c => c.type === 'SALARIE' && c.zone !== 'Prospection')
const freelance = REGISTRE_COMMERCIAUX.filter(c => c.type === 'FREELANCE')
const prospection = REGISTRE_COMMERCIAUX.filter(c => c.zone === 'Prospection')

export const CANAUX_DISTRIBUTION: CanalDistribution[] = [
  {
    id: 'can-vrp-salaries',
    nom: 'VRP salariés',
    description: 'Force de vente terrain — portefeuilles assignés, tarif société',
    effectif: RESEAU_CONSOLIDE_DIST.total_commerciaux,
    ca_mois: 318_000_000,
    ca_objectif: 320_000_000,
    commandes_jour: 98,
    couverture_pct: 82,
    score_canal: 81,
    statut: 'SAIN',
    referent: 'Kodjo Agbeko',
  },
  {
    id: 'can-freelance',
    nom: 'Réseau freelance',
    description: 'Apporteurs indépendants — prix client libre, zones blanches',
    effectif: RESEAU_CONSOLIDE_DIST.total_freelances,
    ca_mois: 68_000_000,
    ca_objectif: 60_000_000,
    commandes_jour: 24,
    couverture_pct: 88,
    marge_pct: 16.4,
    score_canal: 79,
    statut: 'SAIN',
    referent: 'Kofi Agbessi',
  },
  {
    id: 'can-prospection',
    nom: 'Prospection & nouveaux comptes',
    description: 'Ouverture détaillants — pipeline 1ère commande',
    effectif: prospection.length,
    ca_mois: 26_000_000,
    ca_objectif: 35_000_000,
    commandes_jour: 5,
    couverture_pct: 68,
    score_canal: 68,
    statut: 'ATTENTION',
    referent: 'Mawuena Ahi',
  },
]

/** Commerciaux phares par canal (démo). */
export function getTopCommerciauxCanal(canalId: string) {
  if (canalId === 'can-vrp-salaries') return salarie.slice(0, 2)
  if (canalId === 'can-freelance') return freelance.slice(0, 2)
  return prospection.slice(0, 1)
}
