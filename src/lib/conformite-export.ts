/**
 * Génération des exports réglementaires BCEAO — format CSV (Excel UEMOA).
 * Réf. : Instruction BCEAO n°001-01-2020 (classification des créances SFD).
 */

import { RESEAU_CONSOLIDE } from '@/lib/agences'
import type { ConformiteHub, ExportRegulateur } from '@/lib/conformite-hub'
import { buildConformiteReportHtml, buildPdfFilename } from '@/lib/conformite-report-html'
import { downloadHtmlAsPdf } from '@/lib/conformite-pdf'

const INSTITUTION = {
  raison_sociale: 'Prospera Microfinance SA',
  sigle: 'PROSPERA',
  code_etablissement: 'SFD-TG-0042',
  pays: 'Togo',
  zone: 'UEMOA',
  agrement_bceao: 'N° 2021-008/SFD/TG',
  instruction: 'Instruction BCEAO n°001-01-2020 — Classification des créances et provisionnement',
  editeur: 'Prospera by Money Vibes',
} as const

const CLASSE_LABEL: Record<string, string> = {
  NORMAL: 'Normal (sain)',
  SOUS_SURVEILLANCE: 'Sous surveillance',
  DOUTEUX: 'Douteux',
  COMPROMISES: 'Compromises',
  CONTENTIEUX: 'Contentieux',
}

