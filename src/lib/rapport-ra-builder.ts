/**
 * Rapport IA Responsable d'Agence — synthèse opérationnelle par site.
 */
import { AGENCES, AGENCES_DATA, type AgenceDetaillee } from './agences'
import { getMoisCourant, variationMoM } from './mock-time-series'
import { buildComparaisonMoMRapport, getAgenceComparaisonMoM, getTresorerieAgence } from './ra-agence-metrics'
import { REGISTRE_DOSSIERS_BLOQUES } from './mock-risque-registry'
import type { RapportIA } from '@/types/rapport-ia'

function fmtM(n: number): string {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2).replace('.', ',')}M` : `${Math.round(n / 1000)}k`
}

function fmtPct(n: number): string {
  return `${n.toFixed(1).replace('.', ',')}%`
}

function fmtFcfa(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n).replace(/\s/g, ' ') + ' FCFA'
}

function collectePctAgence(agenceId: string): number {
  const ag = AGENCES.find(a => a.id === agenceId)!
  return Math.round((ag.collecte_mois / ag.collecte_objectif) * 100)
}

function buildSyntheseExecutive(
  agenceId: string,
  ag: (typeof AGENCES)[0],
  detail: AgenceDetaillee,
  collectePct: number,
  encoursVar: number,
): string {
  const m = getMoisCourant()
  const ecartCollecte = ag.collecte_objectif - ag.collecte_mois
  const parDelta = detail.par_historique.length >= 2
    ? detail.par_historique[detail.par_historique.length - 1].par_30j -
      detail.par_historique[detail.par_historique.length - 2].par_30j
    : 0
  const mensah = detail.agents_performance.find(a => a.agent === 'Mensah Kodjo')
  const retard30 = detail.portefeuille_aging.find(t => t.tranche === '1-30j')

  const p1 =
    `En mai 2026, ${ag.nom_court} consolide sa position de référence réseau : encours ${fmtM(ag.encours_fcfa)} (${encoursVar > 0 ? '+' : ''}${encoursVar}% vs avril), ` +
    `${ag.emprunteurs_actifs} dossiers actifs et un score santé de ${detail.kpis.score_sante}/100. Le PAR 30 est à ${fmtPct(ag.par_courant)} ` +
    `(${parDelta < 0 ? 'en baisse' : 'stable'} de ${Math.abs(parDelta).toFixed(1)} pt vs avril), soit ${ag.par_courant < m.par_30 ? 'sous' : 'au-dessus de'} la moyenne réseau (${fmtPct(m.par_30)}). ` +
    `Statut prudentiel BCEAO : ${detail.conformite_bceao.statut === 'CONFORME' ? 'conforme' : detail.conformite_bceao.statut.toLowerCase()} — prochain rapport ${detail.conformite_bceao.prochain_rapport}.`

  const p2 =
    `La collecte mensuelle atteint ${collectePct}% de l'objectif (${fmtM(ag.collecte_mois)} / ${fmtM(ag.collecte_objectif)}), ` +
    `${ecartCollecte > 0 ? `soit ${fmtM(ecartCollecte)} à rattraper sur 9 jours ouvrés` : 'objectif déjà sécurisé'}. ` +
    `Le remboursement global reste solide à ${fmtPct(ag.taux_remboursement)}%, mais l'écart interne est marqué : ` +
    `${mensah ? `Mensah Kodjo n'atteint que ${mensah.recouvrement}% de recouvrement (PAR agent ${fmtPct(mensah.par)})` : 'un commercial est en décrochage recouvrement'} ` +
    `contre ${fmtPct(detail.agents_performance.find(a => a.role?.includes('Commercial') && a.recouvrement > 85)?.recouvrement ?? 91)}% pour le meilleur commercial. ` +
    `Priorité semaine : ${ecartCollecte > 300_000 ? 'boucler la collecte' : 'maintenir le rythme'}, débloquer le pipeline crédit et préparer les 7 renouvellements automatiques (${fmtM(3_500_000)} d'encours éligible).`

  const p3 =
    `Trajectoire PAR juin visée à ${fmtPct(detail.forecast[0]?.par_prevu ?? ag.par_courant - 0.5)} (confiance ${detail.forecast[0]?.confidence ?? 87} %) pour rester sous le seuil interne de 8 % avant clôture mai.` +
    (retard30
      ? ` Suivi prioritaire : ${retard30.count} dossiers en retard 1-30j (${fmtM(retard30.montant)}).`
      : '')

  return `${p1}\n\n${p2}\n\n${p3}`
}

