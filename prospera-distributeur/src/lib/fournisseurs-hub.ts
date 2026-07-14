import type { CommandeFournisseur, Fournisseur, ProduitFournisseur } from '@/types'
import { REGISTRE_FOURNISSEURS, DETTE_FOURNISSEURS_TOTALE, DETTE_FOURNISSEURS_ECHUE, getFournisseurById } from '@/lib/registries/fournisseurs-registry'
import { REGISTRE_COMMANDES_FOURNISSEURS, getCommandesDuFournisseur } from '@/lib/registries/commandes-fournisseurs-registry'
import { getProduitsDuFournisseur } from '@/lib/registries/produits-fournisseurs-registry'
import { REGISTRE_STOCK } from '@/lib/registries/stock-registry'
import {
  detecterProduitsEnManque, genererCommandesSuggerees, simulerImpactTresorerie,
  commandesEnAttenteValidation, buildEcheancierFournisseurs,
} from '@/lib/reappro-engine'

/** Agrégats de la rubrique Approvisionnement — bandeau KPI de la page (spec §5.5). */
export interface SyntheseApprovisionnement {
  produits_sous_seuil: number
  commandes_auto_attente: number
  dette_totale: number
  dette_echue: number
  delai_reappro_moyen_j: number
  taux_service_fournisseur_pct: number
  economie_regroupement_mois: number
  montant_suggere: number
}

export function buildSyntheseApprovisionnement(): SyntheseApprovisionnement {
  const alertes = detecterProduitsEnManque()
  const suggerees = genererCommandesSuggerees()
  const attente = commandesEnAttenteValidation()

  const actifs = REGISTRE_FOURNISSEURS.filter(f => f.statut !== 'SUSPENDU')
  const delaiMoyen = actifs.reduce((s, f) => s + f.delai_reel_moyen_j, 0) / (actifs.length || 1)
  const tauxService = actifs.reduce((s, f) => s + f.taux_livraison_conforme_pct, 0) / (actifs.length || 1)

  const economie = [...REGISTRE_COMMANDES_FOURNISSEURS, ...suggerees]
    .reduce((s, c) => s + (c.economie_regroupement ?? 0), 0)

  return {
    produits_sous_seuil: alertes.length,
    commandes_auto_attente: attente.length,
    dette_totale: DETTE_FOURNISSEURS_TOTALE,
    dette_echue: DETTE_FOURNISSEURS_ECHUE,
    delai_reappro_moyen_j: Math.round(delaiMoyen * 10) / 10,
    taux_service_fournisseur_pct: Math.round(tauxService),
    economie_regroupement_mois: economie,
    montant_suggere: suggerees.reduce((s, c) => s + c.montant_ttc, 0),
  }
}

/** Fiche fournisseur — conditions, dette, performance, produits, commandes. */
export interface FicheFournisseurData {
  fournisseur: Fournisseur
  produits: (ProduitFournisseur & { produit_nom: string; concurrent_prix?: number; ecart_prix_pct?: number })[]
  commandes: CommandeFournisseur[]
  commandes_en_cours: number
  litiges: number
  part_dette_pct: number
  ecart_delai_j: number
  synthese_ia: string
}

export function buildFicheFournisseur(fournisseurId: string): FicheFournisseurData | null {
  const fournisseur = getFournisseurById(fournisseurId)
  if (!fournisseur) return null

  const commandes = getCommandesDuFournisseur(fournisseurId)
  const litiges = commandes.filter(c => c.statut === 'LITIGE').length
  const enCours = commandes.filter(
    c => !['RECUE', 'ANNULEE', 'LITIGE'].includes(c.statut),
  ).length

  const produits = getProduitsDuFournisseur(fournisseurId).map(pf => {
    const produit = REGISTRE_STOCK.find(p => p.reference === pf.produit_ref)
    // Prix du meilleur concurrent référencé sur le même produit — base du comparatif.
    const concurrents = REGISTRE_FOURNISSEURS
      .filter(f => f.id !== fournisseurId)
      .flatMap(f => getProduitsDuFournisseur(f.id))
      .filter(p => p.produit_ref === pf.produit_ref)
    const meilleur = concurrents.sort((a, b) => a.prix_achat - b.prix_achat)[0]
    return {
      ...pf,
      produit_nom: produit?.nom ?? pf.produit_ref,
      concurrent_prix: meilleur?.prix_achat,
      ecart_prix_pct: meilleur
        ? Math.round(((pf.prix_achat - meilleur.prix_achat) / meilleur.prix_achat) * 1000) / 10
        : undefined,
    }
  })

  const ecartDelai = Math.round((fournisseur.delai_reel_moyen_j - fournisseur.delai_livraison_j) * 10) / 10
  const partDette = DETTE_FOURNISSEURS_TOTALE > 0
    ? Math.round((fournisseur.encours_du / DETTE_FOURNISSEURS_TOTALE) * 100)
    : 0

  const points: string[] = []
  if (ecartDelai > 2) points.push(`livre en moyenne ${ecartDelai} j après le délai annoncé`)
  if (fournisseur.encours_echu > 0) points.push(`${(fournisseur.encours_echu / 1_000_000).toFixed(1)} M de dette échue`)
  if (fournisseur.taux_litige_pct > 5) points.push(`taux de litige ${fournisseur.taux_litige_pct} %`)
  if (fournisseur.competitivite_prix >= 85) points.push(`prix parmi les plus compétitifs du panel (${fournisseur.competitivite_prix}/100)`)
  if (fournisseur.taux_livraison_conforme_pct >= 95) points.push(`${fournisseur.taux_livraison_conforme_pct} % de livraisons conformes`)

  const synthese = fournisseur.statut === 'SUSPENDU'
    ? `Fournisseur suspendu : ${points.join(', ')}. Aucune commande automatique n'est émise — la bascule vers le fournisseur de secours doit être arbitrée.`
    : points.length > 0
      ? `${fournisseur.nom} : ${points.join(', ')}.`
      : `${fournisseur.nom} : aucune anomalie détectée sur la période.`

  return {
    fournisseur,
    produits,
    commandes,
    commandes_en_cours: enCours,
    litiges,
    part_dette_pct: partDette,
    ecart_delai_j: ecartDelai,
    synthese_ia: synthese,
  }
}

