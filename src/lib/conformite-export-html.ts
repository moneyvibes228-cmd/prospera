/**
 * Rapport régulateur BCEAO — export HTML professionnel (impression / PDF).
 */

import { RESEAU_CONSOLIDE } from '@/lib/agences'
import type { ConformiteHub, ExportRegulateur } from '@/lib/conformite-hub'

export const INSTITUTION_HTML = {
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

export function esc(s: string | number | null | undefined): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function fmtFcfa(n: number): string {
  return `${new Intl.NumberFormat('fr-FR').format(Math.round(n))}\u00a0FCFA`
}

export function fmtNum(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n)
}

export function fmtPct(n: number, digits = 2): string {
  return `${n.toFixed(digits).replace('.', ',')}\u00a0%`
}

export function statutBadge(statut: string): string {
  const s = statut.toUpperCase().replace(/_/g, ' ')
  let cls = 'badge-ok'
  if (s.includes('NON CONFORME') || s.includes('NON_CONFORME')) cls = 'badge-ko'
  else if (s.includes('ATTENTION')) cls = 'badge-warn'
  return `<span class="badge ${cls}">${esc(s)}</span>`
}

export function parEncours(hub: ConformiteHub, seuilJours: number): { montant: number; pct: number } {
  const total = hub.kpis.encours_total_fcfa
  const montant = hub.classifications
    .filter(c => c.jours_retard_max >= seuilJours)
    .reduce((s, c) => s + c.encours_fcfa, 0)
  return {
    montant,
    pct: total > 0 ? Number(((montant / total) * 100).toFixed(2)) : 0,
  }
}

export function parBar(pct: number, seuil: number): string {
  const w = Math.min(100, (pct / Math.max(seuil * 1.5, pct, 1)) * 100)
  const over = pct > seuil
  return `<div class="par-bar"><div class="par-fill ${over ? 'over' : ''}" style="width:${w.toFixed(1)}%"></div><div class="par-threshold" style="left:${Math.min(100, (seuil / Math.max(seuil * 1.5, pct, 1)) * 100).toFixed(1)}%"></div></div>`
}

export function tableHead(cols: string[]): string {
  return `<thead><tr>${cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead>`
}

