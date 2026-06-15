// Types partagés entre la couche données et les composants UI

export type StatutObjectif = 'EN_AVANCE' | 'DANS_LES_TEMPS' | 'EN_RETARD' | 'CRITIQUE'

export interface Objectif {
  id: string
  titre: string
  metrique: string
  valeur_actuelle: number | string
  valeur_cible: number | string
  unite: string
  progression: number          // 0–100 — % d'avancement vers la cible
  statut: StatutObjectif
  echeance: string
  ia_conseil: string
  ia_action_urgente?: string
  inversé?: boolean            // true quand "moins c'est mieux" (PAR, délais...)
}
