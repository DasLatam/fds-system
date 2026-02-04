import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ProfileSchema = z.object({
  full_name: z.string().min(2),
  dni: z.string().min(6),
  cuil: z.string().min(6),
  address: z.string().min(6),
  phone: z.string().min(6),
});

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("user_id,email,full_name,dni,cuil,address,phone,is_paused,plan,default_account_id,created_at,updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });

  // Plan activo por cuenta activa (si RLS lo permite). Si falla, devolvemos null sin romper.
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

    if (!subRes.error) {
      activePlanCode = (subRes.data as any)?.plan_code ?? null;
    }
  }

  return NextResponse.json({
    profile: profile ?? null,
    email: user.email ?? null,
    defaultAccountId: defaultAccountId ?? null,
    activePlanCode,
  });
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = ProfileSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const payload = {
    user_id: user.id,
    email: (user.email ?? "").toLowerCase(),
    ...parsed.data,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "user_id" });

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
