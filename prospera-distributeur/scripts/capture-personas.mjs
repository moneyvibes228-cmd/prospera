import { chromium } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdirSync, writeFileSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const IMG_ROOT = join(__dirname, '..', 'docs', 'guide-utilisateur', 'img', 'personas')
const BASE = 'http://localhost:3002'

const ENTREPRISE = 'Prospera Distribution'
const USERS = {
  DG: { id: '1', nom: 'Koffi Mensah', email: 'dg@demo.prospera.tg', role: 'DG', zone: 'Réseau — Togo', initiales: 'KM', entreprise: ENTREPRISE },
  DC: { id: '2', nom: 'Ama Dzobo', email: 'dc@demo.prospera.tg', role: 'DC', zone: 'Commercial — Toutes zones', initiales: 'AD', entreprise: ENTREPRISE },
  RESP_VENTES: { id: '3', nom: 'Kodjo Agbeko', email: 'ventes@demo.prospera.tg', role: 'RESP_VENTES', zone: 'Région Grand Lomé', initiales: 'KA', entreprise: ENTREPRISE, zones: ['Lomé Nord', 'Lomé Sud', 'Lomé Centre', 'Lomé Est'] },
  SUPERVISEUR: { id: '4', nom: 'Efua Koffi', email: 'superviseur@demo.prospera.tg', role: 'SUPERVISEUR', zone: 'Zone Lomé Nord', initiales: 'EK', entreprise: ENTREPRISE, zones: ['Lomé Nord'] },
  COMMERCIAL: { id: '5', nom: 'Komlan Tetteh', email: 'commercial@demo.prospera.tg', role: 'COMMERCIAL', zone: 'Marché Bé — Lomé', initiales: 'KT', entreprise: ENTREPRISE },
  FREELANCE: { id: '5b', nom: 'Kofi Agbessi', email: 'freelance@demo.prospera.tg', role: 'FREELANCE', zone: 'Portefeuille indépendant — Lomé Sud', initiales: 'KA', entreprise: ENTREPRISE },
  PROSPECTION: { id: '6', nom: 'Mawuena Ahi', email: 'prospection@demo.prospera.tg', role: 'PROSPECTION', zone: 'Zones blanches — Kara', initiales: 'MA', entreprise: ENTREPRISE },
  RESP_STOCK: { id: '7', nom: 'Yao Mensah', email: 'stock@demo.prospera.tg', role: 'RESP_STOCK', zone: 'Entrepôts Lomé + Kara', initiales: 'YM', entreprise: ENTREPRISE },
  GEST_ENTREPOT: { id: '8', nom: 'Edem Kpodo', email: 'entrepot@demo.prospera.tg', role: 'GEST_ENTREPOT', zone: 'Entrepôt Lomé Port', entrepot: 'Lomé Port', initiales: 'EKP', entreprise: ENTREPRISE },
  DAF: { id: '9', nom: 'Sena Fiagbe', email: 'daf@demo.prospera.tg', role: 'DAF', zone: 'Direction Financière', initiales: 'SF', entreprise: ENTREPRISE },
  COMPTABLE: { id: '10', nom: 'Adjoa Mensah', email: 'comptable@demo.prospera.tg', role: 'COMPTABLE', zone: 'Comptabilité — Siège', initiales: 'AM', entreprise: ENTREPRISE },
  MARKETING: { id: '11', nom: 'Kossi Doheto', email: 'marketing@demo.prospera.tg', role: 'MARKETING', zone: 'Marketing & Campagnes', initiales: 'KD', entreprise: ENTREPRISE },
  RECOUVREMENT: { id: '12', nom: 'Elom Adjavon', email: 'recouvrement@demo.prospera.tg', role: 'RECOUVREMENT', zone: 'Créances & Impayés', initiales: 'EA', entreprise: ENTREPRISE },
}

