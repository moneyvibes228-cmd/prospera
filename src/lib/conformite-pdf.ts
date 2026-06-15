/**
 * Conversion HTML → PDF côté client (jsPDF + html2canvas).
 */

export async function downloadHtmlAsPdf(html: string, filename: string): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])

  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;border:none;visibility:hidden'
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument
  if (!doc) {
    document.body.removeChild(iframe)
    throw new Error('Impossible de préparer le rapport PDF')
  }

  const pdfHtml = html.replace(/<button class="print-btn[^>]*>[\s\S]*?<\/button>/, '')
  doc.open()
  doc.write(pdfHtml)
  doc.close()

  await new Promise<void>(resolve => {
    iframe.onload = () => resolve()
    setTimeout(resolve, 400)
  })

  const page = doc.querySelector('.page') as HTMLElement | null
  if (!page) {
    document.body.removeChild(iframe)
    throw new Error('Structure de rapport invalide')
  }

  const canvas = await html2canvas(page, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 794,
  })

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = 210
  const pageHeight = 297
  const imgWidth = pageWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  let heightLeft = imgHeight
  let position = 0
  const imgData = canvas.toDataURL('image/jpeg', 0.92)

  pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
  heightLeft -= pageHeight

  while (heightLeft > 0) {
    position = heightLeft - imgHeight
    pdf.addPage()
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
  }

  const outName = filename.endsWith('.pdf') ? filename : `${filename.replace(/\.html?$/i, '')}.pdf`
  pdf.save(outName)
  document.body.removeChild(iframe)
}
