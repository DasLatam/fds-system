import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type SR = {
  id: string;
  document_id: string;
  email?: string | null;
  status?: string | null;
  expires_at?: string | null;
  // token puede NO existir en tu schema
  token?: string | null;
};

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

  const admin = createAdminClient();

  // SELECT mínimo: solo columnas "core"
  const SR_SELECT = "id, document_id, email, status, expires_at";

  // 1) Intento por columna token (si existe en el schema)
  let sr: SR | null = null;

  const byToken = await admin
    .from("signing_requests")
    .select(SR_SELECT)
    .eq("token", token)
    .maybeSingle<SR>();

  if (!byToken.error && byToken.data) {
    sr = byToken.data;
  }

  // 2) Si falló (por ejemplo: columna token no existe) o no encontró, fallback por id
  if (!sr) {
    const byId = await admin
      .from("signing_requests")
      .select(SR_SELECT)
      .eq("id", token)
      .maybeSingle<SR>();

    if (byId.error) {
      console.error("signing_requests query failed:", {
        byTokenError: byToken.error,
        byIdError: byId.error,
      });

      return NextResponse.json(
        { error: "signing_request_query_failed" },
        { status: 500, headers: { "cache-control": "no-store" } }
      );
    }

    sr = byId.data ?? null;
  }

  if (!sr) {
    return NextResponse.json(
      { error: "invalid_or_expired" },
      { status: 404, headers: { "cache-control": "no-store" } }
    );
  }

  // Expiración (best effort)
  if (sr.expires_at) {
    const exp = new Date(sr.expires_at).getTime();
    if (!Number.isNaN(exp) && exp < Date.now() && (sr.status ?? "pending") === "pending") {
      // OJO: no hacemos UPDATE de status si no estás 100% seguro de schema.
      return NextResponse.json(
        { error: "invalid_or_expired" },
        { status: 404, headers: { "cache-control": "no-store" } }
      );
    }
  }

  if ((sr.status ?? "pending") === "expired") {
    return NextResponse.json(
      { error: "invalid_or_expired" },
      { status: 404, headers: { "cache-control": "no-store" } }
    );
  }

  // Documents: NO pedir original_path en Sprint #2
  const { data: doc, error: docErr } = await admin
    .from("documents")
    .select("id, title, signing_mode")
    .eq("id", sr.document_id)
    .maybeSingle();

  if (docErr) {
    console.error("documents query failed:", docErr);
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
      position: null, // Sprint futuro si querés reintroducirlo con migración
      expiresAt: sr.expires_at ?? null,
      pdfUrl,
      resolvedFromId: true, // porque estamos permitiendo lookup por id
    },
    { headers: { "cache-control": "no-store" } }
  );
}