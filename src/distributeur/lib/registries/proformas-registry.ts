import type { LigneFacture, Proforma, ProformaStatut, CanalEnvoiProforma, ModePaiementFacture } from '@distributeur/types'
import { REGISTRE_PDV, getPdvById } from './pdv-registry'
import { REGISTRE_STOCK } from './stock-registry'
import { calculerTotaux, ligneDepuisProduit, scoreAcceptationIA, suggestionIA } from '@distributeur/lib/proforma-builder'

/**
 * Proformas — le document commercial qui précède la commande (spec V2 §4).
 * Les totaux et le score d'acceptation sont **calculés**, pas saisis : ils dépendent
 * de la santé réelle du PDV (encours, plafond, score) telle qu'elle figure au registre PDV.
 */

/** Panier habituel du client — sert de repère au score : une proforma très au-dessus freine la signature. */
function panierHabituel(pdvId: string): number {
  const pdv = getPdvById(pdvId)
  return pdv ? Math.max(200_000, Math.round(pdv.ca_mois / 3)) : 500_000
}

function plafondCredit(pdvId: string): number {
  const pdv = getPdvById(pdvId)
  if (!pdv) return 1_000_000
  return pdv.type_magasin === 'PROPRE' ? 0 : Math.max(1_000_000, Math.round(pdv.ca_mois * 1.5))
}

function ligne(reference: string, quantite: number, remisePct = 0): LigneFacture {
  const produit = REGISTRE_STOCK.find(p => p.reference === reference) ?? REGISTRE_STOCK[0]
  return ligneDepuisProduit(produit, quantite, remisePct)
}

interface SeedProforma {
  id: string
  numero: string
  pdv_id: string
  date_emission: string
  date_validite: string
  lignes: LigneFacture[]
  remise_globale_pct: number
  statut: ProformaStatut
  conditions_paiement: ModePaiementFacture
  canal_envoi: CanalEnvoiProforma
  vue_le?: string
  relances_envoyees: number
  commande_ref?: string
  facture_ref?: string
}

const SEEDS: SeedProforma[] = [
  {
    id: 'pro-1', numero: 'PRO-2026-0142', pdv_id: 'pdv-1',
    date_emission: '2026-06-09', date_validite: '2026-06-24',
    lignes: [ligne('PRD-RIZ-25KG', 40), ligne('PRD-HUILE-1L', 120, 3), ligne('PRD-SUCRE-1KG', 200)],
    remise_globale_pct: 2, statut: 'VUE', conditions_paiement: 'CREDIT_30J',
    canal_envoi: 'WHATSAPP', vue_le: '2026-06-10', relances_envoyees: 0,
  },
  {
    id: 'pro-2', numero: 'PRO-2026-0141', pdv_id: 'pdv-3',
    date_emission: '2026-06-05', date_validite: '2026-06-12',
    lignes: [ligne('PRD-EAU-1.5L', 60), ligne('PRD-COCA-33CL', 30)],
    remise_globale_pct: 0, statut: 'ENVOYEE', conditions_paiement: 'CREDIT_30J',
    canal_envoi: 'SMS', relances_envoyees: 2,
  },
  {
    id: 'pro-3', numero: 'PRO-2026-0140', pdv_id: 'pdv-6',
    date_emission: '2026-06-08', date_validite: '2026-06-23',
    // Offre découverte — remise 1re commande sur le prospect bloqué identifié par l'IA.
    lignes: [ligne('PRD-EAU-50CL', 40, 10), ligne('PRD-PATES-500G', 60, 10), ligne('PRD-SAVON-PACK', 20, 10)],
    remise_globale_pct: 5, statut: 'ENVOYEE', conditions_paiement: 'ESPECES',
    canal_envoi: 'WHATSAPP', relances_envoyees: 1,
  },
  {
    id: 'pro-4', numero: 'PRO-2026-0139', pdv_id: 'pdv-4',
    date_emission: '2026-05-28', date_validite: '2026-06-12',
    lignes: [ligne('PRD-LAIT-400G', 80), ligne('PRD-CAFE-200G', 50), ligne('PRD-BISCUIT-PK', 60)],
    remise_globale_pct: 3, statut: 'CONVERTIE', conditions_paiement: 'VIREMENT',
    canal_envoi: 'EMAIL', vue_le: '2026-05-29', relances_envoyees: 0,
    commande_ref: 'CMD-2026-4530', facture_ref: 'FAC-8838',
  },
  {
    id: 'pro-5', numero: 'PRO-2026-0138', pdv_id: 'pdv-9',
    date_emission: '2026-06-02', date_validite: '2026-06-17',
    lignes: [ligne('PRD-FARINE-25KG', 60), ligne('PRD-RIZ-25KG', 80), ligne('PRD-HUILE-5L', 40)],
    remise_globale_pct: 4, statut: 'ACCEPTEE', conditions_paiement: 'CREDIT_45J',
    canal_envoi: 'EMAIL', vue_le: '2026-06-03', relances_envoyees: 0,
  },
  {
    id: 'pro-6', numero: 'PRO-2026-0137', pdv_id: 'pdv-7',
    date_emission: '2026-06-10', date_validite: '2026-06-25',
    lignes: [ligne('PRD-BIERE-33CL', 25), ligne('PRD-ENERGY-25CL', 30)],
    remise_globale_pct: 0, statut: 'BROUILLON', conditions_paiement: 'ESPECES',
    canal_envoi: 'IMPRESSION', relances_envoyees: 0,
  },
  {
    id: 'pro-7', numero: 'PRO-2026-0136', pdv_id: 'pdv-5',
    date_emission: '2026-05-20', date_validite: '2026-06-04',
    lignes: [ligne('PRD-DETERGENT-5L', 30), ligne('PRD-JAVEL-1L', 50)],
    remise_globale_pct: 0, statut: 'EXPIREE', conditions_paiement: 'CREDIT_30J',
    canal_envoi: 'SMS', relances_envoyees: 3,
  },
  {
    id: 'pro-8', numero: 'PRO-2026-0135', pdv_id: 'pdv-2',
    date_emission: '2026-05-18', date_validite: '2026-06-02',
    lignes: [ligne('PRD-SHAMPOO-400ML', 20), ligne('PRD-DENTIFRICE-PK', 30)],
    remise_globale_pct: 0, statut: 'REFUSEE', conditions_paiement: 'CREDIT_30J',
    canal_envoi: 'WHATSAPP', vue_le: '2026-05-19', relances_envoyees: 1,
  },
  {
    id: 'pro-9', numero: 'PRO-2026-0134', pdv_id: 'pdv-8',
    date_emission: '2026-06-10', date_validite: '2026-06-13',
    lignes: [ligne('PRD-SIROP-1L', 30), ligne('PRD-JUS-1L', 40)],
    remise_globale_pct: 2, statut: 'VUE', conditions_paiement: 'ESPECES',
    canal_envoi: 'WHATSAPP', vue_le: '2026-06-11', relances_envoyees: 0,
  },
  {
    id: 'pro-10', numero: 'PRO-2026-0133', pdv_id: 'mag-1',
    date_emission: '2026-06-11', date_validite: '2026-06-26',
    lignes: [ligne('PRD-EAU-1.5L', 100), ligne('PRD-BIERE-65CL', 40), ligne('PRD-CHIPS-150G', 50)],
    remise_globale_pct: 0, statut: 'ENVOYEE', conditions_paiement: 'VIREMENT',
    canal_envoi: 'EMAIL', relances_envoyees: 0,
  },
]

