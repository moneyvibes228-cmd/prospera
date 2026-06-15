/**
 * Exporte les mocks dashboard + modules opérationnels en JSON + génère les .md backend.
 * Usage: node scripts/export-dashboard-mocks.mjs
 */
import { writeFileSync, mkdirSync, unlinkSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const outDir = join(root, 'docs', 'backend-dashboard-specs')
const jsonDir = join(outDir, 'json')
const opsJsonDir = join(jsonDir, 'ops')

mkdirSync(jsonDir, { recursive: true })
mkdirSync(opsJsonDir, { recursive: true })

async function loadAllMocks() {
  const tmpScript = join(root, 'scripts', '_tmp_export.mts')
  const loaderScript = `
    import * as mocks from '../src/lib/mockMicrofinance.ts'
    import * as agences from '../src/lib/agences.ts'
    import { MOCK_CREDIT_RISQUE, MOCK_COMMERCIAL, MOCK_FINANCES } from '../src/lib/mockDataByRole.ts'
    import { OPERATIONAL_HUBS } from '../src/lib/mockMicrofinance-hubs.ts'
    import { writeFileSync } from 'fs'

    const data = {
      dashboards: {
        DG: {
          kpis_globaux: mocks.KPIS_GLOBAUX_DG,
          rapport_ia: mocks.RAPPORT_IA_DG,
          anomalies_jour: mocks.ANOMALIES_JOUR,
          reseau_consolide: agences.RESEAU_CONSOLIDE,
          agences: agences.AGENCES,
          agences_data: agences.AGENCES_DATA,
        },
        ROC: mocks.MOCK_ROC_HOME,
        CC: mocks.MOCK_CC_HOME,
        GP: mocks.MOCK_GP_HOME,
        RA: mocks.MOCK_RA_HOME,
        TERRAIN: mocks.MOCK_TERRAIN_HOME,
        COMMUNICATION: mocks.MOCK_COMMUNICATION_HOME,
        COMMERCIAL_RCC: mocks.MOCK_COMMERCIAL_HOME,
        AUDIT: mocks.MOCK_AUDIT_HOME,
        DAF: mocks.MOCK_DAF_HOME,
        RISQUE: {
          ...MOCK_CREDIT_RISQUE,
          rapport_ia: mocks.RAPPORT_IA_CREDIT_RISQUE,
          risque_avance: mocks.RISQUE_AVANCE,
          bceao_repartition: mocks.BCEAO_REPARTITION,
          expected_loss: mocks.EXPECTED_LOSS,
        },
        COMMERCIAL: MOCK_COMMERCIAL,
        FINANCES: {
          ...MOCK_FINANCES,
          rapport_ia: mocks.RAPPORT_IA_FINANCES,
        },
      },
      operations: OPERATIONAL_HUBS,
    }
    writeFileSync('${join(jsonDir, '_all_mocks.json').replace(/\\/g, '/')}', JSON.stringify(data, null, 2))
  `
  writeFileSync(tmpScript, loaderScript)
  try {
    execSync(`npx --yes tsx "${tmpScript}"`, { cwd: root, stdio: 'inherit' })
  } finally {
    try { unlinkSync(tmpScript) } catch {}
  }
  const raw = await import('fs').then(fs => fs.readFileSync(join(jsonDir, '_all_mocks.json'), 'utf8'))
  return JSON.parse(raw)
}

function mdHeader(title, role, endpoint, mockSource) {
  return `# ${title}

> Spécification API pour le backend — générée depuis les mocks frontend Prospera  
> **Rôle** : \`${role}\`  
> **Endpoint suggéré** : \`${endpoint}\`  
> **Source mock frontend** : \`${mockSource}\`

---

`
}

function mdOpsHeader(title, route, endpoint, mockSource) {
  return `# ${title}

> Module opérationnel IMF — spec API backend  
> **Route UI** : \`${route}\`  
> **Endpoint suggéré** : \`${endpoint}\`  
> **Source mock frontend** : \`${mockSource}\`

---

`
}

function mdSection(title, content) {
  return `## ${title}\n\n${content}\n\n`
}

function writeSpecFile(filename, content) {
  writeFileSync(join(outDir, filename), content, 'utf8')
  console.log(`✓ ${filename}`)
}

function buildSpecMd({ title, role, endpoint, source, jsonPath, payload, isOps, route }) {
  const topKeys = typeof payload === 'object' && payload !== null
    ? Object.keys(payload).map(k => `- \`${k}\``).join('\n')
    : '(voir JSON)'

  const header = isOps
    ? mdOpsHeader(title, route, endpoint, source)
    : mdHeader(title, role, endpoint, source)

  const jsonRel = jsonPath.replace(/^.*backend-dashboard-specs[\\/]/, './')
  const jsonStr = JSON.stringify(payload, null, 2)
  const preview = jsonStr.length > 6000
    ? jsonStr.slice(0, 6000) + `\n// ... tronqué — voir ${jsonRel} pour le payload complet\n`
    : jsonStr

  return [
    header,
    mdSection('Paramètres query (suggérés)', '```\n?date=2026-05-24          # date de référence (défaut: aujourd\'hui)\n?agence_id=AG-001         # filtre agence si applicable\n?periode=MOIS             # JOUR | SEMAINE | MOIS\n?page=1&limit=20          # pagination listes longues\n```'),
    mdSection('Clés racine de la réponse', topKeys),
    mdSection('Payload JSON complet (exemple mock)', `Voir le fichier [\`${jsonRel}\`](${jsonRel}) pour le payload complet exporté depuis le frontend.\n\n\`\`\`json\n${preview}\n\`\`\``),
    mdSection('Notes backend', '- Tous les montants sont en **FCFA** (entiers).\n- Les champs `synthese_ia` / `rapport_ia` sont générés par le service IA backend.\n- Les pourcentages sont des nombres (ex: `8.2` = 8,2 %).\n- Authentification : JWT + filtrage par rôle et périmètre (`agence_id`, `agent_id`).'),
  ].join('\n')
}

const DASHBOARDS = [
  { key: 'DG', file: '01-dashboard-dg.md', json: '01-dg.json', title: 'Dashboard Directeur Général (DG)', role: 'MANAGER', endpoint: 'GET /api/v1/dashboard/dg', source: 'KPIS_GLOBAUX_DG + RAPPORT_IA_DG + ANOMALIES_JOUR + agences.ts' },
  { key: 'ROC', file: '02-dashboard-roc.md', json: '02-roc.json', title: 'Dashboard Responsable Opérations & Crédit (ROC)', role: 'RESPONSABLE_CREDIT', endpoint: 'GET /api/v1/dashboard/roc', source: 'MOCK_ROC_HOME' },
  { key: 'CC', file: '03-dashboard-charge-credit.md', json: '03-charge-credit.json', title: 'Dashboard Chargé de Crédit (CC)', role: 'CREDIT', endpoint: 'GET /api/v1/dashboard/charge-credit', source: 'MOCK_CC_HOME' },
  { key: 'GP', file: '04-dashboard-gestionnaire-portefeuille.md', json: '04-gp.json', title: 'Dashboard Gestionnaire de Portefeuille (GP)', role: 'GESTIONNAIRE_PORTEFEUILLE', endpoint: 'GET /api/v1/dashboard/gestionnaire-portefeuille', source: 'MOCK_GP_HOME' },
  { key: 'RA', file: '05-dashboard-responsable-agence.md', json: '05-ra.json', title: 'Dashboard Responsable d\'Agence (RA)', role: 'GESTIONNAIRE', endpoint: 'GET /api/v1/dashboard/responsable-agence', source: 'MOCK_RA_HOME' },
  { key: 'COMMERCIAL_RCC', file: '06-dashboard-responsable-commercial-collecte.md', json: '06-rcc.json', title: 'Dashboard Responsable Commerciale & Collecte (RCC)', role: 'RESPONSABLE_COMMERCIAL', endpoint: 'GET /api/v1/dashboard/responsable-commercial', source: 'MOCK_COMMERCIAL_HOME' },
  { key: 'COMMUNICATION', file: '07-dashboard-communication-marketing.md', json: '07-communication.json', title: 'Dashboard Responsable Communication & Marketing', role: 'COMMUNICATION', endpoint: 'GET /api/v1/dashboard/communication', source: 'MOCK_COMMUNICATION_HOME' },
  { key: 'TERRAIN', file: '08-dashboard-agent-terrain.md', json: '08-terrain.json', title: 'Dashboard Agent Terrain & Collecte', role: 'AGENT_TERRAIN | COLLECTRICE', endpoint: 'GET /api/v1/dashboard/terrain', source: 'MOCK_TERRAIN_HOME' },
  { key: 'AUDIT', file: '09-dashboard-auditeur-interne.md', json: '09-audit.json', title: 'Dashboard Auditeur Interne', role: 'AUDITEUR', endpoint: 'GET /api/v1/dashboard/audit', source: 'MOCK_AUDIT_HOME' },
  { key: 'DAF', file: '10-dashboard-daf.md', json: '10-daf.json', title: 'Dashboard DAF', role: 'DAF', endpoint: 'GET /api/v1/dashboard/daf', source: 'MOCK_DAF_HOME' },
  { key: 'RISQUE', file: '11-dashboard-risque.md', json: '11-risque.json', title: 'Dashboard Analyste Risque', role: 'RISQUE', endpoint: 'GET /api/v1/dashboard/risque', source: 'MOCK_CREDIT_RISQUE + RAPPORT_IA_CREDIT_RISQUE + RISQUE_AVANCE' },
  { key: 'COMMERCIAL', file: '12-dashboard-commercial.md', json: '12-commercial.json', title: 'Dashboard Commercial Agence', role: 'COMMERCIAL', endpoint: 'GET /api/v1/dashboard/commercial', source: 'MOCK_COMMERCIAL (mockDataByRole.ts)' },
  { key: 'FINANCES', file: '13-dashboard-finances.md', json: '13-finances.json', title: 'Dashboard Finances (Relance · Comptable · Paie)', role: 'RELANCE | COMPTABLE | PAIE', endpoint: 'GET /api/v1/dashboard/finances', source: 'MOCK_FINANCES + RAPPORT_IA_FINANCES' },
]

const OPERATIONS = [
  { hubKey: 'produits', slug: 'produits', file: '14-ops-produits.md', json: 'ops/produits.json', title: 'Module Produits IMF', route: '/produits', endpoint: 'GET /api/v1/operations/produits', source: 'PRODUITS_HUB' },
  { hubKey: 'epargne', slug: 'epargne', file: '15-ops-epargne.md', json: 'ops/epargne.json', title: 'Module Épargne', route: '/epargne', endpoint: 'GET /api/v1/operations/epargne', source: 'EPARGNE_HUB' },
  { hubKey: 'groupes', slug: 'groupes', file: '16-ops-groupes.md', json: 'ops/groupes.json', title: 'Module Groupes & Solidarité', route: '/groupes', endpoint: 'GET /api/v1/operations/groupes', source: 'GROUPES_HUB' },
  { hubKey: 'kyc', slug: 'kyc', file: '17-ops-kyc.md', json: 'ops/kyc.json', title: 'Module KYC & Documents', route: '/kyc', endpoint: 'GET /api/v1/operations/kyc', source: 'KYC_HUB' },
  { hubKey: 'comptabilite', slug: 'comptabilite', file: '18-ops-comptabilite.md', json: 'ops/comptabilite.json', title: 'Module Comptabilité UEMOA', route: '/comptabilite', endpoint: 'GET /api/v1/operations/comptabilite', source: 'COMPTABILITE_HUB' },
  { hubKey: 'caisse', slug: 'caisse', file: '19-ops-caisse.md', json: 'ops/caisse.json', title: 'Module Caisse & Trésorerie', route: '/caisse', endpoint: 'GET /api/v1/operations/caisse', source: 'CAISSE_HUB' },
  { hubKey: 'conformite', slug: 'conformite', file: '20-ops-conformite.md', json: 'ops/conformite.json', title: 'Module Conformité BCEAO', route: '/conformite', endpoint: 'GET /api/v1/operations/conformite', source: 'CONFORMITE_HUB' },
  { hubKey: 'relances', slug: 'relances', file: '21-ops-relances.md', json: 'ops/relances.json', title: 'Module Relances IA', route: '/relances', endpoint: 'GET /api/v1/operations/relances', source: 'RELANCES_HUB' },
  { hubKey: 'creditCycle', slug: 'credit-cycle', file: '22-ops-credit-cycle.md', json: 'ops/credit-cycle.json', title: 'Module Cycle de prêt', route: '/credit/cycle', endpoint: 'GET /api/v1/operations/credit-cycle', source: 'CREDIT_CYCLE_HUB' },
  { hubKey: 'coreBanking', slug: 'core-banking', file: '23-ops-core-banking.md', json: 'ops/core-banking.json', title: 'Module Opérations bancaires', route: '/operations-bancaires', endpoint: 'GET /api/v1/operations/core-banking', source: 'CORE_BANKING_HUB' },
  { hubKey: 'terrainOffline', slug: 'terrain-offline', file: '24-ops-terrain-offline.md', json: 'ops/terrain-offline.json', title: 'Module Terrain hors-ligne', route: '/terrain/offline', endpoint: 'GET /api/v1/operations/terrain-offline', source: 'TERRAIN_OFFLINE_HUB' },
  { hubKey: 'utilisateurs', slug: 'utilisateurs', file: '25-ops-utilisateurs.md', json: 'ops/utilisateurs.json', title: 'Module Administration utilisateurs', route: '/utilisateurs', endpoint: 'GET /api/v1/admin/utilisateurs', source: 'UTILISATEURS_HUB' },
]

async function main() {
  let data
  try {
    data = await loadAllMocks()
  } catch (e) {
    console.error('Export TS échoué:', e.message)
    process.exit(1)
  }

  for (const d of DASHBOARDS) {
    const payload = data.dashboards[d.key]
    const jsonPath = join(jsonDir, d.json)
    writeFileSync(jsonPath, JSON.stringify(payload, null, 2), 'utf8')
    console.log(`✓ json/${d.json}`)
    writeSpecFile(d.file, buildSpecMd({
      title: d.title,
      role: d.role,
      endpoint: d.endpoint,
      source: d.source,
      jsonPath: `docs/backend-dashboard-specs/json/${d.json}`,
      payload,
      isOps: false,
    }))
  }

  for (const op of OPERATIONS) {
    const payload = data.operations[op.hubKey]
    const jsonPath = join(jsonDir, op.json)
    writeFileSync(jsonPath, JSON.stringify(payload, null, 2), 'utf8')
    console.log(`✓ json/${op.json}`)
    writeSpecFile(op.file, buildSpecMd({
      title: op.title,
      role: '—',
      endpoint: op.endpoint,
      source: op.source,
      jsonPath: `docs/backend-dashboard-specs/json/${op.json}`,
      payload,
      isOps: true,
      route: op.route,
    }))
  }

  // Index modules opérationnels
  const opsIndex = `# Index — Modules opérationnels IMF

> Vue d'ensemble des 12 modules — payloads JSON dans \`json/ops/\`

| # | Module | Route | Endpoint | Spec | JSON |
|---|--------|-------|----------|------|------|
${OPERATIONS.map((op, i) => `| ${14 + i} | ${op.title.replace('Module ', '')} | \`${op.route}\` | \`${op.endpoint}\` | [${op.file}](./${op.file}) | [json/${op.json}](./json/${op.json}) |`).join('\n')}

## Regénérer

\`\`\`bash
cd prospera-web
node scripts/export-dashboard-mocks.mjs
\`\`\`
`
  writeSpecFile('12-modules-operationnels-index.md', opsIndex)

  console.log(`\nExport terminé → ${outDir}`)
  console.log(`  Dashboards: ${DASHBOARDS.length} specs + JSON`)
  console.log(`  Opérations: ${OPERATIONS.length} specs + JSON (json/ops/)`)
}

main().catch(console.error)