// Source de vérité des accès (miroir de src/lib/route-access.ts).
const ROUTE_ACCESS = {
  '/pilotage-financier': ['DG', 'DC', 'DAF'],
  '/commandes': ['DG', 'DC', 'RESP_VENTES', 'SUPERVISEUR', 'COMMERCIAL', 'FREELANCE', 'PROSPECTION', 'RESP_STOCK'],
  '/stock': ['DG', 'DC', 'RESP_VENTES', 'SUPERVISEUR', 'RESP_STOCK', 'GEST_ENTREPOT', 'DAF', 'COMPTABLE', 'MARKETING'],
  '/entrepot': ['DG', 'RESP_STOCK', 'GEST_ENTREPOT'],
  '/disponibilite': ['COMMERCIAL', 'FREELANCE', 'PROSPECTION'],
  '/mon-activite': ['COMMERCIAL', 'FREELANCE', 'PROSPECTION'],
  '/approvisionnement': ['DG', 'RESP_STOCK', 'DAF', 'COMPTABLE'],
  '/tournees': ['DG', 'DC', 'SUPERVISEUR'],
  '/objectifs': ['DG', 'DC', 'RESP_VENTES'],
  '/facturation': ['DG', 'DC', 'RESP_VENTES', 'COMMERCIAL', 'FREELANCE', 'PROSPECTION', 'DAF', 'COMPTABLE', 'RECOUVREMENT'],
  '/relances': ['DG', 'DC', 'RESP_VENTES', 'SUPERVISEUR', 'COMMERCIAL', 'DAF', 'RECOUVREMENT'],
  '/points-de-vente': ['DG', 'DC', 'RESP_VENTES', 'SUPERVISEUR', 'COMMERCIAL', 'FREELANCE', 'PROSPECTION', 'MARKETING', 'RECOUVREMENT'],
  '/commercial': ['DG', 'DC', 'RESP_VENTES', 'SUPERVISEUR'],
  '/marketing': ['DG', 'DC', 'MARKETING'],
  '/marketing/social': ['DG', 'DC', 'MARKETING'],
  '/automatisations': ['DG', 'MARKETING', 'RECOUVREMENT'],
  '/prospection': ['DG', 'DC', 'RESP_VENTES', 'PROSPECTION'],
  '/equipe': ['DG', 'DC', 'RESP_VENTES', 'SUPERVISEUR'],
  '/comptabilite': ['DG', 'DAF', 'COMPTABLE', 'RECOUVREMENT'],
}

// Ordre d'affichage (façon menu).
const ROUTE_ORDER = [
  '/dashboard', '/pilotage-financier', '/mon-activite', '/tournees', '/commandes',
  '/disponibilite', '/entrepot', '/stock', '/approvisionnement', '/facturation',
  '/relances', '/points-de-vente', '/prospection', '/commercial', '/marketing',
  '/marketing/social', '/automatisations', '/objectifs', '/equipe', '/comptabilite',
]

const TERRAIN = ['COMMERCIAL', 'FREELANCE', 'PROSPECTION']
const STOCK_FULL = ['DG', 'DC', 'DAF', 'RESP_STOCK']

function allowed(role, route) {
  const roles = ROUTE_ACCESS[route]
  return !roles || roles.includes(role)
}

function stockTabs(role) {
  if (role === 'GEST_ENTREPOT') return [{ id: 'stock', label: 'stock' }]
  if (STOCK_FULL.includes(role)) {
    return [
      { id: 'stock', label: 'stock' }, { id: 'transferts', label: 'transferts' },
      { id: 'sante', label: 'sante' }, { id: 'automatisation', label: 'journal-auto' },
      { id: 'sorties', label: 'sorties' }, { id: 'catalogue', label: 'catalogue' },
    ]
  }
  return [{ id: 'stock', label: 'stock' }, { id: 'sorties', label: 'sorties' }, { id: 'catalogue', label: 'catalogue' }]
}

function facturationTabs(role) {
  const t = []
  if (['DG', 'DC', 'DAF', 'COMPTABLE', 'RECOUVREMENT'].includes(role)) t.push({ id: 'factures', label: 'factures' })
  if (['DG', 'DC', 'RESP_VENTES', 'SUPERVISEUR', 'COMMERCIAL', 'FREELANCE', 'PROSPECTION', 'DAF', 'COMPTABLE'].includes(role)) t.push({ id: 'proformas', label: 'proformas' })
  if (['DG', 'DAF', 'COMPTABLE'].includes(role)) t.push({ id: 'efacture', label: 'efacture' })
  return t
}

