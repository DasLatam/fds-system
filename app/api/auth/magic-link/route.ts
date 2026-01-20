import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function POST(req: Request) {
  try {
    const { email } = (await req.json()) as { email?: string };
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const redirectTo = `${appUrl}/auth/callback?next=/dashboard`;

    // 1) Generar link PKCE con admin (no envía mail)
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });

    if (error || !data?.properties?.action_link) {
      throw new Error(
        `Supabase generateLink failed: ${error?.message || "no action_link"}`
      );
    }

    const actionLink = data.properties.action_link;

    // 2) Intentar enviar por Resend
    try {
      const resend = new Resend(env("RESEND_API_KEY"));
      const from = env("RESEND_FROM_EMAIL");

      await resend.emails.send({
        from,
        to: email,
        subject: "Acceso seguro a Firma Electrónica Simple",
        html: `
          <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;max-width:560px;margin:0 auto;padding:24px">
            <h2 style="margin:0 0 12px 0">Ingresar a Firma Electrónica Simple</h2>
            <p style="margin:0 0 14px 0;color:#333">
              Usá este enlace para ingresar de forma segura. Por seguridad, el enlace es <b>de un solo uso</b> y expira.
            </p>
            <p style="margin:18px 0">
              <a href="${actionLink}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:10px 14px;border-radius:10px">
                Ingresar a mi cuenta
              </a>
            </p>
            <p style="margin:18px 0 0 0;color:#666;font-size:12px">
              Si no solicitaste este acceso, podés ignorar este correo.
            </p>
          </div>
        `,
      });

      return NextResponse.json({ ok: true, provider: "resend" });
    } catch (resendErr: any) {
      // 3) Fallback automático: Supabase envía su email default (para no bloquear acceso)
      const supabaseUrl = env("NEXT_PUBLIC_SUPABASE_URL");
      const supabaseAnon = env("NEXT_PUBLIC_SUPABASE_ANON_KEY");

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
              "No se pudo enviar el email (Resend y fallback Supabase fallaron).",
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