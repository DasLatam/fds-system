import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function planLabel(planCode: string | null | undefined) {
  const p = (planCode || "").toLowerCase();
  if (p.includes("company") && p.includes("pro")) return "Empresa PRO";
  if (p.includes("individual") && p.includes("pro")) return "Personal PRO";
  if (p.includes("pro")) return "PRO";
  return "Gratuito";
}

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("user_id, default_account_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const activeAccountId = (profile as any)?.default_account_id ?? null;

  const { data: memberships } = await admin
    .from("account_members")
    .select("account_id, role, status, company_role, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const mem = (memberships || []).filter((m: any) => m.status === "active");
  const accountIds = Array.from(new Set(mem.map((m: any) => m.account_id).filter(Boolean)));

  const { data: accounts } =
    accountIds.length > 0
      ? await admin
          .from("accounts")
          .select("id, account_type, name, company_name, company_cuit, created_at")
          .in("id", accountIds)
          .order("created_at", { ascending: false })
      : { data: [] as any[] };

  const { data: subs } =
    accountIds.length > 0
      ? await admin
          .from("subscriptions")
          .select("account_id, plan_code, status, created_at")
          .in("account_id", accountIds)
          .eq("status", "active")
          .order("created_at", { ascending: false })
      : { data: [] as any[] };

  const planByAccount = new Map<string, string>();
  for (const s of subs || []) {
    if (!planByAccount.has((s as any).account_id)) {
      planByAccount.set((s as any).account_id, (s as any).plan_code);
    }
  }

  async function setActiveAccountAction(formData: FormData) {
    "use server";

    const accountId = String(formData.get("accountId") || "").trim();
    if (!accountId) return;

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const admin = createAdminClient();

    // Validar membership activo
    const { data: m } = await admin
      .from("account_members")
      .select("account_id,status")
      .eq("user_id", user.id)
      .eq("account_id", accountId)
      .maybeSingle();

    if (!m || (m as any).status !== "active") {
      redirect("/dashboard/account?error=not_member");
    }

    const upd = await admin
      .from("profiles")
      .update({ default_account_id: accountId } as any)
      .eq("user_id", user.id);

    if (upd.error) {
      redirect("/dashboard/account?error=update_failed");
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/account");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Cuenta y plan</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Elegí la cuenta activa para el panel y el límite mensual. Podés cambiar el plan desde onboarding.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium">
            Volver al panel
          </Link>
          <Link
            href="/onboarding?next=/dashboard/account"
            className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Cambiar plan / completar datos
          </Link>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        {accounts && accounts.length > 0 ? (
          accounts.map((a: any) => {
            const id = a.id as string;
            const isActive = activeAccountId === id;
            const planCode = planByAccount.get(id) || "individual_free";

            const title =
              (a.account_type || "").toLowerCase() === "company"
                ? a.company_name || a.name || "Empresa"
                : a.name || "Personal";

            return (
              <div key={id} className="rounded-xl border border-zinc-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-zinc-900">
                      {title}{" "}
                      <span className="ml-2 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs">
                        {(a.account_type || "").toLowerCase() === "company" ? "Empresa" : "Personal"}
                      </span>
                      {isActive ? (
                        <span className="ml-2 rounded-md bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
                          Activa
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 text-xs text-zinc-600">
                      <span className="font-medium">Account ID:</span> <span className="font-mono">{id}</span>
                    </div>
                    <div className="mt-1 text-xs text-zinc-600">
                      <span className="font-medium">Plan:</span> {planLabel(planCode)}{" "}
                      <span className="text-zinc-400">({planCode})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isActive ? null : (
                      <form action={setActiveAccountAction}>
                        <input type="hidden" name="accountId" value={id} />
                        <button className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50">
                          Activar esta cuenta
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-zinc-200 p-4 text-sm text-zinc-600">
            No se encontraron cuentas activas para este usuario.
          </div>
        )}
      </div>

      <div className="mt-8 rounded-xl border border-zinc-200 p-4">
        <div className="text-sm font-medium">Cómo funciona la cuenta activa</div>
        <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
          La <span className="font-medium">cuenta activa</span> define desde qué cuenta se crean los documentos y qué plan/límite mensual se
          aplica al crear documentos e invitar firmantes. Si pertenecés a más de una cuenta (por ejemplo Personal y Empresa), elegí acá cuál
          querés usar.
        </p>

        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-medium text-zinc-600 hover:text-zinc-800">
            Ver detalles técnicos
          </summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-zinc-600">
            <li>
              La cuenta activa se guarda en <span className="font-mono">profiles.default_account_id</span>.
            </li>
            <li>
              El plan se obtiene de la suscripción activa: <span className="font-mono">subscriptions.plan_code</span>.
            </li>
            <li>Los límites mensuales se configuran con variables de entorno en Vercel (requieren redeploy al cambiar).</li>
          </ul>
        </details>
      </div>
    </div>
  );
}
