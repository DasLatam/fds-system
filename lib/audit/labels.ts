const EVENT_LABELS: Record<string, string> = {
  // Invitaciones / emails
  invite_created: "Invitación creada",
  email_sent: "Correo enviado",
  invite_resent: "Invitación reenviada",

  // Acceso al link
  link_opened: "Enlace abierto",
  signer_opened: "Firmante abrió el enlace",

  // PDF / archivos
  pdf_uploaded: "PDF subido",
  original_pdf_uploaded: "PDF original subido",
  final_pdf_generated: "PDF final generado",

  // Acciones de firma
  signer_started: "Proceso de firma iniciado",
  signer_submitted: "Firma enviada",
  signed: "Documento firmado",
  rejected: "Documento rechazado",

  // Verificación pública
  verification_match: "Verificación: coincide",
  verification_mismatch: "Verificación: no coincide",

  // Sistema / seguridad
  rate_limited: "Limitación de tasa (rate limit)",
  auth_magic_link: "Magic Link enviado",
};

function titleCase(s: string) {
  return s
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Convierte event_type (crudo) a un label amigable en español.
 * - Usa mapa centralizado.
 * - Fallback: snake_case -> "Snake case" (title case)
 */
export function humanizeAuditEventType(eventType: string | null | undefined) {
  const raw = String(eventType || "").trim();
  if (!raw) return "Evento";

  const key = raw.toLowerCase();
  if (EVENT_LABELS[key]) return EVENT_LABELS[key];

  // Fallback decente
  const normalized = key
    .replace(/\.+/g, " ")
    .replace(/[\/:]+/g, " ")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return titleCase(normalized);
}

export const AUDIT_EVENT_LABELS = EVENT_LABELS;
