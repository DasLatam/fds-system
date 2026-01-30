import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isProfileComplete } from "@/lib/security/profile";
import { isOwnerEmail } from "@/lib/security/owner";

export const dynamic = "force-dynamic";

function canDelete(doc: any) {
  const status = String(doc.status || "");
  const total = Number(doc.total_signers || 0);
  const signed = Number(doc.signed_count || 0);
  return status !== "signed" && total === 0 && signed === 0;
}

function fmt(n: number) {
  try {
    return new Intl.NumberFormat("es-AR").format(n);
  } catch {
    return String(n);
  }
}

async function deleteDocumentAction(formData: FormData) {
  "use server";

  const documentId = String(formData.get("documentId") || "");
  if (!documentId) return;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  const { data: doc, error: docErr } = await admin
    .from("documents")
    .select("id, created_by, status, signed_count, original_path, final_path")
    .eq("id", documentId)
    .maybeSingle();

  if (docErr || !doc) return;
  if (doc.created_by !== user.id) return;

  if (doc.status === "signed" || (doc.signed_count ?? 0) > 0) return;

  const { count: srCount } = await admin
    .from("signing_requests")
    .select("id", { head: true, count: "exact" })
    .eq("document_id", doc.id);

  if ((srCount ?? 0) > 0) return;

  await admin.from("audit_events").delete().eq("document_id", doc.id);
  await admin.from("documents").delete().eq("id", doc.id);

  const paths = [doc.original_path, doc.final_path].filter(Boolean) as string[];
  if (paths.length) {
    await admin.storage.from("fds").remove(paths);
  }

  revalidatePath("/dashboard");
}

