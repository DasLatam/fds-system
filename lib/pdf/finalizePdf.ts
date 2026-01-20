import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export type EvidenceSigner = {
  email: string;
  fullName: string;
  dni: string;
  cuil: string;
  address: string;
  phone: string;
  signedAt: string; // ISO
  ip: string;
  signaturePngBytes: Uint8Array;
};

export async function buildFinalPdf(opts: {
  originalPdfBytes: Uint8Array;
  originalHashSha256: string;
  documentTitle: string;
  completedAtIso: string;
  signers: EvidenceSigner[];
}) {
  const pdf = await PDFDocument.load(opts.originalPdfBytes);

  // Evidence page
  const page = pdf.addPage([595.28, 841.89]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const margin = 40;
  let y = page.getHeight() - margin;

  const drawText = (text: string, size = 10, bold = false) => {
    const f = bold ? fontBold : font;
    page.drawText(text, { x: margin, y, size, font: f, color: rgb(0, 0, 0) });
    y -= size + 6;
  };

  drawText("Constancia de evidencia - Firma Electrónica", 14, true);
  drawText(`Título: ${opts.documentTitle}`, 10);
  drawText(`Hash SHA-256 del PDF original: ${opts.originalHashSha256}`, 10);
  drawText(`Documento finalizado: ${opts.completedAtIso}`, 10);
  y -= 8;

  drawText("Firmantes", 12, true);
  y -= 4;

  const maxSigWidth = 180;
  const sigHeight = 50;

  for (let i = 0; i < opts.signers.length; i++) {
    const s = opts.signers[i];
    if (y < margin + 200) {
      y = page.getHeight() - margin;
      // If too many signers, create another evidence page
      // For simplicity, add another page
      const newPage = pdf.addPage([595.28, 841.89]);
      (page as any) = newPage;
    }

    drawText(`${i + 1}. ${s.fullName} (${s.email})`, 10, true);
    drawText(`DNI: ${s.dni} | CUIL: ${s.cuil}`, 9);
    drawText(`Domicilio: ${s.address} | Cel: ${s.phone}`, 9);
    drawText(`Firmó: ${s.signedAt} | IP: ${s.ip}`, 9);

    const png = await pdf.embedPng(s.signaturePngBytes);
    const pngDims = png.scale(1);
    const scale = Math.min(maxSigWidth / pngDims.width, sigHeight / pngDims.height);
    const w = pngDims.width * scale;
    const h = pngDims.height * scale;

    page.drawRectangle({
      x: margin,
      y: y - h - 6,
      width: maxSigWidth + 10,
      height: sigHeight + 10,
      borderWidth: 1,
      borderColor: rgb(0.85, 0.85, 0.88),
    });

    page.drawImage(png, {
      x: margin + 5,
      y: y - h,
      width: w,
      height: h,
    });

    y -= sigHeight + 24;
  }

  // Footer
  page.drawText(
    "Generado por Firma Electrónica Simple - Evidencia técnica (hash, timestamps e IP) almacenada por 10 años.",
    {
      x: margin,
      y: margin,
      size: 8,
      font,
      color: rgb(0.3, 0.3, 0.3),
    }
  );

  return new Uint8Array(await pdf.save());
}