function buildPiliers(
  agenceId: string,
  ag: (typeof AGENCES)[0],
  detail: AgenceDetaillee,
  collectePct: number,
): NonNullable<RapportIA['synthese_piliers']> {
  const m = getMoisCourant()
  const bloques = REGISTRE_DOSSIERS_BLOQUES.filter(d => d.agence === ag.nom_court)
  const retard30 = detail.portefeuille_aging.find(t => t.tranche === '1-30j')
  const mensah = detail.agents_performance.find(a => a.agent === 'Mensah Kodjo')
  const topCommercial = [...detail.agents_performance]
    .filter(a => !a.role?.toLowerCase().includes('resp'))
    .sort((a, b) => b.collecte - a.collecte)[0]
  const treso = getTresorerieAgence(agenceId)
  const cashDispo = treso.liquidite_disponible
  const cashLabel =
    treso.ratio_couverture_pct >= 600 ? 'excédent confortable' : treso.ratio_couverture_pct >= 240 ? 'NORMAL' : 'TENSION'

  return [
    {
      titre: 'Portefeuille & encours',
      contenu:
        `${ag.emprunteurs_actifs} emprunteurs actifs pour ${fmtM(ag.encours_fcfa)} d'encours — répartition : ` +
        `${detail.repartition_produits.map(p => `${p.produit} ${p.count} dossiers (${fmtPct(p.par)} PAR)`).join(' · ')}. ` +
        `Vieillissement sain : ${detail.portefeuille_aging.find(t => t.tranche === 'Courant')?.count ?? 0} dossiers courants (${fmtM(detail.portefeuille_aging.find(t => t.tranche === 'Courant')?.montant ?? 0)}). ` +
        `→ Valider les 7 renouvellements IA (${fmtM(3_500_000)}) avant fin de semaine pour sécuriser la marge.`,
    },
    {
      titre: 'Risque & PAR',
      contenu:
        `PAR 30 agence ${fmtPct(ag.par_courant)} vs réseau ${fmtPct(m.par_30)} (seuil BCEAO 10%). ` +
        `${retard30 ? `${retard30.count} dossiers en 1-30j (${fmtM(retard30.montant)}) — focus recouvrement terrain` : 'Aucun retard significatif'}. ` +
        `Prévision IA juin : ${fmtPct(detail.forecast[0]?.par_prevu ?? 6.2)} (${detail.forecast[0]?.confidence ?? 87}% confiance). ` +
        `→ Plan de recouvrement ciblé sur les dossiers > 15 j et coaching ${mensah?.agent ?? 'agent dégradé'} (PAR ${mensah ? fmtPct(mensah.par) : '—'}).`,
    },
    {
      titre: 'Commercial & collecte',
      contenu:
        `Collecte ${fmtM(ag.collecte_mois)} = ${collectePct}% de l'objectif (${fmtM(ag.collecte_objectif)}). ` +
        `${topCommercial ? `Meilleur flux : ${topCommercial.agent} (${fmtM(topCommercial.collecte)}, score ${topCommercial.score}/100)` : ''}. ` +
        `${ag.nouveaux_clients_mois} nouveaux clients ce mois · conversion leads ${detail.kpis.taux_conversion_leads}%. ` +
        `→ Objectif 9 jours : ${fmtM(Math.max(0, ag.collecte_objectif - ag.collecte_mois))} via relances groupées + tournée commercants 1-30j.`,
    },
    {
      titre: 'Trésorerie & caisse',
      contenu:
        `Liquidité disponible ${fmtM(cashDispo)} — ${cashLabel}. ` +
        `Entrées journalières estimées ${fmtM(Math.round(ag.collecte_mois / 22))} · décaissements maîtrisés (${detail.kpis.decaissements_mois} dossiers, ${fmtM(detail.kpis.montant_decaisse)}). ` +
        `Réserve obligatoire couverte (${fmtM(detail.kpis.reserv_obligatoire)}). ` +
        `→ Maintenir le plafond de décaissement quotidien ; pas de transfert siège requis ce mois.`,
    },
    {
      titre: 'Pipeline crédit',
      contenu:
        `${bloques.length} dossier(s) bloqué(s) sur l'agence (${bloques.map(b => `${b.client} ${fmtM(b.montant)} — ${b.etape}`).join(' · ') || 'aucun'}). ` +
        `${m.en_attente} demandes en attente au niveau réseau — dont validation ROC/DEC. ` +
        `${m.approuves} approbations et ${m.refuses} rejets sur le mois consolidé. ` +
        `→ Traiter en priorité ${bloques[0]?.id ?? 'DOS-2026-0228'} (${bloques[0]?.bloque_depuis_h ?? 48}h de blocage) et ${bloques[1]?.id ?? 'le 2e dossier'} avant nouveaux décaissements.`,
    },
  ]
}

