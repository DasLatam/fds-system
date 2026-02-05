import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type Prefill = {
  fullName: string | null;
  dni: string | null;
  cuil: string | null;
  address: string | null;
  phone: string | null;
};

function env(name: string): string | null {
  const v = process.env[name];
  return v && v.trim().length ? v.trim() : null;
}

function json(status: number, body: any) {
  return NextResponse.json(body, { status });
}

function getSupabaseAdmin(): SupabaseClient {
  const url = env("SUPABASE_URL") ?? env("NEXT_PUBLIC_SUPABASE_URL");
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("server_misconfig");

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function extractToken(req: NextRequest, paramsToken?: string): string | null {
  // 1) dynamic segment
  const p = (paramsToken || "").trim();
  if (p) return p;

  // 2) legacy query param
  const sp = req.nextUrl.searchParams;
  const q1 = (sp.get("token") || "").trim();
  if (q1) return q1;

  // 3) Next internal prefetch param (observado en logs)
  const q2 = (sp.get("nxtPtoken") || "").trim();
  if (q2) return q2;

  // 4) pathname
  const seg = (req.nextUrl.pathname || "").split("/").filter(Boolean).pop() || "";
  return seg.trim() || null;
}

function isExpired(expiresAt: string | null | undefined) {
  if (!expiresAt) return false;
  const t = Date.parse(expiresAt);
  if (Number.isNaN(t)) return false;
  return Date.now() > t;
}

async function findUserIdByEmail(admin: SupabaseClient, email: string): Promise<string | null> {
  try {
    // Nota: en tu versión de supabase-js, GoTrueAdminApi NO expone getUserByEmail.
    // Usamos listUsers + filtro en memoria. Para la escala actual es suficiente.
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error || !data?.users?.length) return null;
    const target = email.trim().toLowerCase();
    const u = data.users.find((x) => (x.email || "").toLowerCase() === target);
    return u?.id ?? null;
  } catch {
    return null;
  }
}

async function buildSignedPdfUrl(admin: SupabaseClient, doc: any): Promise<string | null> {
  const bucket = "fds";
  const path: string | null =
    (doc?.final_path as string | null) ??
    (doc?.signed_path as string | null) ??
    (doc?.pdf_path as string | null) ??
    (doc?.original_path as string | null) ??
    null;

  if (!path) return null;

  try {
    const { data, error } = await admin.storage.from(bucket).createSignedUrl(path, 60 * 15);
    if (error) return null;
    return data?.signedUrl ?? null;
  } catch {
    return null;
  }
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
  if (!token) return json(400, { error: "invalid_token" });

  let admin: SupabaseClient;
  try {
    admin = getSupabaseAdmin();
  } catch (e: any) {
    return json(500, { error: e?.message || "server_misconfig" });
  }

  // Importante: en tu esquema, el "token" del link ES el UUID (id) del signing_requests.
  // No existe la columna signing_requests.token (PostgREST 42703).
  const { data: sr, error: srErr } = await admin
    .from("signing_requests")
    .select("*")
    .eq("id", token)
    .maybeSingle();

  if (srErr) return json(400, { error: "invalid_link" });
  if (!sr) return json(404, { error: "invalid_token" });

  const replacedBy = (sr as any).replaced_by ?? null;
  if (replacedBy) {
    return json(410, {
      error: "replaced",
      message:
        "Este enlace fue reemplazado por una invitación más nueva. Pedile al creador del documento que te reenvíe la invitación.",
      replacedBy,
    });
  }

  const expiresAt: string | null = (sr as any).expires_at ?? null;
  let status: string = (sr as any).status ?? "pending";
  if (status === "pending" && isExpired(expiresAt)) status = "expired";

  const documentId: string | null = (sr as any).document_id ?? null;
  if (!documentId) return json(400, { error: "invalid_link" });

  const { data: doc, error: docErr } = await admin
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .maybeSingle();

  if (docErr || !doc) return json(404, { error: "document_not_found" });

  const email: string = ((sr as any).email || "").toString();

  // Prefill best-effort
  let prefill: Prefill | null = null;
  if (email) {
    const uid = await findUserIdByEmail(admin, email);
    if (uid) {
      const { data: profile } = await admin
        .from("profiles")
        .select("*")
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
  }

  const signedPdfUrl = await buildSignedPdfUrl(admin, doc);

  return json(200, {
    signingRequestId: (sr as any).id,
    documentId,
    title: (doc as any).title || "Documento",
    email,
    status,
    signingMode: ((sr as any).signing_mode || "parallel") as "parallel" | "sequential",
    position: (sr as any).position ?? null,
    expiresAt,
    replacedBy,

    // Preferimos URL firmada directa a Storage para no depender de /api/preview
    pdfUrl: signedPdfUrl || `/api/preview?token=${encodeURIComponent(token)}`,

    prefill,
  });
}