export type SeveriteAppro = 'CRITIQUE' | 'HAUTE' | 'MODEREE'

export interface AnalyseApproIA {
  titre: string
  detail: string
  action: string
  severite: SeveriteAppro
}

/** Analyses IA de la page Approvisionnement — dérivées des données, pas rédigées à la main. */
export function buildAnalysesApproIA(): AnalyseApproIA[] {
  const analyses: AnalyseApproIA[] = []
  const alertes = detecterProduitsEnManque()
  const suggerees = genererCommandesSuggerees()
  const impact = simulerImpactTresorerie(suggerees)

  const critiques = alertes.filter(a => a.criticite === 'CRITIQUE')
  if (critiques.length > 0) {
    analyses.push({
      titre: `${critiques.length} produit${critiques.length > 1 ? 's' : ''} en rupture imminente`,
      detail: critiques.slice(0, 3)
        .map(a => `${a.produit_nom} — ${a.couverture_jours} j de couverture`)
        .join(' · '),
      action: 'Valider les commandes suggérées aujourd\'hui : au-delà, la livraison arrive après la rupture.',
      severite: 'CRITIQUE',
    })
  }

  const suspendus = REGISTRE_FOURNISSEURS.filter(f => f.statut === 'SUSPENDU')
  for (const f of suspendus) {
    const produitsBloques = getProduitsDuFournisseur(f.id).filter(pf => pf.prioritaire)
    if (produitsBloques.length === 0) continue
    analyses.push({
      titre: `${f.nom} suspendu — ${produitsBloques.length} produit${produitsBloques.length > 1 ? 's' : ''} sans fournisseur prioritaire`,
      detail: `${(f.encours_echu / 1_000_000).toFixed(1)} M de dette échue, ${f.taux_litige_pct} % de litiges, ${f.delai_reel_moyen_j} j de délai réel contre ${f.delai_livraison_j} j annoncés.`,
      action: 'Basculer ces références sur le fournisseur de secours ou solder le litige pour rouvrir le compte.',
      severite: 'HAUTE',
    })
  }

  if (impact.franchit_plancher) {
    analyses.push({
      titre: 'Garde-fou trésorerie déclenché',
      detail: impact.commentaire,
      action: 'Étaler les commandes non critiques ou négocier un délai de paiement avant d\'engager.',
      severite: 'CRITIQUE',
    })
  }

  const regroupees = suggerees.filter(c => c.lignes.length > 1)
  if (regroupees.length > 0) {
    const economie = regroupees.reduce((s, c) => s + (c.economie_regroupement ?? 0), 0)
    analyses.push({
      titre: `${regroupees.length} commande${regroupees.length > 1 ? 's' : ''} regroupée${regroupees.length > 1 ? 's' : ''} par le moteur`,
      detail: `Produits en manque partageant le même fournisseur fusionnés en une seule commande — ${economie.toLocaleString('fr-FR')} F économisés sur le transport et la remise volume.`,
      action: 'Aucune action : le gain est acquis à la validation.',
      severite: 'MODEREE',
    })
  }

  const echus = REGISTRE_FOURNISSEURS.filter(f => f.encours_echu > 0)
    .sort((a, b) => b.encours_echu - a.encours_echu)
  if (echus.length > 0) {
    analyses.push({
      titre: `Dette échue ${(DETTE_FOURNISSEURS_ECHUE / 1_000_000).toFixed(1)} M sur ${echus.length} fournisseurs`,
      detail: `Le plus exposé : ${echus[0].nom}, ${(echus[0].encours_echu / 1_000_000).toFixed(1)} M échus sur un plafond accordé de ${(echus[0].plafond_credit_accorde / 1_000_000).toFixed(0)} M.`,
      action: 'Un fournisseur non payé livre en retard : arbitrer le plan de règlement avec le DAF.',
      severite: DETTE_FOURNISSEURS_ECHUE > 40_000_000 ? 'CRITIQUE' : 'HAUTE',
    })
  }

  return analyses
}

export {
  detecterProduitsEnManque, genererCommandesSuggerees, simulerImpactTresorerie,
  commandesEnAttenteValidation, buildEcheancierFournisseurs,
}
