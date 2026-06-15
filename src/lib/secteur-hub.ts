/** Hub analyse secteur DG — profondeur vs synthèse dashboard */

import { RESEAU_CONSOLIDE, AGENCES } from '@/lib/agences'
import { SECTEURS } from '@/lib/mockMicrofinance'
import { getSecteurBySlug, toSlug, type SecteurDetail } from '@/lib/dg-vue360'
import { formatFcfa } from '@/lib/utils'

const SEUIL_CONCENTRATION_BCEAO = 30

export interface DossierSecteurRisque {
  id: string
  client: string
  agence: string
  agent: string
  montant: number
  jours_retard: number
  sous_secteur: string
  action: string
}

export interface SecteurHub extends SecteurDetail {
  part_reseau_pct: number
  part_reseau_encours_fcfa: number
  encours_reseau_fcfa: number
  ecart_seuil_concentration_pct: number
  synthese_memo: string
  benchmark_secteurs: Array<{ nom: string; slug: string; par_pct: number; part_reseau_pct: number; encours: number }>
  repartition_produits: Array<{ produit: string; pct: number; encours: number; par_pct: number }>
  decaissements_mois: { count: number; montant_fcfa: number; plafond_recommande_pct: number; plafond_fcfa: number }
  migrations_bceao_mois: { normal_vers_surveillance: number; surveillance_vers_douteux: number; commentaire: string }
  dossiers_risque: DossierSecteurRisque[]
  scenarios_choc: Array<{ scenario: string; par_prevu_pct: number; el_prevu_fcfa: number; probabilite_pct: number }>
  decisions_dg: Array<{ priorite: 1 | 2 | 3; titre: string; detail: string; impact: string; delai: string }>
  glossaire: Array<{ terme: string; definition: string; seuil_dg?: string }>
}

function buildDossiersRisque(secteur: SecteurDetail): DossierSecteurRisque[] {
  if (secteur.nom === 'Commerce') {
    return [
      { id: 'CL-1003', client: 'Togbui Apedo', agence: 'Bè Kpota', agent: 'Edem Kpélim', montant: 1_200_000, jours_retard: 42, sous_secteur: 'Vente électronique', action: 'Contentieux à étudier' },
      { id: 'CL-1042', client: 'Komlan Attivor', agence: 'Bè Kpota', agent: 'Edem Kpélim', montant: 850_000, jours_retard: 87, sous_secteur: 'Vente vêtements', action: 'Mise en demeure J+30' },
      { id: 'CL-1088', client: 'Mawuena Boutique', agence: 'Adidogomé', agent: 'Akua Lawson', montant: 620_000, jours_retard: 35, sous_secteur: 'Vente cosmétiques', action: 'Plan apurement' },
      { id: 'CL-1029', client: 'Mensah Folly', agence: 'Lomé Centre', agent: 'Kofi Amavi', montant: 540_000, jours_retard: 35, sous_secteur: 'Vente alimentaire', action: 'Relance MoMo' },
    ]
  }
  if (secteur.nom === 'Agriculture') {
    return [
      { id: 'CL-1071', client: 'Koffi Agbé', agence: 'Kpalimé', agent: 'Ama Fiagbé', montant: 780_000, jours_retard: 52, sous_secteur: 'Élevage', action: 'Restructuration saison' },
      { id: 'CL-1055', client: 'Afi Pêcheurs', agence: 'Hédzranawoé', agent: 'Komi Atsu', montant: 540_000, jours_retard: 38, sous_secteur: 'Pêche', action: 'Visite terrain urgente' },
    ]
  }
  return secteur.sous_secteurs_detail
    .filter(ss => ss.par > 9)
    .flatMap((ss, i) => ss.dossiers_exemples
      .filter(d => d.statut === 'EN_RETARD')
      .map((d, j) => ({
        id: `CL-${secteur.slug}-${i}${j}`,
        client: d.client,
        agence: ss.top_agences[0]?.agence ?? '—',
        agent: d.agent,
        montant: d.montant,
        jours_retard: 30 + j * 10,
        sous_secteur: ss.nom,
        action: 'Suivi recouvrement',
      })))
    .slice(0, 4)
}

