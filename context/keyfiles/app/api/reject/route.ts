import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { logEvent } from "@/lib/audit/logEvent";

export const runtime = "nodejs";

const BodySchema = z.object({
  token: z.string(),
  reason: z.string().min(3).max(500),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const admin = createAdminClient();
  const { token, reason } = parsed.data;

  const { data: sr } = await admin
    .from("signing_requests")
    .select("id,document_id,email,status")
    .eq("token", token)
    .maybeSingle();

  if (!sr) return NextResponse.json({ error: "invalid_token" }, { status: 404 });
  if (sr.status !== "pending") return NextResponse.json({ error: "not_pending" }, { status: 400 });

  await admin
    .from("signing_requests")
    .update({
      status: "rejected",
      rejected_at: new Date().toISOString(),
      rejection_reason: reason,
    })
    .eq("id", sr.id);

  await logEvent({
    documentId: sr.document_id,
    signingRequestId: sr.id,
    actorEmail: sr.email,
    eventType: "signature_submitted",
    payload: { rejected: true, reason },
  });

  return NextResponse.json({ ok: true });
}
