import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sha256Hex } from "@/lib/utils/crypto";
import { logEvent } from "@/lib/audit/logEvent";

export const runtime = "nodejs";

function isMissingColumnError(err: any) {
  return err?.code === "42703" || /column .* does not exist/i.test(err?.message || "");
}

function getBuenosAiresMonthRangeUTC() {
  const nowBA = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const y = nowBA.getUTCFullYear();
  const m = nowBA.getUTCMonth();
  const startUtc = new Date(Date.UTC(y, m, 1, 3, 0, 0));
  const endUtc = new Date(Date.UTC(y, m + 1, 1, 3, 0, 0));
  return { startIso: startUtc.toISOString(), endIso: endUtc.toISOString() };
}

async function resolveAccountId(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const prof = await admin.from("profiles").select("default_account_id").eq("user_id", userId).maybeSingle();
  if (!prof.error) {
    const accountId = (prof.data as any)?.default_account_id as string | null;
    if (accountId) return accountId;
  }

  const mem = await admin
    .from("account_members")
    .select("account_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!mem.error) return (mem.data as any)?.account_id || null;
  return null;
}

async function resolvePlanCode(admin: ReturnType<typeof createAdminClient>, userId: string, accountId: string | null) {
  if (accountId) {
    const sub = await admin
      .from("subscriptions")
      .select("plan_code,status")
      .eq("account_id", accountId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub.error && sub.data?.plan_code) return String(sub.data.plan_code);
  }

  const prof = await admin.from("profiles").select("plan").eq("user_id", userId).maybeSingle();
  if (!prof.error && (prof.data as any)?.plan) return String((prof.data as any).plan);

  return "free";
}

function isProPlan(planCode: string | null) {
  const p = (planCode || "").toLowerCase();
  return p.includes("pro");
}

async function enforceFreeLimitOrThrow(args: {
  admin: ReturnType<typeof createAdminClient>;
  userId: string;
  accountId: string | null;
  planCode: string | null;
}) {
  const FREE_LIMIT = Number(process.env.FES_FREE_DOCS_PER_MONTH || "5");
  if (isProPlan(args.planCode)) return null;

  const { startIso, endIso } = getBuenosAiresMonthRangeUTC();

  const q = args.admin
    .from("documents")
    .select("id", { head: true, count: "exact" })
    .gte("created_at", startIso)
    .lt("created_at", endIso);

  if (args.accountId) {
    q.or(`account_id.eq.${args.accountId},and(account_id.is.null,created_by.eq.${args.userId})`);
  } else {
    q.eq("created_by", args.userId);
  }

  const { count, error } = await q;
  if (error) {
    console.warn("plan_limit_count_failed", error);
    return null;
  }

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

  return null;
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const admin = createAdminClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accountId = await resolveAccountId(admin, user.id);
  const planCode = await resolvePlanCode(admin, user.id, accountId);

  const limitResp = await enforceFreeLimitOrThrow({ admin, userId: user.id, accountId, planCode });
  if (limitResp) return limitResp;

  const form = await req.formData();
  const title = String(form.get("title") || "").trim();
  const file = form.get("file");

  if (!file || !(file instanceof File)) return NextResponse.json({ error: "Missing PDF file" }, { status: 400 });
  if (file.type !== "application/pdf") return NextResponse.json({ error: "File must be a PDF" }, { status: 400 });

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

  const baseDoc: any = {
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
  };

  const enrichedDoc: any = {
    ...baseDoc,
    created_by_user_id: user.id,
    account_id: accountId,
  };

  let ins = await admin.from("documents").insert(enrichedDoc);

  if (ins.error && isMissingColumnError(ins.error)) {
    ins = await admin.from("documents").insert(baseDoc);
  }

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
    payload: { title: safeTitle, originalPath, accountId, planCode },
  });

  return NextResponse.json({ documentId: docId });
}
