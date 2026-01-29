import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isProfileComplete } from "@/lib/security/profile";
import { isOwnerEmail } from "@/lib/security/owner";
import UploadForm from "./UploadForm";

export const dynamic = "force-dynamic";

export default async function DashboardNewPage() {
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

  const showAdmin = isOwnerEmail(user.email);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Subir PDF</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Elegí un PDF, asignale un título y crearemos el documento para invitar firmantes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium">
            Volver
          </Link>
          <Link
            href="/profile?next=/dashboard/new"
            className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium"
          >
            Mis datos
          </Link>
          {showAdmin ? (
            <Link href="/admin" className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium">
              Admin
            </Link>
          ) : null}
          <form action="/api/logout" method="post">
            <button className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium">Salir</button>
          </form>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-zinc-200 p-5">
        <UploadForm />
      </div>
    </div>
  );
}