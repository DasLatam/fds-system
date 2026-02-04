import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const BodySchema = z.object({
  plan: z.enum(["free", "individual_pro", "company_pro"]),
  profile: z.object({
    fullName: z.string().min(2).max(120),
    dni: z.string().min(5).max(32),
    cuil: z.string().min(5).max(32),
    address: z.string().min(5).max(200),
    phone: z.string().min(5).max(50),
  }),
  company: z
    .object({
      name: z.string().min(2).max(200),
      cuit: z.string().min(5).max(32),
      address: z.string().min(5).max(200),
      representativeRole: z.string().min(2).max(120),
    })
    .optional(),
});

function plus30Days() {
  const now = new Date();
  const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return { start: now.toISOString(), end: end.toISOString() };
}

async function getLatestPersonalAccountId(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const { data: rows } = await admin
    .from("accounts")
    .select("id, account_type, created_at")
    .eq("account_type", "personal")
    .order("created_at", { ascending: false });

  if (!rows || rows.length === 0) {
    // fallback: membership
    const { data: mem } = await admin
      .from("account_members")
      .select("account_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return mem?.account_id ?? null;
  }

  // puede existir más de una personal, elegimos la más nueva del sistema
  return (rows[0] as any)?.id ?? null;
}

async function setActiveSubscriptionPlan(
  admin: ReturnType<typeof createAdminClient>,
  accountId: string,
  planCode: string
) {
  const { start, end } = plus30Days();

  const { data: sub } = await admin
    .from("subscriptions")
    .select("id")
    .eq("account_id", accountId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sub?.id) {
    const upd = await admin
      .from("subscriptions")
      .update({
        plan_code: planCode,
        current_period_start: start,
        current_period_end: end,
        provider: "manual",
      })
      .eq("id", sub.id);

    if (upd.error) throw upd.error;
    return;
  }

  const ins = await admin.from("subscriptions").insert({
    account_id: accountId,
    plan_code: planCode,
    status: "active",
    current_period_start: start,
    current_period_end: end,
    provider: "manual",
  });

  if (ins.error) throw ins.error;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const admin = createAdminClient();

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr) return NextResponse.json({ error: "auth_error", details: userErr.message }, { status: 401 });
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = BodySchema.parse(await req.json());

    if (body.plan === "company_pro" && !body.company) {
      return NextResponse.json({ error: "Faltan datos de empresa." }, { status: 400 });
    }

    // Upsert profile (identidad + onboarding + compat plan)
    const legacyPlan = body.plan === "free" ? "free" : "pro";

    const profUp = await admin.from("profiles").upsert(
      {
        user_id: user.id,
        email: user.email || null,
        full_name: body.profile.fullName,
        dni: body.profile.dni,
        cuil: body.profile.cuil,
        address: body.profile.address,
        phone: body.profile.phone,
        plan: legacyPlan,
        onboarding_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any,
      { onConflict: "user_id" }
    );

    if (profUp.error) throw profUp.error;

    // Plan / cuenta activa
    if (body.plan === "company_pro") {
      const c = body.company!;

      // Reusar company account si ya existe (creada por este user)
      const { data: existing } = await admin
        .from("accounts")
        .select("id")
        .eq("account_type", "company")
        .eq("created_by_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      let companyAccountId = existing?.id as string | undefined;

      if (!companyAccountId) {
        const insAcc = await admin
          .from("accounts")
          .insert({
            account_type: "company",
            name: c.name,
            company_name: c.name,
            company_cuit: c.cuit,
            company_address: c.address,
            created_by_user_id: user.id,
          } as any)
          .select("id")
          .single();

        if (insAcc.error) throw insAcc.error;
        companyAccountId = (insAcc.data as any).id;
      } else {
        // update empresa (por si corrigió datos)
        const updAcc = await admin
          .from("accounts")
          .update({
            name: c.name,
            company_name: c.name,
            company_cuit: c.cuit,
            company_address: c.address,
          } as any)
          .eq("id", companyAccountId);

        if (updAcc.error) throw updAcc.error;
      }

      // membership (owner) + rol representante
      const memIns = await admin.from("account_members").insert({
        account_id: companyAccountId,
        user_id: user.id,
        role: "owner",
        status: "active",
        company_role: c.representativeRole,
      } as any);

      // si ya existía, ignoramos conflicto
      if (memIns.error && String(memIns.error.code) !== "23505") {
        // 23505 = unique violation
        // si tu tabla no tiene unique constraint, esto no aplica, pero no rompe.
        throw memIns.error;
      }

      // subscription company_pro
      await setActiveSubscriptionPlan(admin, companyAccountId, "company_pro");

      // set default account al company
      const updProf = await admin
        .from("profiles")
        .update({ default_account_id: companyAccountId } as any)
        .eq("user_id", user.id);

      if (updProf.error) throw updProf.error;

      return NextResponse.json({ ok: true, accountId: companyAccountId, planCode: "company_pro" });
    }

    // Personal (free / individual_pro)
    const personalAccountId = await getLatestPersonalAccountId(admin, user.id);
    if (personalAccountId) {
      const planCode = body.plan === "individual_pro" ? "individual_pro" : "individual_free";
      await setActiveSubscriptionPlan(admin, personalAccountId, planCode);

      // aseguramos default_account_id
      const updProf = await admin
        .from("profiles")
        .update({ default_account_id: personalAccountId } as any)
        .eq("user_id", user.id);

      if (updProf.error) throw updProf.error;

      return NextResponse.json({ ok: true, accountId: personalAccountId, planCode });
    }

    // fallback extremo: si no hay personal account, igual dejamos onboarding hecho
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("onboarding: unexpected error", e);
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}
