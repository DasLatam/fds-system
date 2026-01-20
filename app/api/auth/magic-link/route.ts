import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function normalizeAppUrl(raw: string) {
  if (!raw) return "http://localhost:3000";
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  return `https://${raw}`;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { email?: string };
    const email = (body.email || "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    const appUrl = normalizeAppUrl(
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    );

    const redirectTo = `${appUrl}/auth/callback?next=/dashboard`;

    // ✅ Este es el punto clave: OTP genera el flujo correcto para SSR/PKCE
    // (y Supabase envía el link “real”; nosotros solo lo re-enviamos con Resend)
    const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
    const supabaseAnon = requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

    const supabase = createClient(supabaseUrl, supabaseAnon, {
      auth: { persistSession: false },
    });

    // Pedimos OTP (Supabase generará el link con redirectTo)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      return NextResponse.json(
        { error: "No se pudo solicitar el acceso.", details: error.message },
        { status: 500 }
      );
    }

    // En este modo, Supabase manda el email por defecto.
    // Si querés SI O SI Resend, la forma robusta es usar SMTP custom en Supabase
    // o un proveedor de email integrado, porque Supabase no devuelve el action_link aquí.

    return NextResponse.json({ ok: true, provider: "supabase" });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Error enviando magic link" },
      { status: 500 }
    );
  }
}