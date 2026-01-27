import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const value = (url.searchParams.get("token") || "").trim();

  if (!value || value.length < 10) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  }

  const admin = createAdminClient();

  // 1) Buscar por token
  let srRes = await admin
    .from("signing_requests")
    .select("id, document_id, status, expires_at")
    .eq("token", value)
    .maybeSingle();

  // 2) Fallback: buscar por id (por si el link trae el id)
  if (!srRes.data && !srRes.error) {
    srRes = await admin
      .from("signing_requests")
      .select("id, document_id, status, expires_at")
      .eq("id", value)
      .maybeSingle();
  }

  if (srRes.error) {
    console.error("preview signing_requests error:", srRes.error);
    return NextResponse.json(
      { error: "sr_query_failed", details: srRes.error.message },
      { status: 500 }
    );
  }

  const sr = srRes.data;
  if (!sr) return NextResponse.json({ error: "invalid_or_expired" }, { status: 404 });

  // Expiración
  if (sr.expires_at) {
    const exp = new Date(sr.expires_at as string).getTime();
    if (!Number.isNaN(exp) && exp < Date.now() && sr.status === "pending") {
      await admin.from("signing_requests").update({ status: "expired" }).eq("id", sr.id);
      return NextResponse.json({ error: "invalid_or_expired" }, { status: 404 });
    }
  }
  if (sr.status === "expired") return NextResponse.json({ error: "invalid_or_expired" }, { status: 404 });

  const docRes = await admin
    .from("documents")
    .select("original_path")
    .eq("id", sr.document_id)
    .maybeSingle();

  if (docRes.error) {
    console.error("preview documents error:", docRes.error);
    return NextResponse.json(
      { error: "doc_query_failed", details: docRes.error.message },
      { status: 500 }
    );
  }

  const originalPath = docRes.data?.original_path;
  if (!originalPath) return NextResponse.json({ error: "doc_not_found" }, { status: 404 });

  const dl = await admin.storage.from("fds").download(originalPath);
  if (dl.error) {
    console.error("preview storage download error:", dl.error);
    return NextResponse.json(
      { error: "download_failed", details: dl.error.message },
      { status: 500 }
    );
  }

  const bytes = new Uint8Array(await dl.data.arrayBuffer());

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": 'inline; filename="documento.pdf"',
      "cache-control": "no-store",
    },
  });
}
