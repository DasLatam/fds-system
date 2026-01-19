import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type DocRow = {
  id: string;
  title: string;
  status: "pending" | "signed";
  created_at: string;
};

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("documents")
    .select("id,title,status,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-4 text-sm text-red-600">Error: {error.message}</p>
      </div>
    );
  }

  const docs: DocRow[] = (data ?? []) as DocRow[];

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Link
          href="/dashboard/new"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Subir PDF
        </Link>
      </div>

      <div className="mt-6 rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 p-4">
          <div className="text-sm font-medium">Tus documentos</div>
          <div className="text-xs text-zinc-500">Subí un PDF, invitá firmantes y seguí el estado.</div>
        </div>

        <div className="p-4">
          {docs.length === 0 ? (
            <p className="text-sm text-zinc-600">Todavía no subiste documentos.</p>
          ) : (
            <div className="divide-y divide-zinc-200">
              {docs.map((d) => (
                <div key={d.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-medium">{d.title}</div>
                    <div className="text-xs text-zinc-500">Estado: {d.status}</div>
                  </div>
                  <Link
                    href={`/dashboard/doc/${d.id}`}
                    className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm"
                  >
                    Ver
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
