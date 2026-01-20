import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createHash } from "crypto";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ token: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;
  const admin = createAdminClient();

  // 1) Get signing request
  const { data: sr, error: srErr } = await admin
    .from("signing_requests")
    .select(
      "id, document_id, email, status, position, opened_at, viewed_at, created_at, expires_at"
    )
    .eq("token", token)
    .single();

  if (srErr || !sr) {
    return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  }

  // 2) Expiration check (best-effort)
  if (sr.status === "pending" && sr.expires_at) {
    const exp = new Date(sr.expires_at as any);
    const nowDate = new Date();

    if (exp.getTime() <= nowDate.getTime()) {
      // mark expired
      await admin
        .from("signing_requests")
        .update({ status: "expired" })
        .eq("id", sr.id);

      await admin.from("audit_events").insert({
        document_id: sr.document_id,
        signing_request_id: sr.id,
        actor_email: sr.email,
        event_type: "link_opened",
        ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
        user_agent: req.headers.get("user-agent") || "unknown",
        payload: {
          token_hash: createHash("sha256").update(token).digest("hex"),
          note: "request expired on open",
        },
      });

      return NextResponse.json({ error: "Link expired" }, { status: 410 });
    }
  }

  // 3) Load document
  const { data: doc, error: docErr } = await admin
    .from("documents")
    .select("id, title, signing_mode, original_path, created_by")
    .eq("id", sr.document_id)
    .single();

  if (docErr || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // 4) Sequential order check
  if (doc.signing_mode === "sequential") {
    const { data: list, error: listErr } = await admin
      .from("signing_requests")
      .select("id, status, position")
      .eq("document_id", doc.id)
      .order("position", { ascending: true });

    if (listErr || !list) {
      return NextResponse.json({ error: "Cannot validate order" }, { status: 500 });
    }

    const firstPending = list.find((r) => r.status !== "signed");
    if (firstPending && firstPending.id !== sr.id) {
      return NextResponse.json({ error: "Not your turn yet" }, { status: 409 });
    }
  }

  // 5) Signed URL for private bucket
  const { data: signed, error: signedErr } = await admin.storage
    .from("fds")
    .createSignedUrl(doc.original_path, 600);

  if (signedErr || !signed?.signedUrl) {
    return NextResponse.json({ error: "Could not create signed URL" }, { status: 500 });
  }

  // 6) Audit + opened_at (idempotent)
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ua = req.headers.get("user-agent") || "unknown";

  if (!sr.opened_at) {
    await admin
      .from("signing_requests")
      .update({ opened_at: new Date().toISOString() })
      .eq("id", sr.id);
  }

  await admin.from("audit_events").insert({
    document_id: doc.id,
    signing_request_id: sr.id,
    actor_email: sr.email,
    event_type: "link_opened",
    ip,
    user_agent: ua,
    payload: { token_hash: createHash("sha256").update(token).digest("hex") },
  });

  return NextResponse.json({
    documentId: doc.id,
    title: doc.title,
    email: sr.email,
    status: sr.status,
    signingMode: doc.signing_mode,
    position: sr.position,
    pdfUrl: signed.signedUrl,
  });
}