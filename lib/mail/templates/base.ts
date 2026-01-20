function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function baseEmailTemplate(opts: {
  title: string;
  preheader?: string;
  bodyHtml: string;
  footerHtml?: string;
}) {
  const preheader = opts.preheader ?? "";
  const footer =
    opts.footerHtml ??
    `<p style="margin:0;color:#71717a;font-size:12px">Si no iniciaste esta acción, podés ignorar este correo.</p>`;

  return `
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(
    preheader
  )}</div>
  <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;line-height:1.5;background:#f4f4f5;padding:24px">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e4e4e7;border-radius:16px;overflow:hidden">
      <div style="padding:20px 22px;border-bottom:1px solid #f4f4f5">
        <div style="font-size:12px;color:#71717a">Firma Digital Simple</div>
        <h1 style="margin:6px 0 0 0;font-size:18px;color:#09090b">${escapeHtml(
          opts.title
        )}</h1>
      </div>
      <div style="padding:22px">
        ${opts.bodyHtml}
      </div>
      <div style="padding:16px 22px;border-top:1px solid #f4f4f5">
        ${footer}
      </div>
    </div>
  </div>`;
}
