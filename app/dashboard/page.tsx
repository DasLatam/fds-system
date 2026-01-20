import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isProfileComplete } from "@/lib/security/profile";
import { isOwnerEmail } from "@/lib/security/owner";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id,email,full_name,dni,cuil,address,phone,is_paused")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile?.is_paused) {
    redirect("/profile?paused=1");
  }
  if (!isProfileComplete(profile as any)) {
    redirect("/profile?next=/dashboard");
  }

  const showAdmin = isOwnerEmail(user.email);

  const { data: docs } = await supabase
    .from("documents")
    .select("id,title,status,signing_mode,total_signers,signed_count,created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-600">Subí un PDF, invitá firmantes y seguí el estado.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/profile?next=/dashboard"
            className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium"
          >
            Mis datos
          </Link>
          {showAdmin ? (
            <Link
              href="/admin"
              className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium"
            >
              Admin
            </Link>
          ) : null}
          <Link
            href="/dashboard/new"
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
          >
            Subir PDF
          </Link>
          <form action="/api/logout" method="post">
            <button className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium">
              Salir
            </button>
          </form>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-zinc-200">
        <div className="border-b border-zinc-200 px-4 py-3">
          <h2 className="text-sm font-medium">Tus documentos</h2>
        </div>

        <div className="divide-y divide-zinc-200">
          {!docs || docs.length === 0 ? (
            <div className="p-6">
              <p className="text-sm text-zinc-600">Todavía no subiste documentos.</p>
            </div>
          ) : (
            docs.map((d) => (
              <div key={d.id} className="flex flex-wrap items-center justify-between gap-4 px-4 py-4">
                <div>
                  <div className="font-medium">{d.title}</div>
                  <div className="mt-1 text-xs text-zinc-600">
                    Estado: <span className="font-medium text-zinc-800">{d.status}</span> · Firma: {d.signing_mode} · {d.signed_count}/{d.total_signers} firmantes
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/doc/${d.id}`}
                    className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm"
                  >
                    Ver
                  </Link>
                  {d.status === "signed" ? (
                    <Link
                      href={`/api/download?documentId=${d.id}&kind=final`}
                      className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white"
                    >
                      Descargar
                    </Link>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
