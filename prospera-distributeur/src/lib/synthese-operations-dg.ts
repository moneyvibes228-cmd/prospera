/**
 * Synthèse opérationnelle DG — entrepôts, canaux, familles produits.
 * Chaque axe inclut analyse IA, prévisions et scénarios (source : registres mock).
 */
import { ENTREPOTS_DISTRIBUTION } from './registries/entrepots-registry'
import { CANAUX_DISTRIBUTION, getTopCommerciauxCanal } from './registries/canaux-registry'
import { REGISTRE_STOCK } from './registries/stock-registry'
import { buildRepartitionCategories } from './mock-dg-kpis-builder'
import type {
  SyntheseSecteurIA,
  PrevisionSecteurIA,
  ScenarioSecteurIA,
  RisqueNiveauIA,
} from '@/types/rapport-ia'

function fmtM(n: number): string {
  return `${(n / 1_000_000).toFixed(1).replace('.', ',')}M FCFA`
}

function fmtK(n: number): string {
  if (n >= 1_000_000) return fmtM(n)
  return `${Math.round(n / 1000)} K FCFA`
}

function dedupeEquipe(
  membres: NonNullable<SyntheseSecteurIA['equipe']>,
): NonNullable<SyntheseSecteurIA['equipe']> {
  const seen = new Set<string>()
  return membres.filter(m => {
    if (seen.has(m.nom)) return false
    seen.add(m.nom)
    return true
  })
}

function rupturesReellesEntrepot(nom: string): number {
  return REGISTRE_STOCK.filter(p => p.entrepot === nom && p.stock < p.seuil).length
}

