import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendInviteEmail } from "@/lib/mail/send";
import { logEvent } from "@/lib/audit/logEvent";

export const runtime = "nodejs";

const BodySchema = z.object({
  documentId: z.string().uuid(),
  signingMode: z.enum(["parallel", "sequential"]),
  expiresInDays: z.number().int().min(3).max(30).default(3),
  signers: z
    .array(
      z.object({
        email: z.string().email(),
      })
    )
    .min(1),
});

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const body = BodySchema.parse(json);

    const supabase = await createSupabaseServerClient();
    const admin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: doc, error: docErr } = await supabase
      .from("documents")
      .select("id, title, created_by, signing_mode, total_signers, signed_count")
      .eq("id", body.documentId)
      .single();

    if (docErr || !doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (doc.created_by !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Determine existing signers (we allow adding more later)
    const { count: existingCount } = await admin
      .from("signing_requests")
      .select("id", { count: "exact", head: true })
      .eq("document_id", body.documentId);

    const baseCount = existingCount ?? 0;
    const total = baseCount + body.signers.length;

    await supabase
      .from("documents")
      .update({ signing_mode: body.signingMode, total_signers: total })
      .eq("id", body.documentId);

    // Clear previous pending invites (optional): keep simple, we won't delete automatically.
    // Create signing requests
    const expiresAt = new Date(Date.now() + body.expiresInDays * 24 * 60 * 60 * 1000);
    const rows = body.signers.map((s, idx) => ({
      token: randomUUID(),
      document_id: body.documentId,
      email: s.email,
      position: body.signingMode === "sequential" ? baseCount + idx + 1 : null,
      invited_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    }));

    const { data: created, error: insErr } = await admin
      .from("signing_requests")
      .insert(rows)
      .select("id, email, token");

    if (insErr || !created) {
      return NextResponse.json({ error: insErr?.message || "Insert failed" }, { status: 500 });
    }

    await logEvent({
      documentId: body.documentId,
      actorUserId: user.id,
      eventType: "invite_created",
      payload: { count: created.length, signingMode: body.signingMode },
    });

    // Send emails
    const base = appUrl();
    for (const r of created) {
      const signUrl = `${base}/s/${r.token}`;
      await sendInviteEmail({
        to: r.email,
        documentTitle: doc.title,
        signUrl,
        expiresAtIso: expiresAt.toISOString(),
        inviterEmail: user.email ?? undefined,
      });
      await admin
        .from("signing_requests")
        .update({ email_sent_at: new Date().toISOString() })
        .eq("id", r.id);

      await logEvent({
        documentId: body.documentId,
        signingRequestId: r.id,
        actorUserId: user.id,
        actorEmail: r.email,
        eventType: "email_sent",
        payload: { signUrl },
      });
    }

    return NextResponse.json({ ok: true, invited: created.length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 400 });
  }
}
