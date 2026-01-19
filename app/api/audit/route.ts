import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { logEvent, type AuditEventType } from "@/lib/audit/logEvent";

export const runtime = "nodejs";

const Schema = z.object({
  eventType: z.custom<AuditEventType>(),
  documentId: z.string().uuid(),
  token: z.string().optional(),
  payload: z.record(z.any()).optional(),
});

export async function POST(req: NextRequest) {
  const admin = createAdminClient();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  const userAgent = req.headers.get("user-agent") || "";

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  let signingRequestId: string | null = null;
  let actorEmail: string | null = null;

  if (parsed.data.token) {
    const { data: sr } = await admin
      .from("signing_requests")
      .select("id,email")
      .eq("token", parsed.data.token)
      .maybeSingle();
    signingRequestId = sr?.id ?? null;
    actorEmail = sr?.email ?? null;
  }

  await logEvent({
    documentId: parsed.data.documentId,
    signingRequestId,
    actorEmail,
    eventType: parsed.data.eventType,
    ip,
    userAgent,
    payload: parsed.data.payload,
  });

  return NextResponse.json({ ok: true });
}