function construire(seed: SeedProforma): Proforma {
  const pdv = getPdvById(seed.pdv_id) ?? REGISTRE_PDV[0]
  const totaux = calculerTotaux(seed.lignes, seed.remise_globale_pct)

  const remiseLignes = seed.lignes.length > 0
    ? seed.lignes.reduce((s, l) => s + l.remise_pct, 0) / seed.lignes.length
    : 0

  const score = scoreAcceptationIA({
    score_pdv: pdv.score_ia,
    creance: pdv.creance,
    plafond_credit: plafondCredit(seed.pdv_id),
    remise_pct: seed.remise_globale_pct + remiseLignes,
    montant_ttc: totaux.montant_ttc,
    panier_habituel: panierHabituel(seed.pdv_id),
    relances_envoyees: seed.relances_envoyees,
    vue: seed.vue_le != null,
  })

  const proforma: Proforma = {
    id: seed.id,
    numero: seed.numero,
    pdv_id: seed.pdv_id,
    pdv_nom: pdv.nom,
    commercial: pdv.commercial,
    zone: pdv.zone,
    date_emission: seed.date_emission,
    date_validite: seed.date_validite,
    lignes: seed.lignes,
    montant_ht: totaux.montant_ht,
    tva_pct: 18,
    montant_ttc: totaux.montant_ttc,
    remise_globale_pct: seed.remise_globale_pct,
    statut: seed.statut,
    conditions_paiement: seed.conditions_paiement,
    commande_ref: seed.commande_ref,
    facture_ref: seed.facture_ref,
    score_acceptation_ia: score,
    canal_envoi: seed.canal_envoi,
    vue_le: seed.vue_le,
    relances_envoyees: seed.relances_envoyees,
  }

  return { ...proforma, suggestion_ia: suggestionIA(proforma, pdv.score_ia, pdv.creance) }
}

export const REGISTRE_PROFORMAS: Proforma[] = SEEDS.map(construire)

export function getProformaById(id: string): Proforma | undefined {
  return REGISTRE_PROFORMAS.find(p => p.id === id)
}

/** Proformas expirant sous 48 h — badge du menu Facturation. */
export function countProformasExpirantes(): number {
  const limite = new Date('2026-06-13').getTime()
  const aujourdhui = new Date('2026-06-11').getTime()
  return REGISTRE_PROFORMAS.filter(p => {
    if (!['ENVOYEE', 'VUE', 'BROUILLON'].includes(p.statut)) return false
    const validite = new Date(p.date_validite).getTime()
    return validite >= aujourdhui && validite <= limite
  }).length
}
