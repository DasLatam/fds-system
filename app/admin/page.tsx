import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type View = "overview" | "docs" | "verifications" | "users";
type Kind = "all" | "creator" | "signer";

function qs(params: Record<string, string | undefined>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) p.set(k, v);
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

function fmt(v: any) {
  if (!v) return "—";
  try {
    const d = new Date(v);
    return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString("es-AR");
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

  const view = (sp.view as View) || "overview";
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const kind = (sp.kind as Kind) || "all";

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin");

  const admin = createAdminClient();

  async function fetchUsers() {
    let query = admin
      .from("admin_users_full")
      .select("*")
      .order("docs_created", { ascending: false })
      .limit(100);

    if (q) {
      query = query.or(
        `auth_email.ilike.%${q}%,full_name.ilike.%${q}%,dni.ilike.%${q}%`
      );
    }

    if (kind !== "all") {
      query = query.eq("user_kind", kind);
    }

    const { data, error } = await query;
    return { data: data || [], error: error?.message || null };
  }

  const usersRes = view === "users" ? await fetchUsers() : { data: [], error: null };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <a href="/dashboard" className="text-sm text-blue-700 hover:underline">
          Volver al dashboard
        </a>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <a className={tab(view === "overview")} href="/admin">Resumen</a>
        <a className={tab(view === "docs")} href="/admin?view=docs">Documentos</a>
        <a className={tab(view === "verifications")} href="/admin?view=verifications">Verificaciones</a>
        <a className={tab(view === "users")} href="/admin?view=users">Usuarios</a>
      </div>

      {view === "users" && (
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <form method="GET" className="flex flex-wrap gap-3">
            <input type="hidden" name="view" value="users" />

            <input
              name="q"
              defaultValue={q}
              placeholder="Buscar email, nombre o DNI"
              className="w-64 rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            />

            <button className={pill(kind === "all")} name="kind" value="all">Todos</button>
            <button className={pill(kind === "creator")} name="kind" value="creator">Creadores</button>
            <button className={pill(kind === "signer")} name="kind" value="signer">Firmantes</button>

            <button className="ml-auto rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white">
              Filtrar
            </button>
          </form>

          {usersRes.error && (
            <div className="mt-4 text-sm text-red-700">Error: {usersRes.error}</div>
          )}

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-zinc-600">
                <tr>
                  <th className="py-2">Email</th>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Docs</th>
                  <th>Firmas</th>
                  <th>Estado</th>
                  <th>Alta</th>
                </tr>
              </thead>
              <tbody>
                {usersRes.data.map((u: any) => (
                  <tr key={u.user_id} className="border-t">
                    <td className="py-2 font-mono text-xs">{u.auth_email}</td>
                    <td>{u.full_name || "—"}</td>
                    <td>{u.user_kind}</td>
                    <td>{u.docs_created}</td>
                    <td>{u.invites_signed}</td>
                    <td>{u.is_paused ? "Pausado" : "Activo"}</td>
                    <td>{fmt(u.user_created_at)}</td>
                  </tr>
                ))}
                {usersRes.data.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-sm text-zinc-600">
                      Sin resultados
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
