import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResend } from "@/lib/mail/resendClient";

export const runtime = "nodejs";

const BodySchema = z.object({
  email: z.string().trim().email(),
});

function normalizeAppUrl(raw?: string) {
  const v = (raw || "").trim();
  if (!v) return "http://localhost:3000";
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  return `https://${v}`;
}

function fmtBuenosAires(d: Date) {
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

function isAlreadyExistsError(msg?: string) {
  const m = (msg || "").toLowerCase();
  return m.includes("already registered") || m.includes("already exists") || m.includes("duplicate key");
}

export async function POST(req: NextRequest) {
  const DEBUG = process.env.FES_DEBUG_AUTH === "1";

  try {
    const body = BodySchema.parse(await req.json().catch(() => ({})));
    const email = body.email.toLowerCase();

    const appUrl = normalizeAppUrl(process.env.NEXT_PUBLIC_APP_URL || "https://firmasimple.vercel.app");
    const redirectTo = `${appUrl}/auth/callback-client?next=/dashboard`;

    const admin = createAdminClient();

    // 1) Pre-provision: si el usuario NO existe, lo creamos.
    // Si falla por "already exists", seguimos. Si falla por otra cosa, devolvemos diagnóstico.
    const createRes = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
    });

    if (createRes.error && !isAlreadyExistsError(createRes.error.message)) {
      console.error("magic-link: createUser failed", createRes.error);

      const payload: any = { error: "No se pudo generar el link de acceso.", code: "CREATE_USER_FAILED" };
      if (DEBUG) payload.details = { createUser: createRes.error.message };
      return NextResponse.json(payload, { status: 500 });
    }

    // 2) Generate magic link (action_link)
    const gen = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });

    const actionLink = gen.data?.properties?.action_link || null;

    if (gen.error || !actionLink) {
      console.error("magic-link: generateLink failed", gen.error);

      const payload: any = { error: "No se pudo generar el link de acceso.", code: "GENERATE_LINK_FAILED" };
      if (DEBUG) payload.details = { generateLink: gen.error?.message || "no_action_link" };

      /**
       * HINT importante:
       * Si esto falla SOLO para emails nuevos, casi siempre es porque la creación del user revienta
       * (trigger en auth.users -> profiles con NOT NULL / defaults / RLS).
       */
      payload.hint =
        "Si falla solo con emails nuevos: revisá triggers de auth.users (handle_new_user) y constraints en public.profiles.";

      return NextResponse.json(payload, { status: 500 });
    }

    // 3) Enviar por Resend
    const ts = fmtBuenosAires(new Date());
    const subject = `Acceso seguro a Firma Electrónica Simple ${ts}`;

    const resend = getResend();
    const from = process.env.RESEND_FROM;
    if (!from) {
      const payload: any = { error: "No se pudo enviar el email de acceso.", code: "RESEND_FROM_MISSING" };
      if (DEBUG) payload.details = { env: "RESEND_FROM missing" };
      return NextResponse.json(payload, { status: 500 });
    }

    const send = await resend.emails.send({
      from,
      to: email,
      subject,
      html: `
        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;max-width:560px;margin:0 auto;padding:24px">
          <div style="border:1px solid #e5e7eb;border-radius:14px;padding:20px;background:#fff">
            <h2 style="margin:0 0 10px 0;font-size:20px;color:#111">Ingresar a Firma Electrónica Simple</h2>
            <p style="margin:0 0 12px 0;color:#333;line-height:1.4">Usá este enlace para acceder a tu cuenta.</p>
            <ul style="margin:0 0 14px 18px;color:#333;line-height:1.4">
              <li>🔐 Enlace de un solo uso.</li>
              <li>⏳ Expira automáticamente.</li>
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
        </div>
      `,
      text: `Ingresá a tu cuenta usando este enlace: ${actionLink}`,
    });

    // Resend SDK: si falla suele devolver { error }
    if ((send as any)?.error) {
      const msg = (send as any).error?.message || "Resend error";
      console.error("magic-link: resend failed", send);

      const payload: any = { error: "No se pudo enviar el email de acceso.", code: "RESEND_FAILED" };
      if (DEBUG) payload.details = { resend: msg };
      return NextResponse.json(payload, { status: 500 });
    }

    return NextResponse.json({ ok: true, provider: "resend" });
  } catch (e: any) {
    console.error("magic-link: unexpected", e);
    const payload: any = { error: "No se pudo generar el link de acceso.", code: "UNEXPECTED" };
    if (process.env.FES_DEBUG_AUTH === "1") payload.details = { message: e?.message || String(e) };
    return NextResponse.json(payload, { status: 500 });
  }
}
