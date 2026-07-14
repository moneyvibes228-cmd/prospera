/**
 * Garde-fous transverses — la règle qui relie le marketing au recouvrement.
 *
 * Une société de distribution se tire une balle dans le pied le jour où elle
 * envoie une promo « -10% pour vous » à un client qui lui doit 8,9 M FCFA depuis
 * 78 jours : le commercial perd son levier, le recouvrement perd sa crédibilité,
 * et le client apprend qu'il peut ne pas payer sans conséquence.
 *
 * L'exclusion n'est donc pas une option de campagne, c'est une propriété du
 * client, calculée au même endroit pour les deux postes.
 */

import { REGISTRE_PDV, getPdvById } from '@distributeur/lib/registries/pdv-registry'
import { buildDossiersRecouvrement } from '@distributeur/lib/recouvrement-builder'
import type { PointDeVente } from '@distributeur/types'
import { formatFcfa } from '@distributeur/lib/utils'

/** Date de référence de la démo — même « aujourd'hui » que le reste des registres. */
export const AUJOURDHUI = '2026-06-11'

export function joursDepuis(date: string, reference = AUJOURDHUI): number {
  if (!date || date === '—') return 9999
  const d = new Date(date).getTime()
  if (Number.isNaN(d)) return 9999
  return Math.round((new Date(reference).getTime() - d) / 86_400_000)
}

export function joursAvant(date: string, reference = AUJOURDHUI): number {
  return -joursDepuis(date, reference)
}

/** Retard au-delà duquel un client ne reçoit plus aucune sollicitation commerciale. */
const SEUIL_EXCLUSION_JOURS = 30

export interface ExclusionCampagne {
  pdv_id: string
  pdv_nom: string
  motif: string
  creance: number
}

/**
 * Les clients que le marketing n'a pas le droit de solliciter, et pourquoi.
 * Un client en défaut appartient au recouvrement, pas aux campagnes.
 */
export function exclusionsCampagne(): Map<string, ExclusionCampagne> {
  const exclus = new Map<string, ExclusionCampagne>()

  for (const d of buildDossiersRecouvrement()) {
    const enDefaut = d.jours_retard > SEUIL_EXCLUSION_JOURS || d.credit_bloque
    if (!enDefaut) continue
    exclus.set(d.client_id, {
      pdv_id: d.client_id,
      pdv_nom: d.client_nom,
      motif: d.credit_bloque
        ? `Crédit bloqué — ${formatFcfa(d.reste)} F impayés depuis ${d.jours_retard} j`
        : `Créance ${formatFcfa(d.reste)} F en recouvrement (${d.jours_retard} j)`,
      creance: d.reste,
    })
  }

  // Le pipeline dit parfois A_RISQUE avant même que la compta n'ait passé l'écriture.
  for (const pdv of REGISTRE_PDV) {
    if (exclus.has(pdv.id)) continue
    if (pdv.pipeline === 'A_RISQUE') {
      exclus.set(pdv.id, {
        pdv_id: pdv.id,
        pdv_nom: pdv.nom,
        motif: pdv.creance > 0
          ? `Client à risque — ${formatFcfa(pdv.creance)} F dus (${pdv.creance_jours} j)`
          : 'Client classé à risque — sollicitation commerciale suspendue',
        creance: pdv.creance,
      })
    }
  }

  return exclus
}

/** Motif d'exclusion d'un point de vente, ou `undefined` s'il est adressable. */
export function motifExclusion(pdvId: string, exclus = exclusionsCampagne()): string | undefined {
  return exclus.get(pdvId)?.motif
}

/**
 * L'audience réellement adressable par le marketing : le réseau moins les
 * clients en défaut, moins les prospects sans téléphone.
 */
export function audienceAdressable(): PointDeVente[] {
  const exclus = exclusionsCampagne()
  return REGISTRE_PDV.filter(p => !exclus.has(p.id) && p.type_magasin === 'PARTENAIRE')
}

/**
 * Plafond de sollicitation par client et par semaine. Au-delà, le taux de réponse
 * s'effondre et les désabonnements WhatsApp deviennent définitifs — un contact
 * perdu ne se rachète pas.
 */
export const QUOTA_MESSAGES_SEMAINE = 2

export function pdvNom(id: string): string {
  return getPdvById(id)?.nom ?? id
}
