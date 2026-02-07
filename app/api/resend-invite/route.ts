import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { createAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function jsonError(status: number, error: string, details?: unknown) {
  return NextResponse.json({ error, details }, { status });
}

function getBaseUrl(req: Request) {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (env) return env.replace(/\/$/, "");
  return new URL(req.url).origin;
}

export async function POST(req: Request) {
  const { supabase } = createSupabaseServerClient();
  const admin = createAdminClient();

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  const user = auth?.user;
  if (authErr || !user) return jsonError(401, "unauthorized");

  const body = await req.json().catch(() => null);
  const signingRequestId = body?.signingRequestId as string | undefined;
  if (!signingRequestId || typeof signingRequestId !== "string") {
    return jsonError(400, "invalid_body", { field: "signingRequestId" });
  }

  // Load current signing request
  const { data: sr, error: srErr } = await admin
    .from("signing_requests")
    .select("id,document_id,email,status,signing_mode,position,replaced_by")
    .eq("id", signingRequestId)
    .maybeSingle();

  if (srErr) return jsonError(500, "db_error", srErr);
  if (!sr) return jsonError(404, "not_found");

  // Ownership check: user must own the document
  const { data: doc, error: docErr } = await admin
    .from("documents")
    .select("id,title,created_by")
    .eq("id", sr.document_id)
    .maybeSingle();

  if (docErr) return jsonError(500, "db_error", docErr);
  if (!doc) return jsonError(404, "document_not_found");
  if (doc.created_by !== user.id) return jsonError(403, "forbidden");

  const now = new Date();
  const nowIso = now.toISOString();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  // Create a NEW signing request id (public token) and mark the old one as replaced.
  const newId = randomUUID();

  const ins = await admin
    .from("signing_requests")
    .insert({
      id: newId,
      document_id: sr.document_id,
      email: sr.email,
      status: "pending",
      signing_mode: sr.signing_mode,
      position: sr.position,
      invited_at: nowIso,
      expires_at: expiresAt,
    })
    .select("id,email")
    .maybeSingle();

  if (ins.error || !ins.data) return jsonError(500, "insert_failed", ins.error);

  await admin
    .from("signing_requests")
    .update({ replaced_by: newId })
    .eq("id", signingRequestId);

  const baseUrl = getBaseUrl(req);
  const signUrl = `${baseUrl}/s/${newId}`;

  const resendKey = process.env.RESEND_API_KEY;
  const resendFrom = process.env.RESEND_FROM || "Firma Simple <no-reply@firmasimple.app>";

  if (resendKey) {
    const { Resend } = await import("resend");
    const resend = new Resend(resendKey);
    try {
      await resend.emails.send({
        from: resendFrom,
        to: sr.email,
        subject: `Reenvío de invitación: ${doc.title ?? "Documento"}`,
        html: `
          <div style="font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial;line-height:1.45">
            <h2 style="margin:0 0 12px 0">Reenvío de invitación</h2>
            <p style="margin:0 0 12px 0">Te reenviaron la invitación para firmar:</p>
            <p style="margin:0 0 18px 0"><strong>${doc.title ?? "Documento"}</strong></p>
            <p style="margin:0 0 18px 0">
              <a href="${signUrl}" style="display:inline-block;padding:10px 14px;border-radius:10px;background:#111;color:#fff;text-decoration:none">Abrir para firmar</a>
            </p>
            <p style="margin:0;color:#555;font-size:12px">Si no esperabas este mensaje, podés ignorarlo.</p>
          </div>
        `,
      });
      await admin.from("signing_requests").update({ email_sent_at: nowIso }).eq("id", newId);
    } catch {
      // ignore
    }
  }

  return NextResponse.json({ ok: true, id: newId, url: signUrl });
}
