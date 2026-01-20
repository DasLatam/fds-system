import { baseEmailTemplate } from "@/lib/mail/templates/base";

export function finalEmailTemplate(opts: {
  documentTitle: string;
  downloadUrl: string;
}) {
  const body = `
    <p style="margin:0 0 12px 0;color:#18181b">Hola,</p>
    <p style="margin:0 0 14px 0;color:#18181b">
      El documento <b>${opts.documentTitle}</b> fue finalizado y ya está disponible...
    </p>
    <p style="margin:16px 0">
      <a href="${opts.downloadUrl}" style="display:inline-block;padding:12px 14px;background:#09090b;color:#ffffff;border-radius:10px;text-decoration:none;font-weight:600">
        Descargar PDF final
      </a>
    </p>
    <p style="margin:14px 0 0 0;color:#71717a;font-size:12px">
      Este archivo incluye un sello de evidencia (Hash SHA-256, IP y fecha/hora) para trazabilidad.
    </p>
  `;

  return baseEmailTemplate({
    title: "Documento final",
    preheader: `Documento final listo: ${opts.documentTitle}`,
    bodyHtml: body,
  });
}
