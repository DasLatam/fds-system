import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type SigningRequestRow = {
  id: string;
  document_id: string;
  email?: string | null;
  status?: string | null;
  position?: number | null;
  expires_at?: string | null;
  opened_at?: string | null;
  token?: string | null;
};

export async function GET(_req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;

  if (!token || token.length < 10) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400, headers: { "cache-control": "no-store" } });
  }

  const admin = createAdminClient();

  // 1) Buscar por token (normal)
  let { data: sr, error: srErr } = await admin
    .from("signing_requests")
    .select("*") // <- evita 500 si faltan columnas en el schema real
    .eq("token", token)
    .maybeSingle<SigningRequestRow>();

  if (srErr) {
    console.error("signing-request query by token failed:", srErr);
    return NextResponse.json(
      { error: "signing_request_query_failed" },
      { status: 500, headers: { "cache-control": "no-store" } }
    );
  }

  // 2) Fallback: si alguien está usando el ID como token
  if (!sr) {
    const byId = await admin
      .from("signing_requests")
      .select("*") // <- mismo motivo
      .eq("id", token)
      .maybeSingle<SigningRequestRow>();

    if (byId.error) {
      console.error("signing-request query by id failed:", byId.error);
      return NextResponse.json(
        { error: "signing_request_query_failed" },
        { status: 500, headers: { "cache-control": "no-store" } }
      );
    }

    if (byId.data) sr = byId.data;
  }

  if (!sr) {
    return NextResponse.json(
      { error: "invalid_or_expired" },
      { status: 404, headers: { "cache-control": "no-store" } }
    );
  }

  // Expiración (best-effort)
  if (sr.expires_at) {
    const exp = new Date(sr.expires_at).getTime();
    if (!Number.isNaN(exp) && exp < Date.now() && sr.status === "pending") {
      await admin.from("signing_requests").update({ status: "expired" }).eq("id", sr.id);
      return NextResponse.json(
        { error: "invalid_or_expired" },
        { status: 404, headers: { "cache-control": "no-store" } }
      );
    }
  }

  if (sr.status === "expired") {
    return NextResponse.json(
      { error: "invalid_or_expired" },
      { status: 404, headers: { "cache-control": "no-store" } }
    );
  }

  // opened_at best effort (solo si existe; si no existe igual no rompe porque update se ignora? NO: en Postgres rompe.
  // Entonces: lo intentamos SOLO si el valor viene en el row (select("*") lo trae si existe).
  if ((sr as any).opened_at === null && sr.status === "pending") {
    try {
      await admin
        .from("signing_requests")
        .update({ opened_at: new Date().toISOString() })
        .eq("id", sr.id);
    } catch (e) {
      // No frenamos Sprint #2 por tracking
      console.warn("opened_at update skipped:", e);
    }
  }

  // Ojo: acá antes pedías original_path. Para Sprint #2 no lo necesitás.
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
      status: (sr.status as any) ?? "pending",
      signingMode: (doc.signing_mode as any) ?? "parallel",
      position: (sr as any).position ?? null,
      expiresAt: sr.expires_at ?? null,
      pdfUrl,
      resolvedFromId: Boolean((sr as any).token && (sr as any).token !== token),
    },
    { headers: { "cache-control": "no-store" } }
  );
}