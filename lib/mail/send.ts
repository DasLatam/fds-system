import { getFromEmail, getResend } from "@/lib/mail/resendClient";

export async function sendInviteEmail(opts: {
  to: string;
  documentTitle: string;
  signUrl: string;
}) {
  const resend = getResend();
  const from = getFromEmail();

  await resend.emails.send({
    from,
    to: [opts.to],
    subject: `Firma requerida: ${opts.documentTitle}`,
    html: `
      <div style="font-family:ui-sans-serif,system-ui;line-height:1.5">
        <h2>Firma requerida</h2>
        <p>Te invitaron a firmar: <b>${opts.documentTitle}</b>.</p>
        <p><a href="${opts.signUrl}" style="display:inline-block;padding:10px 14px;background:#000;color:#fff;border-radius:8px;text-decoration:none">Abrir para firmar</a></p>
        <p style="color:#666;font-size:12px">Si no esperabas este correo, podés ignorarlo.</p>
      </div>
    `,
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
    html: `
      <div style="font-family:ui-sans-serif,system-ui;line-height:1.5">
        <h2>Documento final disponible</h2>
        <p>El documento <b>${opts.documentTitle}</b> fue finalizado.</p>
        <p><a href="${opts.downloadUrl}" style="display:inline-block;padding:10px 14px;background:#000;color:#fff;border-radius:8px;text-decoration:none">Descargar PDF final</a></p>
        <p style="color:#666;font-size:12px">Este link puede requerir autenticación, dependiendo de tu rol.</p>
      </div>
    `,
  });
}
