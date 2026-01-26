import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function appUrl() {
  const raw = process.env.NEXT_PUBLIC_APP_URL || "https://firmasimple.vercel.app";
  return raw.startsWith("http") ? raw.replace(/\/$/, "") : `https://${raw.replace(/\/$/, "")}`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token || token.length < 10) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const admin = createAdminClient();

  // 1) Intento normal (con expires_at)
  let sr:
    | {
        id: string;
        document_id: string;
        email: string;
        status: "pending" | "signed" | "rejected" | "expired";
        position: number | null;
        expires_at?: string | null;
        opened_at?: string | null;
      }
    | null = null;

  const first = await admin
    .from("signing_requests")
    .select("id, document_id, email, status, position, expires_at, opened_at")
    .eq("token", token)
    .maybeSingle();

  // 2) Si falla por columna inexistente, reintento sin expires_at
  if (first.error && String(first.error.message || "").includes("expires_at")) {
    const second = await admin
      .from("signing_requests")
      .select("id, document_id, email, status, position, opened_at")
      .eq("token", token)
      .maybeSingle();

    if (second.error || !second.data) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
    }

    sr = { ...second.data, expires_at: null };
  } else {
    if (first.error || !first.data) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
    }
    sr = first.data as any;
  }

  // Expiración (si aplica)
  if (sr.expires_at) {
    const exp = new Date(sr.expires_at).getTime();
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
    .select("id, title, signing_mode, original_path")
    .eq("id", sr.document_id)
    .maybeSingle();

  if (docErr || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const signed = await admin.storage.from("fds").createSignedUrl(doc.original_path, 60 * 10);
  if (signed.error || !signed.data) {
    return NextResponse.json({ error: "Failed to load PDF preview" }, { status: 500 });
  }

  return NextResponse.json(
    {
      documentId: doc.id,
      title: doc.title,
      email: sr.email,
      status: sr.status,
      signingMode: doc.signing_mode,
      position: sr.position,
      expiresAt: sr.expires_at ?? null,
      pdfUrl: signed.data.signedUrl,
    },
    { headers: { "cache-control": "no-store" } }
  );
}
