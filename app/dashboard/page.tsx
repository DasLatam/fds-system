import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isProfileComplete } from "@/lib/security/profile";
import { humanizeAuditEventType } from "@/lib/audit/labels";
import DocumentsListClient from "./DocumentsListClient";

export const dynamic = "force-dynamic";

function fmt(n: number) {
  try {
    return new Intl.NumberFormat("es-AR").format(n);
  } catch {
    return String(n);
  }
}

function parseEnvInt(name: string, fallback: number) {
  const n = Number(process.env[name] || "");
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function planLimitFromPlanCode(planCode: string) {
  const p = (planCode || "").toLowerCase();
  if (p.includes("company") && p.includes("pro")) return parseEnvInt("FES_COMPANY_PRO_DOCS_PER_MONTH", 30);
  if (p.includes("individual") && p.includes("pro")) return parseEnvInt("FES_INDIVIDUAL_PRO_DOCS_PER_MONTH", 20);
  if (p.includes("pro")) return parseEnvInt("FES_INDIVIDUAL_PRO_DOCS_PER_MONTH", 20);
  return parseEnvInt("FES_FREE_DOCS_PER_MONTH", 5);
}

function planLabel(planCode: string) {
  const p = (planCode || "").toLowerCase();
  if (p.includes("company") && p.includes("pro")) return "Empresa PRO";
  if (p.includes("individual") && p.includes("pro")) return "Personal PRO";
  if (p.includes("pro")) return "PRO";
  return "Gratuito";
}

function normalizePlanCode(planCode: string | null | undefined, legacyProfilePlan: string | null | undefined) {
  const p = (planCode || "").trim();
  if (p) return p;
  const legacy = (legacyProfilePlan || "").toLowerCase();
  if (legacy === "pro") return "individual_pro";
  return "individual_free";
}

function getBuenosAiresMonthRangeUTC(d = new Date()) {
  // BA (UTC-3): inicio/fin de mes local BA => 03:00 UTC
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth();
  const start = new Date(Date.UTC(year, month, 1, 3, 0, 0));
  const end = new Date(Date.UTC(year, month + 1, 1, 3, 0, 0));
  return { startISO: start.toISOString(), endISO: end.toISOString(), year, month };
}

function monthLabelEs(year: number, month0: number) {
  const names = [
    "enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre",
  ];
  const m = names[month0] || String(month0 + 1);
  return `${m} ${year}`;
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

  // Seguridad: NO eliminar documentos firmados o con firmas
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
    .select("user_id,email,full_name,dni,cuil,address,phone,is_paused,plan,default_account_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile?.is_paused) redirect("/profile?paused=1");
  if (!isProfileComplete(profile as any)) redirect("/profile?next=/dashboard");

  // =========================
  // Plan activo + uso mensual
  // =========================
  const admin = createAdminClient();

  // Resolver cuenta activa (si falta en profile, usamos el membership más nuevo)
  let activeAccountId: string | null = (profile as any)?.default_account_id ?? null;

  if (!activeAccountId) {
    const { data: mem } = await admin
      .from("account_members")
      .select("account_id,status,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (mem?.account_id && mem?.status === "active") activeAccountId = mem.account_id as any;
  } else {
    // Validar que el usuario sea miembro activo de esa cuenta (defensa)
    const { data: mem } = await admin
      .from("account_members")
      .select("account_id,status")
      .eq("user_id", user.id)
      .eq("account_id", activeAccountId)
      .maybeSingle();
    if (!mem || mem.status !== "active") activeAccountId = null;
  }

  let activeAccountType: string | null = null;
  let activeAccountName: string | null = null;

  if (activeAccountId) {
    const { data: acc } = await admin
      .from("accounts")
      .select("id,account_type,name,company_name")
      .eq("id", activeAccountId)
      .maybeSingle();

    activeAccountType = (acc as any)?.account_type ?? null;
    activeAccountName = (acc as any)?.company_name ?? (acc as any)?.name ?? null;
  }

  const { year, month, startISO, endISO } = getBuenosAiresMonthRangeUTC(new Date());
  const periodLabel = monthLabelEs(year, month);

  let activePlanCode: string = normalizePlanCode(null, (profile as any)?.plan ?? null);

  if (activeAccountId) {
    const { data: sub } = await admin
      .from("subscriptions")
      .select("plan_code,status,created_at")
      .eq("account_id", activeAccountId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    activePlanCode = normalizePlanCode((sub as any)?.plan_code ?? null, (profile as any)?.plan ?? null);
  }

  const activeLimit = planLimitFromPlanCode(activePlanCode);

  // Conteo del mes (por cuenta activa)
  let usedThisMonth = 0;

  if (activeAccountId) {
    const q = admin
      .from("documents")
      .select("id", { head: true, count: "exact" })
      .gte("created_at", startISO)
      .lt("created_at", endISO);

    if ((activeAccountType || "").toLowerCase() === "company") {
      q.eq("account_id", activeAccountId);
    } else {
      // personal: cuenta + legacy docs sin account_id
      q.or(`account_id.eq.${activeAccountId},and(account_id.is.null,created_by.eq.${user.id})`);
    }

    const { count } = await q;
    usedThisMonth = count ?? 0;
  } else {
    // fallback
    const { count } = await admin
      .from("documents")
      .select("id", { head: true, count: "exact" })
      .eq("created_by", user.id)
      .gte("created_at", startISO)
      .lt("created_at", endISO);
    usedThisMonth = count ?? 0;
  }

  // =========================
  // Documentos listados (por cuenta activa)
  // =========================
  let docs: any[] = [];

  if (activeAccountId) {
    const q = admin
      .from("documents")
      .select("id,title,status,signing_mode,total_signers,signed_count,final_path,audit_code,created_at,completed_at,created_by,account_id")
      .order("created_at", { ascending: false });

    if ((activeAccountType || "").toLowerCase() === "company") {
      q.eq("account_id", activeAccountId);
    } else {
      q.or(`account_id.eq.${activeAccountId},and(account_id.is.null,created_by.eq.${user.id})`);
    }

    const { data } = await q;
    docs = (data || []) as any[];
  } else {
    // fallback: RLS por usuario
    const { data } = await supabase
      .from("documents")
      .select("id,title,status,signing_mode,total_signers,signed_count,final_path,audit_code,created_at,completed_at")
      .order("created_at", { ascending: false });
    docs = (data || []) as any[];
  }

  // =========================
  // Métricas visibles (Sprint)
  // =========================
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
          <h1 className="text-2xl font-semibold">Panel</h1>
          <p className="mt-1 text-sm text-zinc-600">Creá una nueva firma, invitá firmantes y seguí el estado.</p>
        </div>
        <div className="text-sm text-zinc-600">Accedé a las acciones principales desde el menú superior.</div>
      </div>

      {/* Plan + uso del mes */}
      <div className="mt-6 rounded-xl border border-zinc-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm">
            <div className="text-zinc-900">
              <span className="font-medium">Cuenta activa:</span>{" "}
              <span className="font-mono text-xs">{activeAccountId || "—"}</span>
              {activeAccountType ? (
                <span className="ml-2 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs">
                  {(activeAccountType || "").toLowerCase() === "company" ? "Empresa" : "Personal"}
                </span>
              ) : null}
            </div>
            <div className="mt-1 text-xs text-zinc-600">
              <span className="font-medium">Plan activo:</span> {planLabel(activePlanCode)}{" "}
              <span className="text-zinc-400">({activePlanCode})</span>
              {activeAccountName ? <span className="ml-2 text-zinc-500">· {activeAccountName}</span> : null}
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm text-zinc-900">
              <span className="font-medium">Uso del mes ({periodLabel}):</span>{" "}
              {fmt(usedThisMonth)}/{fmt(activeLimit)}
            </div>
            <div className="mt-1">
              <Link
                href="/dashboard/account"
                className="inline-flex rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium hover:bg-zinc-50"
              >
                Cambiar plan / cuenta activa
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas (Sprint 1) */}
      <div className="mt-6 grid gap-4 lg:grid-cols-4">
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

      {/* Tus documentos (arriba) */}
      <div className="mt-6">
        <DocumentsListClient docs={safeDocs} deleteAction={deleteDocumentAction} />
      </div>

      {/* Actividad reciente (abajo) */}
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
                  <div className="font-medium text-zinc-900" title={e.event_type}>
                    {humanizeAuditEventType(e.event_type)}{" "}
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
    </div>
  );
}
