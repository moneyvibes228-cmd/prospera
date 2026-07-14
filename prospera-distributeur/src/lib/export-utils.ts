/**
 * Exports légers côté client — CSV (ouvrable dans Excel) et impression PDF.
 *
 * Pas de dépendance externe : le CSV est généré en mémoire puis téléchargé via un Blob,
 * et le « PDF » s'appuie sur la boîte d'impression du navigateur (Enregistrer en PDF).
 */

export type CsvCell = string | number | null | undefined

/** Échappe une cellule pour le format CSV (séparateur `;`, compatible Excel FR). */
function escapeCell(cell: CsvCell): string {
  if (cell == null) return ''
  const s = String(cell)
  if (/[";\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

/**
 * Génère et télécharge un fichier CSV.
 * @param nomFichier nom sans extension (ex. « run-paiement-2026-06-11 »)
 * @param colonnes en-têtes de colonnes
 * @param lignes tableau de lignes, chaque ligne étant un tableau de cellules
 */
export function telechargerCsv(nomFichier: string, colonnes: string[], lignes: CsvCell[][]): void {
  if (typeof window === 'undefined') return
  const contenu = [colonnes, ...lignes]
    .map(ligne => ligne.map(escapeCell).join(';'))
    .join('\r\n')
  // BOM UTF-8 pour qu'Excel lise correctement les accents.
  const blob = new Blob(['\uFEFF' + contenu], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${nomFichier}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** Ouvre la boîte d'impression du navigateur (permet « Enregistrer au format PDF »). */
export function imprimerPdf(): void {
  if (typeof window !== 'undefined') window.print()
}

/** Suffixe de date stable pour nommer les fichiers exportés (jeu de démonstration figé). */
export function suffixeDateFichier(): string {
  return new Date().toISOString().slice(0, 10)
}
