import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { createAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function jsonError(status: number, error: string, details?: unknown) {
  return NextResponse.json({ error, details }, { status });
}

function getBaseUrl(req: Request) {
  // prefer explicit env, fallback to request origin
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (env) return env.replace(/\/$/, "");
  return new URL(req.url).origin;
}

function normalizeEmail(e: string) {
  return e.trim().toLowerCase();
}

function isEmail(s: string) {
  // pragmatic check (avoid rejecting valid-but-rare forms)
  return /^\S+@\S+\.\S+$/.test(s);
}

export async function POST(req: Request) {
  const { supabase } = createSupabaseServerClient();
  const admin = createAdminClient();

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  const user = auth?.user;
  if (authErr || !user) return jsonError(401, "unauthorized");

  const body = await req.json().catch(() => null);
  const documentId = body?.documentId as string | undefined;
  const signingMode = (body?.signingMode as string | undefined) ?? null;
  const emailsRaw = (body?.emails as unknown) ?? [];

  if (!documentId || typeof documentId !== "string") {
    return jsonError(400, "invalid_body", { field: "documentId" });
  }

  if (!Array.isArray(emailsRaw)) {
    return jsonError(400, "invalid_body", { field: "emails" });
  }

  const emails = Array.from(
    new Set(
      emailsRaw
        .filter((x: unknown) => typeof x === "string")
        .map((x: string) => normalizeEmail(x))
        .filter((x: string) => x.length > 3)
    )
  ).filter(isEmail);

  if (emails.length === 0) {
    return jsonError(400, "invalid_body", { field: "emails" });
  }

  // Load document and ownership
  const { data: doc, error: docErr } = await admin
    .from("documents")
    .select("id,title,created_by,account_id,signing_mode,total_signers")
    .eq("id", documentId)
    .maybeSingle();

  if (docErr) return jsonError(500, "db_error", docErr);
  if (!doc) return jsonError(404, "document_not_found");
  if (doc.created_by !== user.id) return jsonError(403, "forbidden");

  // Determine positions (append after existing invites)
  const { count: existingCount, error: countErr } = await admin
    .from("signing_requests")
    .select("id", { count: "exact", head: true })
    .eq("document_id", documentId);

  if (countErr) return jsonError(500, "db_error", countErr);

  const now = new Date();
  const nowIso = now.toISOString();

  // Default expiry: 7 days (can be tuned later)
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const startPos = (existingCount ?? 0) + 1;

  // IMPORTANT: we use signing_requests.id as the public token.
  // The DB schema does not require a separate "token" column.
  const rows = emails.map((email: string, i: number) => ({
    id: randomUUID(),
    document_id: documentId,
    email,
    status: "pending",
    signing_mode: signingMode ?? doc.signing_mode ?? "draw",
    position: startPos + i,
    invited_at: nowIso,
    expires_at: expiresAt,
  }));

  const ins = await admin
    .from("signing_requests")
    .insert(rows)
    .select("id,email");

  if (ins.error || !ins.data) return jsonError(500, "insert_failed", ins.error);

  // Best-effort: update document counters
  await admin
    .from("documents")
    .update({
      total_signers: (doc.total_signers ?? 0) + rows.length,
      signing_mode: signingMode ?? doc.signing_mode ?? "draw",
      status: "pending",
    })
    .eq("id", documentId);

  const baseUrl = getBaseUrl(req);

  // Send emails (best-effort). If you already had this wired elsewhere, keep it there;
  // this route only guarantees DB rows + correct tokens.
  // NOTE: If RESEND isn't configured, we still return success (invites exist).
  const resendKey = process.env.RESEND_API_KEY;
  const resendFrom = process.env.RESEND_FROM || "Firma Simple <no-reply@firmasimple.app>";

  if (resendKey) {
    const { Resend } = await import("resend");
    const resend = new Resend(resendKey);

    await Promise.all(
      ins.data.map(async (r) => {
        const signUrl = `${baseUrl}/s/${r.id}`;
        try {
          await resend.emails.send({
            from: resendFrom,
            to: r.email,
            subject: `Firma requerida: ${doc.title ?? "Documento"}`,
            html: `
              <div style="font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial;line-height:1.45">
                <h2 style="margin:0 0 12px 0">Firma requerida</h2>
                <p style="margin:0 0 12px 0">Te solicitaron firmar el documento:</p>
                <p style="margin:0 0 18px 0"><strong>${doc.title ?? "Documento"}</strong></p>
                <p style="margin:0 0 18px 0">
                  <a href="${signUrl}" style="display:inline-block;padding:10px 14px;border-radius:10px;background:#111;color:#fff;text-decoration:none">Abrir para firmar</a>
                </p>
                <p style="margin:0;color:#555;font-size:12px">Si no esperabas este mensaje, podés ignorarlo.</p>
              </div>
            `,
          });
          await admin
            .from("signing_requests")
            .update({ email_sent_at: nowIso })
            .eq("id", r.id);
        } catch {
          // ignore; invite exists in DB
        }
      })
    );
  }

  return NextResponse.json({
    ok: true,
    documentId,
    invites: ins.data.map((r) => ({ id: r.id, email: r.email, url: `${baseUrl}/s/${r.id}` })),
  });
}
