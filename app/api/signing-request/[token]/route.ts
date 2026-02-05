import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";

function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const TokenSchema = z.string().min(10);

function pickToken(req: NextRequest, paramsToken?: string) {
  const fromParams = String(paramsToken ?? "").trim();
  if (fromParams) return fromParams;

  // En producción vimos requests con query param `nxtPtoken` (prefetch/next internals).
  // Aceptamos ambos para robustez.
  const sp = req.nextUrl.searchParams;
  const fromQuery = (sp.get("token") || "").trim();
  if (fromQuery) return fromQuery;

  const fromNextPrefetch = (sp.get("nxtPtoken") || "").trim();
  if (fromNextPrefetch) return fromNextPrefetch;

  // Último fallback: parsear del pathname.
  // Ej: /api/signing-request/<token>
  const parts = req.nextUrl.pathname.split("/").filter(Boolean);
  const last = (parts[parts.length - 1] || "").trim();
  if (last && last !== "signing-request") return last;

  return "";
}

export async function GET(req: NextRequest, ctx: { params: { token?: string } }) {
  const tokenRaw = pickToken(req, ctx?.params?.token);
  const parsed = TokenSchema.safeParse(tokenRaw);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  }
  const token = parsed.data;

  const res = NextResponse.next();
  type CookieOptions = Parameters<typeof res.cookies.set>[2];
  type CookieToSet = { name: string; value: string; options?: CookieOptions };

  const supabase = createServerClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }: CookieToSet) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Nota: este endpoint debe funcionar sin sesión (firmantes externos)
  // y se basa en el token de la tabla `signing_requests`.
  const { data: sr, error } = await supabase
    .from("signing_requests")
    .select(
      "id, document_id, email, status, signing_mode, position, expires_at, replaced_by, created_at"
    )
    .eq("token", token)
    .maybeSingle();

  if (error || !sr) {
    return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  }

  if (sr.replaced_by) {
    return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  }

  const now = Date.now();
  if (sr.expires_at && new Date(sr.expires_at).getTime() < now) {
    return NextResponse.json({ error: "expired" }, { status: 400 });
  }

  const { data: doc, error: docErr } = await supabase
    .from("documents")
    .select("id, title, storage_path_signed, storage_path_original")
    .eq("id", sr.document_id)
    .single();

  if (docErr || !doc) {
    return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  }

  // Siempre mostrar preview del último estado posible
  const path = doc.storage_path_signed || doc.storage_path_original;
  const pdfUrl = path
    ? `/api/preview?token=${encodeURIComponent(token)}&v=${encodeURIComponent(
        sr.created_at || ""
      )}`
    : "";

  return NextResponse.json({
    documentId: doc.id,
    title: doc.title,
    email: sr.email,
    status: sr.status,
    signingMode: sr.signing_mode,
    position: sr.position,
    expiresAt: sr.expires_at,
    pdfUrl,
  });
}
