import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLAN_CODES, type PlanCode } from "@/lib/plans";

export const runtime = "nodejs";

const Schema = z.object({
  planCode: z.custom<PlanCode>((val) => typeof val === "string" && (PLAN_CODES as readonly string[]).includes(val)),
});

function redirectBack(to: string) {
  return NextResponse.redirect(new URL(to, process.env.NEXT_PUBLIC_SITE_URL || "https://firmasimple.vercel.app"), {
    status: 303,
  });
}

export async function POST(req: Request) {
  const form = await req.formData();
  const parsed = Schema.safeParse({ planCode: form.get("planCode") });
  if (!parsed.success) return redirectBack("/dashboard/account");

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return redirectBack("/login?next=/dashboard/account");

  // Cuenta activa (personal) tomada del profile.
  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("default_account_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (pErr || !profile?.default_account_id) return redirectBack("/dashboard/account");

  const accountId = String((profile as any).default_account_id);

  // Verificar que el usuario sea miembro activo y que la cuenta sea personal.
  const { data: membership } = await supabase
    .from("account_memberships")
    .select("role,status")
    .eq("user_id", user.id)
    .eq("account_id", accountId)
    .eq("status", "active")
    .maybeSingle();

  if (!membership || (membership as any).role !== "owner") return redirectBack("/dashboard/account");

  const { data: account } = await supabase
    .from("accounts")
    .select("account_type")
    .eq("id", accountId)
    .maybeSingle();

  if ((account as any)?.account_type !== "personal") return redirectBack("/dashboard/account");

  const planCode = parsed.data.planCode;

  // Empresa no se selecciona desde acá.
  if (planCode === "company_pro") return redirectBack("/contact");

  const admin = createAdminClient();

  // Buscar la suscripción activa y actualizarla. Si no existe, crear.
  const { data: sub } = await admin
    .from("subscriptions")
    .select("id")
    .eq("account_id", accountId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sub?.id) {
    await admin.from("subscriptions").update({ plan_code: planCode }).eq("id", sub.id);
  } else {
    await admin
      .from("subscriptions")
      .insert({
        account_id: accountId,
        plan_code: planCode,
        status: "active",
      });
  }

  return redirectBack("/dashboard/account");
}
