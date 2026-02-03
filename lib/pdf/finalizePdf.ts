import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";

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

  // P1: capacidad de firma (opcional para compat)
  signerCapacity?: "self" | "representing";
  signerCompanyName?: string | null;
  signerCompanyCuit?: string | null;
  signerCompanyAddress?: string | null;
  signerCompanyRole?: string | null;
};

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1] || "";
  const bin = Buffer.from(base64, "base64");
  return new Uint8Array(bin);
}

function onlyDigits(s: string | null | undefined) {
  return String(s || "").replace(/\D/g, "");
}

export async function buildFinalPdf(opts: {
  originalPdfBytes: Uint8Array;
  originalHashSha256: string;
  documentTitle: string;
  completedAtIso: string;
  signers: EvidenceSigner[];
  auditCode?: string; // opcional para no romper callers existentes
}) {
  const pdf = await PDFDocument.load(opts.originalPdfBytes);

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const margin = 40;

  let page = pdf.addPage([595.28, 841.89]); // A4
  let y = page.getHeight() - margin;

  const setNewPage = () => {
    page = pdf.addPage([595.28, 841.89]);
    y = page.getHeight() - margin;
  };

  const drawText = (text: string, size = 10, bold = false) => {
    const f = bold ? fontBold : font;
    page.drawText(text, { x: margin, y, size, font: f, color: rgb(0, 0, 0) });
    y -= size + 6;
  };

  drawText("Constancia de evidencia - Firma Electrónica", 14, true);
  drawText(`Título: ${opts.documentTitle}`, 10);
  drawText(`Hash SHA-256 del PDF original: ${opts.originalHashSha256}`, 10);
  drawText(`Documento finalizado: ${opts.completedAtIso}`, 10);

  // QR de verificación pública (solo si tenemos auditCode)
  if (opts.auditCode) {
    const verifyUrl = `https://firmasimple.vercel.app/v/${opts.auditCode}`;

    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      errorCorrectionLevel: "M",
      margin: 1,
      scale: 4,
    });

    const qrBytes = dataUrlToBytes(qrDataUrl);
    const qrImg = await pdf.embedPng(qrBytes);

    const qrSize = 72; // ~1 inch
    const qrX = page.getWidth() - qrSize - margin;
    const qrY = page.getHeight() - qrSize - margin;

    page.drawImage(qrImg, { x: qrX, y: qrY, width: qrSize, height: qrSize });

    page.drawText("Verificación", {
      x: qrX,
      y: qrY - 12,
      size: 8,
      font,
      color: rgb(0.35, 0.35, 0.35),
    });

    page.drawText("pública", {
      x: qrX,
      y: qrY - 22,
      size: 8,
      font,
      color: rgb(0.35, 0.35, 0.35),
    });
  }

  y -= 8;

  drawText("Firmantes", 12, true);
  y -= 4;

  const maxSigWidth = 180;
  const sigHeight = 50;

  for (let i = 0; i < opts.signers.length; i++) {
    const s = opts.signers[i];

    // Si no entra, nueva página + header mínimo
    if (y < margin + 200) {
      setNewPage();
      drawText("Firmantes (continuación)", 12, true);
      y -= 4;
    }

    drawText(`${i + 1}. ${s.fullName} (${s.email})`, 10, true);
    drawText(`DNI: ${s.dni} | CUIL: ${s.cuil}`, 9);
    drawText(`Domicilio: ${s.address} | Cel: ${s.phone}`, 9);
    drawText(`Firmó: ${s.signedAt} | IP: ${s.ip}`, 9);

    // P1: capacidad de firma
    const cap = s.signerCapacity || "self";
    if (cap === "representing") {
      const cuit = onlyDigits(s.signerCompanyCuit);
      const companyLine = `En representación de: ${String(s.signerCompanyName || "-")}${
        cuit ? ` (CUIT ${cuit})` : ""
      }`;
      drawText(companyLine, 9);
      if (s.signerCompanyRole) drawText(`Rol: ${String(s.signerCompanyRole)}`, 9);
      if (s.signerCompanyAddress) drawText(`Domicilio empresa: ${String(s.signerCompanyAddress)}`, 9);
    }

    const png = await pdf.embedPng(s.signaturePngBytes);
    const pngDims = png.scale(1);

    // Fit en caja + reducir 50% el tamaño final de la firma
    const fitScale = Math.min(maxSigWidth / pngDims.width, sigHeight / pngDims.height);
    const scale = fitScale * 0.5;

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