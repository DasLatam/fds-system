import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSimplePdfBytes, htmlToPlainText } from "@/lib/pdf/simplePdf";
import { getMonthlyCreateLimitFromPlanCode } from "@/lib/plans.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getBuenosAiresMonthRangeUTC(d = new Date()) {
  // BA (UTC-3): inicio/fin de mes local BA => 03:00 UTC
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth();
  const start = new Date(Date.UTC(year, month, 1, 3, 0, 0));
  const end = new Date(Date.UTC(year, month + 1, 1, 3, 0, 0));
  return { startISO: start.toISOString(), endISO: end.toISOString() };
}

async function resolveActiveAccountId(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("default_account_id, plan")
    .eq("user_id", userId)
    .maybeSingle();

  const defaultAccountId = (profile as any)?.default_account_id || null;
  const legacyProfilePlan = (profile as any)?.plan || null;

  if (defaultAccountId) {
    return { accountId: String(defaultAccountId), legacyProfilePlan };
  }

  // Fallback: primera membresía activa (por created_at desc)
  const admin = createAdminClient();
  const { data: memberships } = await admin
    .from("account_members")
    .select("account_id, status, created_at")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1);

  const accountId = (memberships?.[0] as any)?.account_id || null;
  return { accountId: accountId ? String(accountId) : null, legacyProfilePlan };
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const title = String(body?.title || "").trim();
  const html = String(body?.html || "");

  if (!title) {
    return NextResponse.json({ error: "Ingresá un título." }, { status: 400 });
  }

  const bodyText = htmlToPlainText(html);
  if (!bodyText) {
    return NextResponse.json({ error: "Escribí el contenido del documento." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { accountId: activeAccountId, legacyProfilePlan } = await resolveActiveAccountId(user.id);

  // Determinar account_type (company/personal)
  let accountType: "company" | "personal" = "personal";
  if (activeAccountId) {
    const { data: acc } = await admin.from("accounts").select("account_type").eq("id", activeAccountId).maybeSingle();
    if ((acc as any)?.account_type === "company") accountType = "company";
  }

  // Plan activo por cuenta
  let activePlanCode = accountType === "company" ? "company_pro" : "individual_free";
  if (activeAccountId) {
    const { data: sub } = await admin
      .from("subscriptions")
      .select("plan_code,status")
      .eq("account_id", activeAccountId)
      .eq("status", "active")
      .maybeSingle();

    if ((sub as any)?.plan_code) activePlanCode = String((sub as any).plan_code);
  }

  const monthlyLimit = getMonthlyCreateLimitFromPlanCode(activePlanCode, legacyProfilePlan);
  const { startISO, endISO } = getBuenosAiresMonthRangeUTC(new Date());

  // Uso del mes por cuenta activa:
  // - company: documents.account_id
  // - personal: documents.account_id + fallback legacy (account_id null y created_by=user.id)
  let countQuery = admin
    .from("documents")
    .select("id", { count: "exact", head: true })
    .gte("created_at", startISO)
    .lt("created_at", endISO);

  if (accountType === "company") {
    if (!activeAccountId) {
      return NextResponse.json({ error: "No se pudo resolver la cuenta activa." }, { status: 400 });
    }
    countQuery = countQuery.eq("account_id", activeAccountId);
  } else {
    if (activeAccountId) {
      countQuery = countQuery.or(`account_id.eq.${activeAccountId},and(account_id.is.null,created_by.eq.${user.id})`);
    } else {
      countQuery = countQuery.or(`and(account_id.is.null,created_by.eq.${user.id})`);
    }
  }

  const { count: usedThisMonth, error: countError } = await countQuery;
  if (countError) {
    return NextResponse.json({ error: "No se pudo validar el uso del mes." }, { status: 500 });
  }

  if ((usedThisMonth || 0) >= monthlyLimit) {
    return NextResponse.json(
      {
        code: "PLAN_LIMIT_REACHED",
        error: `Alcanzaste el límite mensual de creación de documentos (${monthlyLimit}).`,
      },
      { status: 402 }
    );
  }

  const documentId = randomUUID();
  const originalPath = `docs/${documentId}/original.pdf`;

  const pdfBytes = createSimplePdfBytes({ title, bodyText });

  const upload = await admin.storage.from("fds").upload(originalPath, pdfBytes, {
    contentType: "application/pdf",
    upsert: true,
  });

  if (upload.error) {
    return NextResponse.json({ error: "No se pudo subir el PDF." }, { status: 500 });
  }

  const { error: insertError } = await admin.from("documents").insert({
    id: documentId,
    title,
    status: "draft",
    signing_mode: "parallel",
    total_signers: 0,
    signed_count: 0,
    created_by: user.id,
    account_id: activeAccountId || null,
    original_path: originalPath,
  });

  if (insertError) {
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