function buildDecisions(secteur: SecteurDetail, partReseau: number, ecartSeuil: number): SecteurHub['decisions_dg'] {
  const base: SecteurHub['decisions_dg'] = []
  if (secteur.alerte_concentration || partReseau > SEUIL_CONCENTRATION_BCEAO) {
    base.push({
      priorite: 1,
      titre: `Plafonner décaissements ${secteur.nom}`,
      detail: `${partReseau} % encours réseau (+${ecartSeuil.toFixed(1)} pt vs seuil BCEAO 30 %)`,
      impact: 'Diversification risque sectoriel',
      delai: 'Juin',
    })
  }
  if (secteur.par_30j_pct > 10) {
    base.push({
      priorite: 1,
      titre: 'Plan recouvrement sectoriel',
      detail: `PAR ${secteur.par_30j_pct} % — ${secteur.dossiers_en_retard} dossiers en retard`,
      impact: `PAR −${Math.min(2, secteur.par_30j_pct - 8).toFixed(1)} pt si exécuté`,
      delai: 'Cette semaine',
    })
  }
  if (secteur.nom === 'Commerce') {
    base.push(
      { priorite: 1, titre: 'Audit dossiers Bè Kpota — Commerce', detail: '63 % approbations Edem Kpélim sur secteur commerce', impact: 'Intégrité portefeuille', delai: '48h' },
      { priorite: 2, titre: 'Réorienter 30 % nouveaux dossiers', detail: 'Vers Artisanat et Services en juin-juillet', impact: 'Concentration −5 pt', delai: 'Juin' },
    )
  }
  if (secteur.nom === 'Agriculture') {
    base.push(
      { priorite: 2, titre: 'Provisions saison basse', detail: 'Saisonnalité SAISONNIER — élevage PAR 13,2 %', impact: 'Conformité bilan', delai: 'Avant 31/05' },
    )
  }
  if (base.length === 0) {
    base.push(
      { priorite: 3, titre: 'Capitaliser sur la performance', detail: `Secteur pilote — PAR ${secteur.par_30j_pct} %`, impact: 'Modèle renouvellement auto', delai: 'Q3' },
    )
  }
  return base.slice(0, 5)
}

