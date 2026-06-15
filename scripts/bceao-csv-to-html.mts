/**
 * Convertit un export CSV BCEAO Prospera en rapport HTML.
 * Usage: npx tsx scripts/bceao-csv-to-html.mts [chemin.csv]
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { bceaoCsvToHtml } from '../src/lib/conformite-export-html'

const __dir = dirname(fileURLToPath(import.meta.url))
const defaultCsv = resolve(__dir, '../../BCEAO_SFD_PROSPERA_JUIN_2026_20260531.csv')
const input = process.argv[2] ?? defaultCsv
const csv = readFileSync(input, 'utf-8')
const html = bceaoCsvToHtml(csv)
const out = input.replace(/\.csv$/i, '.html')
writeFileSync(out, html, 'utf-8')
console.log(`Rapport généré : ${out}`)
