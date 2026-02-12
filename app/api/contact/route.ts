import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { getResend } from "@/lib/mail/resendClient";
import { baseEmailTemplate } from "@/lib/mail/templates/base";

export const runtime = "nodejs";

function json(status: number, body: any) {
  return NextResponse.json(body, { status });
}

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for") || "";
  const first = xff.split(",")[0]?.trim();
  return first || req.headers.get("x-real-ip") || "unknown";
}

function getAdminEmails(): string[] {
  const raw = (process.env.FES_ADMIN_EMAILS || "").trim();
  const emails = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => s.includes("@"));
  return emails;
}

async function verifyTurnstile(token: string, ip?: string) {
  const secret = (process.env.TURNSTILE_SECRET_KEY || "").trim();
  if (!secret) return { ok: false, error: "Falta TURNSTILE_SECRET_KEY." };

  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);

  const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form,
  });

  const j = (await r.json().catch(() => null)) as any;
  const ok = Boolean(j?.success);
  return { ok, error: ok ? null : "Captcha inválido." };
}

const redis = Redis.fromEnv();
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10 m"),
  analytics: true,
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = await ratelimit.limit(`contact:${ip}`);
    if (!rl.success) {
      return json(429, { error: "Demasiados envíos. Probá de nuevo en unos minutos." });
    }

    const fd = await req.formData();
    const name = String(fd.get("name") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const subject = String(fd.get("subject") || "").trim();
    const message = String(fd.get("message") || "").trim();
    const token = String(fd.get("cf-turnstile-response") || "").trim();

    if (!name || !email || !subject || !message) {
      return json(400, { error: "Faltan campos obligatorios." });
    }
    if (!email.includes("@")) {
      return json(400, { error: "Email inválido." });
    }
    if (!token) {
      return json(400, { error: "Captcha requerido." });
    }

    const captcha = await verifyTurnstile(token, ip);
    if (!captcha.ok) return json(400, { error: captcha.error || "Captcha inválido." });

    const to = getAdminEmails();
    if (!to.length) {
      return json(500, { error: "Falta configurar FES_ADMIN_EMAILS." });
    }

    const safe = (s: string) =>
      s
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

    const bodyHtml = `
      <p style="margin:0 0 10px 0;">Nueva consulta desde <b>Contacto</b>.</p>
      <div style="margin:0 0 10px 0;">
        <p style="margin:0 0 6px 0;"><b>Nombre:</b> ${safe(name)}</p>
        <p style="margin:0 0 6px 0;"><b>Email:</b> ${safe(email)}</p>
        <p style="margin:0 0 6px 0;"><b>IP:</b> ${safe(ip)}</p>
      </div>
      <div style="margin:0; padding:12px; border:1px solid #e4e4e7; border-radius:12px; background:#fafafa;">
        <div style="font-size:13px; white-space:pre-wrap; line-height:1.45;">${safe(message)}</div>
      </div>
    `;

    const html = baseEmailTemplate({
      title: `Consulta: ${subject}`,
      preheader: `Consulta de ${name}`,
      bodyHtml,
    });

    const resend = getResend();

    await resend.emails.send({
      from: process.env.FES_FROM_EMAIL || "FES <no-reply@firmasimple.app>",
      to,
      subject: `[FES] ${subject}`,
      html,
      replyTo: email,
    } as any);

    return json(200, { ok: true });
  } catch {
    return json(500, { error: "Error inesperado." });
  }
}
