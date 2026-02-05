import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isExpired(expiresAt: string | null | undefined) {
  if (!expiresAt) return false;
  const t = Date.parse(expiresAt);
  if (!Number.isFinite(t)) return false;
  return Date.now() > t;
}

export async function GET(_req: Request, ctx: { params: { token: string } }) {
  try {
    const token = String(ctx?.params?.token || "").trim();
    if (!token) return NextResponse.json({ error: "Invalid link" }, { status: 400 });

    const admin = createAdminClient();

    const { data: sr, error: srErr } = await admin
      .from("signing_requests")
      .select("token,document_id,email,status,position,expires_at,created_at")
      .eq("token", token)
      .maybeSingle();

    if (srErr || !sr) return NextResponse.json({ error: "Invalid link" }, { status: 400 });

    const { data: doc, error: dErr } = await admin
      .from("documents")
      .select("id,title,signing_mode,status")
      .eq("id", (sr as any).document_id)
      .maybeSingle();

    if (dErr || !doc) return NextResponse.json({ error: "Invalid link" }, { status: 400 });

    const expired = isExpired((sr as any).expires_at);
    const status = expired ? "expired" : ((sr as any).status as any);

    // Prefill: por email del firmante (no requiere sesión; el token es el secreto)
    let prefill: any = null;
    const email = String((sr as any).email || "").trim();
    if (email) {
      const { data: prof } = await admin
        .from("profiles")
        .select("full_name,dni,cuil,address,phone,email")
        .ilike("email", email)
        .limit(1)
        .maybeSingle();

      if (prof) {
        prefill = {
          fullName: (prof as any).full_name ?? null,
          dni: (prof as any).dni ?? null,
          cuil: (prof as any).cuil ?? null,
          address: (prof as any).address ?? null,
          phone: (prof as any).phone ?? null,
          email: (prof as any).email ?? null,
        };
      }
    }

    return NextResponse.json(
      {
        documentId: (doc as any).id,
        title: (doc as any).title,
        email: (sr as any).email,
        status,
        signingMode: (doc as any).signing_mode || "parallel",
        position: (sr as any).position ?? null,
        expiresAt: (sr as any).expires_at ?? null,
        pdfUrl: `/api/preview?token=${encodeURIComponent(token)}`,
        prefill,
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("signing-request GET error", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
