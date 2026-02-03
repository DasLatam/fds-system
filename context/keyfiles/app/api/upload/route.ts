import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sha256Hex } from "@/lib/utils/crypto";
import { logEvent } from "@/lib/audit/logEvent";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();

// ===== FES: Plan/Límite (Free) =====
const FREE_LIMIT = Number(process.env.FES_FREE_DOCS_PER_MONTH || "5");
try {
  // Obtener user id (server-side)
  let userId: string | null = null;
  // patrones comunes
  // @ts-ignore
  if (typeof user !== "undefined" && user?.id) userId = user.id;
  // @ts-ignore
  if (!userId && typeof session !== "undefined" && session?.user?.id) userId = session.user.id;

  // Si no tenemos user, no bloqueamos acá (auth middleware debería cubrir)
  if (userId) {
    // Buscar plan
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("user_id", userId)
      .maybeSingle();

    const plan = (profile?.plan || "free") as string;

    if (plan !== "pro") {
      // Contar documentos creados en el mes actual
      const now = new Date();
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
      const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));

      const { count } = await supabase
        .from("documents")
        .select("id", { head: true, count: "exact" })
        .eq("created_by", userId)
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString());

      if ((count || 0) >= FREE_LIMIT) {
        return NextResponse.json(
          {
            error: "Alcanzaste el límite mensual del plan Free. Actualizá a Pro para crear más documentos.",
            code: "PLAN_LIMIT_REACHED",
            limit: FREE_LIMIT,
          },
          { status: 402 }
        );
      }
    }
  }
} catch (e) {
  // Si falla el check, no rompemos creación (fail-open) para no cortar producción.
  console.warn("plan_limit_check_failed", e);
}
// ===== end Plan/Límite =====

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