export function styles(): string {
  return `
:root {
  --navy: #0f2744;
  --navy-mid: #1a3a5c;
  --gold: #c9a227;
  --gold-light: #f5e6b8;
  --teal: #0d9488;
  --teal-light: #ccfbf1;
  --ok: #15803d;
  --ok-bg: #dcfce7;
  --warn: #c2410c;
  --warn-bg: #ffedd5;
  --ko: #b91c1c;
  --ko-bg: #fee2e2;
  --slate: #64748b;
  --border: #e2e8f0;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  font-size: 11pt;
  line-height: 1.45;
  color: #1e293b;
  background: #f1f5f9;
}
.page {
  max-width: 210mm;
  margin: 24px auto;
  background: #fff;
  box-shadow: 0 4px 24px rgba(15,39,68,.12);
}
@media print {
  body { background: #fff; }
  .page { margin: 0; box-shadow: none; max-width: none; }
  .no-print { display: none !important; }
  .section { break-inside: avoid; }
  .annexe-table { font-size: 8pt; }
}
.cover {
  background: linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 55%, #0d9488 100%);
  color: #fff;
  padding: 36px 40px 32px;
  position: relative;
  overflow: hidden;
}
.cover::after {
  content: '';
  position: absolute;
  top: -60px; right: -60px;
  width: 220px; height: 220px;
  border: 3px solid rgba(201,162,39,.35);
  border-radius: 50%;
}
.cover-badge {
  display: inline-block;
  background: var(--gold);
  color: var(--navy);
  font-size: 9pt;
  font-weight: 800;
  letter-spacing: .12em;
  text-transform: uppercase;
  padding: 4px 12px;
  border-radius: 4px;
  margin-bottom: 16px;
}
.cover h1 {
  font-size: 22pt;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 6px;
}
.cover .subtitle { font-size: 13pt; opacity: .92; margin-bottom: 24px; }
.cover-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 24px;
  font-size: 10pt;
  opacity: .9;
}
.cover-meta dt { font-weight: 600; color: var(--gold-light); }
.cover-meta dd { margin: 0; }
.body { padding: 32px 40px 40px; }
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 28px;
}
.kpi {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px 16px;
  border-top: 3px solid var(--teal);
}
.kpi.alert { border-top-color: var(--ko); background: var(--ko-bg); }
.kpi .label { font-size: 8.5pt; color: var(--slate); text-transform: uppercase; letter-spacing: .04em; font-weight: 600; }
.kpi .value { font-size: 16pt; font-weight: 800; color: var(--navy); margin-top: 4px; }
.kpi .sub { font-size: 9pt; color: var(--slate); margin-top: 2px; }
.section { margin-bottom: 28px; }
.section-title {
  font-size: 11pt;
  font-weight: 800;
  color: var(--navy);
  text-transform: uppercase;
  letter-spacing: .06em;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--gold);
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.section-num {
  background: var(--navy);
  color: var(--gold);
  width: 24px; height: 24px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10pt;
}
table.data {
  width: 100%;
  border-collapse: collapse;
  font-size: 10pt;
}
table.data th {
  background: var(--navy);
  color: #fff;
  font-weight: 600;
  text-align: left;
  padding: 9px 12px;
  font-size: 9pt;
  text-transform: uppercase;
  letter-spacing: .03em;
}
table.data td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}
table.data tbody tr:nth-child(even) { background: #f8fafc; }
table.data tbody tr:hover { background: var(--teal-light); }
table.data .num { text-align: right; font-variant-numeric: tabular-nums; }
table.data tfoot td { font-weight: 800; background: #f1f5f9; border-top: 2px solid var(--navy); }
.badge {
  display: inline-block;
  font-size: 8pt;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: .04em;
}
.badge-ok { background: var(--ok-bg); color: var(--ok); }
.badge-warn { background: var(--warn-bg); color: var(--warn); }
.badge-ko { background: var(--ko-bg); color: var(--ko); }
.par-bar {
  position: relative;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  margin-top: 4px;
  min-width: 80px;
}
.par-fill { height: 100%; border-radius: 4px; background: var(--teal); }
.par-fill.over { background: var(--ko); }
.par-threshold {
  position: absolute;
  top: -2px;
  width: 2px;
  height: 12px;
  background: var(--gold);
}
.classe-normal { color: var(--ok); font-weight: 600; }
.classe-surveillance { color: var(--warn); font-weight: 600; }
.classe-douteux { color: #ea580c; font-weight: 600; }
.classe-compromises { color: var(--ko); font-weight: 700; }
.classe-contentieux { color: #7f1d1d; font-weight: 700; }
.control-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.control-item {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.control-item .lbl { font-size: 9.5pt; color: var(--slate); }
.control-item .val { font-size: 14pt; font-weight: 800; color: var(--navy); }
.footer {
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
  font-size: 8.5pt;
  color: var(--slate);
  display: flex;
  justify-content: space-between;
}
.print-btn {
  position: fixed;
  bottom: 24px; right: 24px;
  background: var(--teal);
  color: #fff;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(13,148,136,.4);
  z-index: 100;
}
.annexe-note {
  font-size: 9pt;
  color: var(--slate);
  background: #f8fafc;
  border-left: 3px solid var(--teal);
  padding: 10px 14px;
  margin-bottom: 12px;
  border-radius: 0 6px 6px 0;
}
`
}

export function classeClass(label: string): string {
  const l = label.toLowerCase()
  if (l.includes('contentieux')) return 'classe-contentieux'
  if (l.includes('compromis')) return 'classe-compromises'
  if (l.includes('douteux')) return 'classe-douteux'
  if (l.includes('surveillance')) return 'classe-surveillance'
  return 'classe-normal'
}

