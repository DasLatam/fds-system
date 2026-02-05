import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function env(name: string): string | null {
  const v = process.env[name];
  return v && v.trim().length ? v.trim() : null;
}

function getSupabaseAdmin() {
  const url = env("SUPABASE_URL") ?? env("NEXT_PUBLIC_SUPABASE_URL");
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new Error("server_misconfig");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function extractToken(req: NextRequest, paramsToken?: string): string | null {
  // 1) params
  const p = (paramsToken || "").trim();
  if (p) return p;

  // 2) query param token
  const sp = req.nextUrl.searchParams;
  const q1 = (sp.get("token") || "").trim();
  if (q1) return q1;

  // 3) Next internal prefetch param
  const q2 = (sp.get("nxtPtoken") || "").trim();
  if (q2) return q2;

  // 4) pathname last segment
  const path = req.nextUrl.pathname || "";
  const seg = path.split("/").filter(Boolean).pop() || "";
  const s = seg.trim();
  return s || null;
}

function json(status: number, body: any) {
  return NextResponse.json(body, { status });
}

function isExpired(expiresAt: string | null | undefined) {
  if (!expiresAt) return false;
  const t = Date.parse(expiresAt);
  if (Number.isNaN(t)) return false;
  return Date.now() > t;
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ token?: string }> | { token?: string } }
) {
  let paramsToken: string | undefined;
  try {
    const p: any = await (ctx?.params as any);
    paramsToken = p?.token;
  } catch {
    // ignore
  }

  const token = extractToken(req, paramsToken);
  if (!token) {
    return json(400, { error: "invalid_token" });
  }

  let admin;
  try {
    admin = getSupabaseAdmin();
  } catch (e: any) {
    return json(500, { error: e?.message || "server_misconfig" });
  }

  // El "token" del link es el UUID (id) de signing_requests.
  // En algunos entornos no existe columna "token" en signing_requests (error 42703).
  // Por eso, buscamos por id y dejamos fallback opcional.
  const { data: sr, error: srErr } = await admin
    .from("signing_requests")
    .select("*")
    .eq("id", token)
    .maybeSingle();

  if (srErr) {
    // Si tu tabla tuviera una columna token, podríamos intentar fallback,
    // pero en tu caso el error era 42703 (columna inexistente) cuando se usaba token.
    return json(400, { error: "invalid_link" });
  }

  if (!sr) {
    return json(404, { error: "invalid_token" });
  }

  // link reemplazado
  const replacedBy = (sr as any).replaced_by ?? null;
  if (replacedBy) {
    return json(410, {
      error: "replaced",
      message: "Este enlace fue reemplazado por una invitación más nueva. Pedile al creador que reenvíe la invitación.",
      replacedBy,
    });
  }

  // expiración
  const expiresAt: string | null = (sr as any).expires_at ?? null;
  let status: string = (sr as any).status ?? "pending";
  if (status === "pending" && isExpired(expiresAt)) status = "expired";

  const documentId: string | null = (sr as any).document_id ?? null;
  if (!documentId) {
    return json(400, { error: "invalid_link" });
  }

  const { data: doc, error: docErr } = await admin
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .maybeSingle();

  if (docErr || !doc) {
    return json(404, { error: "document_not_found" });
  }

  // Autofill: si el email del firmante corresponde a un usuario registrado, traemos su profile.
  let prefill: any = null;
  const email: string = ((sr as any).email || "").toString();
  if (email) {
    try {
      const u = await admin.auth.admin.getUserByEmail(email);
      const uid = u?.data?.user?.id;
      if (uid) {
        const { data: profile } = await admin
          .from("profiles")
          .select("full_name,dni,cuil,address,phone")
          .eq("id", uid)
          .maybeSingle();

        if (profile) {
          prefill = {
            fullName: (profile as any).full_name ?? null,
            dni: (profile as any).dni ?? null,
            cuil: (profile as any).cuil ?? null,
            address: (profile as any).address ?? null,
            phone: (profile as any).phone ?? null,
          };
        }
      }
    } catch {
      // ignore autofill errors
    }
  }

  return json(200, {
    documentId,
    title: (doc as any).title || "Documento",
    email,
    status,
    signingMode: ((sr as any).signing_mode || "parallel") as "parallel" | "sequential",
    position: (sr as any).position ?? null,
    expiresAt,
    pdfUrl: `/api/preview?token=${encodeURIComponent(token)}`,
    prefill,
  });
}
