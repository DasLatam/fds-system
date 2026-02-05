import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { planLabelFromCode } from "@/lib/plans";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id,default_account_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: memberships } = await admin
    .from("account_members")
    .select("account_id, role, status, created_at, accounts(id, name, account_type)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const accountIds = (memberships || [])
    .map((m: any) => m.account_id)
    .filter(Boolean) as string[];

  // plan activo por cuenta
  const { data: subRows } = accountIds.length
    ? await admin
        .from("subscriptions")
        .select("account_id, plan_code, status")
        .in("account_id", accountIds)
        .eq("status", "active")
    : { data: [] as any[] };

  const planByAccount = new Map<string, string>();
  for (const s of subRows || []) {
    if (s?.account_id && s?.plan_code) planByAccount.set(String(s.account_id), String(s.plan_code));
  }

  const activeAccountId = (profile as any)?.default_account_id || (memberships?.[0] as any)?.account_id || null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Cuentas</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Elegí con qué cuenta querés trabajar. La cuenta activa define el plan y el límite mensual de creación de documentos.
          </p>
        </div>

        <Link href="/dashboard" className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50">
          Volver al panel
        </Link>
      </div>

      <div className="mt-6 space-y-4">
        {(memberships || []).map((m: any) => {
          const acc = m.accounts;
          const isActive = activeAccountId && String(activeAccountId) === String(m.account_id);
          const planCode = planByAccount.get(String(m.account_id)) || (acc?.account_type === "company" ? "company_pro" : "individual_free");

          return (
            <div key={String(m.account_id)} className="rounded-xl border border-zinc-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-zinc-900">{acc?.name || "Cuenta"}</div>
                  <div className="mt-1 text-xs text-zinc-600">
                    Tipo: <span className="font-medium">{acc?.account_type === "company" ? "Empresa" : "Personal"}</span> · Rol: {m.role}
                    {planCode ? (
                      <>
                        {" "}· Plan: <span className="font-medium">{planLabelFromCode(planCode)}</span>
                      </>
                    ) : null}
                  </div>
                </div>

                {isActive ? (
                  <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">Activa</div>
                ) : (
                  <form action="/api/accounts/set-default" method="post">
                    <input type="hidden" name="accountId" value={String(m.account_id)} />
                    <button className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50">
                      Usar esta cuenta
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <div className="text-sm font-medium">¿Querés cambiar de tipo de cuenta?</div>
        <p className="mt-1 text-sm text-zinc-600">
          Podés actualizar tu tipo de cuenta desde <Link className="underline" href="/profile?next=/dashboard">Mis datos</Link>.
        </p>
      </div>
    </div>
  );
}
