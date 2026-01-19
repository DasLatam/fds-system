import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createHash } from "crypto";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ token: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;

  const admin = createAdminClient();

  // 1) Buscar signing_request por token
  const { data: sr, error: srErr } = await admin
    .from("signing_requests")
    .select(
      "id, document_id, email, status, position, opened_at, viewed_at, created_at"
    )
    .eq("token", token)
    .single();

  if (srErr || !sr) {
    return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  }

  // 2) Buscar documento
  const { data: doc, error: docErr } = await admin
    .from("documents")
    .select("id, title, signing_mode, original_path, created_by")
    .eq("id", sr.document_id)
    .single();

  if (docErr || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // 3) En modo secuencial, validar turno
  if (doc.signing_mode === "sequential") {
    const { data: pending, error: pendErr } = await admin
      .from("signing_requests")
      .select("id, position, status")
      .eq("document_id", doc.id)
      .order("position", { ascending: true });

    if (pendErr || !pending) {
      return NextResponse.json({ error: "Cannot validate order" }, { status: 500 });
    }

    const firstPending = pending.find((r) => r.status !== "signed");
    if (firstPending && firstPending.id !== sr.id) {
      return NextResponse.json(
        { error: "Not your turn to sign yet" },
        { status: 409 }
      );
    }
  }

  // 4) Generar signed URL del PDF original (bucket privado)
  const { data: signed, error: signedErr } = await admin.storage
    .from("fds")
    .createSignedUrl(doc.original_path, 600); // 10 min

  if (signedErr || !signed?.signedUrl) {
    return NextResponse.json(
      { error: "Could not create signed URL" },
      { status: 500 }
    );
  }

  // 5) Registrar auditoría "link_opened" (idempotente: solo si no estaba)
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ua = req.headers.get("user-agent") || "unknown";

  // marcar opened_at si no estaba
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
    payload: {
      token_hash: createHash("sha256").update(token).digest("hex"),
    },
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