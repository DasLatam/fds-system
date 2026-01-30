import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sha256Hex } from "@/lib/utils/crypto";
import { logEvent } from "@/lib/audit/logEvent";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const admin = createAdminClient();

  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const title = String(form.get("title") || "").trim();
  const file = form.get("file");

  if (!file || !(file instanceof File)) return NextResponse.json({ error: "Missing PDF file" }, { status: 400 });
  if (file.type !== "application/pdf") return NextResponse.json({ error: "File must be a PDF" }, { status: 400 });

  // Usage limits: MVP keeps everything free. Billing comes later.

  const docId = randomUUID();
  const safeTitle = title || file.name || "Documento";

  const bytes = new Uint8Array(await file.arrayBuffer());
  const originalHash = sha256Hex(bytes);

  const originalPath = `${user.id}/${docId}/original/original.pdf`;

  const up = await admin.storage.from("fds").upload(originalPath, bytes, {
    contentType: "application/pdf",
    upsert: false,
  });

  if (up.error) {
    return NextResponse.json({ error: `Storage upload failed: ${up.error.message}` }, { status: 500 });
  }

  const ins = await supabase.from("documents").insert({
    id: docId,
    created_by: user.id,
    title: safeTitle,
    status: "pending",
    signing_mode: "parallel",
    total_signers: 0,
    signed_count: 0,
    original_path: originalPath,
    final_path: null,
    original_hash: originalHash,
  });

  if (ins.error) {
    await admin.storage.from("fds").remove([originalPath]);
    return NextResponse.json({ error: `DB insert failed: ${ins.error.message}` }, { status: 500 });
  }

  await logEvent({
    documentId: docId,
    actorUserId: user.id,
    eventType: "pdf_uploaded",
    ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    userAgent: req.headers.get("user-agent") || null,
    payload: { title: safeTitle, originalPath },
  });

  return NextResponse.json({ documentId: docId });
}
