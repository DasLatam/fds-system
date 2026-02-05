import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Este endpoint se usa tanto para:
 * - Leer perfil (GET) para autofill / UI.
 * - Guardar perfil (POST) en formato "flat" (legacy) o en formato "onboarding" (plan + profile + company).
 *
 * Motivo: en producción vimos clientes que POSTean payload de onboarding a /api/profile.
 * Para evitar 400 invalid_body y romper onboarding, aceptamos ambos formatos.
 */

// --------------------
// Schemas
// --------------------
const FlatSnakeSchema = z.object({
  full_name: z.string().min(2),
  dni: z.string().min(5),
  cuil: z.string().min(5),
  address: z.string().min(5),
  phone: z.string().min(5),
});

const FlatCamelSchema = z.object({
  fullName: z.string().min(2),
  dni: z.string().min(5),
  cuil: z.string().min(5),
  address: z.string().min(5),
  phone: z.string().min(5),
});

const OnboardingSchema = z.object({
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

function isMissingColumnError(err: any) {
  const code = String(err?.code || "");
  if (code === "42703") return true; // undefined_column
  const msg = String(err?.message || "");
  return msg.toLowerCase().includes("column") && msg.toLowerCase().includes("does not exist");
}

async function getLatestPersonalAccountId(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const { data: mems } = await admin
    .from("account_members")
    .select("account_id, status, created_at")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const ids = (mems || []).map((m: any) => m.account_id).filter(Boolean);
  if (ids.length === 0) return null;

  const { data: acc } = await admin
    .from("accounts")
    .select("id, account_type, created_at")
    .in("id", ids)
    .eq("account_type", "personal")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (acc as any)?.id ?? null;
}

async function setActiveSubscriptionPlan(admin: ReturnType<typeof createAdminClient>, accountId: string, planCode: string) {
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

function normalizeFlatProfilePayload(json: any):
  | { full_name: string; dni: string; cuil: string; address: string; phone: string }
  | null {
  const snake = FlatSnakeSchema.safeParse(json);
  if (snake.success) return snake.data;

  const camel = FlatCamelSchema.safeParse(json);
  if (camel.success) {
    return {
      full_name: camel.data.fullName,
      dni: camel.data.dni,
      cuil: camel.data.cuil,
      address: camel.data.address,
      phone: camel.data.phone,
    };
  }

  // También aceptamos { profile: {...} } aunque se haya enviado al endpoint equivocado.
  const nested = z.object({ profile: FlatCamelSchema }).safeParse(json);
  if (nested.success) {
    return {
      full_name: nested.data.profile.fullName,
      dni: nested.data.profile.dni,
      cuil: nested.data.profile.cuil,
      address: nested.data.profile.address,
      phone: nested.data.profile.phone,
    };
  }

  const nestedSnake = z.object({ profile: FlatSnakeSchema }).safeParse(json);
  if (nestedSnake.success) {
    return nestedSnake.data.profile;
  }

  return null;
}

// --------------------
// GET
// --------------------
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("user_id,email,full_name,dni,cuil,address,phone,is_paused,plan,default_account_id,created_at,updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });

  // Plan activo por cuenta activa (best-effort; si falla, devolvemos null)
  let activePlanCode: string | null = null;
  const defaultAccountId = (profile as any)?.default_account_id as string | null | undefined;

  if (defaultAccountId) {
    const subRes = await supabase
      .from("subscriptions")
      .select("plan_code")
      .eq("account_id", defaultAccountId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!subRes.error) activePlanCode = (subRes.data as any)?.plan_code ?? null;
  }

  return NextResponse.json({
    profile: profile ?? null,
    email: user.email ?? null,
    defaultAccountId: defaultAccountId ?? null,
    activePlanCode,
  });
}

// --------------------
// POST
// --------------------
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const admin = createAdminClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr) return NextResponse.json({ error: "auth_error", details: userErr.message }, { status: 401 });
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  if (!json) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  // 1) Si viene payload de onboarding, lo procesamos acá también (para no romper clientes).
  const onboarding = OnboardingSchema.safeParse(json);
  if (onboarding.success) {
    try {
      const body = onboarding.data;

      if (body.plan === "company_pro" && !body.company) {
        return NextResponse.json({ error: "Faltan datos de empresa." }, { status: 400 });
      }

      const legacyPlan = body.plan === "free" ? "free" : "pro";
      const nowIso = new Date().toISOString();

      const profBase: any = {
        user_id: user.id,
        email: (user.email || "").toLowerCase(),
        full_name: body.profile.fullName,
        dni: body.profile.dni,
        cuil: body.profile.cuil,
        address: body.profile.address,
        phone: body.profile.phone,
        plan: legacyPlan,
        updated_at: nowIso,
      };

      // onboarding_completed_at (si existe). Si no existe, reintento sin ese campo.
      let profUp = await admin.from("profiles").upsert(
        {
          ...profBase,
          onboarding_completed_at: nowIso,
        } as any,
        { onConflict: "user_id" }
      );

      if (profUp.error && isMissingColumnError(profUp.error)) {
        profUp = await admin.from("profiles").upsert(profBase as any, { onConflict: "user_id" });
      }

      if (profUp.error) throw profUp.error;

      // Plan / cuenta activa
      if (body.plan === "company_pro") {
        const c = body.company!;

        const { data: existing } = await admin
          .from("accounts")
          .select("id")
          .eq("account_type", "company")
          .eq("created_by_user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        let companyAccountId: string | null = (existing as any)?.id ?? null;

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
          companyAccountId = (insAcc.data as any)?.id ?? null;
        } else {
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

        if (!companyAccountId) {
          return NextResponse.json({ error: "No se pudo crear/obtener la cuenta empresa." }, { status: 500 });
        }

        const memIns = await admin.from("account_members").insert({
          account_id: companyAccountId,
          user_id: user.id,
          role: "owner",
          status: "active",
          company_role: c.representativeRole,
        } as any);

        if (memIns.error && String(memIns.error.code) !== "23505") throw memIns.error;

        await setActiveSubscriptionPlan(admin, companyAccountId, "company_pro");

        const updProf = await admin.from("profiles").update({ default_account_id: companyAccountId } as any).eq("user_id", user.id);
        if (updProf.error) throw updProf.error;

        return NextResponse.json({ ok: true, accountId: companyAccountId, planCode: "company_pro" });
      }

      // Personal
      const personalAccountId = await getLatestPersonalAccountId(admin, user.id);
      if (personalAccountId) {
        const planCode = body.plan === "individual_pro" ? "individual_pro" : "individual_free";
        await setActiveSubscriptionPlan(admin, personalAccountId, planCode);

        const updProf = await admin.from("profiles").update({ default_account_id: personalAccountId } as any).eq("user_id", user.id);
        if (updProf.error) throw updProf.error;

        return NextResponse.json({ ok: true, accountId: personalAccountId, planCode });
      }

      return NextResponse.json({ ok: true });
    } catch (e: any) {
      console.error("profile POST (onboarding payload): unexpected error", e);
      return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
    }
  }

  // 2) Flat profile update (legacy)
  const flat = normalizeFlatProfilePayload(json);
  if (!flat) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const payload = {
    user_id: user.id,
    email: (user.email ?? "").toLowerCase(),
    ...flat,
    updated_at: new Date().toISOString(),
  };

  const { error } = await admin.from("profiles").upsert(payload as any, { onConflict: "user_id" });
  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
