import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSimplePdfBytes, htmlToPlainText } from "@/lib/pdf/simplePdf";
import { getMonthlyCreateLimitFromPlanCode } from "@/lib/plans.server";

export const runtime = "nodejs";

const BodySchema = z.object({
  title: z.string().min(3).max(120),
  html: z.string().min(1),
});

function isMissingColumnError(err: any, column: string) {
  const msg = String(err?.message || "").toLowerCase();
  return msg.includes("column") && msg.includes(column.toLowerCase());
}

function normalizePlanCode(planCode: string | null | undefined, legacyPlan: string | null | undefined) {
  const pc = String(planCode || "").trim();
  if (pc) return pc;

  const lp = String(legacyPlan || "").trim();
  if (lp === "free") return "individual_free";
  if (lp === "pro") return "individual_pro";

  return "individual_free";
}

async function resolveAccountContext(admin: ReturnType<typeof createAdminClient>, userId: string) {
  // profiles.default_account_id define “cuenta activa”
  const { data: profile, error: profileErr } = await admin
    .from("profiles")
    .select("default_account_id,plan")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileErr) throw new Error("db_profile_error");

  const activeAccountId = (profile?.default_account_id as string | null) ?? null;

  // Determinar account_type (company/personal) por accounts
  let accountType: "personal" | "company" = "personal";
  if (activeAccountId) {
    const { data: acc, error: accErr } = await admin
      .from("accounts")
      .select("type")
      .eq("id", activeAccountId)
      .maybeSingle();

    if (!accErr && acc?.type) {
      const t = String(acc.type).toLowerCase();
      if (t === "company") accountType = "company";
      if (t === "personal") accountType = "personal";
    }
  }

  // Plan activo por subscriptions (status='active')
  let planCode: string | null = null;
  if (activeAccountId) {
    const { data: sub, error: subErr } = await admin
      .from("subscriptions")
      .select("plan_code")
      .eq("account_id", activeAccountId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!subErr) planCode = sub?.plan_code ?? null;
  }

  const normalizedPlan = normalizePlanCode(planCode, (profile as any)?.plan ?? null);

  return {
    activeAccountId,
    accountType,
    planCode: normalizedPlan,
  };
}

function monthWindowUTC(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));
  return { startISO: start.toISOString(), endISO: end.toISOString() };
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const admin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { title } = parsed.data;
  const bodyText = htmlToPlainText(parsed.data.html);

  // --- Plan/límite mensual (bloquea en creación, no en firma) ---
  const ctx = await resolveAccountContext(admin, user.id);
  const limit = getMonthlyCreateLimitFromPlanCode(ctx.planCode);
  const { startISO, endISO } = monthWindowUTC();

  if (limit > 0) {
    // Cuenta company: por documents.account_id
    // Cuenta personal: documents.account_id + fallback legacy (account_id null y created_by=user.id)
    let q = admin
      .from("documents")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startISO)
      .lt("created_at", endISO);

    if (ctx.accountType === "company") {
      q = q.eq("account_id", ctx.activeAccountId || "");
    } else {
      // personal
      if (ctx.activeAccountId) {
        q = q.or(`account_id.eq.${ctx.activeAccountId},and(account_id.is.null,created_by.eq.${user.id})`);
      } else {
        // fallback extremo (legacy)
        q = q.or(`and(account_id.is.null,created_by.eq.${user.id})`);
      }
    }

    const { count, error: countErr } = await q;
    if (countErr) return NextResponse.json({ error: "db_error" }, { status: 500 });

    if ((count ?? 0) >= limit) {
      return NextResponse.json(
        {
          error: "monthly_limit_reached",
          message: `Alcanzaste el límite mensual de ${limit} documentos para tu plan.`,
        },
        { status: 403 }
      );
    }
  }

  // --- PDF & storage ---
  const documentId = crypto.randomUUID();
  const originalPath = `${user.id}/${documentId}/original/original.pdf`;

  const pdfBytes = createSimplePdfBytes({ title, bodyText });
  const originalHash = crypto.createHash("sha256").update(Buffer.from(pdfBytes)).digest("hex");

  const upload = await admin.storage.from("fds").upload(originalPath, pdfBytes, {
    contentType: "application/pdf",
    upsert: true,
  });

  if (upload.error) {
    return NextResponse.json({ error: "No se pudo subir el PDF." }, { status: 500 });
  }

  // Insert documento (compatible con esquemas legacy: ignora columnas faltantes)
  const basePayload: any = {
    id: documentId,
    title,
    status: "pending",
    signing_mode: "parallel",
    total_signers: 0,
    signed_count: 0,
    created_by: user.id,
    created_at: new Date().toISOString(),
    account_id: ctx.activeAccountId || null,
    original_path: originalPath,
    final_path: null,
    original_hash: originalHash,
    created_by_user_id: user.id,
  };

  const tryInsert = async (payload: any) => admin.from("documents").insert(payload);

  let ins = await tryInsert(basePayload);

  if (ins.error) {
    // Fallbacks por columnas legacy
    let payload = { ...basePayload };
    if (isMissingColumnError(ins.error, "created_by_user_id")) delete payload.created_by_user_id;
    if (isMissingColumnError(ins.error, "original_hash")) delete payload.original_hash;
    if (isMissingColumnError(ins.error, "final_path")) delete payload.final_path;

    ins = await tryInsert(payload);
  }

  if (ins.error) {
    // best-effort cleanup
    try {
      await admin.storage.from("fds").remove([originalPath]);
    } catch {
      // ignore
    }
    return NextResponse.json({ error: "No se pudo crear el documento." }, { status: 500 });
  }

  return NextResponse.json({ documentId }, { status: 200 });
}
