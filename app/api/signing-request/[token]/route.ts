import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ token: string }> }
) {
  const { token } = await ctx.params;

  if (!token || token.length < 10) {
    return NextResponse.json(
      { error: "invalid_token" },
      { status: 400, headers: { "cache-control": "no-store" } }
    );
  }

  // Tu schema define signing_requests.token como uuid NOT NULL UNIQUE.
  // Si llega algo que no es UUID, evitamos que PostgREST rompa con 500.
  if (!UUID_RE.test(token)) {
    return NextResponse.json(
      { error: "invalid_token_format" },
      { status: 400, headers: { "cache-control": "no-store" } }
    );
  }

  // Guardrail de envs (por si Vercel no los inyecta en runtime)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    console.error("Missing Supabase envs", {
      hasUrl: Boolean(url),
      hasServiceRoleKey: Boolean(serviceRoleKey),
    });
    return NextResponse.json(
      { error: "server_misconfigured_missing_supabase_service_key" },
      { status: 500, headers: { "cache-control": "no-store" } }
    );
  }

  const admin = createAdminClient();

  // 1) Buscar por token (normal)
  let { data: sr, error: srErr } = await admin
    .from("signing_requests")
    .select("id, document_id, email, status, position, expires_at, opened_at")
    .eq("token", token)
    .maybeSingle();

  if (srErr) {
    console.error(
      "signing-request query by token failed:",
      JSON.stringify(srErr, null, 2)
    );
    return NextResponse.json(
      { error: "signing_request_query_failed" },
      { status: 500, headers: { "cache-control": "no-store" } }
    );
  }

  // 2) Fallback: si alguien está usando el ID como token (uuid también)
  if (!sr) {
    const byId = await admin
      .from("signing_requests")
      .select("id, document_id, email, status, position, expires_at, opened_at, token")
      .eq("id", token)
      .maybeSingle();

    if (byId.error) {
      console.error(
        "signing-request query by id failed:",
        JSON.stringify(byId.error, null, 2)
      );
      return NextResponse.json(
        { error: "signing_request_query_failed" },
        { status: 500, headers: { "cache-control": "no-store" } }
      );
    }

    if (byId.data) sr = byId.data as any;
  }

  if (!sr) {
    return NextResponse.json(
      { error: "invalid_or_expired" },
      { status: 404, headers: { "cache-control": "no-store" } }
    );
  }

  // Expiración
  if (sr.expires_at) {
    const exp = new Date(sr.expires_at as string).getTime();
    if (!Number.isNaN(exp) && exp < Date.now() && sr.status === "pending") {
      // OJO: esto asume que status admite 'expired'. En tu schema, NO lo admite.
      // Para Sprint #2 evitamos el update para no romper por CHECK constraint.
      return NextResponse.json(
        { error: "invalid_or_expired" },
        { status: 404, headers: { "cache-control": "no-store" } }
      );
    }
  }

  // opened_at best effort (esto existe en tu schema)
  if (!sr.opened_at && sr.status === "pending") {
    const upd = await admin
      .from("signing_requests")
      .update({ opened_at: new Date().toISOString() })
      .eq("id", sr.id);

    if (upd.error) {
      // No frenamos el flujo por tracking
      console.warn("opened_at update failed:", JSON.stringify(upd.error, null, 2));
    }
  }

  const { data: doc, error: docErr } = await admin
    .from("documents")
    .select("id, title, signing_mode, original_path")
    .eq("id", sr.document_id)
    .maybeSingle();

  if (docErr) {
    console.error("documents query failed:", JSON.stringify(docErr, null, 2));
    return NextResponse.json(
      { error: "document_query_failed" },
      { status: 500, headers: { "cache-control": "no-store" } }
    );
  }

  if (!doc) {
    return NextResponse.json(
      { error: "document_not_found" },
      { status: 404, headers: { "cache-control": "no-store" } }
    );
  }

  const pdfUrl = `/api/preview?token=${encodeURIComponent(token)}`;

  return NextResponse.json(
    {
      documentId: doc.id,
      title: doc.title ?? "Documento",
      email: sr.email ?? "",
      status: sr.status ?? "pending",
      signingMode: doc.signing_mode ?? "parallel",
      position: sr.position ?? null,
      expiresAt: sr.expires_at ?? null,
      pdfUrl,
      resolvedFromId: Boolean((sr as any).token && (sr as any).token !== token),
    },
    { headers: { "cache-control": "no-store" } }
  );
}