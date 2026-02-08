import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSimplePdfBytes, htmlToPlainText } from "@/lib/pdf/simplePdf";

export const runtime = "nodejs";

const PreviewBodySchema = z.object({
  title: z.string().min(1).max(120),
  html: z.string().min(1).max(500_000),
});

// Convierte Uint8Array -> ArrayBuffer “exacto” (sin bytes extra del buffer subyacente)
function u8ToArrayBuffer(u8: Uint8Array): ArrayBuffer {
  return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
}

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
    return NextResponse.json({ error: "sr_query_failed", details: srRes.error.message }, { status: 500 });
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

  const docRes = await admin.from("documents").select("original_path").eq("id", sr.document_id).maybeSingle();

  if (docRes.error) {
    console.error("preview documents error:", docRes.error);
    return NextResponse.json({ error: "doc_query_failed", details: docRes.error.message }, { status: 500 });
  }

  const originalPath = docRes.data?.original_path;
  if (!originalPath) return NextResponse.json({ error: "doc_not_found" }, { status: 404 });

  const dl = await admin.storage.from("fds").download(originalPath);
  if (dl.error) {
    console.error("preview storage download error:", dl.error);
    return NextResponse.json({ error: "download_failed", details: dl.error.message }, { status: 500 });
  }

  // ✅ Devolvemos ArrayBuffer (no Uint8Array) para compatibilidad TS
  const ab = await dl.data.arrayBuffer();

  return new NextResponse(ab, {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": 'inline; filename="documento.pdf"',
      "cache-control": "no-store",
    },
  });
}

// Preview privado: usado en "Redactar" para descargar borrador.
// Requiere sesión.
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = PreviewBodySchema.parse(await req.json());
    const bodyText = htmlToPlainText(body.html);
    const pdfBytes = await createSimplePdfBytes({ title: body.title, bodyText });

    // ✅ Convertimos Uint8Array -> ArrayBuffer para que TS no falle
    const ab = u8ToArrayBuffer(pdfBytes);

    return new NextResponse(ab, {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${
          body.title.replaceAll(/[^a-z0-9\-_ ]/gi, "").slice(0, 64) || "documento"
        }.pdf"`,
        "cache-control": "no-store",
      },
    });
  } catch (e: any) {
    const msg = e?.message || "preview_failed";
    return NextResponse.json({ error: "preview_failed", details: msg }, { status: 400 });
  }
}
