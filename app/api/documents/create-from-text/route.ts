import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sha256Hex } from "@/lib/utils/crypto";
import { logEvent } from "@/lib/audit/logEvent";
import { createSimplePdfBytes, htmlToPlainText } from "@/lib/pdf/simplePdf";

export const runtime = "nodejs";

const TitleSchema = z.string().min(3).max(120);
const BodySchema = z.object({
  title: TitleSchema,
  html: z.string().min(1),
});

function parseEnvInt(name: string, fallback: number) {
  const n = Number(process.env[name] || "");
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function planLimitFromPlanCode(planCode: string) {
  const p = (planCode || "").toLowerCase();
  if (p.includes("company") && p.includes("pro")) return parseEnvInt("FES_COMPANY_PRO_DOCS_PER_MONTH", 30);
  if (p.includes("individual") && p.includes("pro")) return parseEnvInt("FES_INDIVIDUAL_PRO_DOCS_PER_MONTH", 20);
  if (p.includes("pro")) return parseEnvInt("FES_INDIVIDUAL_PRO_DOCS_PER_MONTH", 20);
  return parseEnvInt("FES_FREE_DOCS_PER_MONTH", 5);
}

function normalizePlanCode(planCode: string | null | undefined, legacyProfilePlan: string | null | undefined) {
  const p = (planCode || "").trim();
  if (p) return p;
  const legacy = (legacyProfilePlan || "").toLowerCase();
  if (legacy === "pro") return "individual_pro";
  return "individual_free";
}

function getBuenosAiresMonthRangeUTC(d = new Date()) {
  // BA (UTC-3): inicio/fin mes local BA => UTC ISO (03:00 UTC)
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth();
  const start = new Date(Date.UTC(year, month, 1, 3, 0, 0));
  const end = new Date(Date.UTC(year, month + 1, 1, 3, 0, 0));
  return { startISO: start.toISOString(), endISO: end.toISOString() };
}

function isMissingColumnError(err: any, col: string) {
  const msg = String(err?.message || "").toLowerCase();
  return msg.includes("column") && msg.includes(col.toLowerCase()) && msg.includes("does not exist");
}

async function resolveAccountContext(admin: ReturnType<typeof createAdminClient>, userId: string) {
  // 1) profile
  const { data: profile, error: pErr } = await admin
    .from("profiles")
    .select("user_id, plan, default_account_id, onboarding_completed_at, full_name, dni, cuil, address, phone")
    .eq("user_id", userId)
    .maybeSingle();

  if (pErr) throw pErr;

  // 2) accountId (default primero, sino fallback membership)
  let accountId: string | null = profile?.default_account_id ?? null;

  if (!accountId) {
    const { data: mem } = await admin
      .from("account_members")
      .select("account_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    accountId = mem?.account_id ?? null;
  }

  // 3) account type
  let accountType: string = "personal";
  if (accountId) {
    const { data: acc } = await admin.from("accounts").select("account_type").eq("id", accountId).maybeSingle();
    accountType = (acc?.account_type as string) || "personal";
  }

  // 4) plan code desde subscriptions (active)
  let planCode: string | null = null;
  if (accountId) {
    const { data: sub } = await admin
      .from("subscriptions")
      .select("plan_code")
      .eq("account_id", accountId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    planCode = (sub?.plan_code as string) || null;
  }

  const normalizedPlanCode = normalizePlanCode(planCode, profile?.plan || null);

  return {
    profile,
    accountId,
    accountType,
    planCode: normalizedPlanCode,
  };
}

function isOnboardingComplete(profile: any) {
  return Boolean(
    profile?.onboarding_completed_at &&
      profile?.full_name &&
      profile?.dni &&
      profile?.cuil &&
      profile?.address &&
      profile?.phone
  );
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const admin = createAdminClient();

    // Auth
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr) return NextResponse.json({ error: "auth_error", details: userErr.message }, { status: 401 });
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    // Body
    let parsed: z.infer<typeof BodySchema>;
    try {
      parsed = BodySchema.parse(await req.json());
    } catch (e: any) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const title = parsed.title.trim();
    const html = String(parsed.html || "");

    // Contexto (cuenta / plan / onboarding)
    const ctx = await resolveAccountContext(admin, user.id);
    if (!isOnboardingComplete(ctx.profile)) {
      return NextResponse.json(
        {
          error: "Necesitás completar el registro (datos + plan) antes de crear documentos.",
          code: "ONBOARDING_REQUIRED",
        },
        { status: 428 }
      );
    }

    // Enforce límite mensual por plan (por creación)
    const { startISO, endISO } = getBuenosAiresMonthRangeUTC(new Date());
    const limit = planLimitFromPlanCode(ctx.planCode);

    const q = admin
      .from("documents")
      .select("id", { head: true, count: "exact" })
      .gte("created_at", startISO)
      .lt("created_at", endISO);

    if (ctx.accountId) {
      if ((ctx.accountType || "").toLowerCase() === "company") {
        q.eq("account_id", ctx.accountId);
      } else {
        q.or(`account_id.eq.${ctx.accountId},and(account_id.is.null,created_by.eq.${user.id})`);
      }
    } else {
      q.eq("created_by", user.id);
    }

    const { count, error: cErr } = await q;
    if (cErr) throw cErr;

    if ((count || 0) >= limit) {
      return NextResponse.json(
        {
          error: `Alcanzaste el límite mensual de tu plan (${limit}).`,
          code: "PLAN_LIMIT_REACHED",
          limit,
          used: count || 0,
          planCode: ctx.planCode,
        },
        { status: 402 }
      );
    }

    // Convert HTML -> plain text for PDF rendering (v1)
    const bodyText = htmlToPlainText(html);
    if (!bodyText || bodyText.length < 2) {
      return NextResponse.json({ error: "El documento no puede estar vacío." }, { status: 400 });
    }

    // Build PDF bytes (FIX: no BOM/UTF16 “þÿ”)
    const pdfBytes = await createSimplePdfBytes({ title, bodyText });
    const originalHash = sha256Hex(pdfBytes);

    // Upload a storage
    const documentId = crypto.randomUUID();
    const originalPath = `${user.id}/${documentId}/original/original.pdf`;

    const up = await admin.storage.from("fds").upload(originalPath, pdfBytes, {
      contentType: "application/pdf",
      upsert: true,
    });

    if (up.error) {
      return NextResponse.json({ error: "Failed to upload PDF", details: up.error.message }, { status: 500 });
    }

    // Insert DB (alineado a /upload)
    const enriched = {
      id: documentId,
      created_by: user.id, // legacy
      created_by_user_id: user.id,
      account_id: ctx.accountId,
      title,
      status: "pending",
      original_path: originalPath,
      signing_mode: "parallel",
      total_signers: 0,
      signed_count: 0,
      final_path: null,
      original_hash: originalHash,
    };

    let ins = await admin.from("documents").insert(enriched as any);

    if (ins.error) {
      if (isMissingColumnError(ins.error, "created_by_user_id") || isMissingColumnError(ins.error, "account_id")) {
        const fallback = {
          id: documentId,
          created_by: user.id,
          title,
          status: "pending",
          original_path: originalPath,
          signing_mode: "parallel",
          total_signers: 0,
          signed_count: 0,
          final_path: null,
          original_hash: originalHash,
        };

        ins = await admin.from("documents").insert(fallback as any);
      }
    }

    if (ins.error) {
      await admin.storage.from("fds").remove([originalPath]);
      return NextResponse.json({ error: "DB insert failed", details: ins.error.message }, { status: 500 });
    }

    await logEvent({
      documentId,
      actorUserId: user.id,
      eventType: "document_created_from_text",
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      userAgent: req.headers.get("user-agent") || null,
      payload: {
        title,
        originalPath,
        planCode: ctx.planCode,
        accountId: ctx.accountId,
      },
    });

    return NextResponse.json({ ok: true, documentId }, { status: 200 });
  } catch (e: any) {
    console.error("create-from-text error", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
