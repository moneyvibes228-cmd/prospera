/**
 * Pont mauvais payeur recouvrement → fiche client à risque (vue CL-1042).
 */
import type { ClientRisqueDetail, PaiementRecent } from '@/lib/dec-vue360'
import { getAllClientsRisque, getClientRisqueById } from '@/lib/dec-vue360'
import {
  buildFicheClientMicrofinance,
  getFicheClientMicrofinance,
  type FicheClientMicrofinance,
} from '@/lib/fiche-client-microfinance'
import {
  getMauvaisPayeurById,
  type MauvaisPayeurDetail,
} from '@/lib/roc-recouvrement-vue360'

const MOIS = ['Déc', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai']

function scoreEvolution(score: number): ClientRisqueDetail['score_evolution'] {
  return MOIS.map((mois, i) => ({
    mois,
    score: Math.min(99, Math.max(20, score + (5 - i) * 3)),
  }))
}

function resolveRegistryClientId(mp: MauvaisPayeurDetail): string | undefined {
  if (mp.client_id && !mp.client_id.startsWith('MP-')) return mp.client_id
  const target = mp.nom.toLowerCase()
  const match = getAllClientsRisque().find(c => {
    const n = c.nom.toLowerCase()
    return n === target || target.includes(n) || n.includes(target.replace(/^m\.\s*/, ''))
  })
  return match?.id
}

function mauvaisPayeurToClientRisque(mp: MauvaisPayeurDetail): ClientRisqueDetail {
  const credit = mp.credits[0]
  const pd = Math.min(95, Math.max(15, 100 - mp.probabilite_remboursement_pct))
  const scoreIa = Math.max(20, Math.min(85, 100 - mp.score_recouvrement_ia))

  const paiements: PaiementRecent[] = mp.echanges
    .filter(e => e.type === 'PARTIEL' || e.type === 'PAIEMENT')
    .map(e => ({
      date: e.date,
      montant: e.montant ?? 0,
      type: e.type === 'PARTIEL' ? 'PARTIEL' as const : 'REMBOURSEMENT' as const,
      canal: e.canal === 'MOMO' ? 'Mixx By Yas' : e.canal === 'WHATSAPP' ? 'WhatsApp' : e.canal,
    }))

  if (!paiements.length && mp.retard_j > 14) {
    paiements.push({ date: '18/03/2026', montant: 0, type: 'MANQUE', canal: '—' })
  }

  const visites = mp.echanges
    .filter(e => e.canal === 'VISITE')
    .map(e => ({
      date: e.date,
      agent: e.agent,
      statut: (e.type === 'REFUS' || e.type === 'INJOIGNABLE' ? 'NEGATIVE' : 'POSITIVE') as 'NEGATIVE' | 'POSITIVE' | 'SANS_REPONSE',
      commentaire: e.resume,
    }))

  return {
    id: mp.client_id ?? mp.id,
    nom: mp.nom,
    telephone: mp.telephone,
    agence: mp.agence,
    agent: mp.agent,
    activite: mp.activite,
    secteur: mp.activite.includes('agricol') ? 'Agriculture' : mp.activite.includes('Tontine') ? 'Artisanat' : 'Commerce',
    localite: mp.localite,
    encours: credit?.encours ?? mp.montant_du,
    score_ia: scoreIa,
    pd_pct: pd,
    el: Math.round((credit?.encours ?? mp.montant_du) * pd / 100),
    jours_retard: mp.retard_j,
    action: mp.actions_recommandees[0] ?? 'Recouvrement prioritaire',
    classe_bceao: mp.classe_bceao,
    mensualite: credit?.mensualite ?? Math.round(mp.montant_du / 6),
    echeances_impayees: credit?.echeances_impayees ?? Math.max(1, Math.floor(mp.retard_j / 30)),
    dernier_contact: mp.echanges[0]
      ? `${mp.echanges[0].date} — ${mp.echanges[0].resume.slice(0, 48)}`
      : mp.derniere_visite ?? '—',
    score_evolution: scoreEvolution(scoreIa),
    credits: mp.credits.length
      ? mp.credits.map(c => ({
          reference: c.reference,
          montant: c.montant_initial,
          encours: c.encours,
          statut: 'EN_RETARD',
          date_decaissement: c.date_decaissement,
        }))
      : [{
          reference: `PRT-${mp.id}`,
          montant: mp.montant_du * 1.2,
          encours: mp.montant_du,
          statut: 'EN_RETARD',
          date_decaissement: '01/2025',
        }],
    paiements_recents: paiements,
    visites,
    alertes_ia: [
      {
        severite: mp.retard_j >= 60 ? 'CRITIQUE' as const : 'HAUTE' as const,
        message: `Mauvais payeur réseau #${mp.rang_reseau} — retard J+${mp.retard_j}`,
        action: mp.actions_recommandees[0] ?? 'Plan recouvrement',
        date: '28/05/2026',
      },
      ...mp.causes_principales.slice(0, 2).map((c, i) => ({
        severite: (i === 0 ? 'HAUTE' : 'MOYENNE') as 'HAUTE' | 'MOYENNE',
        message: c,
        action: mp.actions_recommandees[i + 1] ?? mp.actions_recommandees[0] ?? 'Suivi',
        date: '27/05/2026',
      })),
    ],
    analyse_dec: mp.analyse_ia_mauvais_payeur,
  }
}

/** Fiche client complète pour un mauvais payeur (même rendu que /dashboard/credit/clients/CL-1042) */
export function getFicheForMauvaisPayeur(mpId: string): FicheClientMicrofinance | undefined {
  const mp = getMauvaisPayeurById(mpId)
  if (!mp) return undefined

  const registryId = resolveRegistryClientId(mp)
  if (registryId) {
    const fromRegistry = getFicheClientMicrofinance(registryId)
    if (fromRegistry) {
      return {
        ...fromRegistry,
        jours_retard: mp.retard_j,
        encours: mp.credits[0]?.encours ?? mp.montant_du,
        analyse_dec: mp.analyse_ia_mauvais_payeur,
        alertes_ia: [
          {
            severite: 'CRITIQUE',
            message: `Mauvais payeur réseau #${mp.rang_reseau} — ${formatMontant(mp.montant_du)} dû`,
            action: mp.actions_recommandees[0] ?? 'Recouvrement',
            date: '28/05/2026',
          },
          ...fromRegistry.alertes_ia,
        ],
      }
    }
    const base = getClientRisqueById(registryId)
    if (base) return buildFicheClientMicrofinance({ ...base, jours_retard: mp.retard_j })
  }

  return buildFicheClientMicrofinance(mauvaisPayeurToClientRisque(mp))
}

function formatMontant(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

export function getMauvaisPayeurMeta(mpId: string) {
  const mp = getMauvaisPayeurById(mpId)
  if (!mp) return undefined
  return { rang_reseau: mp.rang_reseau, nom: mp.nom }
}
