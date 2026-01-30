import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminRefresh from "./admin-refresh";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function fmt(n: number) {
  try {
    return new Intl.NumberFormat("es-AR").format(n);
  } catch {
    return String(n);
  }
}

function iso(d: Date) {
  return d.toISOString();
}

function normEmail(v: unknown): string {
  if (!v || typeof v !== "string") return "";
  return v.toLowerCase().trim();
}

function mkHref(p: Record<string, string>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) if (v) sp.set(k, v);
  return `/admin?${sp.toString()}`;
}

function tabClass(active: boolean) {
  return active
    ? "rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white"
    : "rounded-md border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50";
}

const card = "rounded-xl border border-zinc-200 bg-white p-4 shadow-sm";

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: {
    q?: string;
    status?: string;
    days?: string;
    view?: string;
  };
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const ownerEmail = normEmail(process.env.FES_OWNER_EMAIL);
  const userEmail = normEmail(user.email);

  if (!ownerEmail) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-xl font-semibold">Admin</h1>
        <p className="mt-2 text-sm text-zinc-700">Admin no está configurado.</p>

        <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium text-zinc-600">Falta variable de entorno</div>
          <div className="mt-1 font-mono text-sm text-zinc-900">FES_OWNER_EMAIL</div>
          <div className="mt-3 text-xs text-zinc-600">
            Configurá <span className="font-mono">FES_OWNER_EMAIL</span> en Vercel (Production/Preview).
          </div>
          <div className="mt-3 text-xs text-zinc-600">
            Email detectado: <span className="font-mono">{userEmail || "(vacío)"}</span>
          </div>
        </div>

        <div className="mt-6">
          <Link className="text-sm text-blue-700 hover:underline" href="/dashboard">
            Volver al dashboard
          </Link>
        </div>
      </main>
    );
  }

  if (userEmail !== ownerEmail) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-xl font-semibold">Admin</h1>
        <p className="mt-2 text-sm text-zinc-700">No autorizado.</p>

        <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium text-zinc-600">Email detectado</div>
          <div className="mt-1 font-mono text-sm text-zinc-900">{userEmail || "(vacío)"}</div>
        </div>

        <div className="mt-6">
          <Link className="text-sm text-blue-700 hover:underline" href="/dashboard">
            Volver al dashboard
          </Link>
        </div>
      </main>
    );
  }

  const q = (searchParams?.q || "").trim();
  const status = (searchParams?.status || "all").toLowerCase();
  const days = (searchParams?.days || "30").toLowerCase();
  const view = (searchParams?.view || "overview").toLowerCase();

  // stamp: cuando cambia esto, forzamos router.refresh()
  const stamp = `${view}|${days}|${status}|${q}`;

  const admin = createAdminClient();

  const now = new Date();
  const d7 = iso(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
  const d30 = iso(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
  const sinceISO = days === "7" ? d7 : days === "30" ? d30 : null;

  const { count: totalDocsCount } = await admin
    .from("documents")
    .select("id", { head: true, count: "exact" });

  const { count: signedDocsCount } = await admin
    .from("documents")
    .select("id", { head: true, count: "exact" })
    .eq("status", "signed");

  const pendingDocsCount = Math.max(0, (totalDocsCount ?? 0) - (signedDocsCount ?? 0));

  const { count: verif30 } = await admin
    .from("verification_events")
    .select("id", { head: true, count: "exact" })
    .gte("created_at", d30);

  const { count: verif7 } = await admin
    .from("verification_events")
    .select("id", { head: true, count: "exact" })
    .gte("created_at", d7);

  const { count: verif30Match } = await admin
    .from("verification_events")
    .select("id", { head: true, count: "exact" })
    .gte("created_at", d30)
    .eq("match", true);

  const verif30Fail = Math.max(0, (verif30 ?? 0) - (verif30Match ?? 0));

  let docsQuery = admin
    .from("documents")
    .select("id,title,status,created_at,completed_at,total_signers,signed_count,audit_code")
    .order("created_at", { ascending: false })
    .limit(200);

  if (sinceISO) docsQuery = docsQuery.gte("created_at", sinceISO);
  if (status === "signed") docsQuery = docsQuery.eq("status", "signed");
  if (status === "pending") docsQuery = docsQuery.neq("status", "signed");
  if (q) docsQuery = docsQuery.ilike("title", `%${q}%`);

  const { data: docs } = await docsQuery;

  let verQuery = admin
    .from("verification_events")
    .select("id,audit_code,match,created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (sinceISO) verQuery = verQuery.gte("created_at", sinceISO);
  const { data: verifs } = await verQuery;

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      {/* fuerza refresh al cambiar filtros */}
      <AdminRefresh stamp={stamp} />

      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Admin</h1>
          <p className="text-sm text-zinc-600">Read-only (owner)</p>
        </div>
        <Link href="/dashboard" className="text-sm text-zinc-700 hover:text-zinc-900">
          Volver al dashboard
        </Link>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Link href={mkHref({ view: "overview", days, status, q })} className={tabClass(view === "overview")}>
          Resumen
        </Link>
        <Link href={mkHref({ view: "docs", days, status, q })} className={tabClass(view === "docs")}>
          Documentos
        </Link>
        <Link
          href={mkHref({ view: "verifications", days, status, q })}
          className={tabClass(view === "verifications")}
        >
          Verificaciones
        </Link>
      </div>

      <div className="mb-6 grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm md:grid-cols-3">
        <div>
          <div className="mb-1 text-xs font-medium text-zinc-700">Rango</div>
          <div className="flex gap-2">
            <Link href={mkHref({ view, days: "7", status, q })} className={tabClass(days === "7")}>
              7 días
            </Link>
            <Link href={mkHref({ view, days: "30", status, q })} className={tabClass(days === "30")}>
              30 días
            </Link>
            <Link href={mkHref({ view, days: "all", status, q })} className={tabClass(days === "all")}>
              Todo
            </Link>
          </div>
        </div>

        <div>
          <div className="mb-1 text-xs font-medium text-zinc-700">Estado docs</div>
          <div className="flex gap-2">
            <Link href={mkHref({ view, days, status: "all", q })} className={tabClass(status === "all")}>
              Todos
            </Link>
            <Link href={mkHref({ view, days, status: "pending", q })} className={tabClass(status === "pending")}>
              Pendientes
            </Link>
            <Link href={mkHref({ view, days, status: "signed", q })} className={tabClass(status === "signed")}>
              Firmados
            </Link>
          </div>
        </div>

        <div>
          <div className="mb-1 text-xs font-medium text-zinc-700">Buscar por título</div>
          <form action="/admin" method="get" className="flex gap-2">
            <input type="hidden" name="view" value={view} />
            <input type="hidden" name="days" value={days} />
            <input type="hidden" name="status" value={status} />
            <input
              name="q"
              defaultValue={q}
              placeholder="Ej: DNI Ariel"
              className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            />
            <button className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-800">
              Buscar
            </button>
          </form>
        </div>
      </div>

      {view === "overview" && (
        <section className="grid gap-3 md:grid-cols-3">
          <div className={card}>
            <div className="text-xs font-medium text-zinc-600">Documentos</div>
            <div className="mt-2 text-2xl font-semibold">{fmt(totalDocsCount ?? 0)}</div>
            <div className="mt-1 text-sm text-zinc-600">
              Firmados: <span className="font-medium text-zinc-900">{fmt(signedDocsCount ?? 0)}</span> · Pendientes:{" "}
              <span className="font-medium text-zinc-900">{fmt(pendingDocsCount)}</span>
            </div>
          </div>

          <div className={card}>
            <div className="text-xs font-medium text-zinc-600">Verificaciones (30 días)</div>
            <div className="mt-2 text-2xl font-semibold">{fmt(verif30 ?? 0)}</div>
            <div className="mt-1 text-sm text-zinc-600">
              Match: <span className="font-medium text-zinc-900">{fmt(verif30Match ?? 0)}</span> · Fail:{" "}
              <span className="font-medium text-zinc-900">{fmt(verif30Fail)}</span>
            </div>
          </div>

          <div className={card}>
            <div className="text-xs font-medium text-zinc-600">Verificaciones (7 días)</div>
            <div className="mt-2 text-2xl font-semibold">{fmt(verif7 ?? 0)}</div>
            <div className="mt-1 text-sm text-zinc-600">Actividad reciente de verificación</div>
          </div>
        </section>
      )}

      {view === "docs" && (
        <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold">Documentos (máx. 200)</div>
            <div className="text-xs text-zinc-600">{q ? `Filtro: “${q}”` : ""}</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs text-zinc-600">
                <tr>
                  <th className="py-2 pr-3">Título</th>
                  <th className="py-2 pr-3">Estado</th>
                  <th className="py-2 pr-3">Firmas</th>
                  <th className="py-2 pr-3">Creado</th>
                  <th className="py-2 pr-3">Finalizado</th>
                  <th className="py-2 pr-3">Auditoría</th>
                </tr>
              </thead>
              <tbody>
                {(docs || []).map((d: any) => (
                  <tr key={d.id} className="border-b border-zinc-100">
                    <td className="py-2 pr-3">
                      <div className="font-medium text-zinc-900">{d.title || "(sin título)"}</div>
                      <div className="text-xs text-zinc-600">{d.id}</div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <a href={`/dashboard/doc/${d.id}`} className="text-xs text-blue-700 hover:underline">
                          Abrir
                        </a>
                        {d.audit_code ? (
                          <a href={`/v/${d.audit_code}`} className="text-xs text-blue-700 hover:underline" target="_blank">
                            Verificar
                          </a>
                        ) : null}
                      </div>
                    </td>
                    <td className="py-2 pr-3">
                      <span className="rounded-full border border-zinc-200 px-2 py-0.5 text-xs">{d.status}</span>
                    </td>
                    <td className="py-2 pr-3">
                      {fmt(Number(d.signed_count || 0))} / {fmt(Number(d.total_signers || 0))}
                    </td>
                    <td className="py-2 pr-3">{d.created_at ? new Date(d.created_at).toLocaleString("es-AR") : "-"}</td>
                    <td className="py-2 pr-3">{d.completed_at ? new Date(d.completed_at).toLocaleString("es-AR") : "-"}</td>
                    <td className="py-2 pr-3">
                      {d.audit_code ? <code className="text-xs text-zinc-700">{d.audit_code}</code> : <span className="text-xs text-zinc-500">-</span>}
                    </td>
                  </tr>
                ))}
                {(docs || []).length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-sm text-zinc-600">
                      No hay documentos para este filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {view === "verifications" && (
        <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold">Verificaciones (máx. 200)</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs text-zinc-600">
                <tr>
                  <th className="py-2 pr-3">Fecha</th>
                  <th className="py-2 pr-3">Audit code</th>
                  <th className="py-2 pr-3">Resultado</th>
                  <th className="py-2 pr-3">Link</th>
                </tr>
              </thead>
              <tbody>
                {(verifs || []).map((v: any) => (
                  <tr key={v.id} className="border-b border-zinc-100">
                    <td className="py-2 pr-3">{v.created_at ? new Date(v.created_at).toLocaleString("es-AR") : "-"}</td>
                    <td className="py-2 pr-3"><code className="text-xs text-zinc-700">{v.audit_code}</code></td>
                    <td className="py-2 pr-3">
                      {v.match === true ? (
                        <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700">MATCH</span>
                      ) : (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700">FAIL</span>
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      {v.audit_code ? (
                        <a href={`/v/${v.audit_code}`} className="text-xs text-blue-700 hover:underline" target="_blank">
                          Abrir verificación
                        </a>
                      ) : (
                        <span className="text-xs text-zinc-500">-</span>
                      )}
                    </td>
                  </tr>
                ))}
                {(verifs || []).length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-sm text-zinc-600">
                      No hay verificaciones para este rango.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
