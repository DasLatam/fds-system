import { getFromEmail, getResend } from "@/lib/mail/resendClient";
import { inviteEmailTemplate } from "@/lib/mail/templates/invite";
import { finalEmailTemplate } from "@/lib/mail/templates/final";
import { magicLinkEmailTemplate } from "@/lib/mail/templates/magicLink";

export async function sendMagicLinkEmail(opts: {
  to: string;
  loginUrl: string;
  appUrl: string;
}) {
  const resend = getResend();
  const from = getFromEmail();

  await resend.emails.send({
    from,
    to: [opts.to],
    subject: "Acceso seguro a Firma Electrónica Simple",
    html: magicLinkEmailTemplate({
      loginUrl: opts.loginUrl,
      recipientEmail: opts.to,
      appUrl: opts.appUrl,
    }),
  });
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

  await resend.emails.send({
    from,
    to: [opts.to],
    subject: `Firma requerida: ${opts.documentTitle}`,
    html: inviteEmailTemplate({
      inviterEmail: opts.inviterEmail,
      documentTitle: opts.documentTitle,
      signUrl: opts.signUrl,
      expiresAtIso: opts.expiresAtIso,
    }),
  });
}

export async function sendFinalEmail(opts: {
  to: string;
  documentTitle: string;
  downloadUrl: string;
}) {
  const resend = getResend();
  const from = getFromEmail();

  await resend.emails.send({
    from,
    to: [opts.to],
    subject: `Documento final: ${opts.documentTitle}`,
    html: finalEmailTemplate({
      documentTitle: opts.documentTitle,
      downloadUrl: opts.downloadUrl,
    }),
  });
}