export default async function DashboardPage() {
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
  if (!isProfileComplete(profile as any)) redirect("/profile?next=/dashboard");

  const showAdmin = isOwnerEmail(user.email);

  const { data: docs } = await supabase
    .from("documents")
    .select("id,title,status,signing_mode,total_signers,signed_count,final_path,audit_code,created_at")
    .order("created_at", { ascending: false });

  // =========================
  // Métricas visibles (Sprint)
  // =========================
  const admin = createAdminClient();

  const safeDocs = (docs || []) as any[];
  const docIds = safeDocs.map((d) => d.id).filter(Boolean);
  const auditCodes = safeDocs.map((d) => d.audit_code).filter(Boolean);

  const totalDocs = safeDocs.length;
  const signedDocs = safeDocs.filter((d) => d.status === "signed").length;
  const pendingDocs = totalDocs - signedDocs;

  const totalSigners = safeDocs.reduce((acc, d) => acc + Number(d.total_signers || 0), 0);
  const signedSigners = safeDocs.reduce((acc, d) => acc + Number(d.signed_count || 0), 0);

  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  let verif30 = 0;
  let verif30Match = 0;
  let verif30Fail = 0;
  let verif7 = 0;

  if (auditCodes.length > 0) {
    const { count: c30 } = await admin
      .from("verification_events")
      .select("id", { head: true, count: "exact" })
      .in("audit_code", auditCodes)
      .gte("created_at", d30);
    verif30 = c30 ?? 0;

    const { count: c30m } = await admin
      .from("verification_events")
      .select("id", { head: true, count: "exact" })
      .in("audit_code", auditCodes)
      .gte("created_at", d30)
      .eq("match", true);
    verif30Match = c30m ?? 0;

    const { count: c30f } = await admin
      .from("verification_events")
      .select("id", { head: true, count: "exact" })
      .in("audit_code", auditCodes)
      .gte("created_at", d30)
      .eq("match", false);
    verif30Fail = c30f ?? 0;

    const { count: c7 } = await admin
      .from("verification_events")
      .select("id", { head: true, count: "exact" })
      .in("audit_code", auditCodes)
      .gte("created_at", d7);
    verif7 = c7 ?? 0;
  }

  type ActivityRow = {
    id: number;
    document_id: string;
    event_type: string;
    actor_email: string | null;
    created_at: string;
  };
  let activity: ActivityRow[] = [];

  if (docIds.length > 0) {
    const { data: a } = await admin
      .from("audit_events")
      .select("id,document_id,event_type,actor_email,created_at")
      .in("document_id", docIds)
      .order("created_at", { ascending: false })
      .limit(25);

    activity = (a || []) as ActivityRow[];
  }

  const titleById = new Map<string, string>();
  for (const d of safeDocs) titleById.set(d.id, d.title);

  function formatDate(iso?: string | null) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-600">Subí un PDF, invitá firmantes y seguí el estado.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/profile?next=/dashboard" className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium">
            Mis datos
          </Link>
          {showAdmin ? (
            <Link href="/admin" className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium">
              Admin
            </Link>
          ) : null}
          <Link href="/dashboard/new" className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white">
            Subir PDF
          </Link>
          <form action="/api/logout" method="post">
            <button className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium">Salir</button>
          </form>
        </div>
      </div>

      {/* Métricas (Sprint 1) */}
      <div className="mt-8 grid gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 p-4">
          <div className="text-xs text-zinc-500">Documentos</div>
          <div className="mt-1 text-2xl font-semibold">{fmt(totalDocs)}</div>
          <div className="mt-2 text-xs text-zinc-600">
            {fmt(signedDocs)} firmados · {fmt(pendingDocs)} pendientes
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 p-4">
          <div className="text-xs text-zinc-500">Firmas</div>
          <div className="mt-1 text-2xl font-semibold">
            {fmt(signedSigners)}/{fmt(totalSigners)}
          </div>
          <div className="mt-2 text-xs text-zinc-600">Firmas completadas vs. totales</div>
        </div>

        <div className="rounded-xl border border-zinc-200 p-4">
          <div className="text-xs text-zinc-500">Verificaciones públicas</div>
          <div className="mt-1 text-2xl font-semibold">{fmt(verif7)}</div>
          <div className="mt-2 text-xs text-zinc-600">Últimos 7 días</div>
        </div>

        <div className="rounded-xl border border-zinc-200 p-4">
          <div className="text-xs text-zinc-500">Verificaciones (30 días)</div>
          <div className="mt-1 text-2xl font-semibold">{fmt(verif30)}</div>
          <div className="mt-2 text-xs text-zinc-600">
            {fmt(verif30Match)} OK · {fmt(verif30Fail)} NO
          </div>
        </div>
      </div>

      {/* Actividad reciente */}
      <div className="mt-6 rounded-xl border border-zinc-200">
        <div className="border-b border-zinc-200 px-4 py-3">
          <h2 className="text-sm font-medium">Actividad reciente (últimos 25)</h2>
          <p className="mt-1 text-xs text-zinc-500">Eventos relevantes registrados en auditoría.</p>
        </div>
        <div className="divide-y divide-zinc-200">
          {activity.length === 0 ? (
            <div className="px-4 py-6 text-sm text-zinc-600">Sin actividad aún.</div>
          ) : (
            activity.map((e) => (
              <div key={e.id} className="px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium text-zinc-900">
                    {e.event_type}{" "}
                    <span className="ml-2 text-xs font-normal text-zinc-500">
                      {titleById.get(e.document_id) || e.document_id}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500">{formatDate(e.created_at)}</div>
                </div>
                <div className="text-xs text-zinc-600">{e.actor_email || "—"}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-zinc-200">
        <div className="border-b border-zinc-200 px-4 py-3">
          <h2 className="text-sm font-medium">Tus documentos</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Podés eliminar documentos “vacíos” (sin firmantes ni firmas). La eliminación se ejecuta al enviar el formulario.
          </p>
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
                  <Link href={`/dashboard/doc/${d.id}`} className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm">
                    Ver
                  </Link>

                  {/* ✅ solo si existe final_path, y sin prefetch */}
                  {d.status === "signed" && d.final_path ? (
                    <Link
                      prefetch={false}
                      href={`/api/download?documentId=${d.id}&kind=final`}
                      className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white"
                    >
                      Descargar
                    </Link>
                  ) : null}

                  {canDelete(d) ? (
                    <form action={deleteDocumentAction}>
                      <input type="hidden" name="documentId" value={d.id} />
                      <button
                        type="submit"
                        className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:border-red-300 hover:bg-red-50"
                      >
                        Eliminar
                      </button>
                    </form>
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