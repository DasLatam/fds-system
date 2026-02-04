// Mapeo centralizado de event_type -> label human-friendly (ES)
//
// Objetivo:
// - UI no muestra claves crudas (email_sent, invite_created, etc.).
// - Fallback decente si aparece un event_type nuevo.

const EVENT_LABELS: Record<string, string> = {
  // Invitaciones / workflow
  invite_created: "Invitación creada",
  invite_resent: "Invitación reenviada",
  invite_opened: "Invitación abierta",
  email_sent: "Correo enviado",
  completion_email_sent: "Aviso final enviado",
  completion_email_failed: "Fallo al enviar aviso final",

  // Documentos / archivos
  document_created: "Documento creado",
  document_updated: "Documento actualizado",
  pdf_uploaded: "PDF subido",
  pdf_downloaded: "PDF descargado",
  document_completed: "Documento finalizado",

  // Firma
  signature_submitted: "Firma registrada",
  signature_rejected: "Firma rechazada",
  signer_signed: "Firmante firmó",
  signer_rejected: "Firmante rechazó",

  // Cuenta / planes
  onboarding_completed: "Onboarding completado",
  plan_changed: "Plan cambiado",
  account_changed: "Cuenta activa cambiada",
};

const WORD_TRANSLATIONS: Record<string, string> = {
  // términos frecuentes en event_type
  email: "correo",
  sent: "enviado",
  failed: "falló",
  failure: "falló",
  invite: "invitación",
  invitation: "invitación",
  created: "creada",
  create: "crear",
  resent: "reenviada",
  opened: "abierta",
  open: "abrir",
  pdf: "PDF",
  uploaded: "subido",
  upload: "subir",
  downloaded: "descargado",
  download: "descargar",
  document: "documento",
  completed: "finalizado",
  completion: "finalización",
  signature: "firma",
  submitted: "registrada",
  rejected: "rechazada",
  signer: "firmante",
  onboarding: "onboarding",
  plan: "plan",
  account: "cuenta",
  changed: "cambiada",
  updated: "actualizado",
};

function capitalizeWord(w: string) {
  if (!w) return w;
  // si viene como "PDF" ya está
  if (w.toUpperCase() === w && w.length <= 4) return w;
  return w.charAt(0).toUpperCase() + w.slice(1);
}

function fallbackHumanize(eventType: string) {
  const raw = String(eventType || "").trim();
  if (!raw) return "Evento";

  const parts = raw
    .split(/[_\-\s]+/g)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 0) return "Evento";

  const words = parts.map((p) => {
    const key = p.toLowerCase();
    const t = WORD_TRANSLATIONS[key];
    return t ?? key;
  });

  // Title Case (pero preservando PDF)
  return words.map(capitalizeWord).join(" ");
}

export function humanizeAuditEventType(eventType: string) {
  const key = String(eventType || "").trim();
  if (!key) return "Evento";

  return EVENT_LABELS[key] ?? fallbackHumanize(key);
}
