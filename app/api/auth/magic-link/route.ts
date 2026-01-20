import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function normalizeAppUrl(raw: string) {
  // Acepta "firmasimple.vercel.app" o "https://firmasimple.vercel.app"
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

    // Redirige a tu callback SSR (donde setea cookies y navega a /dashboard)
    const redirectTo = `${appUrl}/auth/callback?next=/dashboard`;

    // 1) Generar el link de Supabase (NO envía mail)
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });

    const actionLink = data?.properties?.action_link;

    if (error || !actionLink) {
      return NextResponse.json(
        {
          error: "No se pudo generar el link de acceso.",
          details: error?.message || "missing_action_link",
        },
        { status: 500 }
      );
    }

    // 2) Intentar enviar por Resend (mail lindo)
    try {
      const resend = new Resend(requiredEnv("RESEND_API_KEY"));
      const from = requiredEnv("RESEND_FROM_EMAIL");

      await resend.emails.send({
        from,
        to: email,
        subject: "Acceso seguro a Firma Electrónica Simple",
        html: `
          <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;max-width:560px;margin:0 auto;padding:24px">
            <div style="border:1px solid #e5e7eb;border-radius:14px;padding:20px;background:#fff">
              <h2 style="margin:0 0 10px 0;font-size:20px;color:#111">Ingresar a Firma Electrónica Simple</h2>
              <p style="margin:0 0 12px 0;color:#333;line-height:1.4">
                Usá este enlace para acceder a tu cuenta.
              </p>
              <ul style="margin:0 0 14px 18px;color:#333;line-height:1.4">
                <li>🔐 Es un enlace <b>de un solo uso</b> por seguridad.</li>
                <li>⏳ Expira automáticamente en pocos minutos.</li>
              </ul>
              <p style="margin:16px 0">
                <a href="${actionLink}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:10px 14px;border-radius:10px;font-weight:600">
                  Ingresar a mi cuenta
                </a>
              </p>
              <p style="margin:14px 0 0 0;color:#6b7280;font-size:12px;line-height:1.4">
                Si no solicitaste este acceso, podés ignorar este correo.
              </p>
            </div>
            <p style="margin:12px 0 0 0;color:#9ca3af;font-size:11px">
              Firma Electrónica Simple • Acceso seguro
            </p>
          </div>
        `,
      });

      return NextResponse.json({ ok: true, provider: "resend" });
    } catch (resendErr: any) {
      // 3) Fallback automático: Supabase envía su email default
      // Esto evita que te quedes afuera si Resend falla por verificación/deliverability.
      const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
      const supabaseAnon = requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

      const supabase = createClient(supabaseUrl, supabaseAnon, {
        auth: { persistSession: false },
      });

      const { error: otpErr } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });

      if (otpErr) {
        return NextResponse.json(
          {
            error:
              "No se pudo enviar el email de acceso (Resend y Supabase fallaron).",
            details: {
              resend: resendErr?.message || String(resendErr),
              supabase: otpErr.message,
            },
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        provider: "supabase_fallback",
        warning:
          "Resend falló; se envió el email con el proveedor por defecto de Supabase.",
      });
    }
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Error enviando magic link" },
      { status: 500 }
    );
  }
}