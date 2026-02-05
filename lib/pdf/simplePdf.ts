type CreateSimplePdfOpts = {
  title: string;
  bodyText: string;
};

/**
 * Convierte HTML básico a texto plano:
 * - <br>, <p>, <div>, <li> => saltos de línea
 * - elimina tags restantes
 * - decodifica entidades HTML comunes
 */
export function htmlToPlainText(html: string): string {
  const input = String(html || "");

  // Normalizar saltos típicos
  let s = input
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\s*\/p\s*>/gi, "\n")
    .replace(/<\s*p(\s+[^>]*)?>/gi, "")
    .replace(/<\s*\/div\s*>/gi, "\n")
    .replace(/<\s*div(\s+[^>]*)?>/gi, "")
    .replace(/<\s*\/li\s*>/gi, "\n")
    .replace(/<\s*li(\s+[^>]*)?>/gi, "• ")
    .replace(/<\s*\/ul\s*>/gi, "\n")
    .replace(/<\s*ul(\s+[^>]*)?>/gi, "")
    .replace(/<\s*\/ol\s*>/gi, "\n")
    .replace(/<\s*ol(\s+[^>]*)?>/gi, "");

  // Strip tags restantes
  s = s.replace(/<[^>]+>/g, "");

  // Decode entidades comunes (sin depender de librerías)
  const entities: Record<string, string> = {
    "&nbsp;": " ",
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
  };

  s = s.replace(/&(nbsp|amp|lt|gt|quot|apos);|&#39;/g, (m) => entities[m] ?? m);

  // Compactar whitespace
  s = s
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return s;
}

function toUtf16BeHexPdfString(text: string): string {
  const s = String(text ?? "");
  // string vacío con BOM
  if (!s) return "<FEFF>";

  // Node soporta utf16le. Convertimos a BE.
  const le = Buffer.from(s, "utf16le");
  const be = Buffer.alloc(le.length);
  for (let i = 0; i < le.length; i += 2) {
    be[i] = le[i + 1];
    be[i + 1] = le[i];
  }
  return `<FEFF${be.toString("hex").toUpperCase()}>`;
}

function wrapTextByChars(paragraph: string, maxChars: number): string[] {
  const p = String(paragraph || "").trim();
  if (!p) return [""];

  const out: string[] = [];
  const rawLines = p.split("\n").map((l) => l.trim());

  for (const line of rawLines) {
    if (!line) {
      out.push("");
      continue;
    }
    const words = line.split(/\s+/).filter(Boolean);
    let cur = "";
    for (const w of words) {
      if (!cur) {
        cur = w;
        continue;
      }
      if (cur.length + 1 + w.length <= maxChars) {
        cur = `${cur} ${w}`;
      } else {
        out.push(cur);
        cur = w;
      }
    }
    if (cur) out.push(cur);
  }
  return out;
}

function formatXrefOffset(n: number): string {
  return String(n).padStart(10, "0");
}

/**
 * Generador PDF mínimo (Type1 Helvetica) pero **válido** para lectores estrictos y para pdf-lib.
 * - A4
 * - Título + cuerpo con wrapping básico
 * - Multi-página si excede el alto
 */
