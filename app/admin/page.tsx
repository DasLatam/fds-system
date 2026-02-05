import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type View = "overview" | "docs" | "verifications" | "users";
type Days = "7" | "30" | "all";
type Status = "all" | "pending" | "signed";
type Kind = "all" | "creator" | "signer";

function normalizeEmail(v: unknown): string {
  const s = typeof v === "string" ? v : "";
  return s.trim().toLowerCase();
}

function normalizeText(v: unknown): string {
  const s = typeof v === "string" ? v : "";
  return s.trim();
}

function getAdminEmailsFromEnv(): string[] {
  const raw = process.env.FES_ADMIN_EMAILS || "";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function parseView(v: unknown): View {
  const s = typeof v === "string" ? v : "";
  if (s === "docs" || s === "verifications" || s === "overview" || s === "users") return s;
  return "overview";
}

function parseDays(v: unknown): Days {
  const s = typeof v === "string" ? v : "";
  if (s === "7" || s === "30" || s === "all") return s;
  return "30";
}

function parseStatus(v: unknown): Status {
  const s = typeof v === "string" ? v : "";
  if (s === "all" || s === "pending" || s === "signed") return s;
  return "all";
}

function parseKind(v: unknown): Kind {
  const s = typeof v === "string" ? v : "";
  if (s === "all" || s === "creator" || s === "signer") return s;
  return "all";
}

function sinceIso(days: Days): string | null {
  if (days === "all") return null;
  const n = days === "7" ? 7 : 30;
  const d = new Date(Date.now() - n * 24 * 60 * 60 * 1000);
  return d.toISOString();
}

function qs(params: Record<string, string | undefined>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") p.set(k, v);
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

function tab(active: boolean) {
  return active
    ? "rounded-xl border border-zinc-900 bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
    : "rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50";
}

function pill(active: boolean) {
  return active
    ? "rounded-lg border border-zinc-900 bg-zinc-900 px-3 py-1 text-sm font-medium text-white"
    : "rounded-lg border border-zinc-200 bg-white px-3 py-1 text-sm font-medium text-zinc-800 hover:bg-zinc-50";
}

function card() {
  return "rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm";
}

function fmtNumber(n: any) {
  const v = typeof n === "number" ? n : Number(n ?? 0);
  try {
    return new Intl.NumberFormat("es-AR").format(v);
  } catch {
    return String(v);
  }
}

function fmtDateTime(v: any) {
  if (!v) return "—";
  try {
    const d = new Date(v);
    if (isNaN(d.getTime())) return String(v);
    return d.toLocaleString("es-AR");
  } catch {
    return String(v);
  }
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const view = parseView(sp.view);
  const days = parseDays(sp.days);
  const status = parseStatus(sp.status);
  const q = normalizeText(typeof sp.q === "string" ? sp.q : "");
  const kind = parseKind(sp.kind);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin");

  const email =
    normalizeEmail(user.email) ||
    normalizeEmail((user.user_metadata as any)?.email) ||
    normalizeEmail((user.user_metadata as any)?.user_email);

  const allowed = getAdminEmailsFromEnv();
  const isAdmin = email && allowed.includes(email);

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="mt-2 text-sm text-zinc-700">No autorizado.</p>

        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-medium text-zinc-600">Email detectado</div>
          <div className="mt-1 font-mono text-sm text-zinc-900">{email || "(vacío)"}</div>
          <div className="mt-4 text-xs text-zinc-600">
            Para habilitar acceso, definí <span className="font-mono">FES_ADMIN_EMAILS</span> en Vercel (coma-separado).
          </div>
        </div>

        <div className="mt-6">
          <a className="text-sm text-blue-700 hover:underline" href="/dashboard">
            Volver al dashboard
          </a>
        </div>
      </main>
    );
  }

  const admin = createAdminClient();
  const since = sinceIso(days);

  // =======================
  // Overview metrics
  // =======================
  async function countDocs(filter: { status?: Status; since?: string | null }) {
    let query = admin.from("documents").select("*", { count: "exact", head: true });
    if (filter.status && filter.status !== "all") query = query.eq("status", filter.status);
    if (filter.since) query = query.gte("created_at", filter.since);
    const { count } = await query;
    return count || 0;
  }

  async function countVerifications(filter: { since?: string | null }) {
    let query = admin.from("verification_events").select("*", { count: "exact", head: true });
    if (filter.since) query = query.gte("created_at", filter.since);
    const { count } = await query;
    return count || 0;
  }

  const docsTotal = await countDocs({ since });
  const docsSigned = await countDocs({ status: "signed", since });
  const docsPending = await countDocs({ status: "pending", since });

  const verifTotal = await countVerifications({ since });
  const verif7 = await countVerifications({ since: sinceIso("7") });

  // =======================
  // Docs list
  // =======================
  async function fetchDocs() {
    let query = admin
      .from("documents")
      .select("id,title,status,created_at,completed_at,signed_count,total_signers,audit_code")
      .order("created_at", { ascending: false })
      .limit(50);

    if (since) query = query.gte("created_at", since);
    if (status !== "all") query = query.eq("status", status);
    if (q) query = query.ilike("title", `%${q}%`);

    const { data, error } = await query;
    return { data: data || [], error: error?.message || null };
  }

  // =======================
  // Verifications list
  // =======================
  async function fetchVerifications() {
    let query = admin
      .from("verification_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (since) query = query.gte("created_at", since);

    const { data, error } = await query;
    return { data: data || [], error: error?.message || null };
  }

  // =======================
  // Users list (admin_users_full)
  // =======================
  async function fetchUsers() {
    let query = admin
      .from("admin_users_full")
      .select(
        "user_id,auth_email,full_name,dni,is_paused,user_created_at,last_sign_in_at,user_kind,docs_created,docs_signed_created,invites_received,invites_signed"
      )
      .order("docs_created", { ascending: false })
      .limit(100);

    if (q) {
      query = query.or(`auth_email.ilike.%${q}%,full_name.ilike.%${q}%,dni.ilike.%${q}%`);
    }
    if (kind !== "all") {
      query = query.eq("user_kind", kind);
    }

    const { data, error } = await query;
    return { data: data || [], error: error?.message || null };
  }

  const docsRes = view === "docs" ? await fetchDocs() : { data: [], error: null };
  const verRes = view === "verifications" ? await fetchVerifications() : { data: [], error: null };
  const usersRes = view === "users" ? await fetchUsers() : { data: [], error: null };

  const baseParams: Record<string, string | undefined> = {
    days,
    status,
    q: q || undefined,
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Admin</h1>
          <p className="mt-1 text-sm text-zinc-600">Read-only</p>
        </div>

        <a className="text-sm text-blue-700 hover:underline" href="/dashboard">
          Volver al dashboard
        </a>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        <a className={tab(view === "overview")} href={"/admin" + qs({ ...baseParams, view: "overview" })}>
          Resumen
        </a>
        <a className={tab(view === "docs")} href={"/admin" + qs({ ...baseParams, view: "docs" })}>
          Documentos
        </a>
        <a className={tab(view === "verifications")} href={"/admin" + qs({ ...baseParams, view: "verifications" })}>
          Verificaciones
        </a>
        <a className={tab(view === "users")} href={"/admin" + qs({ ...baseParams, view: "users", kind })}>
          Usuarios
        </a>
      </div>

      {/* Global filters (GET) */}
      <form method="GET" action="/admin" className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <input type="hidden" name="view" value={view} />

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <div className="text-xs font-medium text-zinc-600">Rango</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button className={pill(days === "7")} name="days" value="7" type="submit">
                7 días
              </button>
              <button className={pill(days === "30")} name="days" value="30" type="submit">
                30 días
              </button>
              <button className={pill(days === "all")} name="days" value="all" type="submit">
                Todo
              </button>
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-zinc-600">Estado docs</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button className={pill(status === "all")} name="status" value="all" type="submit">
                Todos
              </button>
              <button className={pill(status === "pending")} name="status" value="pending" type="submit">
                Pendientes
              </button>
              <button className={pill(status === "signed")} name="status" value="signed" type="submit">
                Firmados
              </button>
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-zinc-600">
              Buscar {view === "users" ? "(email / nombre / DNI)" : "(título)"}
            </div>
            <div className="mt-2 flex gap-2">
              {/* Si estás en users, mantenemos kind */}
              {view === "users" && <input type="hidden" name="kind" value={kind} />}
              <input
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
                name="q"
                defaultValue={q}
                placeholder={view === "users" ? "Ej: Juan / 30123456" : "Ej: DNI 30123456"}
              />
              <button className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800" type="submit">
                Buscar
              </button>
            </div>
          </div>
        </div>

        {/* Extra filter: Users kind */}
        {view === "users" && (
          <div className="mt-4">
            <div className="text-xs font-medium text-zinc-600">Tipo de usuario</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button className={pill(kind === "all")} name="kind" value="all" type="submit">
                Todos
              </button>
              <button className={pill(kind === "creator")} name="kind" value="creator" type="submit">
                Creadores
              </button>
              <button className={pill(kind === "signer")} name="kind" value="signer" type="submit">
                Firmantes
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Overview */}
      {view === "overview" && (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className={card()}>
            <div className="text-xs font-medium text-zinc-600">Documentos</div>
            <div className="mt-2 text-3xl font-semibold">{fmtNumber(docsTotal)}</div>
            <div className="mt-2 text-sm text-zinc-700">
              Firmados: {fmtNumber(docsSigned)} · Pendientes: {fmtNumber(docsPending)}
            </div>
          </div>

          <div className={card()}>
            <div className="text-xs font-medium text-zinc-600">Verificaciones ({days === "all" ? "todo" : `${days} días`})</div>
            <div className="mt-2 text-3xl font-semibold">{fmtNumber(verifTotal)}</div>
            <div className="mt-2 text-sm text-zinc-700">Últimos 7 días: {fmtNumber(verif7)}</div>
          </div>

          <div className={card()}>
            <div className="text-xs font-medium text-zinc-600">Admin</div>
            <div className="mt-2 font-mono text-sm text-zinc-900">{email}</div>
            <div className="mt-2 text-xs text-zinc-600">Acceso por FES_ADMIN_EMAILS</div>
          </div>
        </div>
      )}

      {/* Docs */}
      {view === "docs" && (
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Documentos</h2>
            <div className="text-xs text-zinc-600">Mostrando hasta 50</div>
          </div>

          {docsRes.error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              Error: {docsRes.error}
            </div>
          )}

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-zinc-600">
                <tr>
                  <th className="py-2">Título</th>
                  <th className="py-2">Estado</th>
                  <th className="py-2">Firmas</th>
                  <th className="py-2">Creado</th>
                  <th className="py-2">Completado</th>
                  <th className="py-2">Audit</th>
                </tr>
              </thead>
              <tbody className="text-zinc-900">
                {docsRes.data.map((d: any) => (
                  <tr key={d.id} className="border-t border-zinc-100">
                    <td className="py-2">
                      <a className="text-blue-700 hover:underline" href={`/dashboard/doc/${d.id}`}>
                        {d.title || "(sin título)"}
                      </a>
                    </td>
                    <td className="py-2">{d.status || "—"}</td>
                    <td className="py-2">
                      {typeof d.signed_count === "number" && typeof d.total_signers === "number"
                        ? `${d.signed_count}/${d.total_signers}`
                        : "—"}
                    </td>
                    <td className="py-2">{fmtDateTime(d.created_at)}</td>
                    <td className="py-2">{fmtDateTime(d.completed_at)}</td>
                    <td className="py-2 font-mono text-xs text-zinc-600">{d.audit_code || "—"}</td>
                  </tr>
                ))}
                {docsRes.data.length === 0 && (
                  <tr>
                    <td className="py-6 text-sm text-zinc-600" colSpan={6}>
                      Sin resultados con estos filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Verifications */}
      {view === "verifications" && (
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Verificaciones</h2>
            <div className="text-xs text-zinc-600">Mostrando hasta 50</div>
          </div>

          {verRes.error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              Error: {verRes.error}
            </div>
          )}

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-zinc-600">
                <tr>
                  <th className="py-2">Fecha</th>
                  <th className="py-2">Audit</th>
                  <th className="py-2">Match</th>
                  <th className="py-2">Raw</th>
                </tr>
              </thead>
              <tbody className="text-zinc-900">
                {verRes.data.map((v: any, idx: number) => (
                  <tr key={v.id ?? idx} className="border-t border-zinc-100">
                    <td className="py-2">{fmtDateTime(v.created_at)}</td>
                    <td className="py-2 font-mono text-xs text-zinc-600">{String(v.audit_code ?? v.code ?? "—")}</td>
                    <td className="py-2">{String(v.match ?? v.result ?? v.is_match ?? "—")}</td>
                    <td className="py-2">
                      <details className="text-xs text-zinc-700">
                        <summary className="cursor-pointer select-none">ver</summary>
                        <pre className="mt-2 whitespace-pre-wrap rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-[11px]">
{JSON.stringify(v, null, 2)}
                        </pre>
                      </details>
                    </td>
                  </tr>
                ))}
                {verRes.data.length === 0 && (
                  <tr>
                    <td className="py-6 text-sm text-zinc-600" colSpan={4}>
                      Sin resultados en este rango.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Users */}
      {view === "users" && (
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Usuarios</h2>
            <div className="text-xs text-zinc-600">Mostrando hasta 100</div>
          </div>

          {usersRes.error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              Error: {usersRes.error}
            </div>
          )}

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-zinc-600">
                <tr>
                  <th className="py-2">Email</th>
                  <th className="py-2">Nombre</th>
                  <th className="py-2">DNI</th>
                  <th className="py-2">Tipo</th>
                  <th className="py-2">Docs</th>
                  <th className="py-2">Firmas</th>
                  <th className="py-2">Estado</th>
                  <th className="py-2">Alta</th>
                  <th className="py-2">Últ. login</th>
                </tr>
              </thead>
              <tbody className="text-zinc-900">
                {usersRes.data.map((u: any) => (
                  <tr key={u.user_id} className="border-t border-zinc-100">
                    <td className="py-2 font-mono text-xs">{u.auth_email}</td>
                    <td className="py-2">{u.full_name || "—"}</td>
                    <td className="py-2">{u.dni || "—"}</td>
                    <td className="py-2">{u.user_kind}</td>
                    <td className="py-2">{fmtNumber(u.docs_created)}</td>
                    <td className="py-2">{fmtNumber(u.invites_signed)}</td>
                    <td className="py-2">{u.is_paused ? "Pausado" : "Activo"}</td>
                    <td className="py-2">{fmtDateTime(u.user_created_at)}</td>
                    <td className="py-2">{fmtDateTime(u.last_sign_in_at)}</td>
                  </tr>
                ))}
                {usersRes.data.length === 0 && (
                  <tr>
                    <td className="py-6 text-sm text-zinc-600" colSpan={9}>
                      Sin resultados con estos filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
