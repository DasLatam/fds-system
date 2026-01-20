import { baseEmailTemplate } from "@/lib/mail/templates/base";

export function magicLinkEmailTemplate(opts: {
  loginUrl: string;
  recipientEmail: string;
  appUrl: string;
}) {
  const body = `
    <p style="margin:0 0 12px 0;color:#18181b">Hola,</p>
    <p style="margin:0 0 14px 0;color:#18181b">
      Recibimos una solicitud para ingresar a <b>Firma Digital Simple</b> con el correo <b>${opts.recipientEmail}</b>.
    </p>
    <p style="margin:0 0 14px 0;color:#18181b">
      Por seguridad, este enlace es de <b>un solo uso</b> y expira automáticamente.
    </p>
    <p style="margin:16px 0">
      <a href="${opts.loginUrl}" style="display:inline-block;padding:12px 14px;background:#09090b;color:#ffffff;border-radius:10px;text-decoration:none;font-weight:600">
        Ingresar a mi cuenta
      </a>
    </p>
    <p style="margin:14px 0 0 0;color:#71717a;font-size:12px">
      Si el botón no funciona, copiá y pegá este enlace en tu navegador:<br/>
      <span style="word-break:break-all">${opts.loginUrl}</span>
    </p>
  `;

  return baseEmailTemplate({
    title: "Acceso seguro",
    preheader: "Tu enlace de acceso de un solo uso (expira por seguridad).",
    bodyHtml: body,
    footerHtml: `
      <p style="margin:0;color:#71717a;font-size:12px">
        Este enlace te permitirá ingresar a ${opts.appUrl}. Si no solicitaste el acceso, ignorá este correo.
      </p>
    `,
  });
}
