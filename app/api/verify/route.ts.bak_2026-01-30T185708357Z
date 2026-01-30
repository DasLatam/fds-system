import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function bad(msg: string, code = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status: code });
}

function getIp(req: Request) {
  const xf = req.headers.get("x-forwarded-for") || "";
  const ip = xf.split(",")[0]?.trim();
  return ip || req.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function POST(req: Request) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return bad("Server misconfigured", 500);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return bad("Invalid JSON body");
  }

  const audit_code = String(body?.audit_code || "").trim();
  const sha256 = String(body?.sha256 || "").trim().toLowerCase();

  if (!audit_code) return bad("Missing audit_code");
  if (!/^[a-f0-9]{64}$/.test(sha256)) return bad("Invalid sha256");

  const ip = getIp(req);
  const userAgent = req.headers.get("user-agent") || "";

  // 1) Buscar documento por audit_code
  const { data: doc, error: docErr } = await supabase
    .from("documents")
    .select("id, title, status, completed_at, audit_code, final_hash_sha256")
    .eq("audit_code", audit_code)
    .maybeSingle();

  if (docErr) return bad("DB error", 500);
  if (!doc) {
    // métrica igual (código inválido)
    await supabase.from("verification_events").insert({
      audit_code,
      match: null,
      provided_sha256: sha256,
      ip,
      user_agent: userAgent,
    });
    return bad("Código inválido", 404);
  }

  if (doc.status !== "signed") {
    // métrica (documento no finalizado)
    await supabase.from("verification_events").insert({
      audit_code,
      match: false,
      provided_sha256: sha256,
      ip,
      user_agent: userAgent,
    });

    return NextResponse.json({
      ok: true,
      match: false,
      reason: "Documento aún no finalizado",
      document: {
        title: doc.title,
        status: doc.status,
        completed_at: doc.completed_at,
        audit_code: doc.audit_code,
      },
    });
  }

  if (!doc.final_hash_sha256) {
    await supabase.from("verification_events").insert({
      audit_code,
      match: null,
      provided_sha256: sha256,
      ip,
      user_agent: userAgent,
    });
    return bad("Documento sin hash final (backfill pendiente)", 500);
  }

  // 2) Firmantes (público)
  const { data: signers, error: sErr } = await supabase
    .from("signing_requests")
    .select("email, signer_full_name, signed_at, status")
    .eq("document_id", doc.id)
    .order("position", { ascending: true });

  if (sErr) return bad("DB error", 500);

  const match = sha256 === String(doc.final_hash_sha256).toLowerCase();

  // 3) Métrica dedicada (nuevo)
  await supabase.from("verification_events").insert({
    audit_code,
    match,
    provided_sha256: sha256,
    ip,
    user_agent: userAgent,
  });

  // 4) Mantener audit_events (lo que ya tenías)
  await supabase.from("audit_events").insert({
    document_id: doc.id,
    event_type: "pdf_viewed",
    payload: { kind: "public_verify", audit_code, provided_sha256: sha256, match },
  });

  return NextResponse.json({
    ok: true,
    match,
    document: {
      title: doc.title,
      completed_at: doc.completed_at,
      audit_code: doc.audit_code,
      status: doc.status,
      final_hash_sha256: doc.final_hash_sha256, // si preferís no devolverlo, lo sacamos luego
    },
    signers: (signers || []).map((s: any) => ({
      full_name: s.signer_full_name,
      email: s.email,
      signed_at: s.signed_at,
      status: s.status,
    })),
  });
}