export function createSimplePdfBytes(opts: CreateSimplePdfOpts): Uint8Array {
  const title = String(opts?.title || "").trim();
  const bodyText = String(opts?.bodyText || "").trim();

  // Layout
  const pageW = 595;
  const pageH = 842;
  const marginX = 50;
  const marginTop = 52;
  const marginBottom = 52;

  const titleFontSize = 18;
  const bodyFontSize = 12;
  const leading = 14;

  const maxCharsPerLine = 92; // aproximación para Helvetica 12pt en A4 con márgenes
  const bodyLines = bodyText
    .split("\n")
    .flatMap((p) => wrapTextByChars(p, maxCharsPerLine));

  const firstPageBodyYStart = pageH - marginTop - 2 * titleFontSize - 16; // debajo del título
  const otherPageBodyYStart = pageH - marginTop - bodyFontSize;

  const maxLinesFirst = Math.max(1, Math.floor((firstPageBodyYStart - marginBottom) / leading));
  const maxLinesOther = Math.max(1, Math.floor((otherPageBodyYStart - marginBottom) / leading));

  const chunks: string[][] = [];
  if (bodyLines.length <= maxLinesFirst) {
    chunks.push(bodyLines);
  } else {
    chunks.push(bodyLines.slice(0, maxLinesFirst));
    let idx = maxLinesFirst;
    while (idx < bodyLines.length) {
      chunks.push(bodyLines.slice(idx, idx + maxLinesOther));
      idx += maxLinesOther;
    }
  }

  const pageCount = Math.max(1, chunks.length);

  type PdfObj = { id: number; content: Buffer };
  const objects: PdfObj[] = [];

  // Font: Helvetica
  objects.push({
    id: 3,
    content: Buffer.from(
      `3 0 obj\n<< /Type /Font /Subtype /Type1 /Name /F1 /BaseFont /Helvetica >>\nendobj\n`,
      "utf8"
    ),
  });

  const pageObjStart = 4;
  const contentObjStart = pageObjStart + pageCount;

  const pageIds: number[] = [];
  for (let p = 0; p < pageCount; p++) {
    const pageId = pageObjStart + p;
    const contentId = contentObjStart + p;
    pageIds.push(pageId);

    const lines = chunks[p] ?? [];

    const parts: string[] = [];

    if (p === 0) {
      // Title
      parts.push("BT");
      parts.push(`/F1 ${titleFontSize} Tf`);
      parts.push(`${marginX} ${pageH - marginTop - titleFontSize} Td`);
      parts.push(`${toUtf16BeHexPdfString(title || "Documento")} Tj`);
      parts.push("ET");
    }

    // Body
    parts.push("BT");
    parts.push(`/F1 ${bodyFontSize} Tf`);
    const startY = p === 0 ? firstPageBodyYStart : otherPageBodyYStart;
    parts.push(`${marginX} ${startY} Td`);
    parts.push(`${leading} TL`);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? "";
      parts.push(`${toUtf16BeHexPdfString(line)} Tj`);
      if (i !== lines.length - 1) parts.push("T*");
    }
    parts.push("ET");

    const stream = parts.join("\n") + "\n";
    const streamBuf = Buffer.from(stream, "utf8");

    const contentObj = Buffer.concat([
      Buffer.from(`${contentId} 0 obj\n<< /Length ${streamBuf.length} >>\nstream\n`, "utf8"),
      streamBuf,
      Buffer.from("endstream\nendobj\n", "utf8"),
    ]);

    const pageObj = Buffer.from(
      `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>\nendobj\n`,
      "utf8"
    );

    objects.push({ id: contentId, content: contentObj });
    objects.push({ id: pageId, content: pageObj });
  }

  // Pages (2 0) con Kids como ARRAY (esto evita PDFs “en blanco” y errores de pdf-lib)
  const kids = pageIds.map((id) => `${id} 0 R`).join(" ");
  objects.push({
    id: 2,
    content: Buffer.from(
      `2 0 obj\n<< /Type /Pages /Kids [${kids}] /Count ${pageCount} >>\nendobj\n`,
      "utf8"
    ),
  });

  // Catalog (1 0)
  objects.push({
    id: 1,
    content: Buffer.from(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`, "utf8"),
  });

  // Sort by object id
  objects.sort((a, b) => a.id - b.id);

  // Assemble PDF
  const header = Buffer.from("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n", "binary");

  const maxId = objects[objects.length - 1]?.id ?? 0;
  const offsets: number[] = Array.from({ length: maxId + 1 }, () => 0);

  const parts: Buffer[] = [header];
  let cursor = header.length;

  for (const obj of objects) {
    offsets[obj.id] = cursor;
    parts.push(obj.content);
    cursor += obj.content.length;
  }

  const xrefOffset = cursor;

  const size = maxId + 1;

  let xref = "xref\n";
  xref += `0 ${size}\n`;
  xref += "0000000000 65535 f \n";
  for (let i = 1; i < size; i++) {
    xref += `${formatXrefOffset(offsets[i])} 00000 n \n`;
  }

  const trailer =
    `trailer\n<< /Size ${size} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  parts.push(Buffer.from(xref, "utf8"));
  parts.push(Buffer.from(trailer, "utf8"));

  return Buffer.concat(parts);
}