function buildEntrepotSyntheses(): SyntheseSecteurIA[] {
  return ENTREPOTS_DISTRIBUTION.map(e => {
    const objPct = Math.round((e.ca_mois / e.ca_objectif) * 100)
    const ruptures = rupturesReellesEntrepot(e.nom)
    const tendance: SyntheseSecteurIA['tendance'] =
      ruptures >= 2 && e.taux_service_pct < 92 ? 'ALERTE'
        : objPct >= 100 ? 'POSITIF' : 'STABLE'
    const risque: RisqueNiveauIA =
      ruptures >= 2 && e.nom === 'Lomé Port' ? 'ELEVE'
        : ruptures >= 1 ? 'MODERE' : 'FAIBLE'

    const previsions: PrevisionSecteurIA[] = e.nom === 'Lomé Port'
      ? [
          { metrique: 'Ventes sorties', valeur_actuelle: fmtM(e.ca_mois), valeur_prevue: '348M FCFA', horizon: '30j', confidence: 76, tendance: 'HAUSSE' },
          { metrique: 'Taux service', valeur_actuelle: `${e.taux_service_pct}%`, valeur_prevue: '88%', horizon: '30j', confidence: 71, tendance: 'BAISSE' },
          { metrique: 'Ruptures SKU', valeur_actuelle: String(ruptures), valeur_prevue: '0', horizon: '7j', confidence: 84, tendance: 'BAISSE' },
        ]
      : [
          { metrique: 'Ventes sorties', valeur_actuelle: fmtM(e.ca_mois), valeur_prevue: '86M FCFA', horizon: '30j', confidence: 82, tendance: 'HAUSSE' },
          { metrique: 'Taux service', valeur_actuelle: `${e.taux_service_pct}%`, valeur_prevue: '97%', horizon: '30j', confidence: 88, tendance: 'HAUSSE' },
          { metrique: 'Ruptures SKU', valeur_actuelle: String(ruptures), valeur_prevue: '0', horizon: '7j', confidence: 79, tendance: 'BAISSE' },
        ]

    const scenarios: ScenarioSecteurIA[] = e.nom === 'Lomé Port'
      ? [
          { label: 'Optimiste', impact: 'Bon huile 400 cartons · service 94% · +16M CA juillet', probabilite: 28 },
          { label: 'Central', impact: 'Rupture huile J+5 · -8% volume alimentaire · service 88%', probabilite: 54 },
          { label: 'Pessimiste', impact: '2 SKU critiques + retard livraisons Lomé Centre · -22M CA', probabilite: 18 },
        ]
      : [
          { label: 'Optimiste', impact: 'Réappro savon · Kara dépasse 90M · zéro rupture', probabilite: 35 },
          { label: 'Central', impact: 'Savon rétabli sous 10j · CA stable 80-84M', probabilite: 52 },
          { label: 'Pessimiste', impact: 'Rupture savon prolongée · perte 12 détaillants hygiène', probabilite: 13 },
        ]

    const analyse_ia = e.nom === 'Lomé Port'
      ? `L'IA détecte une tension supply sur l'alimentaire : huile 5L à 180 cartons (seuil 200), avec pic de demande prévu +22% la semaine prochaine. Sans bon de commande validé sous 48h, 34 détaillants risquent un arrêt de commande. Le taux de service à 91% masque un écart géographique — Lomé Centre tire la performance vers le bas (impayés élevés, livraisons retardées). La prévision centrale place juillet à 348M si le réappro est lancé cette semaine.`
      : `Plateforme régionale performante : taux de service 96%, encours clients maîtrisé (${fmtM(e.impayes_lies)}). Signal unique : savon ménager sous seuil (45/80 cartons) — impact limité à l'hygiène nord mais 12 détaillants Kara concernés. L'IA estime une normalisation sous 7-10 jours avec réappro programmé. Potentiel de croissance Centrale (+Sokodé) si capacité expédition portée à 5/j.`

    return {
      secteur_id: e.id,
      nom: e.nom,
      groupe: 'ENTREPOT',
      tendance,
      risque_niveau: risque,
      resume: ruptures >= 1
        ? `${ruptures} SKU sous seuil · taux service ${e.taux_service_pct}% · ${e.livraisons_jour} expéditions/j`
        : `Sorties ${objPct}% objectif · stock ${fmtM(e.valeur_stock_fcfa)} · ${e.references_stock} références`,
      analyse_ia,
      chiffres: [
        { label: 'Ventes sorties', valeur: fmtM(e.ca_mois) },
        { label: 'Expéditions/j', valeur: String(e.livraisons_jour) },
        { label: 'Ruptures SKU', valeur: String(ruptures) },
        { label: 'Taux service', valeur: `${e.taux_service_pct}%` },
      ],
      previsions,
      scenarios,
      facteurs_cles: e.nom === 'Lomé Port'
        ? ['Huile 5L critique J+5', 'Pic demande +22% semaine prochaine', 'Lomé Centre : impayés 38%']
        : ['Savon sous seuil Kara', 'Centrale en croissance', 'Encours clients faible'],
      action_prioritaire: e.nom === 'Lomé Port'
        ? 'Valider bon de commande huile 400 cartons — délai critique 48h'
        : 'Programmer réappro savon 120 cartons — priorité expédition Kara',
      equipe: dedupeEquipe([
        { nom: e.responsable, role: 'RESPONSABLE', score: e.score_operation, note: e.type === 'PRINCIPAL' ? 'Plateforme principale' : 'Hub régional' },
      ]),
    }
  })
}

