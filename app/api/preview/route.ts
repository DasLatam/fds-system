import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";

  if (!token || token.length < 10) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: sr, error: srErr } = await admin
    .from("signing_requests")
    .select("id, document_id, status, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (srErr) {
    console.error("preview sr query failed:", srErr);
    return NextResponse.json({ error: "sr_query_failed" }, { status: 500 });
  }
  if (!sr) return NextResponse.json({ error: "invalid_or_expired" }, { status: 404 });

  if (sr.expires_at) {
    const exp = new Date(sr.expires_at as string).getTime();
    if (!Number.isNaN(exp) && exp < Date.now() && sr.status === "pending") {
      await admin.from("signing_requests").update({ status: "expired" }).eq("id", sr.id);
      return NextResponse.json({ error: "invalid_or_expired" }, { status: 404 });
    }
  }
  if (sr.status === "expired") return NextResponse.json({ error: "invalid_or_expired" }, { status: 404 });

  const { data: doc, error: docErr } = await admin
    .from("documents")
    .select("original_path")
    .eq("id", sr.document_id)
    .maybeSingle();

  if (docErr) {
    console.error("preview doc query failed:", docErr);
    return NextResponse.json({ error: "doc_query_failed" }, { status: 500 });
  }
  if (!doc?.original_path) return NextResponse.json({ error: "doc_not_found" }, { status: 404 });

  const dl = await admin.storage.from("fds").download(doc.original_path);
  if (dl.error) {
    console.error("preview download failed:", dl.error);
    return NextResponse.json({ error: "download_failed" }, { status: 500 });
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
