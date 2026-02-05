import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const TokenSchema = z.string().min(10);

function pickToken(req: NextRequest, paramsToken?: string) {
  const fromParams = String(paramsToken ?? "").trim();
  if (fromParams) return fromParams;

  // fallback: si algún cliente usa querystring (legacy)
  const qs = req.nextUrl.searchParams.get("token");
  return String(qs ?? "").trim();
}

function safeNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function GET(req: NextRequest, ctx: { params: { token?: string } }) {
  const token = pickToken(req, ctx?.params?.token);

  const parsed = TokenSchema.safeParse(token);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  }

  const admin = createAdminClient();

  // 1) Lookup signing_request por token (public endpoint)
  const srRes = await admin.from("signing_requests").select("*").eq("token", token).maybeSingle();

  if (srRes.error || !srRes.data) {
    return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  }

  const sr: any = srRes.data;
  const documentId = String(sr.document_id ?? "");
  if (!documentId) {
    return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  }

  // 2) Lookup documento (título + signing_mode + paths)
  const docRes = await admin
    .from("documents")
    .select("id,title,signing_mode,original_path,status")
    .eq("id", documentId)
    .maybeSingle();

  if (docRes.error || !docRes.data) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const doc: any = docRes.data;

  // 3) Estado / expiración (si existe columna expires_at)
  const now = Date.now();
  const expiresAtRaw: string | null =
    (sr.expires_at as string | null) ?? (sr.expiresAt as string | null) ?? null;

  let status: "pending" | "signed" | "rejected" | "expired" = String(sr.status || "pending") as any;
  if (status === "pending" && expiresAtRaw) {
    const t = Date.parse(expiresAtRaw);
    if (Number.isFinite(t) && t < now) status = "expired";
  }

  const email = String(sr.email ?? "").toLowerCase();

  // 4) Autofill (best-effort) por email del firmante
  let prefill: any = null;
  if (email) {
    const profRes = await admin
      .from("profiles")
      .select("full_name,dni,cuil,address,phone")
      .eq("email", email)
      .maybeSingle();

    if (!profRes.error && profRes.data) {
      prefill = {
        fullName: String((profRes.data as any).full_name ?? ""),
        dni: String((profRes.data as any).dni ?? ""),
        cuil: String((profRes.data as any).cuil ?? ""),
        address: String((profRes.data as any).address ?? ""),
        phone: String((profRes.data as any).phone ?? ""),
      };
    }
  }

  // 5) Signing mode / position
  const signingMode = (String(doc.signing_mode ?? sr.signing_mode ?? "parallel") as any) as
    | "parallel"
    | "sequential";

  const position =
    safeNumber(sr.position) ?? safeNumber(sr.signing_order) ?? safeNumber(sr.order) ?? null;

  // 6) PDF preview URL (ruta existente)
  const pdfUrl = `/api/preview?token=${encodeURIComponent(token)}`;

  return NextResponse.json({
    documentId: String(doc.id),
    title: String(doc.title ?? ""),
    email,
    status,
    signingMode,
    position,
    expiresAt: expiresAtRaw,
    pdfUrl,
    prefill,
  });
}
