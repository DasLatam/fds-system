/**
 * FES P0-1: bloquear PDFs encriptados en upload
 * - Agrega ignoreEncryption: true en PDFDocument.load
 * - Luego bloquea si pdfDoc.isEncrypted
 *
 * Uso:
 *   node ./tmp/patch_pdf_encryption_block.js
 */
const fs = require("fs");
const path = require("path");

const CANDIDATES = [
  "app/api/documents/upload/route.ts",
  "app/api/document/upload/route.ts",
  "app/api/upload/route.ts",
];

function exists(p) {
  try { fs.accessSync(p, fs.constants.F_OK); return true; } catch { return false; }
}

function read(p) { return fs.readFileSync(p, "utf8"); }
function write(p, s) { fs.writeFileSync(p, s, "utf8"); }

function patchFile(filePath) {
  let src = read(filePath);

  // 1) Asegurar ignoreEncryption: true en PDFDocument.load(...)
  // Soporta patrones simples: PDFDocument.load(pdfBytes) o PDFDocument.load(bytes)
  // Si ya tiene options, no toca.
  const loadCallRegex = /PDFDocument\.load\(\s*([^)]+?)\s*\)/g;

  let changedLoad = false;
  src = src.replace(loadCallRegex, (m, arg) => {
    // si ya tiene objeto options (contiene "{") no tocamos
    if (arg.includes("{")) return m;
    changedLoad = true;
    return `PDFDocument.load(${arg}, { ignoreEncryption: true })`;
  });

  // 2) Insertar bloqueo si isEncrypted
  // Buscamos una asignación típica: const pdfDoc = await PDFDocument.load(...)
  // y agregamos el bloque inmediatamente después.
  const assignRegex = /const\s+(pdfDoc|doc)\s*=\s*await\s+PDFDocument\.load\([^\n;]*\);\s*/m;
  const match = src.match(assignRegex);

  let inserted = false;
  if (match) {
    const varName = match[1];
    const insertBlock =
`\n// FES P0-1: bloquear PDFs encriptados (pdf-lib)
// Nota: ignoreEncryption permite cargar para detectar, pero NO aceptamos PDFs protegidos.
if (${varName} && ${varName}.isEncrypted) {
  return NextResponse.json(
    {
      error: "El PDF está protegido con contraseña (encriptado). Por seguridad, subí una versión sin contraseña.",
      code: "PDF_ENCRYPTED",
    },
    { status: 400 }
  );
}\n`;

    // Evitar duplicar si ya está aplicado
    if (!src.includes("code: \"PDF_ENCRYPTED\"")) {
      src = src.replace(assignRegex, (block) => block + insertBlock);
      inserted = true;
    }
  }

  // 3) Verificar import NextResponse si usamos NextResponse.json
  // Si el archivo no importa NextResponse, intentamos agregarlo de forma conservadora.
  if ((inserted || src.includes("PDF_ENCRYPTED")) && !src.includes("NextResponse")) {
    // No hacemos magia si el archivo no usa NextResponse en absoluto:
    // Solo avisamos.
    console.warn(`[WARN] ${filePath}: no encontré 'NextResponse' en el archivo. Revisá imports manualmente si compila.`);
  }

  if (changedLoad || inserted) {
    const backupPath = `${filePath}.bak_${new Date().toISOString().replace(/[:.]/g, "")}`;
    write(backupPath, read(filePath));
    write(filePath, src);
    console.log(`[OK] Patched: ${filePath}`);
    console.log(`     Backup: ${backupPath}`);
    return true;
  }

  console.log(`[SKIP] No match to patch in: ${filePath}`);
  return false;
}

function main() {
  const found = CANDIDATES.filter(exists);
  if (found.length === 0) {
    console.error("No encontré ningún route candidato de upload:");
    for (const c of CANDIDATES) console.error(" - " + c);
    process.exit(1);
  }

  let any = false;
  for (const f of found) {
    any = patchFile(f) || any;
  }

  if (!any) {
    console.error("Encontré routes candidatos, pero no hallé PDFDocument.load(...) para patch.");
    console.error("Decime en qué archivo se está parseando el PDF y lo ajustamos.");
    process.exit(2);
  }

  console.log("\nListo. Ahora corré:");
  console.log("  npm run build");
  console.log("y probá en producción subiendo un PDF con contraseña (debe rechazarlo con error claro).");
}

main();
