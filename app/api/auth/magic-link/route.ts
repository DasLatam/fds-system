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

  // Fallbacks típicos en Vercel
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

async function sendMagicLinkEmail(params: { to: string; link: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.FES_EMAIL_FROM || process.env.RESEND_FROM || process.env.FES_FROM_EMAIL || "";

  if (!apiKey || !from) {
    // Si no hay Resend configurado, devolvemos señal para fallback a Supabase OTP
    return { ok: false as const, reason: "resend_not_configured" as const };
  }

  const resend = new Resend(apiKey);

  const subject = "Tu link de acceso a Firma Simple";
  const html = `
  <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;">
    <h2 style="margin:0 0 12px 0;">Ingresar a Firma Simple</h2>
    <p style="margin:0 0 12px 0;">Hacé click para ingresar:</p>
    <p style="margin:0 0 16px 0;">
      <a href="${params.link}" style="display:inline-block;padding:10px 14px;border-radius:8px;background:#111;color:#fff;text-decoration:none;">
        Ingresar
      </a>
    </p>
    <p style="margin:0;color:#666;font-size:12px;">Si no pediste este email, podés ignorarlo.</p>
  </div>`;

  await resend.emails.send({
    from,
    to: params.to,
    subject,
    html,
  });

  return { ok: true as const };
}

export async function POST(req: NextRequest) {
  try {
    const body = BodySchema.parse(await req.json());
    const email = body.email.trim().toLowerCase();
    const nextPath = (body.next && body.next.startsWith("/")) ? body.next : "/dashboard";

    const baseUrl = getBaseUrl(req);
    const redirectTo = `${baseUrl}/auth/callback-client?next=${encodeURIComponent(nextPath)}`;

    const admin = createAdminClient();

    // 1) Asegurar existencia de usuario (para emails nuevos)
    //    - Si ya existe, NO fallar.
    const getRes = await admin.auth.admin.getUserByEmail(email);
    const exists = !!getRes.data?.user;

    if (!exists) {
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
    }

    // 2) Generar link (admin generate_link)
    const gl = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });

    if (gl.error || !gl.data?.properties?.action_link) {
      console.error("magic-link: generateLink failed", gl.error || gl.data);
      return NextResponse.json(
        { error: "No se pudo generar el link de acceso.", details: gl.error?.message || "no_action_link" },
        { status: 500 }
      );
    }

    const actionLink = gl.data.properties.action_link;

    // 3) Enviar email vía Resend (si está configurado)
    try {
      const sendRes = await sendMagicLinkEmail({ to: email, link: actionLink });
      if (sendRes.ok) {
        return NextResponse.json({ ok: true });
      }
    } catch (e: any) {
      console.error("magic-link: resend send failed", e);
      // seguimos con fallback abajo
    }

    // 4) Fallback: usar Supabase OTP nativo (si Resend no está o falla)
    //    OJO: esto depende del SMTP / email provider configurado en Supabase.
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
