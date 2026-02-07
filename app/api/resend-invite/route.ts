import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendInviteEmail } from "@/lib/mail/send";
import { logEvent } from "@/lib/audit/logEvent";

export const runtime = "nodejs";

const BodySchema = z.object({
  signingRequestId: z.string().uuid(),
  expiresInDays: z.number().int().min(3).max(30).default(3),
});

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const ct = req.headers.get("content-type") || "";
  const payload = ct.includes("application/json")
    ? await req.json().catch(() => null)
    : Object.fromEntries((await req.formData()).entries());

  const parsed = BodySchema.safeParse({
    signingRequestId: String((payload as any)?.signingRequestId || (payload as any)?.signing_request_id || ""),
    expiresInDays: Number((payload as any)?.expiresInDays || (payload as any)?.expires_in_days || 3),
  });

  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const { signingRequestId, expiresInDays } = parsed.data;

  const { data: sr, error: srErr } = await admin
    .from("signing_requests")
    .select("id,document_id,email,status,token")
    .eq("id", signingRequestId)
    .single();

  if (srErr || !sr) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { data: doc, error: docErr } = await admin
    .from("documents")
    .select("id,title,created_by")
    .eq("id", sr.document_id)
    .single();

  if (docErr || !doc) return NextResponse.json({ error: "doc_not_found" }, { status: 404 });
  if (doc.created_by !== user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
  const newToken = randomUUID();

  // 1) Actualizamos token/estado/vencimiento (NO email_sent_at todavía)
  const upd = await admin
    .from("signing_requests")
    .update({
      token: newToken,
      status: "pending",
      invited_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      rejection_reason: null, // ✅ existe en tu schema
      // ❌ NO rejected_at (no existe)
    })
    .eq("id", sr.id)
    .select("id, token")
    .single();

  if (upd.error || !upd.data) {
    console.error("resend-invite update failed:", upd.error);
    return NextResponse.json(
      { error: "signing_request_update_failed" },
      { status: 500 }
    );
  }

  // 2) Verificación dura: si por cualquier motivo no quedó persistido, NO mandamos mail
  if (upd.data.token !== newToken) {
    console.error("resend-invite token mismatch after update", {
      expected: newToken,
      got: upd.data.token,
    });
    return NextResponse.json(
      { error: "signing_request_token_not_persisted" },
      { status: 500 }
    );
  }

  const signUrl = `${appUrl()}/s/${newToken}`;

  // 3) Enviamos email
  try {
    await sendInviteEmail({
      to: sr.email,
      documentTitle: doc.title,
      signUrl,
      expiresAtIso: expiresAt.toISOString(),
      inviterEmail: user.email ?? undefined,
    });

    // ✅ solo si se envió
    const sentUpd = await admin
      .from("signing_requests")
      .update({ email_sent_at: new Date().toISOString() })
      .eq("id", sr.id);

    if (sentUpd.error) {
      console.warn("email_sent_at update failed:", sentUpd.error);
    }

    await logEvent({
      documentId: doc.id,
      signingRequestId: sr.id,
      actorUserId: user.id,
      actorEmail: sr.email,
      eventType: "email_sent",
      payload: { signUrl, resend: true },
    });

    const redirectUrl = new URL(
      `/dashboard/doc/${doc.id}`,
      process.env.NEXT_PUBLIC_APP_URL || "https://firmasimple.vercel.app"
    );
    redirectUrl.searchParams.set("toast", "resent");
    return NextResponse.redirect(redirectUrl, 303);
  } catch (e: any) {
    const msg = e?.message || "send_failed";

    await logEvent({
      documentId: doc.id,
      signingRequestId: sr.id,
      actorUserId: user.id,
      actorEmail: sr.email,
      eventType: "email_sent",
      payload: { ok: false, error: msg, action: "resend_invite" },
    });

    return NextResponse.json({ error: "email_failed", details: msg }, { status: 429 });
  }
}