import { getFromEmail, getResend } from "@/lib/mail/resendClient";
import { inviteEmailTemplate } from "@/lib/mail/templates/invite";
import { finalEmailTemplate } from "@/lib/mail/templates/final";
import { magicLinkEmailTemplate } from "@/lib/mail/templates/magicLink";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function formatBuenosAiresTimestamp(d: Date) {
  // YYYY/MM/DD HH:mm:ss (BA)
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

function extractStatusCode(err: any): number | null {
  // Resend SDK puede tirar distintos shapes
  return (
    err?.statusCode ??
    err?.response?.status ??
    err?.response?.statusCode ??
    err?.cause?.statusCode ??
    null
  );
}

async function sendWithRetry(sendFn: () => Promise<any>) {
  // Backoff suave para 429 y 5xx
  const delays = [350, 900, 1700]; // ms
  let lastErr: any = null;

  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      return await sendFn();
    } catch (err: any) {
      lastErr = err;
      const code = extractStatusCode(err);

      const retryable = code === 429 || (code != null && code >= 500);
      if (!retryable || attempt === delays.length) {
        throw err;
      }

      await sleep(delays[attempt]);
    }
  }

  throw lastErr;
}

export async function sendMagicLinkEmail(opts: {
  to: string;
  loginUrl: string;
  appUrl: string;
}) {
  const resend = getResend();
  const from = getFromEmail();

  // ✅ Subject único para evitar “threads” en Gmail
  const ts = formatBuenosAiresTimestamp(new Date());
  const subject = `Acceso seguro a Firma Electrónica Simple ${ts}`;

  await sendWithRetry(() =>
    resend.emails.send({
      from,
      to: [opts.to],
      subject,
      html: magicLinkEmailTemplate({
        loginUrl: opts.loginUrl,
        recipientEmail: opts.to,
        appUrl: opts.appUrl,
      }),
    })
  );
}

export async function sendInviteEmail(opts: {
  to: string;
  documentTitle: string;
  signUrl: string;
  expiresAtIso: string;
  inviterEmail?: string;
}) {
  const resend = getResend();
  const from = getFromEmail();

  await sendWithRetry(() =>
    resend.emails.send({
      from,
      to: [opts.to],
      subject: `Firma requerida: ${opts.documentTitle}`,
      html: inviteEmailTemplate({
        inviterEmail: opts.inviterEmail,
        documentTitle: opts.documentTitle,
        signUrl: opts.signUrl,
        expiresAtIso: opts.expiresAtIso,
      }),
    })
  );
}

export async function sendFinalEmail(opts: {
  to: string;
  documentTitle: string;
  downloadUrl: string;
}) {
  const resend = getResend();
  const from = getFromEmail();

  await sendWithRetry(() =>
    resend.emails.send({
      from,
      to: [opts.to],
      subject: `Documento final: ${opts.documentTitle}`,
      html: finalEmailTemplate({
        documentTitle: opts.documentTitle,
        downloadUrl: opts.downloadUrl,
      }),
    })
  );
}
