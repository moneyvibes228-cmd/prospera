/**
 * Rapport IA DG distributeur — langage grossiste / distribution B2B.
 * Dérivé des registres zones, PDV, stock, factures, commerciaux.
 */
import { ZONES_DISTRIBUTION, RESEAU_CONSOLIDE_DIST } from './registries/zones-registry'
import { REGISTRE_PDV } from './registries/pdv-registry'
import { buildSyntheseOperationsDG } from './synthese-operations-dg'
import type { RapportIA } from '@distributeur/types/rapport-ia'

function fmtM(n: number): string {
  return `${(n / 1_000_000).toFixed(1).replace('.', ',')}M FCFA`
}

function fmtK(n: number): string {
  if (n >= 1_000_000) return fmtM(n)
  return `${Math.round(n / 1000)} K FCFA`
}

function fmtPct(n: number): string {
  return `${n.toFixed(1).replace('.', ',')} %`
}

function caObjectifPct(): number {
  return Math.round((RESEAU_CONSOLIDE_DIST.ca_mois / RESEAU_CONSOLIDE_DIST.ca_objectif) * 100)
}

function buildSyntheseExecutive(): string {
  const r = RESEAU_CONSOLIDE_DIST
  const objPct = caObjectifPct()
  const lomeCentre = ZONES_DISTRIBUTION.find(z => z.id === 'zn-lome-centre')!
  const kiosque = REGISTRE_PDV.find(p => p.id === 'pdv-3')!
  const facturesRetard30 = 23 // réseau consolidé (hors échantillon démo)

  const p1 = `En juin 2026, le réseau grossiste enregistre ${fmtM(r.ca_mois)} de ventes sorties entrepôt, soit ${objPct} % de l'objectif mensuel (${fmtM(r.ca_objectif)}). La dynamique est tirée par l'entrepôt Kara (quota dépassé, taux service 96 %) et le canal freelance Lomé Sud (+15 % de détaillants couverts). En contrepartie, la plateforme Lomé Port sous tension : taux service 91 %, famille alimentaire en alerte — le détaillant Kiosque Port cumule ${fmtK(kiosque.creance)} de factures impayées à J+${kiosque.creance_jours}, avec risque de blocage commande à crédit.`

  const p2 = `Deux arbitrages attendus en comité de direction. Côté supply : valider le bon de commande huile 5L (400 cartons, entrepôt Lomé Port) — rupture prévue sous 5 jours sur 34 détaillants alimentaires. Côté force de vente : lancer le plan de reprise Lomé Est — 12 points de vente sans passage commercial depuis 15 jours, dont Boutique Nouvelle toujours en prospection (aucune 1ère commande).`

  const p3 = `L'organisation distribution : 2 plateformes logistiques (Lomé Port, Kara), ${r.total_commerciaux} VRP salariés et ${r.total_freelances} freelances sur 3 canaux commerciaux desservent ${r.total_pdv} détaillants. Komlan Tetteh dépasse son objectif de 12 % (meilleur vendeur terrain, score IA 91). L'IA projette ${fmtM(428_000_000)} en juillet si le plan Lomé Est démarre sous 7 jours — sinon scénario à 405 M avec ${facturesRetard30} factures clients > 30j et perte estimée de 8 % de volume sur les SKU alimentaires.`

  return [p1, p2, p3].join('\n\n')
}

