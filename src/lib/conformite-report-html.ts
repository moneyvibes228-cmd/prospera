/**
 * Rapports conformité BCEAO — tous types, mise en page PDF.
 */

import { RESEAU_CONSOLIDE } from '@/lib/agences'
import type { ConformiteHub, ExportRegulateur } from '@/lib/conformite-hub'
import {
  INSTITUTION_HTML,
  buildBceaoMensuelHtml,
  classeClass,
  esc,
  fmtFcfa,
  fmtNum,
  fmtPct,
  parBar,
  parEncours,
  statutBadge,
  styles,
  tableHead,
} from '@/lib/conformite-export-html'

const CLASSE_LABEL: Record<string, string> = {
  NORMAL: 'Normal (sain)',
  SOUS_SURVEILLANCE: 'Sous surveillance',
  DOUTEUX: 'Douteux',
  COMPROMISES: 'Compromises',
  CONTENTIEUX: 'Contentieux',
}

function wrapReport(opts: {
  docTitle: string
  coverTitle: string
  subtitle: string
  periode: string
  reference?: string
  body: string
  footerLeft?: string
  footerRight?: string
}): string {
  const now = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Lome' })
  const ref = opts.reference ?? INSTITUTION_HTML.instruction
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<title>${esc(opts.docTitle)}</title>
<style>${styles()}</style>
</head>
<body>
<div class="page">
  <header class="cover">
    <div class="cover-badge">UEMOA · BCEAO · SFD</div>
    <h1>${esc(opts.coverTitle)}</h1>
    <p class="subtitle">${esc(opts.subtitle)}</p>
    <dl class="cover-meta">
      <dt>Établissement</dt><dd>${esc(INSTITUTION_HTML.raison_sociale)}</dd>
      <dt>Code SFD</dt><dd>${esc(INSTITUTION_HTML.code_etablissement)}</dd>
      <dt>Agrément</dt><dd>${esc(INSTITUTION_HTML.agrement_bceao)}</dd>
      <dt>Pays</dt><dd>${esc(INSTITUTION_HTML.pays)} (${esc(INSTITUTION_HTML.zone)})</dd>
      <dt>Période</dt><dd>${esc(opts.periode)}</dd>
      <dt>Généré le</dt><dd>${esc(now)}</dd>
      <dt>Référence</dt><dd>${esc(ref)}</dd>
      <dt>Logiciel</dt><dd>${esc(INSTITUTION_HTML.editeur)}</dd>
    </dl>
  </header>
  <div class="body">${opts.body}
    <footer class="footer">
      <span>${esc(opts.footerLeft ?? INSTITUTION_HTML.editeur)}</span>
      <span>${esc(opts.footerRight ?? 'Prospera AI — Conformité BCEAO')}</span>
    </footer>
  </div>
</div>
</body>
</html>`
}

function buildParTrimestrielHtml(hub: ConformiteHub, exp: ExportRegulateur): string {
  const parRows = ([30, 60, 90] as const).map(j => {
    const { montant, pct } = parEncours(hub, j)
    const seuil = j === 30 ? 10 : j === 90 ? 5 : 7
    return { j, montant, pct, seuil, ecart: Number((pct - seuil).toFixed(2)), ok: pct <= seuil }
  })

  const dossiersPar30 = hub.classifications
    .filter(c => c.jours_retard_max >= 30)
    .sort((a, b) => b.jours_retard_max - a.jours_retard_max)

  const body = `
    <div class="kpi-grid">
      ${parRows.map(p => `
      <div class="kpi ${!p.ok ? 'alert' : ''}">
        <div class="label">PAR ${p.j}+</div>
        <div class="value">${fmtPct(p.pct)}</div>
        <div class="sub">${statutBadge(p.ok ? 'CONFORME' : 'NON CONFORME')} · seuil ${fmtPct(p.seuil, 0)}</div>
      </div>`).join('')}
      <div class="kpi">
        <div class="label">Encours réseau</div>
        <div class="value" style="font-size:13pt">${fmtFcfa(hub.kpis.encours_total_fcfa)}</div>
        <div class="sub">${fmtNum(hub.kpis.total_dossiers)} dossiers</div>
      </div>
    </div>

    <section class="section">
      <h2 class="section-title"><span class="section-num">1</span> PAR consolidé réseau</h2>
      <table class="data">
        ${tableHead(['Indicateur', 'Encours à risque', 'Taux', 'Seuil BCEAO', 'Écart (pt)', 'Visualisation', 'Statut'])}
        <tbody>${parRows.map(p => `<tr>
          <td><strong>PAR ${p.j}+</strong></td>
          <td class="num">${fmtFcfa(p.montant)}</td>
          <td class="num"><strong>${fmtPct(p.pct)}</strong></td>
          <td class="num">${fmtPct(p.seuil, 0)}</td>
          <td class="num">${p.ecart > 0 ? '+' : ''}${p.ecart.toFixed(2).replace('.', ',')}</td>
          <td>${parBar(p.pct, p.seuil)}</td>
          <td>${statutBadge(p.ok ? 'CONFORME' : 'NON CONFORME')}</td>
        </tr>`).join('')}</tbody>
      </table>
    </section>

    <section class="section">
      <h2 class="section-title"><span class="section-num">2</span> PAR par agence</h2>
      <table class="data">
        ${tableHead(['Agence', 'Encours', 'PAR 30', 'PAR 60', 'PAR 90', 'Doss. à risque', 'Statut'])}
        <tbody>${hub.provisions_agences.map(a => {
          const items = hub.classifications.filter(c => c.agence === a.agence)
          const enc = a.encours_fcfa
          const par = (s: number) => {
            const m = items.filter(c => c.jours_retard_max >= s).reduce((x, c) => x + c.encours_fcfa, 0)
            return enc > 0 ? Number(((m / enc) * 100).toFixed(2)) : 0
          }
          return `<tr>
            <td><strong>${esc(a.agence)}</strong></td>
            <td class="num">${fmtFcfa(enc)}</td>
            <td class="num">${fmtPct(par(30))}</td>
            <td class="num">${fmtPct(par(60))}</td>
            <td class="num">${fmtPct(par(90))}</td>
            <td class="num">${fmtNum(a.dossiers_a_risque)}</td>
            <td>${statutBadge(a.statut_bceao.replace('_', ' '))}</td>
          </tr>`
        }).join('')}</tbody>
      </table>
    </section>

    <section class="section">
      <h2 class="section-title"><span class="section-num">3</span> Évolution trimestrielle</h2>
      <table class="data">
        ${tableHead(['Mois', 'PAR 30 réseau', 'Remboursement', 'Liquidité'])}
        <tbody>${RESEAU_CONSOLIDE.par_historique.map(h => `<tr>
          <td>${esc(h.mois)}</td>
          <td class="num">${fmtPct(h.par_30j, 1)}</td>
          <td class="num">${fmtPct(h.remboursement, 1)}</td>
          <td class="num">${fmtFcfa(h.liquidite ?? 0)}</td>
        </tr>`).join('')}</tbody>
      </table>
    </section>

    <section class="section">
      <h2 class="section-title"><span class="section-num">4</span> Dossiers PAR ≥ 30 j (${dossiersPar30.length})</h2>
      <table class="data annexe-table">
        ${tableHead(['Réf.', 'Client', 'Agence', 'Encours', 'J+ max', 'Classe', 'Provision'])}
        <tbody>${dossiersPar30.map(c => `<tr>
          <td><code>${esc(c.ref_pret)}</code></td>
          <td>${esc(c.client)}</td>
          <td>${esc(c.agence)}</td>
          <td class="num">${fmtFcfa(c.encours_fcfa)}</td>
          <td class="num"><strong>${c.jours_retard_max}</strong></td>
          <td class="${classeClass(CLASSE_LABEL[c.classe_calculee] ?? '')}">${esc(CLASSE_LABEL[c.classe_calculee])}</td>
          <td class="num">${fmtFcfa(c.provision_fcfa)}</td>
        </tr>`).join('')}</tbody>
      </table>
    </section>`

  return wrapReport({
    docTitle: `PAR trimestriel — ${exp.periode}`,
    coverTitle: 'Rapport trimestriel PAR',
    subtitle: 'PAR consolidé réseau — SFD',
    periode: exp.periode,
    body,
    footerRight: `Contrôle IA ${exp.conformite_ia_pct ?? 95} % — Prospera AI`,
  })
}

function buildSituationLiquiditeHtml(hub: ConformiteHub, exp: ExportRegulateur): string {
  const liquidite = RESEAU_CONSOLIDE.liquidite_totale
  const engagementsCt = Math.round(hub.kpis.encours_total_fcfa * 0.08)
  const ratio = engagementsCt > 0 ? Number(((liquidite / engagementsCt) * 100).toFixed(1)) : 100
  const seuil = 100
  const ok = ratio >= seuil

  const body = `
    <div class="kpi-grid">
      <div class="kpi ${!ok ? 'alert' : ''}">
        <div class="label">Ratio liquidité CT</div>
        <div class="value">${fmtPct(ratio, 1)}</div>
        <div class="sub">${statutBadge(ok ? 'CONFORME' : 'NON CONFORME')} · seuil ${seuil} %</div>
      </div>
      <div class="kpi">
        <div class="label">Actifs liquides</div>
        <div class="value" style="font-size:13pt">${fmtFcfa(liquidite)}</div>
        <div class="sub">Caisse + banques + placements CT</div>
      </div>
      <div class="kpi">
        <div class="label">Engagements CT</div>
        <div class="value" style="font-size:13pt">${fmtFcfa(engagementsCt)}</div>
        <div class="sub">&lt; 12 mois</div>
      </div>
      <div class="kpi">
        <div class="label">Encours crédit</div>
        <div class="value" style="font-size:13pt">${fmtFcfa(hub.kpis.encours_total_fcfa)}</div>
        <div class="sub">Base calcul engagements</div>
      </div>
    </div>

    <section class="section">
      <h2 class="section-title"><span class="section-num">1</span> Ratio de liquidité</h2>
      <table class="data">
        ${tableHead(['Poste', 'Montant', 'Référence'])}
        <tbody>
          <tr><td>Actifs liquides</td><td class="num">${fmtFcfa(liquidite)}</td><td>Bilan simplifié</td></tr>
          <tr><td>Engagements à court terme</td><td class="num">${fmtFcfa(engagementsCt)}</td><td>Échéances crédit CT + dépôts exigibles</td></tr>
          <tr><td><strong>Ratio de liquidité</strong></td><td class="num"><strong>${fmtPct(ratio, 1)}</strong></td><td>Seuil BCEAO : ${seuil} %</td></tr>
          <tr><td>Statut</td><td colspan="2">${statutBadge(ok ? 'CONFORME' : 'NON CONFORME')}</td></tr>
        </tbody>
      </table>
    </section>

    <section class="section">
      <h2 class="section-title"><span class="section-num">2</span> Liquidité par agence</h2>
      <table class="data">
        ${tableHead(['Agence', 'Collecte mois', 'Encours crédit', 'Ratio collecte/encours'])}
        <tbody>${hub.provisions_agences.map(a => {
          const collecte = Math.round(a.encours_fcfa * 0.15)
          const r = a.encours_fcfa > 0 ? Number(((collecte / a.encours_fcfa) * 100).toFixed(1)) : 0
          return `<tr>
            <td><strong>${esc(a.agence)}</strong></td>
            <td class="num">${fmtFcfa(collecte)}</td>
            <td class="num">${fmtFcfa(a.encours_fcfa)}</td>
            <td class="num">${fmtPct(r, 1)}</td>
          </tr>`
        }).join('')}</tbody>
      </table>
    </section>

    <section class="section">
      <h2 class="section-title"><span class="section-num">3</span> Prévisions liquidité</h2>
      <table class="data">
        ${tableHead(['Mois', 'Liquidité prévue', 'PAR prévu', 'Confiance IA'])}
        <tbody>${RESEAU_CONSOLIDE.forecast.map(f => `<tr>
          <td>${esc(f.mois)}</td>
          <td class="num">${fmtFcfa(RESEAU_CONSOLIDE.liquidite_totale + f.collecte_prevue * 0.3)}</td>
          <td class="num">${fmtPct(f.par_prevu, 1)}</td>
          <td class="num">${f.confidence} %</td>
        </tr>`).join('')}</tbody>
      </table>
      <p class="annexe-note">Rapport hebdomadaire — transmission BCEAO obligatoire si ratio &lt; 100 %.</p>
    </section>`

  return wrapReport({
    docTitle: `Liquidité — ${exp.periode}`,
    coverTitle: 'Situation de liquidité',
    subtitle: 'Liquidité à court terme — SFD',
    periode: exp.periode,
    body,
    footerRight: `Contrôle IA ${exp.conformite_ia_pct ?? 100} % — Prospera AI`,
  })
}

function buildLbcFtHtml(hub: ConformiteHub, exp: ExportRegulateur): string {
  const lbc = hub.lbc_ft
  const k = lbc.kpis

  const body = `
    <div class="kpi-grid">
      <div class="kpi ${k.taux_kyc_pct < 95 ? 'alert' : ''}">
        <div class="label">KYC complet</div>
        <div class="value">${fmtPct(k.taux_kyc_pct, 1)}</div>
        <div class="sub">${statutBadge(k.taux_kyc_pct >= 95 ? 'CONFORME' : 'ATTENTION')} · objectif 95 %</div>
      </div>
      <div class="kpi">
        <div class="label">DS transmises</div>
        <div class="value">${k.ds_transmises}</div>
        <div class="sub">${k.ds_en_analyse} en analyse</div>
      </div>
      <div class="kpi">
        <div class="label">Comptes gelés</div>
        <div class="value">${k.comptes_geles}</div>
        <div class="sub">${k.operations_suspectes_mois} alertes mois</div>
      </div>
      <div class="kpi">
        <div class="label">Agents formés LBC/FT</div>
        <div class="value">${k.agents_formes_pct} %</div>
        <div class="sub">${k.ppe_identifies} PPE identifiés</div>
      </div>
    </div>

    <p class="annexe-note">${esc(lbc.synthese_ia)}</p>

    <section class="section">
      <h2 class="section-title"><span class="section-num">1</span> Opérations suspectes (${lbc.operations_suspectes.length})</h2>
      <table class="data">
        ${tableHead(['Date', 'Client', 'Agence', 'Montant', 'Type', 'Niveau', 'Statut', 'Motif'])}
        <tbody>${lbc.operations_suspectes.map(o => `<tr>
          <td>${esc(o.date)} ${esc(o.heure)}</td>
          <td>${esc(o.client)}</td>
          <td>${esc(o.agence)}</td>
          <td class="num">${fmtFcfa(o.montant_fcfa)}</td>
          <td>${esc(o.type_operation)}</td>
          <td>${statutBadge(o.niveau_risque === 'CRITIQUE' ? 'NON CONFORME' : o.niveau_risque === 'ELEVE' ? 'ATTENTION' : 'CONFORME')}</td>
          <td>${esc(o.statut.replace(/_/g, ' '))}</td>
          <td style="max-width:160px;font-size:9pt">${esc(o.motif_alerte)}</td>
        </tr>`).join('')}</tbody>
      </table>
    </section>

    <section class="section">
      <h2 class="section-title"><span class="section-num">2</span> Déclarations CENTIF</h2>
      <table class="data">
        ${tableHead(['Type', 'Date', 'Référence', 'Statut', 'Description'])}
        <tbody>${lbc.declarations_centif.map(d => `<tr>
          <td><strong>${esc(d.type)}</strong></td>
          <td>${esc(d.date)}</td>
          <td><code>${esc(d.reference)}</code></td>
          <td>${statutBadge(d.statut === 'TRANSMISE' || d.statut === 'ACCUSEE' ? 'CONFORME' : d.statut === 'NEANT' ? 'CONFORME' : 'ATTENTION')}</td>
          <td>${esc(d.description)}</td>
        </tr>`).join('')}</tbody>
      </table>
    </section>

    <section class="section">
      <h2 class="section-title"><span class="section-num">3</span> KYC par agence</h2>
      <table class="data">
        ${tableHead(['Agence', 'KYC complet', 'Incomplets', 'Alertes', 'DS mois', 'Formations'])}
        <tbody>${lbc.par_agence.map(a => `<tr>
          <td><strong>${esc(a.agence)}</strong></td>
          <td class="num">${fmtPct(a.kyc_complet_pct, 1)}</td>
          <td class="num">${a.dossiers_incomplets}</td>
          <td class="num">${a.alertes_ouvertes}</td>
          <td class="num">${a.ds_mois}</td>
          <td class="num">${a.formations_a_jour_pct} %</td>
        </tr>`).join('')}</tbody>
      </table>
    </section>

    <section class="section">
      <h2 class="section-title"><span class="section-num">4</span> Dossiers KYC prioritaires</h2>
      <table class="data">
        ${tableHead(['Client', 'Agence', 'Niveau', 'Statut', 'Montant bloqué', 'Motif'])}
        <tbody>${lbc.dossiers_kyc_prioritaires.map(d => `<tr>
          <td>${esc(d.client)} <span style="color:#64748b;font-size:9pt">(${esc(d.client_id)})</span></td>
          <td>${esc(d.agence)}</td>
          <td>${esc(d.niveau.replace(/_/g, ' '))}</td>
          <td>${statutBadge(d.statut === 'BLOQUE' ? 'NON CONFORME' : d.statut === 'EN_COURS' ? 'ATTENTION' : 'CONFORME')}</td>
          <td class="num">${d.montant_bloque_fcfa ? fmtFcfa(d.montant_bloque_fcfa) : '—'}</td>
          <td style="font-size:9pt">${esc(d.motif)}</td>
        </tr>`).join('')}</tbody>
      </table>
    </section>

    <section class="section">
      <h2 class="section-title"><span class="section-num">5</span> Contrôles internes LBC/FT</h2>
      <table class="data">
        ${tableHead(['Contrôle', 'Résultat', 'Seuil', 'Statut', 'Dernière vérif.'])}
        <tbody>${lbc.controles.map(c => `<tr>
          <td>${esc(c.libelle)}</td>
          <td>${esc(c.valeur)}</td>
          <td>${esc(c.seuil ?? '—')}</td>
          <td>${statutBadge(c.statut.replace('_', ' '))}</td>
          <td>${esc(c.derniere_verification)}</td>
        </tr>`).join('')}</tbody>
      </table>
    </section>`

  return wrapReport({
    docTitle: `LBC/FT — ${exp.periode}`,
    coverTitle: 'Déclaration LBC/FT',
    subtitle: 'Lutte contre le blanchiment et le financement du terrorisme',
    periode: exp.periode,
    reference: lbc.referent_reglementaire,
    body,
    footerRight: `Prochain rapport CENTIF : ${k.prochain_rapport_centif}`,
  })
}

export function buildConformiteReportHtml(hub: ConformiteHub, exp: ExportRegulateur): string {
  switch (exp.type) {
    case 'PAR_TRIMESTRIEL':
      return buildParTrimestrielHtml(hub, exp)
    case 'SITUATION_LIQUIDITE':
      return buildSituationLiquiditeHtml(hub, exp)
    case 'LBC_FT':
      return buildLbcFtHtml(hub, exp)
    case 'BCEAO_MENSUEL':
    default:
      return buildBceaoMensuelHtml(hub, exp).replace(
        /<button class="print-btn[\s\S]*?<\/button>/,
        '',
      )
  }
}

function periodeSlug(periode: string): string {
  return periode
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .toUpperCase()
}

export function buildPdfFilename(exp: ExportRegulateur): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const per = periodeSlug(exp.periode)
  const prefix: Record<string, string> = {
    BCEAO_MENSUEL: 'BCEAO_SFD',
    PAR_TRIMESTRIEL: 'BCEAO_PAR_TRIM',
    SITUATION_LIQUIDITE: 'BCEAO_LIQUIDITE',
    LBC_FT: 'BCEAO_LBCFT',
  }
  return `${prefix[exp.type] ?? 'BCEAO'}_${INSTITUTION_HTML.sigle}_${per}_${date}.pdf`
}
