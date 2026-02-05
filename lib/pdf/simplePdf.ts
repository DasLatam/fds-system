import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

function decodeEntities(s: string): string {
  const map: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
  };

  return String(s || "").replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (m, g1) => {
    if (!g1) return m;

    // numeric entities
    if (g1.startsWith("#x") || g1.startsWith("#X")) {
      const code = parseInt(g1.slice(2), 16);
      if (Number.isFinite(code)) return String.fromCodePoint(code);
      return m;
    }
    if (g1.startsWith("#")) {
      const code = parseInt(g1.slice(1), 10);
      if (Number.isFinite(code)) return String.fromCodePoint(code);
      return m;
    }

    const key = String(g1).toLowerCase();
    if (map[key] != null) return map[key];
    return m;
  });
}

export function htmlToPlainText(html: string): string {
  let s = String(html || "");
  s = s.replace(/\r\n?/g, "\n");
  s = s.replace(/<\s*br\s*\/?>/gi, "\n");
  s = s.replace(/<\/\s*(div|p|h1|h2|h3|h4|h5|h6)\s*>/gi, "\n");
  s = s.replace(/<\s*li\b[^>]*>/gi, "• ");
  s = s.replace(/<\/\s*li\s*>/gi, "\n");
  s = s.replace(/<\/\s*(ul|ol)\s*>/gi, "\n");

  // remove opening tags for common containers
  s = s.replace(/<\s*(div|p|h1|h2|h3|h4|h5|h6|ul|ol)\b[^>]*>/gi, "");
  s = s.replace(/<\s*span\b[^>]*>/gi, "");
  s = s.replace(/<\/\s*span\s*>/gi, "");

  // strip anything else
  s = s.replace(/<[^>]+>/g, "");

  s = decodeEntities(s);

  // normalize spaces, keep newlines
  s = s.replace(/[ \t]+\n/g, "\n");
  s = s.replace(/\n{3,}/g, "\n\n");
  s = s.replace(/[ \t]{2,}/g, " ");

  return s.trim();
}

type FontLike = {
  widthOfTextAtSize: (text: string, size: number) => number;
};

function wrapText(text: string, font: FontLike, fontSize: number, maxWidth: number): string[] {
  const t = String(text || "");
  if (!t.trim()) return [""];

  const words = t.split(/\s+/g);
  const lines: string[] = [];
  let line = "";

  for (const w of words) {
    const candidate = line ? `${line} ${w}` : w;

    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
      line = candidate;
      continue;
    }

    if (line) lines.push(line);

    // if single word is too long, hard-break it
    if (font.widthOfTextAtSize(w, fontSize) <= maxWidth) {
      line = w;
      continue;
    }

    let chunk = "";
    for (const ch of w) {
      const c2 = chunk + ch;
      if (font.widthOfTextAtSize(c2, fontSize) <= maxWidth) {
        chunk = c2;
      } else {
        if (chunk) lines.push(chunk);
        chunk = ch;
      }
    }
    line = chunk;
  }

  if (line) lines.push(line);
  return lines.length ? lines : [t];
}

export async function createSimplePdfBytes(opts: { title: string; bodyText: string }): Promise<Uint8Array> {
  const title = String(opts?.title || "").trim() || "Documento";
  const bodyText = String(opts?.bodyText || "").replace(/\r\n?/g, "\n").trim();

  const pdf = await PDFDocument.create();
  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // A4 portrait
  const pageWidth = 595.28;
  const pageHeight = 841.89;

  const marginX = 56;
  const marginTop = 56;
  const marginBottom = 56;
  const contentWidth = pageWidth - marginX * 2;

  const titleSize = 18;
  const bodySize = 12;
  const leading = 1.35;

  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - marginTop;

  const ensureSpace = (needed: number) => {
    if (y - needed >= marginBottom) return;
    page = pdf.addPage([pageWidth, pageHeight]);
    y = pageHeight - marginTop;
  };

  // Title
  const titleLines = wrapText(title, fontBold, titleSize, contentWidth);
  for (const line of titleLines) {
    ensureSpace(titleSize * leading);
    page.drawText(line, {
      x: marginX,
      y: y - titleSize,
      size: titleSize,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    y -= titleSize * leading;
  }

  y -= 8;

  const rawLines = bodyText ? bodyText.split("\n") : [];
  const baseIndent = 0;
  const bulletIndent = 14;

  for (const raw of rawLines) {
    const trimmed = raw.replace(/\s+$/g, "");
    if (!trimmed.trim()) {
      y -= bodySize * 0.8;
      continue;
    }

    const isBullet = trimmed.trim().startsWith("• ");
    const lineText = isBullet ? trimmed.trim().slice(2).trim() : trimmed;
    const indent = isBullet ? bulletIndent : baseIndent;
    const maxW = contentWidth - indent;

    const wrapped = wrapText(lineText, fontRegular, bodySize, maxW);

    wrapped.forEach((wline, idx) => {
      ensureSpace(bodySize * leading);

      if (isBullet && idx === 0) {
        page.drawText("•", {
          x: marginX,
          y: y - bodySize,
          size: bodySize,
          font: fontRegular,
          color: rgb(0, 0, 0),
        });
      }

      page.drawText(wline, {
        x: marginX + indent,
        y: y - bodySize,
        size: bodySize,
        font: fontRegular,
        color: rgb(0, 0, 0),
      });

      y -= bodySize * leading;
    });
  }

  return pdf.save();
}