function buildHub(slug: string): SecteurHub | null {
  const secteur = getSecteurBySlug(slug)
  if (!secteur) return null

  const encoursReseau = RESEAU_CONSOLIDE.encours_total
  const partReseau = Math.round((secteur.encours / encoursReseau) * 1000) / 10
  const ecartSeuil = Math.max(0, partReseau - SEUIL_CONCENTRATION_BCEAO)

  const benchmark = SECTEURS.map(s => ({
    nom: s.nom,
    slug: toSlug(s.nom),
    par_pct: s.par_30j_pct,
    part_reseau_pct: Math.round((s.encours / encoursReseau) * 1000) / 10,
    encours: s.encours,
  })).sort((a, b) => b.encours - a.encours)

  const plafondPct = secteur.alerte_concentration ? 25 : 35
  const decaissementsMois = Math.round(secteur.encours * 0.012)

  return {
    ...secteur,
    part_reseau_pct: partReseau,
    part_reseau_encours_fcfa: secteur.encours,
    encours_reseau_fcfa: encoursReseau,
    ecart_seuil_concentration_pct: ecartSeuil,
    synthese_memo: secteur.alerte_concentration
      ? `${secteur.nom} : ${partReseau} % de l'encours réseau (${formatFcfa(secteur.encours)} / ${formatFcfa(encoursReseau)}) — ${ecartSeuil > 0 ? `+${ecartSeuil.toFixed(1)} pt au-dessus du seuil BCEAO 30 %` : 'proche du seuil'}. PAR sectoriel ${secteur.par_30j_pct} % · EL ${formatFcfa(secteur.expected_loss)}. Bè Kpota concentre ${secteur.nom === 'Commerce' ? '19' : '14'} % de l'exposition sectorielle avec PAR supérieur. ${secteur.dossiers_en_retard} dossiers en retard — arbitrage décaissements requis.`
      : `${secteur.nom} : ${partReseau} % encours réseau · PAR ${secteur.par_30j_pct} % · remboursement ${secteur.taux_remboursement} %. Profil ${secteur.par_30j_pct <= 7 ? 'sain' : 'acceptable'}. Saisonnalité ${secteur.saisonalite.toLowerCase()} — ${secteur.saisonalite === 'SAISONNIER' ? 'provisions renforcées recommandées en basse saison' : 'flux prévisibles pour renouvellements'}.`,
    benchmark_secteurs: benchmark,
    repartition_produits: [
      { produit: 'Crédit individuel', pct: secteur.nom === 'Commerce' ? 58 : 62, encours: Math.round(secteur.encours * 0.6), par_pct: secteur.par_30j_pct + 0.4 },
      { produit: 'Crédit groupe', pct: 28, encours: Math.round(secteur.encours * 0.28), par_pct: secteur.par_30j_pct - 0.8 },
      { produit: 'Tontine / épargne', pct: 14, encours: Math.round(secteur.encours * 0.12), par_pct: Math.max(3, secteur.par_30j_pct - 2.5) },
    ],
    decaissements_mois: {
      count: Math.max(1, Math.round(secteur.nb_dossiers * 0.04)),
      montant_fcfa: decaissementsMois,
      plafond_recommande_pct: plafondPct,
      plafond_fcfa: Math.round(encoursReseau * (plafondPct / 100) * (partReseau / 100)),
    },
    migrations_bceao_mois: {
      normal_vers_surveillance: secteur.nom === 'Commerce' ? 8 : secteur.par_30j_pct > 10 ? 5 : 2,
      surveillance_vers_douteux: secteur.nom === 'Commerce' ? 3 : secteur.par_30j_pct > 10 ? 2 : 0,
      commentaire: secteur.nom === 'Commerce'
        ? '8 migrations NORMAL → SOUS_SURVEILLANCE ce mois (secteur Commerce, surtout Adidogomé et Bè Kpota)'
        : `${secteur.par_30j_pct > 10 ? 'Migrations en hausse — surveillance comité crédit' : 'Stabilité classification — peu de migrations'}`,
    },
    dossiers_risque: buildDossiersRisque(secteur),
    scenarios_choc: [
      {
        scenario: 'Choc conjoncture local (−15 % CA clients)',
        par_prevu_pct: Math.min(15, secteur.par_30j_pct + 2.8),
        el_prevu_fcfa: Math.round(secteur.expected_loss * 1.35),
        probabilite_pct: secteur.alerte_concentration ? 28 : 18,
      },
      {
        scenario: 'Exécution plan diversification (P1)',
        par_prevu_pct: Math.max(4, secteur.par_30j_pct - 1.2),
        el_prevu_fcfa: Math.round(secteur.expected_loss * 0.88),
        probabilite_pct: 62,
      },
      {
        scenario: 'Statu quo — tendance actuelle',
        par_prevu_pct: secteur.par_30j_pct + (secteur.croissance_mensuelle_pct > 0 ? 0.4 : -0.2),
        el_prevu_fcfa: secteur.expected_loss,
        probabilite_pct: 74,
      },
    ],
    decisions_dg: buildDecisions(secteur, partReseau, ecartSeuil),
    glossaire: [
      { terme: 'Concentration sectorielle', definition: 'Part d\'un secteur d\'activité dans l\'encours total du réseau.', seuil_dg: 'Seuil BCEAO vigilance : 30 %. Action DG si > 30 % pendant 2 trimestres.' },
      { terme: 'Expected Loss sectoriel', definition: 'Perte probable agrégée des dossiers du secteur (modèle CBI v5).', seuil_dg: 'Provisions sectorielles ≥ EL — sinon gap à combler.' },
      { terme: 'Saisonnalité', definition: 'Variation prévisible des flux de trésorerie selon le cycle d\'activité.', seuil_dg: 'Secteurs SAISONNIER : provisions +20 % en basse saison.' },
      { terme: 'Plafond décaissement', definition: 'Limite de volume mensuel de nouveaux crédits par secteur pour diversifier le risque.', seuil_dg: 'Secteur en alerte : max 25 % du flux mensuel réseau.' },
    ],
  }
}

const _cache = new Map<string, SecteurHub>()

export function getSecteurHub(slug: string): SecteurHub | null {
  if (!_cache.has(slug)) {
    const hub = buildHub(slug)
    if (hub) _cache.set(slug, hub)
    else return null
  }
  return _cache.get(slug)!
}

export { SEUIL_CONCENTRATION_BCEAO, AGENCES }
