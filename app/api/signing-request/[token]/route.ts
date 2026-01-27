import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token || token.length < 10) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400, headers: { "cache-control": "no-store" } });
  }

  const admin = createAdminClient();

  const { data: sr, error: srErr } = await admin
    .from("signing_requests")
    .select("id, document_id, email, status, position, expires_at, opened_at")
    .eq("token", token)
    .maybeSingle();

  if (srErr) {
    console.error("signing-request query failed:", srErr);
    return NextResponse.json({ error: "signing_request_query_failed" }, { status: 500, headers: { "cache-control": "no-store" } });
  }

  if (!sr) {
    return NextResponse.json({ error: "invalid_or_expired" }, { status: 404, headers: { "cache-control": "no-store" } });
  }

  if (sr.expires_at) {
    const exp = new Date(sr.expires_at as string).getTime();
    if (!Number.isNaN(exp) && exp < Date.now() && sr.status === "pending") {
      await admin.from("signing_requests").update({ status: "expired" }).eq("id", sr.id);
      return NextResponse.json({ error: "invalid_or_expired" }, { status: 404, headers: { "cache-control": "no-store" } });
    }
  }
  if (sr.status === "expired") {
    return NextResponse.json({ error: "invalid_or_expired" }, { status: 404, headers: { "cache-control": "no-store" } });
  }

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
    return NextResponse.json({ error: "document_query_failed" }, { status: 500, headers: { "cache-control": "no-store" } });
  }
  if (!doc) {
    return NextResponse.json({ error: "document_not_found" }, { status: 404, headers: { "cache-control": "no-store" } });
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
    },
    { headers: { "cache-control": "no-store" } }
  );
}
