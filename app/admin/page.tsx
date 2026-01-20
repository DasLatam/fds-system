import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isOwnerEmail } from "@/lib/security/owner";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Row = {
  user_id: string;
  email: string;
  full_name?: string | null;
  is_paused?: boolean | null;
  docs_count: number;
};

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!isOwnerEmail(user.email)) redirect("/dashboard");

  const admin = createAdminClient();

  const { data: usersRes, error: usersErr } = await admin.auth.admin.listUsers({ perPage: 2000 });
  if (usersErr) {
    throw new Error("No se pudieron listar usuarios");
  }

  const userIds = (usersRes?.users ?? []).map((u) => u.id);

  const { data: profiles } = await admin
    .from("profiles")
    .select("user_id,email,full_name,is_paused")
    .in("user_id", userIds);

  const profileById = new Map((profiles ?? []).map((p) => [p.user_id, p]));

  const { data: docsCounts } = await admin
    .from("documents")
    .select("created_by")
    .in("created_by", userIds);

  const counts = new Map<string, number>();
  for (const d of docsCounts ?? []) {
    const id = d.created_by as string;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  const rows: Row[] = (usersRes?.users ?? []).map((u) => {
    const p = profileById.get(u.id);
    return {
      user_id: u.id,
      email: (p?.email ?? u.email ?? "").toLowerCase(),
      full_name: p?.full_name ?? null,
      is_paused: p?.is_paused ?? false,
      docs_count: counts.get(u.id) ?? 0,
    };
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Panel de administración</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Moderación y métricas básicas. Podés pausar usuarios si detectás abuso.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium">
            Volver
          </Link>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-4 py-3">
          <h2 className="text-sm font-medium">Usuarios</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs text-zinc-600">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Docs</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {rows.map((r) => (
                <tr key={r.user_id}>
                  <td className="px-4 py-3 font-medium">{r.email}</td>
                  <td className="px-4 py-3">{r.full_name ?? <span className="text-zinc-400">(sin identidad)</span>}</td>
                  <td className="px-4 py-3">{r.docs_count}</td>
                  <td className="px-4 py-3">
                    {r.is_paused ? (
                      <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700">Pausado</span>
                    ) : (
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">Activo</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <form action="/api/admin/toggle-user" method="post">
                      <input type="hidden" name="user_id" value={r.user_id} />
                      <input type="hidden" name="pause" value={r.is_paused ? "0" : "1"} />
                      <button className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm">
                        {r.is_paused ? "Reactivar" : "Pausar"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
