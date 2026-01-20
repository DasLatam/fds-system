import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";

function appOrigin(req: NextRequest) {
  // Fuente de verdad: tu dominio público (evita redirects raros)
  const raw = process.env.NEXT_PUBLIC_APP_URL;
  if (raw && (raw.startsWith("http://") || raw.startsWith("https://"))) return raw;
  if (raw) return `https://${raw}`;
  // fallback local
  return new URL(req.url).origin;
}

function safeNextPath(next: string | null) {
  // Solo permitimos paths internos para evitar open-redirect y errores
  if (!next) return "/dashboard";
  if (!next.startsWith("/")) return "/dashboard";
  if (next.startsWith("//")) return "/dashboard";
  return next;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"));
  const origin = appOrigin(req);

  // Si no hay code, es un link viejo/consumido o una URL mal formada
  if (!code) {
    return NextResponse.redirect(new URL(`/login?error=missing_code`, origin));
  }

  const cookieStore = await cookies();
  type CookieOptions = Parameters<typeof cookieStore.set>[2];
  type CookieToSet = { name: string; value: string; options?: CookieOptions };

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          // Importante: setear cookies en el response del server runtime
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("exchangeCodeForSession error:", error);
    const msg = encodeURIComponent(error.message);

    // Si ya expiró, devolvemos al login con mensaje claro
    return NextResponse.redirect(
      new URL(`/login?error=auth_callback_failed&msg=${msg}`, origin)
    );
  }

  // Listo: ya hay sesión en cookies, vamos al destino
  return NextResponse.redirect(new URL(next, origin));
}
