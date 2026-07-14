/**
 * Pilotage commandes DG — pipeline grossiste, volumes, analyses IA.
 */
import type { Commande, CommandeStatut } from '@/types'
import { REGISTRE_COMMANDES } from './registries/commandes-registry'

export interface CommandePipelineDG {
  statut: CommandeStatut
  count: number
  volume_fcfa: number
}

export interface AnalyseCommandeIA {
  severite: 'CRITIQUE' | 'HAUTE' | 'MODEREE'
  titre: string
  detail: string
  action: string
}

export function buildSyntheseCommandesDG(commandes: Commande[]) {
  const volumeTotal = commandes.reduce((s, c) => s + c.montant_societe, 0)
  const panierMoyen = commandes.length > 0 ? Math.round(volumeTotal / commandes.length) : 0
  const margeMoyenne = commandes.length > 0
    ? Math.round(commandes.reduce((s, c) => s + c.marge_brute_pct, 0) / commandes.length * 10) / 10
    : 0
  const bloquees = commandes.filter(c => c.priorite_ia === 'BLOQUEE')
  const prioritaires = commandes.filter(c => c.priorite_ia === 'HAUTE')
  const enPreparation = commandes.filter(c => c.statut === 'PREPARATION')
  const freelance = commandes.filter(c => c.type_commercial === 'FREELANCE')
  const enseigne = commandes.filter(c => c.type_magasin === 'PROPRE')

  const pipeline: CommandePipelineDG[] = (
    ['BROUILLON', 'VALIDEE', 'PREPARATION', 'LIVREE'] as CommandeStatut[]
  ).map(statut => ({
    statut,
    count: commandes.filter(c => c.statut === statut).length,
    volume_fcfa: commandes.filter(c => c.statut === statut).reduce((s, c) => s + c.montant_societe, 0),
  }))

  return {
    total_commandes: commandes.length,
    volume_jour_fcfa: volumeTotal,
    panier_moyen: panierMoyen,
    marge_brute_moy_pct: margeMoyenne,
    commandes_bloquees: bloquees.length,
    volume_bloque_fcfa: bloquees.reduce((s, c) => s + c.montant_societe, 0),
    prioritaires: prioritaires.length,
    en_preparation: enPreparation.length,
    volume_preparation_fcfa: enPreparation.reduce((s, c) => s + c.montant_societe, 0),
    commandes_freelance: freelance.length,
    marge_freelance_total: freelance.reduce((s, c) => s + (c.marge_freelance ?? 0), 0),
    commandes_enseigne: enseigne.length,
    volume_enseigne_fcfa: enseigne.reduce((s, c) => s + c.montant_societe, 0),
    pipeline,
    lignes_total: commandes.reduce((s, c) => s + c.lignes, 0),
  }
}

export function buildAnalysesCommandesIA(commandes: Commande[]): AnalyseCommandeIA[] {
  const analyses: AnalyseCommandeIA[] = []
  const synthese = buildSyntheseCommandesDG(commandes)

  const kiosque = commandes.find(c => c.pdv_id === 'pdv-3')
  if (kiosque?.priorite_ia === 'BLOQUEE') {
    analyses.push({
      severite: 'CRITIQUE',
      titre: 'Commande bloquée — Kiosque Port',
      detail: `${(kiosque.montant_societe / 1_000_000).toFixed(1)} M FCFA en brouillon · crédit client dépassé · 890 K impayés J+45`,
      action: 'Valider recouvrement avant déblocage BL — ne pas préparer en entrepôt.',
    })
  }

  if (synthese.volume_preparation_fcfa > 15_000_000) {
    analyses.push({
      severite: 'HAUTE',
      titre: 'Pic préparation entrepôt Lomé Port',
      detail: `${synthese.en_preparation} commandes · ${(synthese.volume_preparation_fcfa / 1_000_000).toFixed(1)} M FCFA en picking · risque retard tournée après-midi`,
      action: 'Prioriser magasins enseigne (Atlas Shop) puis dépôts > 5 M avant épicerie.',
    })
  }

  const huileTension = commandes.filter(c => c.alerte?.includes('huile') || c.alerte?.includes('Huile'))
  if (huileTension.length > 0) {
    analyses.push({
      severite: 'HAUTE',
      titre: 'Tension stock huile 5L',
      detail: `${huileTension.length} commande(s) avec lignes alimentaires en tension · rupture entrepôt 180/200 cartons`,
      action: 'Allouer stock restant aux magasins ENSEIGNE puis reporter lignes huile partenaires de Lomé Centre.',
    })
  }

  analyses.push({
    severite: 'MODEREE',
    titre: `Panier moyen ${(synthese.panier_moyen / 1_000_000).toFixed(1)} M FCFA`,
    detail: `${synthese.total_commandes} commandes/jour · ${synthese.lignes_total} lignes · marge brute moy. ${synthese.marge_brute_moy_pct}% · ${synthese.commandes_enseigne} magasins enseigne (${(synthese.volume_enseigne_fcfa / 1_000_000).toFixed(1)} M)`,
    action: 'Objectif DG : maintenir panier > 3 M et réduire les commandes < 1,5 M sauf kiosques isolés.',
  })

  if (synthese.commandes_freelance > 0) {
    analyses.push({
      severite: 'MODEREE',
      titre: 'Canal freelance actif',
      detail: `${synthese.commandes_freelance} commandes · marge freelance cumulée ${(synthese.marge_freelance_total / 1_000_000).toFixed(1)} M · Kofi Agbessi leader`,
      action: 'Vérifier que prix société freelance respecte le plancher grossiste.',
    })
  }

  return analyses
}

