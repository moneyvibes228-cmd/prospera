import { chromium } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdirSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'docs', 'guide-utilisateur', 'img')
mkdirSync(OUT_DIR, { recursive: true })

const BASE = 'http://localhost:3002'

// Comptes démo (miroir de src/lib/auth.ts) — id + payload localStorage complet.
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

// Plan de capture : chaque écran capturé avec le rôle le plus représentatif.
const SHOTS = [
  { file: '01-login', role: null, path: '/login' },
  { file: '02-dashboard-dg', role: 'DG', path: '/dashboard' },
  { file: '03-dashboard-commercial', role: 'COMMERCIAL', path: '/dashboard' },
  { file: '04-dashboard-marketing', role: 'MARKETING', path: '/dashboard' },
  { file: '05-dashboard-recouvrement', role: 'RECOUVREMENT', path: '/dashboard' },
  { file: '06-dashboard-stock', role: 'RESP_STOCK', path: '/dashboard' },
  { file: '07-dashboard-entrepot', role: 'GEST_ENTREPOT', path: '/dashboard' },
  { file: '08-dashboard-daf', role: 'DAF', path: '/dashboard' },
  { file: '09-pilotage-financier', role: 'DG', path: '/pilotage-financier' },
  { file: '10-points-de-vente', role: 'DC', path: '/points-de-vente' },
  { file: '11-points-de-vente-detail', role: 'DC', path: '__PDV_DETAIL__' },
  { file: '12-prospection', role: 'PROSPECTION', path: '/prospection' },
  { file: '13-commercial-terrain', role: 'DC', path: '/commercial' },
  { file: '14-tournees', role: 'SUPERVISEUR', path: '/tournees' },
  { file: '15-mon-activite', role: 'COMMERCIAL', path: '/mon-activite' },
  { file: '16-commandes', role: 'DC', path: '/commandes' },
  { file: '17-disponibilite', role: 'COMMERCIAL', path: '/disponibilite' },
  { file: '18-entrepot', role: 'GEST_ENTREPOT', path: '/entrepot' },
  { file: '19-stock', role: 'RESP_STOCK', path: '/stock' },
  { file: '20-approvisionnement', role: 'RESP_STOCK', path: '/approvisionnement' },
  { file: '21-facturation', role: 'COMPTABLE', path: '/facturation' },
  { file: '22-relances', role: 'RECOUVREMENT', path: '/relances' },
  { file: '23-marketing', role: 'MARKETING', path: '/marketing' },
  { file: '24-marketing-social', role: 'MARKETING', path: '/marketing/social' },
  { file: '25-automatisations', role: 'MARKETING', path: '/automatisations' },
  { file: '26-objectifs', role: 'DC', path: '/objectifs' },
  { file: '27-equipe', role: 'DC', path: '/equipe' },
  { file: '28-comptabilite', role: 'COMPTABLE', path: '/comptabilite' },
]

async function applyAuth(context, role) {
  await context.clearCookies()
  if (!role) {
    await context.addInitScript(() => window.localStorage.clear())
    return
  }
  const user = USERS[role]
  await context.addCookies([{ name: 'prospera_dist_auth', value: user.id, url: BASE }])
  await context.addInitScript((u) => {
    window.localStorage.setItem('prospera_dist_user', JSON.stringify(u))
  }, user)
}

async function main() {
  const browser = await chromium.launch()
  const results = []

  for (const shot of SHOTS) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 })
    await applyAuth(context, shot.role)
    const page = await context.newPage()

    let targetPath = shot.path
    if (targetPath === '__PDV_DETAIL__') {
      await page.goto(`${BASE}/points-de-vente`, { waitUntil: 'networkidle' }).catch(() => {})
      const href = await page.getAttribute('a[href^="/points-de-vente/"]', 'href').catch(() => null)
      targetPath = href || '/points-de-vente'
    }

    try {
      await page.goto(`${BASE}${targetPath}`, { waitUntil: 'networkidle', timeout: 30000 })
    } catch {
      await page.goto(`${BASE}${targetPath}`, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {})
    }
    // Laisse le temps aux graphiques (recharts) et cartes de se peindre.
    await page.waitForTimeout(2500)

    const finalUrl = page.url()
    const out = join(OUT_DIR, `${shot.file}.png`)
    await page.screenshot({ path: out, fullPage: true })
    results.push({ file: shot.file, role: shot.role, url: finalUrl })
    console.log(`OK ${shot.file} [${shot.role ?? 'public'}] -> ${finalUrl}`)
    await context.close()
  }

  await browser.close()
  console.log('\n=== RESUME ===')
  console.log(JSON.stringify(results, null, 2))
}

main().catch((e) => { console.error(e); process.exit(1) })
