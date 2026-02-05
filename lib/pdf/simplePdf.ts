function escapePdfString(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export function htmlToPlainText(html: string) {
  let s = String(html || "");

  // Bloques -> saltos
  s = s.replace(/<\s*br\s*\/?\s*>/gi, "\n");
  s = s.replace(/<\s*\/p\s*>/gi, "\n");
  s = s.replace(/<\s*p\b[^>]*>/gi, "");
  s = s.replace(/<\s*\/div\s*>/gi, "\n");
  s = s.replace(/<\s*div\b[^>]*>/gi, "");
  s = s.replace(/<\s*\/h[1-6]\s*>/gi, "\n");
  s = s.replace(/<\s*h[1-6]\b[^>]*>/gi, "");

  // Listas
  s = s.replace(/<\s*li\b[^>]*>/gi, "• ");
  s = s.replace(/<\s*\/li\s*>/gi, "\n");
  s = s.replace(/<\s*\/ol\s*>/gi, "\n");
  s = s.replace(/<\s*\/ul\s*>/gi, "\n");

  // Limpiar etiquetas restantes
  s = s.replace(/<[^>]+>/g, "");

  // Entidades HTML comunes
  s = s.replace(/&nbsp;/g, " ");
  s = s.replace(/&amp;/g, "&");
  s = s.replace(/&lt;/g, "<");
  s = s.replace(/&gt;/g, ">");
  s = s.replace(/&quot;/g, '"');
  s = s.replace(/&#39;/g, "'");

  // Normalizar saltos
  s = s.replace(/\r\n/g, "\n");
  s = s.replace(/\n{3,}/g, "\n\n");

  return s.trim();
}

function wrapLines(text: string, maxChars: number) {
  const lines: string[] = [];
  const paragraphs = String(text || "").split("\n");

  for (const p of paragraphs) {
    const words = p.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }

    let current = "";
    for (const w of words) {
      const next = current ? `${current} ${w}` : w;
      if (next.length > maxChars) {
        if (current) lines.push(current);
        current = w;
      } else {
        current = next;
      }
    }
    if (current) lines.push(current);
  }

  return lines;
}

export function createSimplePdfBytes(opts: { title: string; bodyText: string }) {
  const title = String(opts.title || "").trim();
  const bodyText = String(opts.bodyText || "");

  const pageW = 595; // A4
  const pageH = 842;
  const marginX = 50;
  const marginTop = 72;
  const marginBottom = 72;

  const titleFont = 16;
  const bodyFont = 12;
  const bodyLeading = 14;

  const bodyMaxLines = Math.floor((pageH - marginTop - marginBottom - 28) / bodyLeading);
  const bodyLines = wrapLines(bodyText, 95);

  const pages: string[] = [];

  const makePageContent = (pageIndex: number) => {
    const start = pageIndex * bodyMaxLines;
    const slice = bodyLines.slice(start, start + bodyMaxLines);

    const yStartTitle = pageH - marginTop;
    const yStartBody = yStartTitle - 28;

    const parts: string[] = [];
    parts.push("BT");
    parts.push(`/F1 ${titleFont} Tf`);
    parts.push(`${marginX} ${yStartTitle} Td`);
    parts.push(`(${escapePdfString(title)}) Tj`);
    parts.push("ET");

    // Body
    parts.push("BT");
    parts.push(`/F1 ${bodyFont} Tf`);
    parts.push(`${marginX} ${yStartBody} Td`);
    parts.push(`${bodyLeading} TL`); // leading

    for (let i = 0; i < slice.length; i++) {
      const line = slice[i] ?? "";
      if (i === 0) {
        parts.push(`(${escapePdfString(line)}) Tj`);
      } else {
        parts.push("T*");
        parts.push(`(${escapePdfString(line)}) Tj`);
      }
    }

    parts.push("ET");

    return parts.join("\n") + "\n";
  };

  const pageCount = Math.max(1, Math.ceil(bodyLines.length / bodyMaxLines));
  for (let i = 0; i < pageCount; i++) pages.push(makePageContent(i));

  // PDF objects
  const objects: string[] = [];
  const offsets: number[] = [0];

  const pushObj = (obj: string) => {
    const currentLen = objects.join("").length;
    offsets.push(currentLen);
    objects.push(obj);
  };

  // 1: Catalog
  pushObj("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  // 2: Pages root - kids to be filled later
  // We'll place a placeholder and replace after we know kids.
  pushObj("2 0 obj\n<< /Type /Pages /Kids [KIDS] /Count [COUNT] >>\nendobj\n");
  // 3: Font
  pushObj("3 0 obj\n<< /Type /Font /Subtype /Type1 /Name /F1 /BaseFont /Helvetica >>\nendobj\n");

  const pageObjNums: number[] = [];
  const contentObjNums: number[] = [];

  let nextObjNum = 4;
  for (let i = 0; i < pages.length; i++) {
    const pageObj = nextObjNum++;
    const contentObj = nextObjNum++;
    pageObjNums.push(pageObj);
    contentObjNums.push(contentObj);

    pushObj(
      `${pageObj} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObj} 0 R >>\nendobj\n`
    );

    const stream = pages[i];
    const len = Buffer.byteLength(stream, "utf8");
    pushObj(
      `${contentObj} 0 obj\n<< /Length ${len} >>\nstream\n${stream}endstream\nendobj\n`
    );
  }

  // Replace kids/count in obj 2
  const kids = pageObjNums.map((n) => `${n} 0 R`).join(" ");
  const count = pageObjNums.length;
  objects[1] = objects[1].replace("[KIDS]", kids).replace("[COUNT]", String(count));

  // Build xref
  const body = "%PDF-1.4\n" + objects.join("");
  const xrefStart = Buffer.byteLength(body, "utf8");

  let xref = "xref\n0 " + (offsets.length) + "\n";
  xref += "0000000000 65535 f \n";

  // offsets[1] corresponds to obj 1 position relative to body start after header? we used objects.join length without header.
  // Need absolute offsets in full file. We'll compute by scanning body? We'll compute by accumulating.
  const headerLen = Buffer.byteLength("%PDF-1.4\n", "utf8");

  // Recompute offsets properly by walking through objects
  let running = headerLen;
  const objOffsets: number[] = [0];
  for (const obj of objects) {
    objOffsets.push(running);
    running += Buffer.byteLength(obj, "utf8");
  }

  for (let i = 1; i < objOffsets.length; i++) {
    const off = objOffsets[i];
    xref += String(off).padStart(10, "0") + " 00000 n \n";
  }

  const trailer =
    "trailer\n" +
    `<< /Size ${objOffsets.length} /Root 1 0 R >>\n` +
    "startxref\n" +
    `${xrefStart}\n` +
    "%%EOF\n";

  const full = body + xref + trailer;
  return new TextEncoder().encode(full);
}
