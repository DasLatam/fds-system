import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token || token.length < 10) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: sr, error: srErr } = await admin
    .from("signing_requests")
    .select("id, document_id, email, status, position, expires_at, opened_at")
    .eq("token", token)
    .maybeSingle();

  if (srErr || !sr) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
  }

  // Expiración
  if (sr.expires_at) {
    const exp = new Date(sr.expires_at as string).getTime();
    if (!Number.isNaN(exp) && exp < Date.now() && sr.status === "pending") {
      await admin.from("signing_requests").update({ status: "expired" }).eq("id", sr.id);
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
    }
  }
  if (sr.status === "expired") {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
  }

  // Marcar apertura
  if (!sr.opened_at && sr.status === "pending") {
    await admin.from("signing_requests").update({ opened_at: new Date().toISOString() }).eq("id", sr.id);
  }

  const { data: doc, error: docErr } = await admin
    .from("documents")
    .select("id, title, signing_mode")
    .eq("id", sr.document_id)
    .maybeSingle();

  if (docErr || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // ✅ preview same-origin
  const pdfUrl = `/api/preview?token=${encodeURIComponent(token)}`;

  return NextResponse.json(
    {
      documentId: doc.id,
      title: doc.title,
      email: sr.email,
      status: sr.status,
      signingMode: doc.signing_mode,
      position: sr.position,
      expiresAt: sr.expires_at ?? null,
      pdfUrl,
    },
    { headers: { "cache-control": "no-store" } }
  );
}
