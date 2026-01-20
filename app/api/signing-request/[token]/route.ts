import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logEvent } from "@/lib/audit/logEvent";

export const runtime = "nodejs";

function getIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ token: string }> }
) {
  const { token } = await ctx.params;
  const admin = createAdminClient();
  const ip = getIp(req);
  const userAgent = req.headers.get("user-agent") || "";

  const { data: sr, error: srErr } = await admin
    .from("signing_requests")
    .select("id, document_id, email, status, position, opened_at, expires_at")
    .eq("token", token)
    .maybeSingle();
  if (srErr || !sr) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
  }

  // Expiration (best-effort): if pending and expired, mark as expired
  const now = new Date();
  if (sr.status === "pending" && sr.expires_at) {
    const exp = new Date(sr.expires_at as any);
    if (exp.getTime() <= now.getTime()) {
      await admin.from("signing_requests").update({ status: "expired" }).eq("id", sr.id);
      (sr as any).status = "expired";
    }
  }

  // Expiration (best-effort): if pending and expired, mark as expired
  const now = new Date();
  if (sr.status === "pending" && sr.expires_at) {
    const exp = new Date(sr.expires_at as any);
    if (exp.getTime() <= now.getTime()) {
      await admin.from("signing_requests").update({ status: "expired" }).eq("id", sr.id);
      (sr as any).status = "expired";
    }
  }

  const { data: doc, error: docErr } = await admin
    .from("documents")
    .select("id, title, signing_mode, original_path")
    .eq("id", sr.document_id)
    .maybeSingle();

  if (docErr || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Mark opened/viewed (best-effort)
  const nowIso = new Date().toISOString();
  if (!sr.opened_at) {
    await admin.from("signing_requests").update({ opened_at: nowIso }).eq("id", sr.id);
    await logEvent({
      documentId: doc.id,
      signingRequestId: sr.id,
      actorEmail: sr.email,
      eventType: "link_opened",
      ip,
      userAgent,
    });
  }

  await logEvent({
    documentId: doc.id,
    signingRequestId: sr.id,
    actorEmail: sr.email,
    eventType: "pdf_viewed",
    ip,
    userAgent,
  });

  // Signed URL for preview
  const signed = await admin.storage.from("fds").createSignedUrl(doc.original_path, 60 * 10);
  if (signed.error || !signed.data) {
    return NextResponse.json({ error: signed.error?.message || "Failed to create signed url" }, { status: 500 });
  }

  return NextResponse.json({
    documentId: doc.id,
    title: doc.title,
    email: sr.email,
    status: sr.status,
    signingMode: doc.signing_mode,
    position: sr.position,
    expiresAt: sr.expires_at ?? null,
    pdfUrl: signed.data.signedUrl,
  });
}
