import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function requiredEnvOneOf(names: string[]) {
  for (const n of names) {
    const v = process.env[n];
    if (v) return v;
  }
  throw new Error(`Missing env (one of): ${names.join(", ")}`);
}

function normalizeAppUrl(raw: string) {
  if (!raw) return "http://localhost:3000";
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  return `https://${raw}`;
}

function formatBuenosAiresTimestamp(d: Date) {
  // YYYY/MM/DD HH:mm:ss
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);

  const map: Record<string, string> = {};
  for (const p of parts) if (p.type !== "literal") map[p.type] = p.value;

  return `${map.year}/${map.month}/${map.day} ${map.hour}:${map.minute}:${map.second}`;
}

function looksLikeUserNotFound(msg: string) {
  return /user.*not found|not found/i.test(msg || "");
}

function looksLikeSignupsDisabled(msg: string) {
  return /signups?.*(disabled|not allowed)|signup.*(disabled|not allowed)/i.test(msg || "");
}

async function sendViaSupabaseOtpFallback(params: { email: string; redirectTo: string }) {
  const supabase = createClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    { auth: { persistSession: false } }
  );

  const { error: otpErr } = await supabase.auth.signInWithOtp({
    email: params.email,
    options: {
      emailRedirectTo: params.redirectTo,
      shouldCreateUser: true,
    },
  });

  return { otpErr };
}

export async function POST(req: Request) {
  const DEBUG = process.env.FES_DEBUG_AUTH === "1";
  const ENABLE_SUPABASE_OTP_FALLBACK = process.env.FES_ENABLE_SUPABASE_OTP_FALLBACK === "1";

  try {
    const body = (await req.json().catch(() => ({}))) as { email?: string };
    const email = (body.email || "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    const appUrl = normalizeAppUrl(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");

    // ✅ callback client (lee #access_token)
    const redirectTo = `${appUrl}/auth/callback-client?next=/dashboard`;

    const admin = createAdminClient();

    // 1) Generar link (NO envía mail)
    let gen = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });

    // 1b) Si falla por usuario inexistente o signups deshabilitados, auto-creamos user y reintentamos
    if (gen.error && (looksLikeUserNotFound(gen.error.message) || looksLikeSignupsDisabled(gen.error.message))) {
      try {
        // createUser no envía mail; solo crea el user para poder generar el link
        // email_confirm true: evita fricción en proyectos con confirmación estricta
        await admin.auth.admin.createUser({ email, email_confirm: true });
      } catch (e: any) {
        // si ya existe, puede fallar con "already registered": lo ignoramos
        if (DEBUG) console.warn("auto_provision_createUser_failed", e?.message || e);
      }

      gen = await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo },
      });
    }

    const actionLink = gen.data?.properties?.action_link;

    if (!actionLink || gen.error) {
      const msg = gen.error?.message || "generateLink did not return action_link";

      // Fallback opcional (solo si lo activás por env)
      if (ENABLE_SUPABASE_OTP_FALLBACK) {
        const { otpErr } = await sendViaSupabaseOtpFallback({ email, redirectTo });

        if (otpErr) {
          const payload: any = {
            error: "No se pudo generar ni enviar el link de acceso.",
            code: "MAGIC_LINK_FAILED",
          };
          if (DEBUG) payload.details = { generateLink: msg, supabaseOtp: otpErr.message };
          return NextResponse.json(payload, { status: 500 });
        }

        return NextResponse.json({ ok: true, provider: "supabase_fallback" });
      }

      const payload: any = {
        error: "No se pudo generar el link de acceso.",
        code: "MAGIC_LINK_GENERATE_FAILED",
      };
      if (DEBUG) payload.details = { generateLink: msg };
      return NextResponse.json(payload, { status: 500 });
    }

    // ✅ Subject único para evitar threads en Gmail
    const ts = formatBuenosAiresTimestamp(new Date());
    const subject = `Acceso seguro a Firma Electrónica Simple ${ts}`;

    // 2) Enviar por Resend
    try {
      const resend = new Resend(requiredEnv("RESEND_API_KEY"));
      const from = requiredEnvOneOf(["RESEND_FROM_EMAIL", "RESEND_FROM"]);

      await resend.emails.send({
        from,
        to: email,
        subject,
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
                Solicitud: <b>${ts}</b> (Argentina)
              </p>
              <p style="margin:10px 0 0 0;color:#6b7280;font-size:12px;line-height:1.4">
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
      // 3) Si Resend falla, fallback OTP opcional (por env)
      if (ENABLE_SUPABASE_OTP_FALLBACK) {
        const { otpErr } = await sendViaSupabaseOtpFallback({ email, redirectTo });

        if (otpErr) {
          const payload: any = {
            error: "No se pudo enviar el email de acceso (Resend y Supabase fallaron).",
            code: "MAGIC_LINK_SEND_FAILED",
          };
          if (DEBUG) payload.details = { resend: resendErr?.message || String(resendErr), supabaseOtp: otpErr.message };
          return NextResponse.json(payload, { status: 500 });
        }

        return NextResponse.json({ ok: true, provider: "supabase_fallback" });
      }

      const payload: any = {
        error: "No se pudo enviar el email de acceso.",
        code: "RESEND_FAILED",
      };
      if (DEBUG) payload.details = { resend: resendErr?.message || String(resendErr) };
      return NextResponse.json(payload, { status: 500 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error enviando magic link" }, { status: 500 });
  }
}
