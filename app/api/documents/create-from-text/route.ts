import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import crypto from "crypto";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sha256Hex } from "@/lib/utils/crypto";
import { logEvent } from "@/lib/audit/logEvent";
import { createSimplePdfBytes } from "@/lib/pdf/simplePdf";

export const runtime = "nodejs";

const BodySchema = z.object({
  title: z.string().min(3).max(120),
  html: z.string().min(1).max(500_000),
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
  const { data: profile, error: pErr } = await admin
    .from("profiles")
    .select("user_id, plan, default_account_id, onboarding_completed_at, full_name, dni, cuil, address, phone")
    .eq("user_id", userId)
    .maybeSingle();

  if (pErr) throw pErr;

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

  let accountType: string = "personal";
  if (accountId) {
    const { data: acc } = await admin.from("accounts").select("account_type").eq("id", accountId).maybeSingle();
    accountType = (acc?.account_type as string) || "personal";
  }

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

function htmlToPlainText(html: string) {
  const raw = String(html || "");
  // Normalización suave: <br> y </p> como saltos
  let s = raw
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\/\s*p\s*>/gi, "\n")
    .replace(/<\/\s*div\s*>/gi, "\n")
    .replace(/<\s*li\s*>/gi, "• ")
    .replace(/<\/\s*li\s*>/gi, "\n");

  // strip tags restantes
  s = s.replace(/<[^>]+>/g, "");

  // decode entidades básicas
  s = s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");

  // compactar espacios
  s = s.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n");
  return s.trim();
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

    // Enforce límite mensual (por creación)
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

    // Parse body
    const body = BodySchema.parse(await req.json());
    const title = body.title.trim();
    const bodyText = htmlToPlainText(body.html);

    // Generar PDF válido
    const pdfBytes = await createSimplePdfBytes({ title, bodyText });

    const documentId = crypto.randomUUID();
    const originalPath = `${user.id}/${documentId}/original/original.pdf`;
    const originalHash = sha256Hex(pdfBytes);

    const up = await admin.storage.from("fds").upload(originalPath, pdfBytes, {
      contentType: "application/pdf",
      upsert: true,
    });

    if (up.error) {
      return NextResponse.json({ error: "Failed to upload PDF", details: up.error.message }, { status: 500 });
    }

    // Insert DB (alineado al upload)
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
      return NextResponse.json({ error: "Failed to create document", details: ins.error.message }, { status: 500 });
    }

    await logEvent({
      documentId,
      actorUserId: user.id,
      // usamos un eventType existente en AuditEventType para no romper build
      eventType: "doc_created",
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      userAgent: req.headers.get("user-agent") || null,
      payload: {
        title,
        originalPath,
        planCode: ctx.planCode,
        accountId: ctx.accountId,
        source: "redact",
      },
    });

    return NextResponse.json({ ok: true, documentId });
  } catch (e: any) {
    console.error("documents/create-from-text: unexpected error", e);
    const msg = String(e?.message || "");
    if (msg.toLowerCase().includes("json")) {
      return NextResponse.json({ error: "invalid_body", details: msg }, { status: 400 });
    }
    return NextResponse.json({ error: msg || "Unexpected error" }, { status: 500 });
  }
}
