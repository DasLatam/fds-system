import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type DocRow = {
  id: string;
  title: string;
  status: "pending" | "signed";
  original_path: string;
  final_path: string | null;
};

export default async function DocPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();

  const { data: doc, error } = await supabase
    .from("documents")
    .select("id,title,status,original_path,final_path")
    .eq("id", id)
    .single();

  if (error || !doc) return notFound();

  const d = doc as DocRow;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{d.title}</h1>
          <p className="text-sm text-zinc-600">
            Estado:{" "}
            <span className={d.status === "signed" ? "text-emerald-700" : "text-amber-700"}>
              {d.status}
            </span>
          </p>
        </div>
        <Link href="/dashboard" className="text-sm underline">
          Volver
        </Link>
      </div>

      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-4">
        <div className="text-sm font-medium">Acciones</div>
        <div className="mt-3 space-y-2 text-sm">
          <p className="text-zinc-600">
            (MVP) En esta pantalla vamos a agregar: invitar firmantes, ver auditoría y descargar PDF final.
          </p>
        </div>
      </div>
    </div>
  );
}
