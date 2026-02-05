import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const BUCKET = "fds";

// DOC IRS (el que vos listaste)
const DOCUMENT_ID = "b8d4aed1-1380-4a0d-a31c-b3372af583de";
const FINAL_PATH =
  "6a00e39b-a9d4-4341-923a-10e7bbcabf4b/b8d4aed1-1380-4a0d-a31c-b3372af583de/final/final.pdf";

// Código del PDF que estás verificando
const AUDIT_CODE = "669026E1475E69AF";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function sha256HexFromArrayBuffer(ab: ArrayBuffer) {
  return crypto.createHash("sha256").update(Buffer.from(ab)).digest("hex");
}

async function main() {
  // 1) descargar final.pdf
  const { data: file, error: dlErr } = await supabase.storage.from(BUCKET).download(FINAL_PATH);
  if (dlErr) throw dlErr;
  if (!file) throw new Error("download returned null file");

  const ab = await file.arrayBuffer();
  const final_hash_sha256 = await sha256HexFromArrayBuffer(ab);

  // 2) update documents
  const { error: upErr } = await supabase
    .from("documents")
    .update({
      audit_code: AUDIT_CODE,
      final_hash_sha256,
    })
    .eq("id", DOCUMENT_ID);

  if (upErr) throw upErr;

  console.log("OK updated:", {
    document_id: DOCUMENT_ID,
    audit_code: AUDIT_CODE,
    final_hash_sha256,
  });
}

main().catch((e) => {
  console.error("FAIL:", e?.message || e);
  process.exit(1);
});
