import { baseEmailTemplate } from "@/lib/mail/templates/base";

export function inviteEmailTemplate(opts: {
  inviterEmail?: string;
  documentTitle: string;
  signUrl: string;
  expiresAtIso: string;
}) {
  const body = `
    <p style="margin:0 0 12px 0;color:#18181b">Hola,</p>
    <p style="margin:0 0 14px 0;color:#18181b">
      ${opts.inviterEmail ? `El usuario <b>${opts.inviterEmail}</b> te invitó a firmar el documento:` :
      `Te invitaron a firmar el documento:`}
      <b>${opts.documentTitle}</b>.
    </p>
    <p style="margin:0 0 14px 0;color:#18181b">
      Antes de firmar, vas a completar tus datos de identificación (Nombre, DNI, CUIL, domicilio y celular)
      y luego realizar tu firma manuscrita.
    </p>
    <p style="margin:0 0 14px 0;color:#18181b">
      ⏳ <b>Vence:</b> ${new Date(opts.expiresAtIso).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}
    </p>
    <p style="margin:16px 0">
      <a href="${opts.signUrl}" style="display:inline-block;padding:12px 14px;background:#09090b;color:#ffffff;border-radius:10px;text-decoration:none;font-weight:600">
        Abrir documento para firmar
      </a>
    </p>
    <p style="margin:14px 0 0 0;color:#71717a;font-size:12px">
      Por seguridad, este enlace es personal. Si no reconocés el documento, podés rechazarlo desde la pantalla de firma.
    </p>
  `;

  return baseEmailTemplate({
    title: "Firma requerida",
    preheader: `Te invitaron a firmar: ${opts.documentTitle}`,
    bodyHtml: body,
  });
}