function buildSynthesePiliers(): { titre: string; contenu: string }[] {
  const r = RESEAU_CONSOLIDE_DIST
  const couverture = Math.round(ZONES_DISTRIBUTION.reduce((s, z) => s + z.couverture_visites_pct, 0) / ZONES_DISTRIBUTION.length)

  return [
    {
      titre: 'Ventes terrain & prise de commande',
      contenu: `${r.commandes_jour} commandes/j (+8,5 % vs mai), panier moyen 3,2 M FCFA. Taux de couverture tournées ${couverture} % — Lomé Est (62 %) et Lomé Centre (71 %) plombent le réseau. 34 commandes sauvées par l'alerte stock IA (évite les ruptures sur le terrain). Komlan Tetteh : meilleur VRP (score 91, 28 visites/j).`,
    },
    {
      titre: 'Facturation clients & encaissements',
      contenu: `Encours clients ${fmtM(r.creances_total)}, dont ${fmtM(r.creances_retard)} de factures impayées (${Math.round((r.creances_retard / r.creances_total) * 100)} %). Taux d'encaissement 77 % (objectif DAF 85 %). Priorité : Kiosque Port — ${fmtK(890_000)}, J+45. Relances WhatsApp : 42 % de taux de réponse — l'IA recommande visite superviseur + blocage commande à crédit au-delà de 30j.`,
    },
    {
      titre: 'Stock, entrepôts & préparation',
      contenu: `${r.ruptures_stock} références sous seuil minimum. Huile 5L : 180 cartons / seuil 200 — 34 détaillants sans réappro sous 5j. Savon Kara également sous seuil. Prévision demande IA : +22 % semaine prochaine (pic consommation locale). Préparation commandes : 18 livraisons/j, délai moyen 1,4j (objectif 1,2j).`,
    },
    {
      titre: 'Réseau freelance & marges grossiste',
      contenu: `12 freelances actifs — portefeuilles séparés, prix client libre vs tarif société. Kofi Agbessi : marge jour +18 % vs M-1, 2 nouveaux détaillants signés. 3 freelances sous score 70 à coacher. Extension réseau sans charge salariale : +15 % de détaillants couverts en zones blanches. Marge brute réseau stable à 18,2 %.`,
    },
    {
      titre: 'Objectifs & prévisions juillet',
      contenu: `CA prévu ${fmtM(428_000_000)} (confiance 79 %) avec plan Lomé Est. Sans action : 405 M, hausse impayés à 48 M, 2 340 détaillants passent en statut « à risque ». Commandes prévues : 134/j. Focus catégories : boissons (+12 % saison) et alimentaire (sensible aux ruptures huile/riz).`,
    },
  ]
}