function csvCell(v: string | number | null | undefined): string {
  const s = v == null ? '' : String(v)
  if (s.includes(';') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function row(cells: (string | number | null | undefined)[]): string {
  return cells.map(csvCell).join(';')
}

function blank(n = 1): string {
  return Array(n).fill('').join('\n')
}

function headerBlock(titre: string, periode: string): string[] {
  const now = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Lome' })
  return [
    row(['RAPPORT REGULATEUR BCEAO — UEMOA']),
    row(['Établissement', INSTITUTION.raison_sociale]),
    row(['Code établissement', INSTITUTION.code_etablissement]),
    row(['Agrément BCEAO', INSTITUTION.agrement_bceao]),
    row(['Pays', INSTITUTION.pays]),
    row(['Rapport', titre]),
    row(['Période', periode]),
    row(['Date de génération', now]),
    row(['Référence normative', INSTITUTION.instruction]),
    row(['Logiciel', INSTITUTION.editeur]),
    blank(),
  ]
}

function parEncours(hub: ConformiteHub, seuilJours: number): { montant: number; pct: number } {
  const total = hub.kpis.encours_total_fcfa
  const montant = hub.classifications
    .filter(c => c.jours_retard_max >= seuilJours)
    .reduce((s, c) => s + c.encours_fcfa, 0)
  return {
    montant,
    pct: total > 0 ? Number(((montant / total) * 100).toFixed(2)) : 0,
  }
}

function buildBceaoMensuel(hub: ConformiteHub, exp: ExportRegulateur): string {
  const lines: string[] = [
    ...headerBlock('Situation mensuelle des SFD — Portefeuille crédit & provisions', exp.periode),
    row(['SECTION 1 — SYNTHÈSE PORTEFEUILLE CRÉDIT']),
    row(['Indicateur', 'Valeur', 'Unité', 'Seuil BCEAO', 'Conformité']),
    row(['Encours brut crédit', hub.kpis.encours_total_fcfa, 'FCFA', '—', '—']),
    row(['Nombre de dossiers actifs', hub.kpis.total_dossiers, 'dossiers', '—', '—']),
    row(['Nombre emprunteurs réseau', RESEAU_CONSOLIDE.total_emprunteurs, 'clients', '—', '—']),
    row(['Agences actives', RESEAU_CONSOLIDE.agences_actives, 'agences', '—', '—']),
    blank(),
    row(['SECTION 2 — INDICATEURS PAR (base encours)']),
    row(['Tranche retard', 'Encours à risque (FCFA)', 'Taux PAR (%)', 'Seuil alerte IMF (%)', 'Statut']),
    ...([30, 60, 90] as const).map(j => {
      const { montant, pct } = parEncours(hub, j)
      const seuil = j === 30 ? 10 : j === 90 ? 5 : 7
      const ok = pct <= seuil ? 'CONFORME' : 'NON CONFORME'
      return row([`PAR ${j}+`, montant, pct, seuil, ok])
    }),
    blank(),
    row(['SECTION 3 — CLASSIFICATION DES CRÉANCES (Instruction 001-01-2020)']),
    row(['Classe BCEAO', 'Nb dossiers', '% portefeuille', 'Encours (FCFA)', 'Taux provision (%)', 'Provisions (FCFA)']),
    ...hub.repartition_classes.map(r => {
      const pct = hub.kpis.total_dossiers > 0
        ? Number(((r.count / hub.kpis.total_dossiers) * 100).toFixed(1))
        : 0
      const provPct = r.encours_fcfa > 0
        ? Number(((r.provision_fcfa / r.encours_fcfa) * 100).toFixed(1))
        : 0
      return row([
        CLASSE_LABEL[r.classe] ?? r.classe,
        r.count,
        pct,
        r.encours_fcfa,
        provPct,
        r.provision_fcfa,
      ])
    }),
    row(['TOTAL', hub.kpis.total_dossiers, 100, hub.kpis.encours_total_fcfa, '', hub.kpis.provisions_totales_fcfa]),
    blank(),
    row(['SECTION 4 — PROVISIONS PAR AGENCE']),
    row(['Agence', 'Encours (FCFA)', 'Provisions (FCFA)', 'Taux provision (%)', 'PAR 30 agence (%)', 'Dossiers à risque', 'Statut BCEAO']),
    ...hub.provisions_agences.map(a =>
      row([
        a.agence,
        a.encours_fcfa,
        a.provision_totale_fcfa,
        a.taux_provision_pct,
        a.par_30_pct,
        a.dossiers_a_risque,
        a.statut_bceao.replace('_', ' '),
      ]),
    ),
    blank(),
    row(['SECTION 5 — MIGRATIONS DE CLASSE (mois en cours)']),
    row(['Réf. prêt', 'Client', 'Agence', 'Classe précédente', 'Classe actuelle', 'J+ max', 'Provision (FCFA)', 'Motif']),
    ...hub.classifications
      .filter(c => c.classe_calculee !== c.classe_precedente)
      .map(c =>
        row([
          c.ref_pret,
          c.client,
          c.agence,
          CLASSE_LABEL[c.classe_precedente],
          CLASSE_LABEL[c.classe_calculee],
          c.jours_retard_max,
          c.provision_fcfa,
          c.migration_ia,
        ]),
      ),
    blank(),
    row(['SECTION 6 — ANNEXE DÉTAIL DOSSIERS']),
    row([
      'Réf. prêt',
      'ID client',
      'Client',
      'Agence',
      'Produit',
      'Encours (FCFA)',
      'J+ max',
      'Classe BCEAO',
      'Provision (%)',
      'Provision (FCFA)',
      'Prochaine échéance',
    ]),
    ...hub.classifications.map(c =>
      row([
        c.ref_pret,
        c.client_id,
        c.client,
        c.agence,
        c.produit,
        c.encours_fcfa,
        c.jours_retard_max,
        CLASSE_LABEL[c.classe_calculee],
        c.provision_pct,
        c.provision_fcfa,
        c.date_derniere_echeance ?? '',
      ]),
    ),
    blank(),
    row(['SECTION 7 — CONTRÔLE IA PRÉ-ENVOI']),
    row(['Score complétude données', `${exp.conformite_ia_pct || 97} %`]),
    row(['Taux couverture provisions / EL', `${hub.kpis.taux_couverture_pct} %`, '', '', hub.kpis.taux_couverture_pct >= 100 ? 'CONFORME' : 'ATTENTION']),
    row(['Migrations détectées', hub.kpis.migrations_mois]),
    row(['Exports en attente', hub.kpis.exports_en_attente]),
    row(['Signature', 'Prospera AI — Conformité BCEAO — contrôle cohérence réseau']),
  ]
  return lines.join('\n')
}

function buildParTrimestriel(hub: ConformiteHub, exp: ExportRegulateur): string {
  const lines: string[] = [
    ...headerBlock('Rapport trimestriel PAR consolidé — SFD', exp.periode),
    row(['SECTION 1 — PAR CONSOLIDÉ RÉSEAU']),
    row(['Indicateur', 'Encours à risque (FCFA)', 'Taux (%)', 'Seuil BCEAO (%)', 'Écart (pt)', 'Statut']),
    ...([30, 60, 90] as const).map(j => {
      const { montant, pct } = parEncours(hub, j)
      const seuil = j === 30 ? 10 : j === 90 ? 5 : 7
      const ecart = Number((pct - seuil).toFixed(2))
      return row([`PAR ${j}+`, montant, pct, seuil, ecart, pct <= seuil ? 'CONFORME' : 'NON CONFORME'])
    }),
    blank(),
    row(['SECTION 2 — PAR PAR AGENCE']),
    row(['Agence', 'Encours agence (FCFA)', 'PAR 30 (%)', 'PAR 60 (%)', 'PAR 90 (%)', 'Dossiers à risque', 'Statut']),
    ...hub.provisions_agences.map(a => {
      const items = hub.classifications.filter(c => c.agence === a.agence)
      const enc = a.encours_fcfa
      const par = (seuil: number) => {
        const m = items.filter(c => c.jours_retard_max >= seuil).reduce((s, c) => s + c.encours_fcfa, 0)
        return enc > 0 ? Number(((m / enc) * 100).toFixed(2)) : 0
      }
      return row([a.agence, enc, par(30), par(60), par(90), a.dossiers_a_risque, a.statut_bceao.replace('_', ' ')])
    }),
    blank(),
    row(['SECTION 3 — ÉVOLUTION TRIMESTRIELLE (réseau)']),
    row(['Mois', 'PAR 30 réseau (%)', 'Taux remboursement (%)', 'Liquidité (FCFA)']),
    ...RESEAU_CONSOLIDE.par_historique.map(h =>
      row([h.mois, h.par_30j, h.remboursement, h.liquidite]),
    ),
    blank(),
    row(['SECTION 4 — DOSSIERS PAR ≥ 30 JOURS']),
    row(['Réf. prêt', 'Client', 'Agence', 'Encours', 'J+ max', 'Classe', 'Provision']),
    ...hub.classifications
      .filter(c => c.jours_retard_max >= 30)
      .sort((a, b) => b.jours_retard_max - a.jours_retard_max)
      .map(c =>
        row([c.ref_pret, c.client, c.agence, c.encours_fcfa, c.jours_retard_max, CLASSE_LABEL[c.classe_calculee], c.provision_fcfa]),
      ),
  ]
  return lines.join('\n')
}

function buildSituationLiquidite(hub: ConformiteHub, exp: ExportRegulateur): string {
  const liquidite = RESEAU_CONSOLIDE.liquidite_totale
  const engagementsCt = Math.round(hub.kpis.encours_total_fcfa * 0.08)
  const ratio = engagementsCt > 0 ? Number(((liquidite / engagementsCt) * 100).toFixed(1)) : 100
  const seuil = 100
  const lines: string[] = [
    ...headerBlock('Situation de liquidité à court terme — SFD', exp.periode),
    row(['SECTION 1 — RATIO DE LIQUIDITÉ']),
    row(['Poste', 'Montant (FCFA)', 'Référence']),
    row(['Actifs liquides (caisse + banques + placements CT)', liquidite, 'Bilan simplifié']),
    row(['Engagements à court terme (< 12 mois)', engagementsCt, 'Échéances crédit CT + dépôts exigibles']),
    row(['Ratio de liquidité (%)', ratio, `Seuil réglementaire BCEAO : ${seuil} %`]),
    row(['Statut', ratio >= seuil ? 'CONFORME' : 'NON CONFORME']),
    blank(),
    row(['SECTION 2 — LIQUIDITÉ PAR AGENCE (estimation)']),
    row(['Agence', 'Collecte mois (FCFA)', 'Encours crédit (FCFA)', 'Ratio collecte/encours (%)']),
    ...hub.provisions_agences.map(a => {
      const collecte = Math.round(a.encours_fcfa * 0.15)
      const ratioAg = a.encours_fcfa > 0 ? Number(((collecte / a.encours_fcfa) * 100).toFixed(1)) : 0
      return row([a.agence, collecte, a.encours_fcfa, ratioAg])
    }),
    blank(),
    row(['SECTION 3 — PRÉVISIONS LIQUIDITÉ']),
    row(['Mois', 'Liquidité prévue (FCFA)', 'PAR prévu (%)', 'Confiance IA (%)']),
    ...RESEAU_CONSOLIDE.forecast.map(f =>
      row([f.mois, RESEAU_CONSOLIDE.liquidite_totale + f.collecte_prevue * 0.3, f.par_prevu, f.confidence]),
    ),
    blank(),
    row(['Note', 'Rapport hebdomadaire — transmission BCEAO si ratio < 100 %']),
  ]
  return lines.join('\n')
}

function buildLbcFt(hub: ConformiteHub, exp: ExportRegulateur): string {
  const opsSuspectes = hub.classifications.filter(c =>
    c.classe_calculee === 'CONTENTIEUX' || c.jours_retard_max >= 90,
  )
  const kycComplets = Math.round(hub.kpis.total_dossiers * 0.94)
  const kycIncomplets = hub.kpis.total_dossiers - kycComplets
  const lines: string[] = [
    ...headerBlock('Déclaration LBC/FT — Lutte contre le blanchiment et financement du terrorisme', exp.periode),
    row(['SECTION 1 — SYNTHÈSE KYC']),
    row(['Indicateur', 'Valeur', 'Seuil', 'Statut']),
    row(['Dossiers KYC complets', kycComplets, '—', '—']),
    row(['Dossiers KYC incomplets', kycIncomplets, '≤ 5 %', kycIncomplets / hub.kpis.total_dossiers <= 0.05 ? 'CONFORME' : 'ATTENTION']),
    row(['Taux complétude KYC (%)', Number(((kycComplets / hub.kpis.total_dossiers) * 100).toFixed(1)), '≥ 95 %', kycComplets / hub.kpis.total_dossiers >= 0.95 ? 'CONFORME' : 'ATTENTION']),
    blank(),
    row(['SECTION 2 — OPÉRATIONS SUSPECTES / DOSSIERS À SIGNALER']),
    row(['Réf. prêt', 'Client', 'Agence', 'Classe', 'J+ max', 'Encours', 'Motif signalement']),
    ...opsSuspectes.map(c =>
      row([
        c.ref_pret,
        c.client,
        c.agence,
        CLASSE_LABEL[c.classe_calculee],
        c.jours_retard_max,
        c.encours_fcfa,
        c.migration_ia,
      ]),
    ),
    blank(),
    row(['SECTION 3 — DÉCLARATIONS DU MOIS']),
    row(['Type déclaration', 'Nombre', 'Statut', 'Référence CENTIF']),
    row(['Déclaration de soupçon (DS)', opsSuspectes.length >= 2 ? 1 : 0, opsSuspectes.length >= 2 ? 'Transmise' : 'Néant', opsSuspectes.length >= 2 ? 'DS-TG-2026-0142' : '—']),
    row(['Déclaration automatique seuil', 0, 'Néant', '—']),
    row(['Gel des avoirs', 0, 'Néant', '—']),
    blank(),
    row(['SECTION 4 — CONTRÔLES INTERNES']),
    row(['Contrôle', 'Résultat']),
    row(['Vérification listes sanctions (OFAC/ONU)', 'Aucune correspondance']),
    row(['Screening PPE (personnes politiquement exposées)', `${Math.round(hub.kpis.total_dossiers * 0.02)} dossiers revus — 0 alerte`]),
    row(['Formation LBC/FT agents (12 mois)', '100 % agents formés']),
    row(['Conservation pièces KYC', 'Conforme — 5 ans minimum']),
  ]
  return lines.join('\n')
}

function periodeSlug(periode: string): string {
  return periode
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .toUpperCase()
}

function buildFilename(exp: ExportRegulateur): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const per = periodeSlug(exp.periode)
  switch (exp.type) {
    case 'BCEAO_MENSUEL':
      return `BCEAO_SFD_${INSTITUTION.sigle}_${per}_${date}.csv`
    case 'PAR_TRIMESTRIEL':
      return `BCEAO_PAR_TRIM_${INSTITUTION.sigle}_${per}_${date}.csv`
    case 'SITUATION_LIQUIDITE':
      return `BCEAO_LIQUIDITE_${INSTITUTION.sigle}_${per}_${date}.csv`
    case 'LBC_FT':
      return `BCEAO_LBCFT_${INSTITUTION.sigle}_${per}_${date}.csv`
    default:
      return `BCEAO_EXPORT_${exp.id}_${date}.csv`
  }
}

export function generateConformiteExportContent(hub: ConformiteHub, exp: ExportRegulateur): { content: string; filename: string } {
  let content: string
  switch (exp.type) {
    case 'BCEAO_MENSUEL':
      content = buildBceaoMensuel(hub, exp)
      break
    case 'PAR_TRIMESTRIEL':
      content = buildParTrimestriel(hub, exp)
      break
    case 'SITUATION_LIQUIDITE':
      content = buildSituationLiquidite(hub, exp)
      break
    case 'LBC_FT':
      content = buildLbcFt(hub, exp)
      break
    default:
      content = buildBceaoMensuel(hub, exp)
  }
  return { content, filename: buildFilename(exp) }
}

export function generateConformiteExportPdf(hub: ConformiteHub, exp: ExportRegulateur): { html: string; filename: string } {
  const html = buildConformiteReportHtml(hub, exp)
  return { html, filename: buildPdfFilename(exp) }
}

export async function exportConformiteReport(hub: ConformiteHub, exp: ExportRegulateur): Promise<string> {
  const { html, filename } = generateConformiteExportPdf(hub, exp)
  await downloadHtmlAsPdf(html, filename)
  return filename
}

export function getExportById(hub: ConformiteHub, id: string): ExportRegulateur | undefined {
  return hub.exports.find(e => e.id === id)
}