function buildCanalSyntheses(): SyntheseSecteurIA[] {
  return CANAUX_DISTRIBUTION.map(c => {
    const objPct = Math.round((c.ca_mois / c.ca_objectif) * 100)
    const tendance: SyntheseSecteurIA['tendance'] =
      c.statut === 'CRITIQUE' ? 'ALERTE'
        : c.statut === 'ATTENTION' ? 'STABLE'
          : objPct >= 100 ? 'POSITIF' : 'STABLE'
    const risque: RisqueNiveauIA =
      c.id === 'can-prospection' ? 'MODERE'
        : c.couverture_pct < 75 ? 'ELEVE' : 'FAIBLE'

    const tops = getTopCommerciauxCanal(c.id).filter(com => com.nom !== c.referent)
    const equipe = dedupeEquipe([
      { nom: c.referent, role: 'RESPONSABLE', score: c.score_canal, note: c.description },
      ...tops.map(com => ({
        nom: com.nom,
        role: com.type === 'FREELANCE'
          ? 'FREELANCE' as const
          : com.zone === 'Prospection'
            ? 'PROSPECTION' as const
            : 'COMMERCIAL' as const,
        score: com.score_ia,
        note: `${com.commandes_jour} cmd/j · ${fmtK(com.ca_jour)}/jour`,
      })),
    ])

    const iaByCanal: Record<string, { analyse: string; previsions: PrevisionSecteurIA[]; scenarios: ScenarioSecteurIA[]; facteurs: string[]; action?: string }> = {
      'can-vrp-salaries': {
        analyse: `La force salariée porte 77% du CA réseau avec une couverture tournées à 82% — en dessous de l'objectif 90%. L'IA identifie un goulot sur Lomé Est (62% couverture) et Lomé Centre (71%). Komlan Tetteh surperforme (+12% vs quota) : son modèle de tournée (28 visites/j, priorisation PDV à risque churn) est réplicable. Sans plan Lomé Est, la prévision centrale plafonne le canal à 325M en juillet.`,
        previsions: [
          { metrique: 'CA canal', valeur_actuelle: fmtM(c.ca_mois), valeur_prevue: '335M FCFA', horizon: '30j', confidence: 78, tendance: 'HAUSSE' },
          { metrique: 'Couverture tournées', valeur_actuelle: `${c.couverture_pct}%`, valeur_prevue: '88%', horizon: '30j', confidence: 74, tendance: 'HAUSSE' },
          { metrique: 'Commandes/j', valeur_actuelle: String(c.commandes_jour), valeur_prevue: '108/j', horizon: '30j', confidence: 80, tendance: 'HAUSSE' },
        ],
        scenarios: [
          { label: 'Optimiste', impact: 'Plan Lomé Est lancé · couverture 90% · +17M CA', probabilite: 30 },
          { label: 'Central', impact: 'Maintien 82-85% couverture · CA +5% vs juin', probabilite: 55 },
          { label: 'Pessimiste', impact: '12 PDV non visités · -15M CA alimentaire', probabilite: 15 },
        ],
        facteurs: ['Lomé Est sous-couvert', 'Komlan Tetteh : best practice', 'Objectif quasi atteint (99%)'],
        action: 'Déployer plan Lomé Est — 12 PDV prioritaires sous 7 jours',
      },
      'can-freelance': {
        analyse: `Canal en surperformance (+13% vs objectif) avec 12 freelances actifs couvrant des zones blanches sans charge salariale. Kofi Agbessi tire la marge réseau (+18% vs M-1). L'IA signale 3 freelances sous score 70 — risque de prix client trop bas (marge < 12%). Extension possible : +4 indépendants sur Lomé Est pourrait ajouter 18M CA à 60j avec un ROI immédiat.`,
        previsions: [
          { metrique: 'CA canal', valeur_actuelle: fmtM(c.ca_mois), valeur_prevue: '74M FCFA', horizon: '30j', confidence: 81, tendance: 'HAUSSE' },
          { metrique: 'Marge freelance', valeur_actuelle: `${c.marge_pct}%`, valeur_prevue: '17,8%', horizon: '30j', confidence: 72, tendance: 'HAUSSE' },
          { metrique: 'Nouveaux détaillants', valeur_actuelle: '2/mois', valeur_prevue: '5/mois', horizon: '60j', confidence: 68, tendance: 'HAUSSE' },
        ],
        scenarios: [
          { label: 'Optimiste', impact: '+4 freelances Lomé Est · 74M → 82M CA', probabilite: 32 },
          { label: 'Central', impact: 'Croissance +8% · marge stable 16-17%', probabilite: 58 },
          { label: 'Pessimiste', impact: '3 freelances faibles · érosion marge -2 pt', probabilite: 10 },
        ],
        facteurs: ['Zones blanches Lomé Sud', 'Marge Kofi Agbessi +18%', '3 freelances à coacher'],
        action: 'Coaching grilles prix — 3 freelances score < 70',
      },
      'can-prospection': {
        analyse: `Pipeline de conversion en retard : 74% de l'objectif CA, 68% de couverture prospection. Mawuena Ahi (15/18 tournées, score 68) cumule les écarts. Boutique Nouvelle reste bloquée en prospection sans 1ère commande — signal fort de friction prix ou crédit. L'IA estime 8 conversions possibles sous 30j si visites superviseur + offre découverte (-5% 1ère commande).`,
        previsions: [
          { metrique: 'CA canal', valeur_actuelle: fmtM(c.ca_mois), valeur_prevue: '32M FCFA', horizon: '30j', confidence: 65, tendance: 'HAUSSE' },
          { metrique: 'Conversions/mois', valeur_actuelle: '3', valeur_prevue: '8', horizon: '30j', confidence: 62, tendance: 'HAUSSE' },
          { metrique: 'Couverture', valeur_actuelle: `${c.couverture_pct}%`, valeur_prevue: '78%', horizon: '30j', confidence: 70, tendance: 'HAUSSE' },
        ],
        scenarios: [
          { label: 'Optimiste', impact: '8 conversions · Boutique Nouvelle signée · 35M CA', probabilite: 22 },
          { label: 'Central', impact: '5 conversions · objectif 30M atteint', probabilite: 56 },
          { label: 'Pessimiste', impact: 'Pipeline stagnant · 22M CA · churn prospects', probabilite: 22 },
        ],
        facteurs: ['Boutique Nouvelle non convertie', 'Mawuena Ahi sous objectif', 'Offre découverte non testée'],
        action: 'Visite superviseur + offre 1ère commande Boutique Nouvelle',
      },
    }

    const ia = iaByCanal[c.id]

    return {
      secteur_id: c.id,
      nom: c.nom,
      groupe: 'CANAL',
      tendance,
      risque_niveau: risque,
      resume: tendance === 'POSITIF'
        ? `Objectif CA dépassé (${objPct}%) · ${c.commandes_jour} commandes/j · couverture ${c.couverture_pct}%`
        : `CA ${objPct}% objectif · ${c.effectif} actifs · couverture ${c.couverture_pct}%`,
      analyse_ia: ia.analyse,
      chiffres: [
        { label: 'CA canal', valeur: fmtM(c.ca_mois) },
        { label: 'Effectif', valeur: String(c.effectif) },
        { label: 'Commandes/j', valeur: String(c.commandes_jour) },
        ...(c.marge_pct ? [{ label: 'Marge freelance', valeur: `${c.marge_pct}%` }] : [{ label: 'Couverture', valeur: `${c.couverture_pct}%` }]),
      ],
      previsions: ia.previsions,
      scenarios: ia.scenarios,
      facteurs_cles: ia.facteurs,
      action_prioritaire: ia.action,
      equipe,
    }
  })
}

