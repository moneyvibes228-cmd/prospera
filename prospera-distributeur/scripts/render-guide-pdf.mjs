import { chromium } from '@playwright/test'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const HTML = join(__dirname, '..', 'docs', 'guide-utilisateur', 'GUIDE_PAR_PERSONA.html')
const PDF = join(__dirname, '..', 'docs', 'guide-utilisateur', 'GUIDE_PAR_PERSONA.pdf')

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.goto(pathToFileURL(HTML).toString(), { waitUntil: 'networkidle' })

  // S'assure que toutes les images sont chargées avant impression.
  await page.evaluate(async () => {
    const imgs = Array.from(document.images)
    await Promise.all(imgs.map(img => img.complete ? Promise.resolve() : new Promise(res => {
      img.addEventListener('load', res)
      img.addEventListener('error', res)
    })))
  })

  await page.pdf({
    path: PDF,
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', bottom: '16mm', left: '16mm', right: '16mm' },
    displayHeaderFooter: true,
    headerTemplate: `<div></div>`,
    footerTemplate: `
      <div style="width:100%; font-size:8px; color:#94a3b8; font-family:Arial, sans-serif; display:flex; justify-content:space-between; padding:0 16mm;">
        <span>Prospera Distribution — Guide utilisateur par persona</span>
        <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
      </div>`,
  })

  await browser.close()
  console.log('PDF généré :', PDF)
}

main().catch((e) => { console.error(e); process.exit(1) })