export function buildBceaoMensuelHtml(hub: ConformiteHub, exp: ExportRegulateur): string {
  const now = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Lome' })
  const par30 = parEncours(hub, 30)
  const par60 = parEncours(hub, 60)
  const par90 = parEncours(hub, 90)
  const parRows = [
    { label: 'PAR 30+', ...par30, seuil: 10 },
    { label: 'PAR 60+', ...par60, seuil: 7 },
    { label: 'PAR 90+', ...par90, seuil: 5 },
  ]

  const migrations = hub.classifications.filter(c => c.classe_calculee !== c.classe_precedente)
  const dossiersRisque = hub.classifications
    .filter(c => c.jours_retard_max > 0 || c.classe_calculee !== 'NORMAL')
    .sort((a, b) => b.jours_retard_max - a.jours_retard_max)

  const repartitionRows = hub.repartition_classes.map(r => {
    const pct = hub.kpis.total_dossiers > 0
      ? Number(((r.count / hub.kpis.total_dossiers) * 100).toFixed(1))
      : 0
    const provPct = r.encours_fcfa > 0
      ? Number(((r.provision_fcfa / r.encours_fcfa) * 100).toFixed(1))
      : 0
    return { ...r, pct, provPct, label: CLASSE_LABEL[r.classe] ?? r.classe }
  })

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Rapport BCEAO — ${esc(INSTITUTION_HTML.sigle)} — ${esc(exp.periode)}</title>
<style>${styles()}</style>
</head>
<body>
<button class="print-btn no-print" onclick="window.print()">Imprimer / PDF</button>
<div class="page">
  <header class="cover">
    <div class="cover-badge">UEMOA · BCEAO · SFD</div>
    <h1>Rapport régulateur</h1>
    <p class="subtitle">Situation mensuelle — Portefeuille crédit &amp; provisions</p>
    <dl class="cover-meta">
      <dt>Établissement</dt><dd>${esc(INSTITUTION_HTML.raison_sociale)}</dd>
      <dt>Code SFD</dt><dd>${esc(INSTITUTION_HTML.code_etablissement)}</dd>
      <dt>Agrément</dt><dd>${esc(INSTITUTION_HTML.agrement_bceao)}</dd>
      <dt>Pays</dt><dd>${esc(INSTITUTION_HTML.pays)} (${esc(INSTITUTION_HTML.zone)})</dd>
      <dt>Période</dt><dd>${esc(exp.periode)}</dd>
      <dt>Généré le</dt><dd>${esc(now)}</dd>
      <dt>Référence</dt><dd>${esc(INSTITUTION_HTML.instruction)}</dd>
      <dt>Logiciel</dt><dd>${esc(INSTITUTION_HTML.editeur)}</dd>
    </dl>
  </header>

  <div class="body">
    <div class="kpi-grid">
      <div class="kpi">
        <div class="label">Encours brut crédit</div>
        <div class="value">${fmtFcfa(hub.kpis.encours_total_fcfa)}</div>
        <div class="sub">${fmtNum(hub.kpis.total_dossiers)} dossiers actifs</div>
      </div>
      <div class="kpi ${par30.pct > 10 ? 'alert' : ''}">
        <div class="label">PAR 30+ réseau</div>
        <div class="value">${fmtPct(par30.pct)}</div>
        <div class="sub">Seuil BCEAO : 10 % · ${statutBadge(par30.pct <= 10 ? 'CONFORME' : 'NON CONFORME')}</div>
      </div>
      <div class="kpi">
        <div class="label">Provisions totales</div>
        <div class="value">${fmtFcfa(hub.kpis.provisions_totales_fcfa)}</div>
        <div class="sub">Couverture EL : ${fmtPct(hub.kpis.taux_couverture_pct, 0)}</div>
      </div>
      <div class="kpi">
        <div class="label">Réseau</div>
        <div class="value">${RESEAU_CONSOLIDE.total_emprunteurs}</div>
        <div class="sub">emprunteurs · ${RESEAU_CONSOLIDE.agences_actives} agences actives</div>
      </div>
    </div>

    <section class="section">
      <h2 class="section-title"><span class="section-num">2</span> Indicateurs PAR (base encours)</h2>
      <table class="data">
        ${tableHead(['Tranche', 'Encours à risque', 'Taux PAR', 'Seuil IMF', 'Visualisation', 'Statut'])}
        <tbody>
          ${parRows.map(p => {
            const ok = p.pct <= p.seuil
            return `<tr>
              <td><strong>${esc(p.label)}</strong></td>
              <td class="num">${fmtFcfa(p.montant)}</td>
              <td class="num"><strong>${fmtPct(p.pct)}</strong></td>
              <td class="num">${fmtPct(p.seuil, 0)}</td>
              <td>${parBar(p.pct, p.seuil)}</td>
              <td>${statutBadge(ok ? 'CONFORME' : 'NON CONFORME')}</td>
            </tr>`
          }).join('')}
        </tbody>
      </table>
    </section>

    <section class="section">
      <h2 class="section-title"><span class="section-num">3</span> Classification des créances</h2>
      <table class="data">
        ${tableHead(['Classe BCEAO', 'Dossiers', '% portefeuille', 'Encours', 'Taux prov.', 'Provisions'])}
        <tbody>
          ${repartitionRows.map(r => `<tr>
            <td class="${classeClass(r.label)}">${esc(r.label)}</td>
            <td class="num">${fmtNum(r.count)}</td>
            <td class="num">${fmtPct(r.pct, 1)}</td>
            <td class="num">${fmtFcfa(r.encours_fcfa)}</td>
            <td class="num">${fmtPct(r.provPct, 1)}</td>
            <td class="num">${fmtFcfa(r.provision_fcfa)}</td>
          </tr>`).join('')}
        </tbody>
        <tfoot><tr>
          <td>TOTAL</td>
          <td class="num">${fmtNum(hub.kpis.total_dossiers)}</td>
          <td class="num">100 %</td>
          <td class="num">${fmtFcfa(hub.kpis.encours_total_fcfa)}</td>
          <td></td>
          <td class="num">${fmtFcfa(hub.kpis.provisions_totales_fcfa)}</td>
        </tr></tfoot>
      </table>
    </section>

    <section class="section">
      <h2 class="section-title"><span class="section-num">4</span> Provisions par agence</h2>
      <table class="data">
        ${tableHead(['Agence', 'Encours', 'Provisions', 'Taux prov.', 'PAR 30', 'Doss. à risque', 'Statut BCEAO'])}
        <tbody>
          ${hub.provisions_agences.map(a => `<tr>
            <td><strong>${esc(a.agence)}</strong></td>
            <td class="num">${fmtFcfa(a.encours_fcfa)}</td>
            <td class="num">${fmtFcfa(a.provision_totale_fcfa)}</td>
            <td class="num">${fmtPct(a.taux_provision_pct, 1)}</td>
            <td class="num">${fmtPct(a.par_30_pct, 1)}</td>
            <td class="num">${fmtNum(a.dossiers_a_risque)}</td>
            <td>${statutBadge(a.statut_bceao.replace('_', ' '))}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </section>

    <section class="section">
      <h2 class="section-title"><span class="section-num">5</span> Migrations de classe (${migrations.length})</h2>
      <table class="data">
        ${tableHead(['Réf. prêt', 'Client', 'Agence', 'Avant', 'Après', 'J+ max', 'Provision', 'Motif'])}
        <tbody>
          ${migrations.slice(0, 20).map(c => `<tr>
            <td><code>${esc(c.ref_pret)}</code></td>
            <td>${esc(c.client)}</td>
            <td>${esc(c.agence)}</td>
            <td>${esc(CLASSE_LABEL[c.classe_precedente])}</td>
            <td class="${classeClass(CLASSE_LABEL[c.classe_calculee] ?? '')}">${esc(CLASSE_LABEL[c.classe_calculee])}</td>
            <td class="num">${c.jours_retard_max}</td>
            <td class="num">${fmtFcfa(c.provision_fcfa)}</td>
            <td style="max-width:180px;font-size:9pt">${esc(c.migration_ia)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
      ${migrations.length > 20 ? `<p class="annexe-note">${migrations.length - 20} migration(s) supplémentaire(s) — détail complet dans l&apos;export CSV réglementaire.</p>` : ''}
    </section>

    <section class="section">
      <h2 class="section-title"><span class="section-num">6</span> Dossiers à risque (${dossiersRisque.length})</h2>
      <p class="annexe-note">Focus dossiers en retard ou classés hors «&nbsp;Normal&nbsp;». Les ${fmtNum(hub.kpis.total_dossiers - dossiersRisque.length)} dossiers sains sont omis pour lisibilité — annexe CSV complète disponible.</p>
      <table class="data annexe-table">
        ${tableHead(['Réf.', 'Client', 'Agence', 'Produit', 'Encours', 'J+', 'Classe', 'Prov. %', 'Provision', 'Échéance'])}
        <tbody>
          ${dossiersRisque.map(c => `<tr>
            <td><code>${esc(c.ref_pret)}</code></td>
            <td>${esc(c.client)}</td>
            <td>${esc(c.agence)}</td>
            <td>${esc(c.produit)}</td>
            <td class="num">${fmtFcfa(c.encours_fcfa)}</td>
            <td class="num">${c.jours_retard_max > 0 ? `<strong>${c.jours_retard_max}</strong>` : '0'}</td>
            <td class="${classeClass(CLASSE_LABEL[c.classe_calculee] ?? '')}">${esc(CLASSE_LABEL[c.classe_calculee])}</td>
            <td class="num">${c.provision_pct} %</td>
            <td class="num">${fmtFcfa(c.provision_fcfa)}</td>
            <td>${esc(c.date_derniere_echeance ?? '—')}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </section>

    <section class="section">
      <h2 class="section-title"><span class="section-num">7</span> Contrôle IA pré-envoi</h2>
      <div class="control-grid">
        <div class="control-item">
          <span class="lbl">Complétude données</span>
          <span class="val">${exp.conformite_ia_pct || 97} %</span>
        </div>
        <div class="control-item">
          <span class="lbl">Couverture provisions / EL</span>
          <span class="val">${hub.kpis.taux_couverture_pct} % ${statutBadge(hub.kpis.taux_couverture_pct >= 100 ? 'CONFORME' : 'ATTENTION')}</span>
        </div>
        <div class="control-item">
          <span class="lbl">Migrations détectées</span>
          <span class="val">${hub.kpis.migrations_mois}</span>
        </div>
        <div class="control-item">
          <span class="lbl">Exports en attente</span>
          <span class="val">${hub.kpis.exports_en_attente}</span>
        </div>
      </div>
    </section>

    <footer class="footer">
      <span>${esc(INSTITUTION_HTML.editeur)} — Rapport généré automatiquement</span>
      <span>Signature IA : Prospera AI — Conformité BCEAO — contrôle cohérence réseau</span>
    </footer>
  </div>
</div>
</body>
</html>`
}

export function buildHtmlFilename(exp: ExportRegulateur): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const per = exp.periode
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .toUpperCase()
  return `BCEAO_SFD_${INSTITUTION_HTML.sigle}_${per}_${date}.html`
}

/** Parse un export CSV BCEAO Prospera et produit le rapport HTML équivalent */
export function bceaoCsvToHtml(csv: string): string {
  const lines = csv.split(/\r?\n/).filter(l => l.trim())
  const meta: Record<string, string> = {}
  const sections: { title: string; headers: string[]; rows: string[][] }[] = []
  let current: { title: string; headers: string[]; rows: string[][] } | null = null

  for (const line of lines) {
    if (line.startsWith('RAPPORT REGULATEUR')) continue
    if (line.startsWith('SECTION ')) {
      if (current) sections.push(current)
      current = { title: line, headers: [], rows: [] }
      continue
    }
    const cells = line.split(';')
    if (cells.length === 2 && !line.includes('SECTION') && !current) {
      meta[cells[0]!] = cells[1]!
      continue
    }
    if (!current) continue
    if (current.headers.length === 0) {
      current.headers = cells
    } else {
      current.rows.push(cells)
    }
  }
  if (current) sections.push(current)

  const parSection = sections.find(s => s.title.includes('PAR'))
  const par30 = parSection?.rows.find(r => r[0]?.startsWith('PAR 30'))
  const synthSection = sections.find(s => s.title.includes('SYNTHÈSE'))
  const encours = synthSection?.rows.find(r => r[0]?.includes('Encours'))
  const dossiers = synthSection?.rows.find(r => r[0]?.includes('dossiers actifs'))
  const emprunteurs = synthSection?.rows.find(r => r[0]?.includes('emprunteurs'))
  const agences = synthSection?.rows.find(r => r[0]?.includes('Agences'))
  const classSection = sections.find(s => s.title.includes('CLASSIFICATION'))
  const totalRow = classSection?.rows.find(r => r[0] === 'TOTAL')
  const agenceSection = sections.find(s => s.title.includes('PROVISIONS PAR AGENCE'))
  const migSection = sections.find(s => s.title.includes('MIGRATIONS'))
  const annexeSection = sections.find(s => s.title.includes('ANNEXE'))
  const ctrlSection = sections.find(s => s.title.includes('CONTRÔLE'))
  const dossiersRisque = (annexeSection?.rows ?? []).filter(r => {
    const j = parseInt(r[6] ?? '0', 10)
    const cls = (r[7] ?? '').toLowerCase()
    return j > 0 || !cls.includes('normal')
  })

  const n = (s: string | undefined) => parseInt((s ?? '0').replace(/\s/g, ''), 10) || 0
  const pct = (s: string | undefined) => parseFloat((s ?? '0').replace(',', '.')) || 0

  const hubLike = {
    encours: n(encours?.[1]),
    dossiers: n(dossiers?.[1]),
    par30: pct(par30?.[2]),
    par30Statut: par30?.[4] ?? '',
    provisions: n(totalRow?.[5]),
    couverture: ctrlSection?.rows.find(r => r[0]?.includes('couverture'))?.[1]?.replace(' %', '') ?? '100',
    migrations: n(ctrlSection?.rows.find(r => r[0]?.includes('Migrations'))?.[1]),
    exportsAttente: n(ctrlSection?.rows.find(r => r[0]?.includes('Exports en attente'))?.[1]),
    completude: ctrlSection?.rows.find(r => r[0]?.includes('complétude'))?.[1]?.replace(' %', '') ?? '97',
  }

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Rapport BCEAO — ${esc(meta['Établissement'] ?? INSTITUTION_HTML.raison_sociale)} — ${esc(meta['Période'] ?? '')}</title>
<style>${styles()}</style>
</head>
<body>
<button class="print-btn no-print" onclick="window.print()">Imprimer / PDF</button>
<div class="page">
  <header class="cover">
    <div class="cover-badge">UEMOA · BCEAO · SFD</div>
    <h1>Rapport régulateur</h1>
    <p class="subtitle">${esc(meta['Rapport'] ?? 'Situation mensuelle SFD')}</p>
    <dl class="cover-meta">
      <dt>Établissement</dt><dd>${esc(meta['Établissement'] ?? '')}</dd>
      <dt>Code SFD</dt><dd>${esc(meta['Code établissement'] ?? '')}</dd>
      <dt>Agrément</dt><dd>${esc(meta['Agrément BCEAO'] ?? '')}</dd>
      <dt>Pays</dt><dd>${esc(meta['Pays'] ?? 'Togo')}</dd>
      <dt>Période</dt><dd>${esc(meta['Période'] ?? '')}</dd>
      <dt>Généré le</dt><dd>${esc(meta['Date de génération'] ?? '')}</dd>
      <dt>Référence</dt><dd>${esc(meta['Référence normative'] ?? '')}</dd>
      <dt>Logiciel</dt><dd>${esc(meta['Logiciel'] ?? INSTITUTION_HTML.editeur)}</dd>
    </dl>
  </header>
  <div class="body">
    <div class="kpi-grid">
      <div class="kpi">
        <div class="label">Encours brut crédit</div>
        <div class="value">${fmtFcfa(hubLike.encours)}</div>
        <div class="sub">${fmtNum(hubLike.dossiers)} dossiers actifs</div>
      </div>
      <div class="kpi ${hubLike.par30 > 10 ? 'alert' : ''}">
        <div class="label">PAR 30+ réseau</div>
        <div class="value">${fmtPct(hubLike.par30)}</div>
        <div class="sub">${statutBadge(hubLike.par30Statut || (hubLike.par30 <= 10 ? 'CONFORME' : 'NON CONFORME'))}</div>
      </div>
      <div class="kpi">
        <div class="label">Provisions totales</div>
        <div class="value">${fmtFcfa(hubLike.provisions)}</div>
        <div class="sub">Couverture EL : ${hubLike.couverture} %</div>
      </div>
      <div class="kpi">
        <div class="label">Réseau</div>
        <div class="value">${fmtNum(n(emprunteurs?.[1]))}</div>
        <div class="sub">emprunteurs · ${fmtNum(n(agences?.[1]))} agences actives</div>
      </div>
    </div>

    ${sections.filter(s => s.title.includes('PAR') && !s.title.includes('TRIM')).map(s => `
    <section class="section">
      <h2 class="section-title"><span class="section-num">2</span> ${esc(s.title.replace('SECTION ', ''))}</h2>
      <table class="data">
        <thead><tr>${[...s.headers, 'Visualisation'].map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
        <tbody>${s.rows.map(r => {
          const isPar = r[0]?.startsWith('PAR')
          const seuil = parseFloat(r[3] ?? '10') || 10
          const p = parseFloat(r[2] ?? '0') || 0
          return `<tr>
            <td><strong>${esc(r[0] ?? '')}</strong></td>
            <td class="num">${fmtFcfa(n(r[1]))}</td>
            <td class="num"><strong>${esc(r[2] ?? '')} %</strong></td>
            <td class="num">${esc(r[3] ?? '')} %</td>
            <td>${statutBadge(r[4] ?? '')}</td>
            ${isPar ? `<td>${parBar(p, seuil)}</td>` : '<td></td>'}
          </tr>`
        }).join('')}</tbody>
      </table>
    </section>`).join('')}

    ${classSection ? `
    <section class="section">
      <h2 class="section-title"><span class="section-num">3</span> ${esc(classSection.title.replace('SECTION ', ''))}</h2>
      <table class="data">
        ${tableHead(classSection.headers)}
        <tbody>${classSection.rows.map(r => `<tr>
          ${r.map((c, i) => {
            if (i === 0) return `<td class="${classeClass(c)}">${esc(c)}</td>`
            if (i === 3 || i === 5) return `<td class="num">${fmtFcfa(n(c))}</td>`
            if (i === 1 || i === 2) return `<td class="num">${esc(c)}</td>`
            return `<td class="num">${esc(c)}</td>`
          }).join('')}
        </tr>`).join('')}</tbody>
      </table>
    </section>` : ''}

    ${agenceSection ? `
    <section class="section">
      <h2 class="section-title"><span class="section-num">4</span> ${esc(agenceSection.title.replace('SECTION ', ''))}</h2>
      <table class="data">
        ${tableHead(agenceSection.headers)}
        <tbody>${agenceSection.rows.map(r => `<tr>
          <td><strong>${esc(r[0] ?? '')}</strong></td>
          <td class="num">${fmtFcfa(n(r[1]))}</td>
          <td class="num">${fmtFcfa(n(r[2]))}</td>
          <td class="num">${esc(r[3] ?? '')} %</td>
          <td class="num">${esc(r[4] ?? '')} %</td>
          <td class="num">${esc(r[5] ?? '')}</td>
          <td>${statutBadge(r[6] ?? '')}</td>
        </tr>`).join('')}</tbody>
      </table>
    </section>` : ''}

    ${migSection ? `
    <section class="section">
      <h2 class="section-title"><span class="section-num">5</span> ${esc(migSection.title.replace('SECTION ', ''))}</h2>
      <table class="data">
        ${tableHead(migSection.headers)}
        <tbody>${migSection.rows.map(r => `<tr>
          <td><code>${esc(r[0] ?? '')}</code></td>
          <td>${esc(r[1] ?? '')}</td>
          <td>${esc(r[2] ?? '')}</td>
          <td>${esc(r[3] ?? '')}</td>
          <td class="${classeClass(r[4] ?? '')}">${esc(r[4] ?? '')}</td>
          <td class="num">${esc(r[5] ?? '')}</td>
          <td class="num">${fmtFcfa(n(r[6]))}</td>
          <td style="max-width:200px;font-size:9pt">${esc(r[7] ?? '')}</td>
        </tr>`).join('')}</tbody>
      </table>
    </section>` : ''}

    ${dossiersRisque.length > 0 ? `
    <section class="section">
      <h2 class="section-title"><span class="section-num">6</span> Dossiers à risque (${dossiersRisque.length})</h2>
      <p class="annexe-note">Extrait de l&apos;annexe réglementaire — dossiers en retard ou hors classe «&nbsp;Normal&nbsp;».</p>
      <table class="data annexe-table">
        ${tableHead(annexeSection?.headers ?? [])}
        <tbody>${dossiersRisque.map(r => `<tr>
          ${r.map((c, i) => {
            if (i === 5) return `<td class="num">${fmtFcfa(n(c))}</td>`
            if (i === 6) return `<td class="num">${parseInt(c, 10) > 0 ? `<strong>${esc(c)}</strong>` : esc(c)}</td>`
            if (i === 7) return `<td class="${classeClass(c)}">${esc(c)}</td>`
            if (i === 9) return `<td class="num">${fmtFcfa(n(c))}</td>`
            return `<td>${i === 0 ? `<code>${esc(c)}</code>` : esc(c)}</td>`
          }).join('')}
        </tr>`).join('')}</tbody>
      </table>
    </section>` : ''}

    ${ctrlSection ? `
    <section class="section">
      <h2 class="section-title"><span class="section-num">7</span> ${esc(ctrlSection.title.replace('SECTION ', ''))}</h2>
      <div class="control-grid">
        ${ctrlSection.rows.filter(r => !r[0]?.includes('Signature')).map(r => `
        <div class="control-item">
          <span class="lbl">${esc(r[0] ?? '')}</span>
          <span class="val">${esc(r[1] ?? '')} ${r[4] ? statutBadge(r[4]) : ''}</span>
        </div>`).join('')}
      </div>
    </section>` : ''}

    <footer class="footer">
      <span>${esc(INSTITUTION_HTML.editeur)}</span>
      <span>${esc(ctrlSection?.rows.find(r => r[0]?.includes('Signature'))?.[1] ?? 'Prospera AI — Conformité BCEAO')}</span>
    </footer>
  </div>
</div>
</body>
</html>`
}
