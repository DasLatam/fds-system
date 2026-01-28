/* scripts/backfill-audit.ts */
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "documents";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function makeAuditCode() {
  // Código corto, copiable, no adivinable
  // Ej: FES-7H2K-9Q3D-1M8P
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin O/0, I/1
  const rand = (n: number) =>
    Array.from({ length: n }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `FES-${rand(4)}-${rand(4)}-${rand(4)}`;
}

async function sha256HexFromArrayBuffer(ab: ArrayBuffer) {
  const buf = Buffer.from(ab);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

async function main() {
  // Trae docs firmados que tengan final_path pero faltan campos
  const { data: docs, error } = await supabase
    .from("documents")
    .select("id, final_path, audit_code, final_hash_sha256, status")
    .eq("status", "signed")
    .not("final_path", "is", null)
    .or("audit_code.is.null,final_hash_sha256.is.null");

  if (error) throw error;
  if (!docs || docs.length === 0) {
    console.log("No docs to backfill.");
    return;
  }

  console.log(`Found ${docs.length} docs to backfill`);

  for (const d of docs) {
    try {
      const audit_code = d.audit_code ?? makeAuditCode();

      // Descargar final.pdf desde Storage
      const path = d.final_path as string;
      const { data: file, error: dlErr } = await supabase.storage.from(BUCKET).download(path);
      if (dlErr) throw dlErr;
      if (!file) throw new Error("download returned null file");

      const ab = await file.arrayBuffer();
      const final_hash_sha256 = d.final_hash_sha256 ?? (await sha256HexFromArrayBuffer(ab));

      // Guardar en documents
      const { error: upErr } = await supabase
        .from("documents")
        .update({ audit_code, final_hash_sha256 })
        .eq("id", d.id);
      if (upErr) throw upErr;

      // Registrar audit_event opcional (recomendado)
      await supabase.from("audit_events").insert({
        document_id: d.id,
        event_type: "pdf_finalized",
        payload: { backfill: true, audit_code, final_hash_sha256, final_path: path },
      });

      console.log(`OK ${d.id} -> ${audit_code}`);
    } catch (e: any) {
      console.error(`FAIL ${d.id}`, e?.message || e);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});