import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const BodySchema = z.object({
  email: z.string().email().max(320),
  next: z.string().optional(), // ej: "/dashboard"
});

function getBaseUrl(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;

  const env =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  return env || "https://firmasimple.vercel.app";
}

function isEmailExistsError(err: any) {
  const code = String(err?.code || "");
  const msg = String(err?.message || "");
  return code === "email_exists" || msg.toLowerCase().includes("already been registered");
}

function formatSolicitudAR(date = new Date()) {
  // Fecha/hora estilo: 2026/02/04 00:32:38 (Argentina)
  try {
    const fmt = new Intl.DateTimeFormat("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    // Intl para es-AR devuelve con separadores locales, lo normalizamos a YYYY/MM/DD HH:mm:ss
    const parts = fmt.formatToParts(date);
    const get = (t: string) => parts.find((p) => p.type === t)?.value || "00";
    const yyyy = get("year");
    const mm = get("month");
    const dd = get("day");
    const hh = get("hour");
    const mi = get("minute");
    const ss = get("second");
    return `${yyyy}/${mm}/${dd} ${hh}:${mi}:${ss} (Argentina)`;
  } catch {
    return `${date.toISOString().replace("T", " ").slice(0, 19)} (UTC)`;
  }
}

function buildMagicLinkHtml(params: { link: string; solicitud: string; baseUrl: string }) {
  // Preheader “oculto”
  const preheader = "Enlace de un solo uso. Expira en pocos minutos.";

  // HTML tipo “card” (similar al que mostrabas en el screenshot)
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Acceso seguro a Firma Electrónica Simple</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f7f9;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      ${preheader}
    </div>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f6f7f9;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="640" style="max-width:640px;width:100%;">
            <tr>
              <td style="padding:0 0 14px 0;">
                <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;color:#111;font-size:24px;font-weight:800;letter-spacing:-0.02em;">
                  Ingresar a Firma Electrónica Simple
                </div>
              </td>
            </tr>

            <tr>
              <td style="background:#ffffff;border:1px solid #e6e8ee;border-radius:18px;padding:26px;">
                <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;color:#111;font-size:18px;font-weight:800;margin:0 0 6px 0;">
                  Ingresar a Firma Electrónica Simple
                </div>

                <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;color:#444;font-size:14px;line-height:1.5;margin:0 0 16px 0;">
                  Usá este enlace para acceder a tu cuenta.
                </div>

                <ul style="margin:0 0 18px 18px;padding:0;font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;color:#333;font-size:14px;line-height:1.5;">
                  <li>🔐 Es un enlace de un solo uso por seguridad.</li>
                  <li>⏳ Expira automáticamente en pocos minutos.</li>
                </ul>

                <div style="margin:18px 0 8px 0;">
                  <a href="${params.link}"
                     style="display:inline-block;background:#111;color:#fff;text-decoration:none;
                            padding:12px 18px;border-radius:12px;font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
                            font-size:14px;font-weight:700;">
                    Ingresar a mi cuenta
                  </a>
                </div>

                <div style="margin-top:18px;border-top:1px solid #eee;padding-top:14px;">
                  <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;color:#666;font-size:13px;">
                    <strong>Solicitud:</strong> ${params.solicitud}
                  </div>
                  <div style="margin-top:10px;font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;color:#777;font-size:12px;line-height:1.45;">
                    Si no solicitaste este acceso, podés ignorar este correo.
                  </div>
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:14px 4px 0 4px;">
                <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;color:#888;font-size:12px;text-align:center;">
                  Firma Electrónica Simple • Acceso seguro
                </div>
                <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;color:#bbb;font-size:11px;text-align:center;margin-top:6px;">
                  ${params.baseUrl.replace(/^https?:\/\//, "")}
                </div>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildMagicLinkText(params: { link: string; solicitud: string; baseUrl: string }) {
  return [
    "Ingresar a Firma Electrónica Simple",
    "",
    "Usá este enlace para acceder a tu cuenta:",
    params.link,
    "",
    "- Es un enlace de un solo uso por seguridad.",
    "- Expira automáticamente en pocos minutos.",
    "",
    `Solicitud: ${params.solicitud}`,
    "",
    "Si no solicitaste este acceso, podés ignorar este correo.",
    "",
    `Sitio: ${params.baseUrl}`,
  ].join("\n");
}

function stripArgentinaSuffix(s: string) {
  return s.replace(/\s*\(Argentina\)\s*$/, "").trim();
}

async function sendMagicLinkEmail(params: { to: string; link: string; solicitud: string; baseUrl: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.FES_EMAIL_FROM || process.env.RESEND_FROM || process.env.FES_FROM_EMAIL || "";

  if (!apiKey || !from) {
    return { ok: false as const, reason: "resend_not_configured" as const };
  }

  const resend = new Resend(apiKey);

  // ✅ Subject con timestamp para evitar que Gmail lo agrupe
  const base = process.env.FES_MAGIC_LINK_SUBJECT || "Acceso seguro a Firma Electrónica Simple";
  const ts = stripArgentinaSuffix(params.solicitud);
  const subject = `${base} ${ts}`;

  const html = buildMagicLinkHtml({
    link: params.link,
    solicitud: params.solicitud,
    baseUrl: params.baseUrl,
  });

  const text = buildMagicLinkText({
    link: params.link,
    solicitud: params.solicitud,
    baseUrl: params.baseUrl,
  });

  await resend.emails.send({
    from,
    to: params.to,
    subject,
    html,
    text,
    headers: {
      // ✅ NO usar In-Reply-To / References si querés evitar threading
      "X-Entity-Ref-ID": `fes-magiclink:${params.to.toLowerCase()}:${Date.now()}`,
    },
  });

  return { ok: true as const };
}

export async function POST(req: NextRequest) {
  try {
    const body = BodySchema.parse(await req.json());
    const email = body.email.trim().toLowerCase();
    const nextPath = body.next && body.next.startsWith("/") ? body.next : "/dashboard";

    const baseUrl = getBaseUrl(req);
    const redirectTo = `${baseUrl}/auth/callback-client?next=${encodeURIComponent(nextPath)}`;

    const admin = createAdminClient();

    // 1) Asegurar existencia de usuario (para emails nuevos)
    //    Intentamos crear y si ya existe (email_exists) seguimos igual.
    const createRes = await admin.auth.admin.createUser({
      email,
      email_confirm: false,
    });

    if (createRes.error && !isEmailExistsError(createRes.error)) {
      console.error("magic-link: createUser failed", createRes.error);
      return NextResponse.json(
        { error: "No se pudo crear el usuario.", details: createRes.error.message },
        { status: 500 }
      );
    }

    // 2) Generar link (admin generate_link)
    const gl = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });

    const actionLink = gl.data?.properties?.action_link;
    if (gl.error || !actionLink) {
      console.error("magic-link: generateLink failed", gl.error || gl.data);
      return NextResponse.json(
        { error: "No se pudo generar el link de acceso.", details: gl.error?.message || "no_action_link" },
        { status: 500 }
      );
    }

    const solicitud = formatSolicitudAR(new Date());

    // 3) Enviar email vía Resend (si está configurado)
    try {
      const sendRes = await sendMagicLinkEmail({ to: email, link: actionLink, solicitud, baseUrl });
      if (sendRes.ok) return NextResponse.json({ ok: true });
    } catch (e: any) {
      console.error("magic-link: resend send failed", e);
      // seguimos con fallback abajo
    }

    // 4) Fallback: Supabase OTP nativo (depende del SMTP de Supabase)
    const supabase = await createSupabaseServerClient();
    const otp = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true,
      },
    });

    if (otp.error) {
      console.error("magic-link: supabase signInWithOtp failed", otp.error);
      return NextResponse.json(
        { error: "No se pudo generar ni enviar el link de acceso.", details: otp.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("magic-link: unexpected error", e);
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}