function expand(role, route) {
  const S = []
  switch (route) {
    case '/dashboard': return [{ slug: 'dashboard', path: '/dashboard' }]
    case '/pilotage-financier': return [{ slug: 'pilotage-financier', path: '/pilotage-financier' }]
    case '/tournees': return [{ slug: 'tournees', path: '/tournees' }]
    case '/commercial': return [{ slug: 'commercial-terrain', path: '/commercial' }]
    case '/marketing': return [{ slug: 'marketing', path: '/marketing' }]
    case '/automatisations': return [{ slug: 'automatisations', path: '/automatisations' }]
    case '/objectifs': return [{ slug: 'objectifs', path: '/objectifs' }]
    case '/comptabilite': return [{ slug: 'comptabilite', path: '/comptabilite' }]
    case '/mon-activite':
      S.push({ slug: 'mon-activite-jour', path: '/mon-activite' })
      S.push({ slug: 'mon-activite-semaine', path: '/mon-activite', click: 'Semaine' })
      S.push({ slug: 'mon-activite-historique', path: '/mon-activite', click: 'Historique' })
      S.push({ slug: 'mon-activite-cloture', path: '/mon-activite', action: 'cloture' })
      return S
    case '/commandes':
      S.push({ slug: 'commandes', path: '/commandes' })
      if (TERRAIN.includes(role)) S.push({ slug: 'commandes-nouvelle', path: '/commandes', action: 'nouvelleCommande' })
      return S
    case '/disponibilite':
      S.push({ slug: 'disponibilite', path: '/disponibilite' })
      S.push({ slug: 'disponibilite-panier', path: '/disponibilite', action: 'panier' })
      return S
    case '/entrepot':
      return [
        { slug: 'entrepot-preparation', path: '/entrepot?tab=preparation' },
        { slug: 'entrepot-expedition', path: '/entrepot?tab=expedition' },
        { slug: 'entrepot-reception', path: '/entrepot?tab=reception' },
        { slug: 'entrepot-inventaire', path: '/entrepot?tab=inventaire' },
      ]
    case '/stock':
      return stockTabs(role).map(t => ({ slug: `stock-${t.label}`, path: `/stock?tab=${t.id}` }))
    case '/approvisionnement':
      return [
        { slug: 'appro-reappro', path: '/approvisionnement?tab=reappro' },
        { slug: 'appro-commandes', path: '/approvisionnement?tab=commandes' },
        { slug: 'appro-fournisseurs', path: '/approvisionnement?tab=fournisseurs' },
        { slug: 'appro-regles', path: '/approvisionnement?tab=regles' },
      ]
    case '/facturation':
      for (const t of facturationTabs(role)) S.push({ slug: `facturation-${t.label}`, path: `/facturation?tab=${t.id}` })
      if (TERRAIN.includes(role)) S.push({ slug: 'facturation-proforma-builder', path: '/facturation?tab=proformas', action: 'proforma' })
      return S
    case '/relances':
      return [
        { slug: 'relances-impayes', path: '/relances' },
        { slug: 'relances-reappro', path: '/relances', click: 'Réapprovisionnement' },
        { slug: 'relances-prospection', path: '/relances', click: 'Prospection' },
        { slug: 'relances-tous', path: '/relances', click: 'Tous les flux' },
      ]
    case '/points-de-vente':
      return [
        { slug: 'points-de-vente', path: '/points-de-vente' },
        { slug: 'points-de-vente-detail', path: '__PDV__' },
      ]
    case '/prospection':
      return [
        { slug: 'prospection-territoires', path: '/prospection' },
        { slug: 'prospection-carnet', path: '/prospection', click: 'Carnet de prospects' },
        { slug: 'prospection-survie', path: '/prospection', click: 'Ouvertures & survie' },
        { slug: 'prospection-passation', path: '/prospection', click: 'Passation' },
      ]
    case '/marketing/social':
      return [
        { slug: 'social-calendrier', path: '/marketing/social' },
        { slug: 'social-idees', path: '/marketing/social', click: 'Idées & modèles' },
        { slug: 'social-inbox', path: '/marketing/social', click: 'Boîte de réception' },
        { slug: 'social-performance', path: '/marketing/social', click: 'Ce que ça rapporte' },
        { slug: 'social-journal', path: '/marketing/social', click: "Journal d'activité" },
      ]
    case '/equipe':
      return [
        { slug: 'equipe-classement', path: '/equipe' },
        { slug: 'equipe-comparatif', path: '/equipe', click: 'Tableau comparatif' },
        { slug: 'equipe-coaching', path: '/equipe', click: 'Coaching & retours IA' },
      ]
    default:
      return [{ slug: route.replace(/\//g, '') || 'home', path: route }]
  }
}

function screensFor(role) {
  const out = []
  for (const route of ROUTE_ORDER) {
    if (!allowed(role, route)) continue
    out.push(...expand(role, route))
  }
  return out
}

async function applyAuth(context, role) {
  const user = USERS[role]
  await context.addCookies([{ name: 'prospera_dist_auth', value: user.id, url: BASE }])
  await context.addInitScript((u) => window.localStorage.setItem('prospera_dist_user', JSON.stringify(u)), user)
}

async function clickByText(page, text) {
  const btn = page.locator(`button:has-text(${JSON.stringify(text)})`).first()
  await btn.click({ timeout: 8000 })
}

async function doAction(page, action) {
  if (action === 'panier') {
    const adds = page.locator('button:has-text("Ajouter")')
    const n = await adds.count()
    if (n > 0) await adds.nth(0).click().catch(() => {})
    if (n > 1) await adds.nth(1).click().catch(() => {})
    await page.waitForTimeout(400)
    await page.locator('button:has-text("Panier")').last().click({ timeout: 8000 }).catch(() => {})
  } else if (action === 'nouvelleCommande') {
    await page.locator('button:has-text("Nouvelle commande")').first().click({ timeout: 8000 }).catch(() => {})
  } else if (action === 'proforma') {
    await page.locator('button:has-text("Créer une proforma")').first().click({ timeout: 8000 }).catch(() => {})
  } else if (action === 'cloture') {
    const c = page.locator('button:has-text("Clôturer")').first()
    if (await c.count() > 0) await c.click({ timeout: 8000 }).catch(() => {})
  }
}

async function main() {
  const only = process.argv[2] // rôle(s) optionnel(s), séparés par des virgules
  const roles = only ? only.split(',').map(r => r.trim()).filter(Boolean) : Object.keys(USERS)
  const browser = await chromium.launch()
  const manifest = {}

  for (const role of roles) {
    const dir = join(IMG_ROOT, role.toLowerCase())
    mkdirSync(dir, { recursive: true })
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.25 })
    await applyAuth(context, role)
    const page = await context.newPage()
    manifest[role] = []

    const screens = screensFor(role)
    let idx = 0
    for (const sc of screens) {
      idx++
      let path = sc.path
      if (path === '__PDV__') {
        await page.goto(`${BASE}/points-de-vente`, { waitUntil: 'networkidle' }).catch(() => {})
        const href = await page.getAttribute('a[href^="/points-de-vente/"]', 'href').catch(() => null)
        path = href || '/points-de-vente'
      }
      try {
        await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 30000 })
      } catch {
        await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {})
      }
      await page.waitForTimeout(1500)
      if (sc.click) { try { await clickByText(page, sc.click); await page.waitForTimeout(1200) } catch (e) { console.log(`   ! clic "${sc.click}" échoué (${role}/${sc.slug})`) } }
      if (sc.action) { await doAction(page, sc.action); await page.waitForTimeout(1000) }

      const num = String(idx).padStart(2, '0')
      const file = `${num}-${sc.slug}.png`
      const rel = `img/personas/${role.toLowerCase()}/${file}`
      await page.screenshot({ path: join(dir, file), fullPage: true })
      manifest[role].push({ slug: sc.slug, file: rel, url: page.url() })
      console.log(`OK ${role} ${file} -> ${page.url()}`)
    }
    await context.close()
  }

  await browser.close()
  const tag = roles.join('-')
  writeFileSync(join(IMG_ROOT, `manifest-${tag}.json`), JSON.stringify(manifest, null, 2))
  console.log('\nManifest écrit.')
}

main().catch((e) => { console.error(e); process.exit(1) })
