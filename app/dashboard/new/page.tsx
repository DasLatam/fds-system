import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isProfileComplete } from "@/lib/security/profile";
import NewDocumentTabs from "./NewDocumentTabs";

export const dynamic = "force-dynamic";

export default async function NewDocPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id,email,full_name,dni,cuil,address,phone,is_paused")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile?.is_paused) redirect("/profile?paused=1");
  if (!isProfileComplete(profile as any)) redirect("/profile?next=/dashboard/new");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Nuevo documento</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Subí un PDF existente o redactá el documento dentro de Firma Simple. Luego podés invitar firmantes.
          </p>
        </div>

        <Link href="/dashboard" className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50">
          Volver al panel
        </Link>
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6">
        <NewDocumentTabs />
      </div>

      <p className="mt-6 text-xs text-zinc-500">
        Recordatorio: la firma electrónica simple se basa en evidencia técnica y trazabilidad. En la auditoría se registran eventos, hashes y
        metadatos para respaldar el proceso.
      </p>
    </div>
  );
}