function buildFamilleSyntheses(): SyntheseSecteurIA[] {
  const iaByFamille: Record<string, { analyse: string; previsions: PrevisionSecteurIA[]; scenarios: ScenarioSecteurIA[]; facteurs: string[]; action?: string; risque: RisqueNiveauIA }> = {
    Boissons: {
      analyse: `Famille moteur (+12% saison attendue) : eau et soda tirent 38% du CA. Rotation rapide, stock sain sur Lomé Port (eau 2400 packs, soda 1200). L'IA projette une hausse continue juillet-août liée à la chaleur. Risque modéré : dépendance à 2 SKU pour 70% du volume boissons.`,
      previsions: [
        { metrique: 'CA famille', valeur_actuelle: '156,6M FCFA', valeur_prevue: '175M FCFA', horizon: '30j', confidence: 85, tendance: 'HAUSSE' },
        { metrique: 'Part CA réseau', valeur_actuelle: '38%', valeur_prevue: '40%', horizon: '30j', confidence: 79, tendance: 'HAUSSE' },
        { metrique: 'Ruptures', valeur_actuelle: '1', valeur_prevue: '0', horizon: '30j', confidence: 92, tendance: 'BAISSE' },
      ],
      scenarios: [
        { label: 'Optimiste', impact: 'Saison forte · +18% volume · 180M CA', probabilite: 38 },
        { label: 'Central', impact: '+12% saison · 175M CA', probabilite: 50 },
        { label: 'Pessimiste', impact: 'Concurrence promo · +5% seulement', probabilite: 12 },
      ],
      facteurs: ['Saison chaleur +12%', 'Stock eau/soda sain', '2 SKU = 70% volume'],
      risque: 'FAIBLE',
    },
    Alimentaire: {
      analyse: `Famille sous tension : huile 5L en rupture imminente (J+5), impactant 34 détaillants. Riz stable (890 sacs). L'IA anticipe une perte de 8% de volume si réappro non validé — soit ~11M FCFA de CA perdu en juillet. La demande alimentaire est élastique : les détaillants basculent vers un concurrent sous 72h de rupture.`,
      previsions: [
        { metrique: 'CA famille', valeur_actuelle: '140,1M FCFA', valeur_prevue: '128M FCFA', horizon: '30j', confidence: 68, tendance: 'BAISSE' },
        { metrique: 'Ruptures', valeur_actuelle: '2', valeur_prevue: '0', horizon: '7j', confidence: 84, tendance: 'BAISSE' },
        { metrique: 'Détaillants à risque', valeur_actuelle: '34', valeur_prevue: '6', horizon: '30j', confidence: 71, tendance: 'BAISSE' },
      ],
      scenarios: [
        { label: 'Optimiste', impact: 'Réappro huile J+3 · CA maintenu 142M', probabilite: 25 },
        { label: 'Central', impact: 'Rupture 5j · -8% volume · 128M CA', probabilite: 58 },
        { label: 'Pessimiste', impact: 'Bascule concurrent · -18% · 115M CA', probabilite: 17 },
      ],
      facteurs: ['Huile 5L critique', '34 détaillants sans réappro', 'Élasticité demande élevée'],
      action: 'Bon de commande huile 400 cartons — urgence supply chain',
      risque: 'CRITIQUE',
    },
    Hygiène: {
      analyse: `Famille stable à 18% du CA, concentrée sur Kara (savon sous seuil). Impact géographique limité mais 12 détaillants nord sans réappro savon. L'IA prévoit un retour à la normale sous 10j. Opportunité : cross-sell hygiène sur portefeuilles alimentaire Lomé Nord (+4M potentiel).`,
      previsions: [
        { metrique: 'CA famille', valeur_actuelle: '74,2M FCFA', valeur_prevue: '78M FCFA', horizon: '30j', confidence: 77, tendance: 'HAUSSE' },
        { metrique: 'Ruptures', valeur_actuelle: '1', valeur_prevue: '0', horizon: '7j', confidence: 81, tendance: 'BAISSE' },
        { metrique: 'Cross-sell potentiel', valeur_actuelle: '—', valeur_prevue: '+4M FCFA', horizon: '60j', confidence: 64, tendance: 'HAUSSE' },
      ],
      scenarios: [
        { label: 'Optimiste', impact: 'Cross-sell Lomé Nord · 82M CA', probabilite: 28 },
        { label: 'Central', impact: 'Savon rétabli · 78M CA stable', probabilite: 58 },
        { label: 'Pessimiste', impact: 'Rupture prolongée · 68M CA', probabilite: 14 },
      ],
      facteurs: ['Savon Kara sous seuil', '12 détaillants impactés', 'Cross-sell Lomé Nord possible'],
      action: 'Lancer campagne cross-sell savon sur 80 PDV Lomé Nord',
      risque: 'MODERE',
    },
  }

  return buildRepartitionCategories().slice(0, 3).map(cat => {
    const ia = iaByFamille[cat.categorie]
    const tendance: SyntheseSecteurIA['tendance'] =
      cat.ruptures >= 2 ? 'ALERTE' : cat.ca_pct >= 35 ? 'POSITIF' : 'STABLE'

    return {
      secteur_id: `fam-${cat.categorie.toLowerCase()}`,
      nom: cat.categorie,
      groupe: 'FAMILLE',
      tendance,
      risque_niveau: ia.risque,
      resume: cat.ruptures >= 2
        ? `${cat.ruptures} ruptures stock · ${cat.ca_pct}% du CA réseau · risque perte volume`
        : `${cat.ca_pct}% du CA sorties · ${fmtM(cat.ca_mois)} ce mois`,
      analyse_ia: ia.analyse,
      chiffres: [
        { label: 'Part CA', valeur: `${cat.ca_pct}%` },
        { label: 'Ventes', valeur: fmtM(cat.ca_mois) },
        { label: 'Ruptures', valeur: String(cat.ruptures) },
      ],
      previsions: ia.previsions,
      scenarios: ia.scenarios,
      facteurs_cles: ia.facteurs,
      action_prioritaire: ia.action,
    }
  })
}

export function buildSyntheseOperationsDG(): SyntheseSecteurIA[] {
  return [...buildEntrepotSyntheses(), ...buildCanalSyntheses(), ...buildFamilleSyntheses()]
}
