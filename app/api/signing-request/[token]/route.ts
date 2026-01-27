import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

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

  // 1) Buscar por token (normal)
  let { data: sr, error: srErr } = await admin
    .from("signing_requests")
    .select("id, document_id, email, status, position, expires_at, opened_at, replaced_by")
    .eq("token", token)
    .maybeSingle();

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
      .select("id, document_id, email, status, position, expires_at, opened_at, replaced_by, token")
      .eq("id", token)
      .maybeSingle();

    if (byId.error) {
      console.error("signing-request query by id failed:", byId.error);
      return NextResponse.json(
        { error: "signing_request_query_failed" },
        { status: 500, headers: { "cache-control": "no-store" } }
      );
    }

    if (byId.data) {
      sr = byId.data as any;
    }
  }

  if (!sr) {
    return NextResponse.json(
      { error: "invalid_or_expired" },
      { status: 404, headers: { "cache-control": "no-store" } }
    );
  }

  // Reemplazado por resend => inválido
  if ((sr as any).replaced_by) {
    return NextResponse.json(
      { error: "invalid_or_expired" },
      { status: 404, headers: { "cache-control": "no-store" } }
    );
  }

  // Expiración
  if (sr.expires_at) {
    const exp = new Date(sr.expires_at as string).getTime();
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

  // opened_at best effort
  if (!sr.opened_at && sr.status === "pending") {
    await admin.from("signing_requests").update({ opened_at: new Date().toISOString() }).eq("id", sr.id);
  }

  const { data: doc, error: docErr } = await admin
    .from("documents")
    .select("id, title, signing_mode, original_path")
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
      position: sr.position ?? null,
      expiresAt: sr.expires_at ?? null,
      pdfUrl,
      resolvedFromId: Boolean((sr as any).token && (sr as any).token !== token),
    },
    { headers: { "cache-control": "no-store" } }
  );
}
