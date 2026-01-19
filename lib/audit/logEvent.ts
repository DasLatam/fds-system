import { createAdminClient } from "@/lib/supabase/admin";

export type AuditEventType =
  | "doc_created"
  | "pdf_uploaded"
  | "invite_created"
  | "email_sent"
  | "link_opened"
  | "pdf_viewed"
  | "signature_submitted"
  | "pdf_finalized";

export async function logEvent(opts: {
  documentId: string;
  signingRequestId?: string | null;
  actorUserId?: string | null;
  actorEmail?: string | null;
  eventType: AuditEventType;
  ip?: string | null;
  userAgent?: string | null;
  payload?: Record<string, any>;
}) {
  const admin = createAdminClient();
  await admin.from("audit_events").insert({
    document_id: opts.documentId,
    signing_request_id: opts.signingRequestId ?? null,
    actor_user_id: opts.actorUserId ?? null,
    actor_email: opts.actorEmail ?? null,
    event_type: opts.eventType,
    ip: opts.ip ?? null,
    user_agent: opts.userAgent ?? null,
    payload: opts.payload ?? {},
  });
}
