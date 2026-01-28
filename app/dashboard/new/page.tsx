import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isProfileComplete } from "@/lib/security/profile";
import { isOwnerEmail } from "@/lib/security/owner";

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
          <Link href="/profile?next=/dashboard/new" className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium">
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
        <form id="uploadForm" className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Título del documento</label>
            <input
              name="title"
              type="text"
              required
              placeholder="Ej: DNI Ariel"
              className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-zinc-500">Este título se mostrará en el dashboard y en la página de firma.</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Archivo PDF</label>
            <input
              name="file"
              type="file"
              accept="application/pdf"
              required
              className="block w-full text-sm"
            />
            <p className="mt-1 text-xs text-zinc-500">Solo PDF. Tamaño recomendado: hasta 10–20 MB.</p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
            >
              Subir y crear documento
            </button>
            <span id="uploadStatus" className="text-sm text-zinc-600" />
          </div>
        </form>
      </div>

      {/* Script inline mínimo para subir (sin crear componente client aparte) */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
(function() {
  const form = document.getElementById('uploadForm');
  const status = document.getElementById('uploadStatus');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = 'Subiendo...';

    const fd = new FormData(form);
    const title = fd.get('title');
    const file = fd.get('file');

    if (!title || !file) {
      status.textContent = 'Completá título y PDF.';
      return;
    }

    try {
      const r = await fetch('/api/documents/upload', {
        method: 'POST',
        body: fd
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        status.textContent = j?.error || 'No se pudo subir el PDF.';
        return;
      }

      status.textContent = 'Listo. Redirigiendo...';
      if (j?.documentId) {
        window.location.href = '/dashboard/doc/' + j.documentId;
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err) {
      status.textContent = 'Error de red al subir.';
    }
  });
})();
          `,
        }}
      />
    </div>
  );
}