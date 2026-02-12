import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlanCode } from "@/lib/plans";

export const runtime = "nodejs";

type Body = {
  accountId?: string;
  account_id?: string;
  planCode?: PlanCode | string;
  plan_code?: string;
};

const ALLOWED_PERSONAL_PLANS = new Set<string>(["individual_free", "individual_pro"]);

function json(status: number, data: any) {
  return NextResponse.json(data, { status });
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) return json(401, { error: "unauthorized" });

    const body = (await req.json().catch(() => ({}))) as Body;

    const accountId = body.accountId ?? body.account_id;
    const planCodeRaw = body.planCode ?? body.plan_code;

    if (!accountId || typeof accountId !== "string") {
      return json(400, { error: "missing_account_id" });
    }
    if (!planCodeRaw || typeof planCodeRaw !== "string") {
      return json(400, { error: "missing_plan_code" });
    }
    if (!ALLOWED_PERSONAL_PLANS.has(planCodeRaw)) {
      return json(400, { error: "invalid_plan_code", allowed: Array.from(ALLOWED_PERSONAL_PLANS) });
    }

    // Validar membresía (solo owner/admin puede cambiar plan)
    const { data: member, error: memberErr } = await supabase
      .from("account_members")
      .select("role,status")
      .eq("account_id", accountId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberErr) return json(500, { error: "membership_check_failed" });
    if (!member || member.status !== "active") return json(403, { error: "forbidden" });
    if (member.role !== "owner" && member.role !== "admin") return json(403, { error: "forbidden_role" });

    // Validar tipo de cuenta personal
    const { data: account, error: accErr } = await supabase
      .from("accounts")
      .select("account_type")
      .eq("id", accountId)
      .maybeSingle();

    if (accErr) return json(500, { error: "account_lookup_failed" });
    if (!account) return json(404, { error: "account_not_found" });
    if (account.account_type !== "personal") {
      return json(400, { error: "only_personal_accounts_can_change_plan" });
    }

    const admin = createAdminClient();

    // Buscar suscripción activa
    const { data: sub, error: subErr } = await admin
      .from("subscriptions")
      .select("id,plan_code,status")
      .eq("account_id", accountId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subErr) return json(500, { error: "subscription_lookup_failed" });

    if (sub?.id) {
      const { error: updErr } = await admin
        .from("subscriptions")
        .update({ plan_code: planCodeRaw, updated_at: new Date().toISOString() })
        .eq("id", sub.id);

      if (updErr) return json(500, { error: "subscription_update_failed" });
    } else {
      const { error: insErr } = await admin.from("subscriptions").insert({
        account_id: accountId,
        plan_code: planCodeRaw,
        status: "active",
        provider: "manual",
        started_at: new Date().toISOString(),
      });

      if (insErr) return json(500, { error: "subscription_insert_failed" });
    }

    return json(200, { ok: true, accountId, planCode: planCodeRaw });
  } catch (e: any) {
    return json(500, { error: "unexpected_error", message: e?.message ?? String(e) });
  }
}
