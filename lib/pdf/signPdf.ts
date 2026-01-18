import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export type SealInfo = {
  originalHashSha256: string
  signerIp: string
  timestampIso: string
  signerEmail: string
}

export async function signPdf(params: {
  originalPdfBytes: Uint8Array
  signaturePngBytes: Uint8Array
  seal: SealInfo
}): Promise<Uint8Array> {
  const { originalPdfBytes, signaturePngBytes, seal } = params

  const pdfDoc = await PDFDocument.load(originalPdfBytes)
  const pages = pdfDoc.getPages()
  const last = pages[pages.length - 1]

  const png = await pdfDoc.embedPng(signaturePngBytes)
  const pngDims = png.scale(0.35)

  // Place signature bottom-right on last page
  const margin = 36
  const x = Math.max(margin, last.getWidth() - pngDims.width - margin)
  const y = margin

  last.drawImage(png, {
    x,
    y,
    width: pngDims.width,
    height: pngDims.height
  })

  // Add audit/seal page
  const sealPage = pdfDoc.addPage([595.28, 841.89]) // A4 points
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const lines: string[] = [
    'Sello de Firma Digital Simple (FDS) — Argentina Ley 25.506',
    '',
    'Este documento contiene una firma manuscrita capturada digitalmente y un sello de auditoría.',
    'Para una validez jurídica robusta (timestamp certificado), integrar un TSA (RFC 3161) y guardar el token.',
    '',
    `Hash SHA-256 del PDF original: ${seal.originalHashSha256}`,
    `Firmante: ${seal.signerEmail}`,
    `IP registrada: ${seal.signerIp}`,
    `Timestamp (servidor): ${seal.timestampIso}`
  ]

  let cursorY = 780
  sealPage.drawText(lines[0], { x: 40, y: cursorY, size: 16, font: bold, color: rgb(0, 0, 0) })
  cursorY -= 32

  for (const line of lines.slice(1)) {
    sealPage.drawText(line, { x: 40, y: cursorY, size: 11, font, color: rgb(0.1, 0.1, 0.1) })
    cursorY -= 18
  }

  const out = await pdfDoc.save()
  return out
}
