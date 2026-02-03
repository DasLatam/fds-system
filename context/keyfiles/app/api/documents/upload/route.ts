import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const TitleSchema = z.string().min(3).max(120);

export async function POST(req: NextRequest) {
  try {
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

    const { data: { user }, error: userErr } = await supabase.auth.getUser();

    if (userErr) {
      return NextResponse.json({ error: "auth_error", details: userErr.message }, { status: 401 });
    }
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const form = await req.formData();
    const title = TitleSchema.parse(String(form.get("title") || "").trim());

    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Missing PDF file" }, { status: 400 });
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
    }

    const admin = createAdminClient();

    // ✅ Generamos ID nosotros (porque la tabla no tiene default)
    const documentId = crypto.randomUUID();
    const originalPath = `${user.id}/${documentId}/original/original.pdf`;

    console.log("upload: start", { userId: user.id, documentId, title, originalPath });

    // 1) Subir PDF primero (si falla, no ensuciamos DB)
    const bytes = new Uint8Array(await file.arrayBuffer());

    const up = await admin.storage.from("fds").upload(originalPath, bytes, {
      contentType: "application/pdf",
      upsert: true,
    });

    if (up.error) {
      console.error("upload: storage upload failed", up.error);
      return NextResponse.json({ error: "Failed to upload PDF", details: up.error.message }, { status: 500 });
    }

    // 2) Insert en documents (con original_path NOT NULL)
    const ins = await admin.from("documents").insert({
      id: documentId,
      created_by: user.id,
      title,
      status: "pending",
      original_path: originalPath,
      signing_mode: "parallel",
      total_signers: 0,
      signed_count: 0,
    });

    if (ins.error) {
      console.error("upload: documents insert failed", ins.error);

      // rollback storage
      await admin.storage.from("fds").remove([originalPath]);

      return NextResponse.json(
        { error: "Failed to create document", details: ins.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, documentId });
  } catch (e: any) {
    console.error("upload: unexpected error", e);
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}