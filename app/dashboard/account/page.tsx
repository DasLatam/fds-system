import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PLAN_DEFINITIONS, planLabelFromCode, type PlanCode } from "@/lib/plans";

export const dynamic = "force-dynamic";

function missingIdentityFields(profile: any) {
  const missing: string[] = [];

  const first_name = String(profile?.first_name || "").trim();
  const last_name = String(profile?.last_name || "").trim();
  const phone = String(profile?.phone || "").trim();
  const dni_type = String(profile?.dni_type || "").trim();
  const dni_number = String(profile?.dni_number || profile?.dni || "").trim();

  if (!first_name) missing.push("Nombre");
  if (!last_name) missing.push("Apellido");
  if (!phone) missing.push("Teléfono móvil");
  if (!dni_type) missing.push("Tipo de DNI");
  if (!dni_number) missing.push("Número de DNI");

  // Recomendados
  if (!String(profile?.cuil || "").trim()) missing.push("CUIT/CUIL (recomendado)");
  if (!String(profile?.street || "").trim()) missing.push("Calle (recomendado)");
  if (!String(profile?.street_number || "").trim()) missing.push("Altura (recomendado)");
  if (!String(profile?.province || "").trim()) missing.push("Provincia (recomendado)");
  if (!String(profile?.country || "").trim()) missing.push("País (recomendado)");
  if (!String(profile?.dni_front_path || "").trim()) missing.push("DNI frente (recomendado)");
  if (!String(profile?.dni_back_path || "").trim()) missing.push("DNI dorso (recomendado)");

  return missing;
}

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/account");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "default_account_id, first_name, last_name, phone, dni_type, dni_number, dni, cuil, street, street_number, province, country, dni_front_path, dni_back_path"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: memberships } = await supabase
    .from("account_memberships")
    .select("account_id, role, status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  const accountIds = (memberships || []).map((m: any) => m.account_id).filter(Boolean);

  const { data: accounts } = await supabase
    .from("accounts")
    .select("id, name, account_type")
    .in("id", accountIds.length ? accountIds : ["00000000-0000-0000-0000-000000000000"])
    .order("created_at", { ascending: true });

  const activeAccountId = (profile as any)?.default_account_id || (accounts?.[0] as any)?.id || null;

  const { data: activeSub } = await supabase
    .from("subscriptions")
    .select("plan_code")
    .eq("account_id", activeAccountId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const activePlanCode = (activeSub as any)?.plan_code ? String((activeSub as any).plan_code) : null;
  const missing = missingIdentityFields(profile);

  const personalPlans = [PLAN_DEFINITIONS.individual_free, PLAN_DEFINITIONS.individual_pro];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Cuentas</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Elegí tu <span className="font-medium">cuenta activa</span> y gestioná el plan de tus cuentas personales. La cuenta Empresa se gestiona por contacto.
        </p>
      </div>

      {missing.length > 0 && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="font-semibold">Tu identidad aún no está completa</div>
          <p className="mt-2 leading-relaxed">
            Para evitar problemas de validez probatoria o auditoría, usá siempre datos reales y verificables. Te falta completar:
          </p>
          <ul className="mt-2 list-disc pl-5">
            {missing.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
          <div className="mt-3">
            <Link
  href="/profile?next=/dashboard/account"
  className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
>
  Completar identidad
</Link>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Cuenta activa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(accounts || []).map((a: any) => {
                const isActive = a.id === activeAccountId;
                return (
                  <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-3">
                    <div>
                      <div className="text-sm font-medium text-zinc-900">{a.name || (a.account_type === "company" ? "Empresa" : "Personal")}</div>
                      <div className="mt-1 text-xs text-zinc-600">
                        Tipo: {a.account_type === "company" ? "Empresa" : "Personal"}
                      </div>
                    </div>
                    {isActive ? (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">Activa</span>
                    ) : (
                      <form action="/api/accounts/set-default" method="post">
                        <input type="hidden" name="accountId" value={a.id} />
                        <Button type="submit" variant="secondary">
                          Seleccionar
                        </Button>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
              <div className="font-medium text-zinc-900">Plan activo</div>
              <p className="mt-1">
                {activePlanCode ? (
                  <>
                    <span className="font-medium">{planLabelFromCode(activePlanCode as PlanCode)}</span>
                    <span className="text-zinc-600"> (cuenta actual)</span>
                  </>
                ) : (
                  <span className="text-zinc-600">Sin plan detectado</span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Planes personales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {personalPlans.map((p) => {
                const isActivePersonal = activePlanCode === p.code;
                const isRecommended = p.code === "individual_pro";
                return (
                  <div
                    key={p.code}
                    className={
                      "rounded-2xl border bg-white p-4 " +
                      (isRecommended ? "border-emerald-300 ring-1 ring-emerald-200" : "border-zinc-200")
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-semibold text-zinc-900">{p.label}</div>
                          {isRecommended && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">Sugerido</span>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-zinc-600">{p.shortLabel}</div>
                      </div>

                      {isActivePersonal ? (
                        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">Plan actual</span>
                      ) : (
                        <form action="/api/accounts/change-plan" method="post">
                          <input type="hidden" name="planCode" value={p.code} />
                          <Button type="submit" className="bg-emerald-600 text-white hover:bg-emerald-700">
                            Elegir
                          </Button>
                        </form>
                      )}
                    </div>

                    <div className="mt-4 text-sm text-zinc-800">
                      <div className="flex items-baseline gap-2">
                        <div className="text-2xl font-semibold">
                          {p.code === "individual_free" ? "Gratis" : `ARS ${p.priceArs.toLocaleString("es-AR")}`}
                        </div>
                        {p.code !== "individual_free" && <div className="text-xs text-zinc-500">/ mes</div>}
                      </div>
                      {p.code === "individual_free" && (
                        <div className="mt-1 text-xs text-zinc-500">
                          Antes <span className="line-through">ARS 9.900</span>
                        </div>
                      )}
                    </div>

                    <ul className="mt-4 list-disc pl-5 text-sm text-zinc-700">
                      {p.featureBullets.slice(0, 4).map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
              ¿Necesitás plan Empresa? <Link href="/contact" className="font-medium text-emerald-700 hover:underline">Contactanos</Link>.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