export function buildRapportIADG(): RapportIA {
  const r = RESEAU_CONSOLIDE_DIST
  const objPct = caObjectifPct()
  const lomeCentre = ZONES_DISTRIBUTION.find(z => z.id === 'zn-lome-centre')!

  return {
    date_generation: '11/06/2026 à 06:00',
    periode: 'Juin 2026 — Vue consolidée entrepôts & canaux',
    destinataire: 'Directeur Général',
    synthese_executive: buildSyntheseExecutive(),
    synthese_piliers: buildSynthesePiliers(),
    synthese_operations: buildSyntheseOperationsDG(),
    chiffres_cles: [
      { label: 'Ventes sorties', valeur: fmtM(r.ca_mois), tendance: 'HAUSSE', commentaire: `${objPct}% quota mensuel` },
      { label: 'Détaillants actifs', valeur: String(r.total_pdv), tendance: 'HAUSSE', commentaire: `${r.total_commerciaux} VRP · ${r.total_freelances} freelances` },
      { label: 'Commandes / jour', valeur: String(r.commandes_jour), tendance: 'HAUSSE', commentaire: 'Panier moy. 3,2 M FCFA' },
      { label: 'Encours impayés', valeur: fmtM(r.creances_retard), tendance: 'HAUSSE', commentaire: `${Math.round((r.creances_retard / r.creances_total) * 100)}% du poste clients` },
      { label: 'Encaissement', valeur: '77%', tendance: 'HAUSSE', commentaire: 'Obj. DAF 85%' },
      { label: 'Ruptures SKU', valeur: `${r.ruptures_stock} références`, tendance: 'HAUSSE', commentaire: 'Huile 5L · Lomé Port' },
      { label: 'Taux service', valeur: '93%', tendance: 'BAISSE', commentaire: 'Lomé Port 91% · Kara 96%' },
      { label: 'Marge brute', valeur: '18,2%', tendance: 'STABLE', commentaire: 'Tarif grossiste société' },
    ],
    points_forts: [
      'Entrepôt Kara — quota sorties dépassé, taux service 96 %, expéditions à l\'heure',
      'Komlan Tetteh (VRP) — +12 % vs objectif vendeur, 28 tournées/j, meilleur score IA terrain (91)',
      'Canal freelance — 12 actifs, CA +13 % vs objectif, +15 % détaillants couverts sans masse salariale',
      'Famille Boissons — +12 % saison attendue, stock eau/soda sain sur Lomé Port',
      'Canal VRP salariés — 318 M FCFA, 99 % de l\'objectif canal, encaissement maîtrisé sur Lomé Nord',
    ],
    points_attention: [
      { titre: 'Crédit client — Kiosque Port', detail: `${fmtK(890_000)} impayés J+45 · plafond crédit dépassé · bloquer commande à crédit + visite superviseur`, severite: 'CRITIQUE' },
      { titre: 'Supply chain — Huile 5L (Lomé Port)', detail: '180 / 200 cartons · rupture sous 5j · 34 détaillants alimentaires sans réappro · risque bascule concurrent', severite: 'CRITIQUE' },
      { titre: 'Plateforme Lomé Port — Taux service', detail: `91 % (obj. 95 %) · ${fmtPct(lomeCentre.creances_pct)} factures clients en retard sur secteur portuaire · retards préparation commandes`, severite: 'HAUTE' },
      { titre: 'Canal VRP — Couverture Lomé Est', detail: '62 % tournées · 12 détaillants sans passage depuis 15j · Boutique Nouvelle sans 1ère commande', severite: 'HAUTE' },
      { titre: 'Trésorerie grossiste — Encaissement', detail: `77 % vs objectif 85 % · ${fmtM(8_400_000)} à récupérer en juin pour tenir le BFR distributeur`, severite: 'MODEREE' },
    ],
    recommandations: [
      { priorite: 1, action: 'Recouvrement Kiosque Port — blocage crédit client + visite superviseur + mise en demeure', impact_estime: `${fmtK(890_000)} récupérables · 72 % si action sous 48h`, delai: '48h' },
      { priorite: 1, action: 'Achats & supply — bon de commande huile 5L, 400 cartons, entrepôt Lomé Port', impact_estime: 'Sécuriser 34 détaillants alimentaires · éviter -8 % volume', delai: 'Cette semaine' },
      { priorite: 2, action: 'Canal VRP — plan reprise 12 PDV Lomé Est + conversion Boutique Nouvelle (1ère commande)', impact_estime: 'Ventes sorties juillet +23 M FCFA (prévision IA)', delai: '7 jours' },
      { priorite: 2, action: 'Canal prospection — coaching Mawuena Ahi (15/18 tournées, score 68)', impact_estime: 'Couverture Lomé Est 62 % → 78 % · +5 conversions/mois', delai: '14 jours' },
      { priorite: 3, action: 'Canal freelance — revue grilles prix client des 3 indépendants score < 70', impact_estime: 'Marge réseau freelance +8 % · prix société inchangé', delai: 'Juin 2026' },
    ],
    previsions_30j: [
      { metrique: 'Ventes sorties entrepôt', valeur_actuelle: fmtM(r.ca_mois), valeur_prevue: '428M FCFA', confidence: 79 },
      { metrique: 'Encours clients impayés', valeur_actuelle: fmtM(r.creances_retard), valeur_prevue: '38M FCFA', confidence: 74 },
      { metrique: 'Commandes terrain / jour', valeur_actuelle: String(r.commandes_jour), valeur_prevue: '134/j', confidence: 81 },
      { metrique: 'Taux service plateformes', valeur_actuelle: '93%', valeur_prevue: '95%', confidence: 76 },
      { metrique: 'Marge brute grossiste', valeur_actuelle: '18,2%', valeur_prevue: '18,6%', confidence: 72 },
      { metrique: 'Expéditions / jour', valeur_actuelle: '18', valeur_prevue: '20/j', confidence: 78 },
    ],
    alertes_immediates: [
      '🚨 Crédit client — Kiosque Port : 890 K FCFA impayés J+45, plafond dépassé → risque coupure approvisionnement',
      '🚨 Supply chain — Huile 5L Lomé Port : rupture sous 5 jours, 34 détaillants alimentaires impactés',
      '⚠ Plateforme Lomé Port — taux service 91 % (obj. 95 %), retards préparation sur commandes grossiste',
      '⚠ Canal VRP — Lomé Est : 12 détaillants sans passage commercial depuis 15 jours',
      `ℹ Quota sorties ${objPct}% — entrepôt Kara et canal freelance compensent la tension Lomé Port`,
    ],
    comparaison_mois_precedent: [
      { metrique: 'Ventes sorties entrepôt', mois_precedent: '405M FCFA', mois_courant: fmtM(r.ca_mois), variation_pct: 1.7 },
      { metrique: 'Commandes terrain / jour', mois_precedent: '117', mois_courant: String(r.commandes_jour), variation_pct: 8.5 },
      { metrique: 'Encours clients impayés', mois_precedent: '41,1M FCFA', mois_courant: fmtM(r.creances_retard), variation_pct: 4.1 },
      { metrique: 'Taux service plateformes', mois_precedent: '94%', mois_courant: '93%', variation_pct: -1.0, variation_unite: 'pt' },
      { metrique: 'Encaissement grossiste', mois_precedent: '74%', mois_courant: '77%', variation_pct: 4.1, variation_unite: 'pt' },
      { metrique: 'Marge brute', mois_precedent: '18,0%', mois_courant: '18,2%', variation_pct: 1.1, variation_unite: 'pt' },
    ],
    signature_ia: 'Prospera AI v2.4 — Rapport distribution grossiste · généré 06:00 · Précision 89,7 %',
  }
}

export const RAPPORT_IA_DG = buildRapportIADG()