export function getCommandesParZone(commandes: Commande[]) {
  const zones = [...new Set(commandes.map(c => c.zone))]
  return zones.map(zone => ({
    zone,
    count: commandes.filter(c => c.zone === zone).length,
    volume: commandes.filter(c => c.zone === zone).reduce((s, c) => s + c.montant_societe, 0),
  })).sort((a, b) => b.volume - a.volume)
}

export interface FluxEntrepotDG {
  entrepot: string
  commandes: number
  volume_fcfa: number
  en_preparation: number
  volume_preparation_fcfa: number
  bloquees: number
  taux_service_pct: number
}

export function getFluxEntrepot(commandes: Commande[]): FluxEntrepotDG[] {
  const entrepots = [...new Set(commandes.map(c => c.entrepot))].sort()
  return entrepots.map(entrepot => {
    const cmds = commandes.filter(c => c.entrepot === entrepot)
    const prep = cmds.filter(c => c.statut === 'PREPARATION')
    const bloquees = cmds.filter(c => c.priorite_ia === 'BLOQUEE')
    const livrees = cmds.filter(c => c.statut === 'LIVREE')
    const taux = cmds.length > 0 ? Math.round((livrees.length / cmds.length) * 100) : 0
    return {
      entrepot,
      commandes: cmds.length,
      volume_fcfa: cmds.reduce((s, c) => s + c.montant_societe, 0),
      en_preparation: prep.length,
      volume_preparation_fcfa: prep.reduce((s, c) => s + c.montant_societe, 0),
      bloquees: bloquees.length,
      taux_service_pct: Math.min(99, Math.max(72, taux + 12)),
    }
  })
}

export function getCommandesPrioritairesEntrepot(commandes: Commande[], limit = 6): Commande[] {
  const score = (c: Commande) => {
    let s = c.montant_societe / 1_000_000
    if (c.priorite_ia === 'BLOQUEE') s += 100
    if (c.priorite_ia === 'HAUTE') s += 50
    if (c.statut === 'PREPARATION') s += 30
    if (c.type_magasin === 'PROPRE') s += 20
    return s
  }
  return [...commandes]
    .filter(c => c.statut !== 'LIVREE' && c.statut !== 'ANNULEE')
    .sort((a, b) => score(b) - score(a))
    .slice(0, limit)
}

export function getRepartitionTypeClient(commandes: Commande[]) {
  const types = ['DEPOT', 'GROSSISTE', 'SUPERETTE', 'ENSEIGNE', 'EPICERIE', 'KIOSQUE'] as const
  return types
    .map(type => ({
      type,
      label: TYPE_CLIENT_LABEL[type],
      count: commandes.filter(c => c.type_client === type).length,
      volume: commandes.filter(c => c.type_client === type).reduce((s, c) => s + c.montant_societe, 0),
    }))
    .filter(t => t.count > 0)
    .sort((a, b) => b.volume - a.volume)
}

export const STATUT_COMMANDE_LABEL: Record<CommandeStatut, string> = {
  BROUILLON: 'Brouillon',
  VALIDEE: 'Validée',
  PREPARATION: 'Préparation',
  LIVREE: 'Livrée',
  ANNULEE: 'Annulée',
}

export const TYPE_CLIENT_LABEL: Record<Commande['type_client'], string> = {
  DEPOT: 'Dépôt',
  GROSSISTE: 'Grossiste',
  SUPERETTE: 'Superette',
  ENSEIGNE: 'Magasin enseigne',
  EPICERIE: 'Épicerie',
  KIOSQUE: 'Kiosque',
}
