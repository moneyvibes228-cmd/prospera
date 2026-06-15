/** Téléchargement côté client (Blob + lien temporaire) */

export function downloadTextFile(content: string, filename: string, mime = 'text/csv;charset=utf-8') {
  const bom = '\uFEFF'
  const blob = new Blob([bom + content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