/** Rapport IA RA — contenu enrichi (Lomé Centre par défaut) */
export function buildRapportIARa(agenceId = 'AG-001'): RapportIA {
  const ag = AGENCES.find(a => a.id === agenceId)!
  const detail = AGENCES_DATA[agenceId]
  if (!detail) {
    return {
      date_generation: '27/05/2026 à 07:00',
      periode: `Mai 2026 — Agence ${ag.nom_court}`,
      destinataire: "Responsable d'Agence",
      synthese_executive: `Données agence ${ag.nom_court} indisponibles.`,
      chiffres_cles: [],
      signature_ia: 'Prospera AI · RA',
    }
  }

  const m = getMoisCourant()
  const collectePct = collectePctAgence(agenceId)
  const comparaison = getAgenceComparaisonMoM(agenceId)
  const encoursVar = comparaison.encours.variation_pct
  const bloques = REGISTRE_DOSSIERS_BLOQUES.filter(d => d.agence === ag.nom_court)
  const treso = getTresorerieAgence(agenceId)
  const parHist = detail.par_historique
  const parTendance = parHist.length >= 2 && parHist[parHist.length - 1].par_30j < parHist[parHist.length - 2].par_30j ? 'BAISSE' : 'STABLE'

  return {
    date_generation: "aujourd'hui 07:00",
    periode: `Mai 2026 — Agence ${ag.nom_court}`,
    destinataire: `${ag.responsable} · Responsable d'Agence`,
    synthese_executive: buildSyntheseExecutive(agenceId, ag, detail, collectePct, encoursVar),
    chiffres_cles: [
      {
        label: 'Score santé agence',
        valeur: `${detail.kpis.score_sante}/100`,
        tendance: detail.kpis.score_sante >= 85 ? 'HAUSSE' : 'STABLE',
        commentaire: `2e du réseau · BCEAO ${detail.conformite_bceao.statut}`,
      },
      {
        label: 'Encours',
        valeur: fmtM(ag.encours_fcfa),
        tendance: encoursVar >= 0 ? 'HAUSSE' : 'BAISSE',
        commentaire: `${ag.emprunteurs_actifs} dossiers · ${encoursVar > 0 ? '+' : ''}${encoursVar}% M-1`,
      },
      {
        label: 'PAR 30',
        valeur: fmtPct(ag.par_courant),
        tendance: parTendance,
        commentaire: `Réseau ${fmtPct(m.par_30)} · seuil 10%`,
      },
      {
        label: 'Collecte mois',
        valeur: `${collectePct}%`,
        tendance: collectePct >= 90 ? 'HAUSSE' : 'BAISSE',
        commentaire: `Écart ${fmtM(Math.max(0, ag.collecte_objectif - ag.collecte_mois))}`,
      },
      {
        label: 'Remboursement',
        valeur: fmtPct(ag.taux_remboursement),
        tendance: 'HAUSSE',
        commentaire: `Impayés ~${fmtM(detail.kpis.encours * (detail.kpis.par_30j / 100) * 0.35)}`,
      },
      {
        label: 'Liquidité agence',
        valeur: fmtM(treso.liquidite_disponible),
        tendance: 'STABLE',
        commentaire: `Caisse phys. ${fmtM(treso.caisse_physique_fcfa)} · couv. ${treso.ratio_couverture_pct}%`,
      },
    ],
    synthese_piliers: buildPiliers(agenceId, ag, detail, collectePct),
    points_forts: [
      ...detail.ia_insights.filter(i => i.type === 'OPPORTUNITE').map(i => i.detail),
      `PAR en amélioration continue depuis janvier (${fmtPct(parHist[0]?.par_30j ?? 9.2)} → ${fmtPct(ag.par_courant)})`,
      `${detail.conformite_bceao.items.filter(i => i.ok).length}/${detail.conformite_bceao.items.length} contrôles BCEAO OK sur le site`,
    ],
    points_attention: [
      ...detail.alertes.map(a => ({
        titre: a.type,
        detail: a.detail,
        severite: (a.urgence === 'HAUTE' ? 'HAUTE' : a.urgence === 'CRITIQUE' ? 'CRITIQUE' : 'MODEREE') as 'CRITIQUE' | 'HAUTE' | 'MODEREE',
      })),
      ...(bloques.length > 0
        ? [{
            titre: 'Pipeline bloqué',
            detail: `${bloques.length} dossier(s) — ${bloques.map(b => b.client).join(', ')}`,
            severite: 'HAUTE' as const,
          }]
        : []),
    ],
    recommandations: [
      {
        priorite: 1,
        action: detail.alertes[0]?.action ?? 'Lancer propositions renouvellement IA (7 clients)',
        impact_estime: `+${fmtM(3_500_000)} encours sécurisé`,
        delai: '48 h',
      },
      {
        priorite: 1,
        action: `Coaching recouvrement Mensah Kodjo — plan 5 dossiers 1-30j`,
        impact_estime: 'PAR agent −2 pts visé',
        delai: 'Cette semaine',
      },
      {
        priorite: 2,
        action: detail.alertes.find(a => a.type.includes('collecte'))?.action ?? `Rattraper ${fmtM(ag.collecte_objectif - ag.collecte_mois)} de collecte`,
        impact_estime: `Objectif ${collectePct}% → 100%`,
        delai: '9 jours ouvrés',
      },
      {
        priorite: 2,
        action: `Débloquer ${bloques.map(b => b.id).join(' + ') || 'pipeline ROC'}`,
        impact_estime: fmtFcfa(bloques.reduce((s, b) => s + b.montant, 0)),
        delai: '72 h max',
      },
      {
        priorite: 3,
        action: 'Point équipe vendredi — partage bonnes pratiques Yawo Adjavon / Mawunya Kpodzo',
        impact_estime: 'Homogénéiser performance commerciaux',
        delai: 'Vendredi 10h',
      },
    ],
    previsions_30j: [
      {
        metrique: 'PAR 30 agence',
        valeur_actuelle: fmtPct(ag.par_courant),
        valeur_prevue: fmtPct(detail.forecast[0]?.par_prevu ?? 6.2),
        confidence: detail.forecast[0]?.confidence ?? 87,
      },
      {
        metrique: 'Collecte hebdo',
        valeur_actuelle: fmtM(Math.round(ag.collecte_mois / 4)),
        valeur_prevue: fmtM(Math.round(ag.collecte_objectif / 4)),
        confidence: 82,
      },
      {
        metrique: 'Score santé',
        valeur_actuelle: `${detail.kpis.score_sante}/100`,
        valeur_prevue: `${Math.min(95, detail.kpis.score_sante + 2)}/100`,
        confidence: 78,
      },
    ],
    alertes_immediates: [
      ...detail.alertes.map(a => `⚠ ${a.type} — ${a.detail}`),
      ...bloques.map(b => `⏳ ${b.client} bloqué ${b.bloque_depuis_h}h (${b.etape})`),
      `ℹ ${detail.ia_insights[0]?.titre ?? 'Prévision PAR favorable juin'}`,
    ],
    comparaison_mois_precedent: buildComparaisonMoMRapport(agenceId),
    signature_ia: 'Prospera AI v2.4 · Pilotage agence',
  }
}
