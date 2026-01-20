import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isProfileComplete } from "@/lib/security/profile";

export const dynamic = "force-dynamic";

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

type SignerRow = {
  id: string;
  email: string;
  status: "pending" | "signed" | "rejected" | "expired";
  position: number | null;
  email_sent_at: string | null;
  opened_at: string | null;
  signed_at: string | null;
  expires_at: string | null;
  rejection_reason: string | null;
};

type AuditRow = {
  id: number;
  event_type: string;
  actor_email: string | null;
  created_at: string;
};

export default async function DocumentPage({ params }: { params: { id: string } }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,dni,cuil,address,phone,is_paused")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile || profile.is_paused) redirect("/profile?next=/dashboard");
  if (!isProfileComplete({
    user_id: user.id,
    email: user.email || null,
    full_name: profile.full_name,
    dni: profile.dni,
    cuil: profile.cuil,
    address: profile.address,
    phone: profile.phone,
    is_paused: profile.is_paused,
  })) {
    redirect("/profile?next=/dashboard");
  }

  const { data: doc, error: docErr } = await supabase
    .from("documents")
    .select("id,title,status,signing_mode,total_signers,signed_count,created_at,completed_at")
    .eq("id", params.id)
    .single();

  if (docErr || !doc) redirect("/dashboard");

  const { data: signers } = await supabase
    .from("signing_requests")
    .select("id,email,status,position,email_sent_at,opened_at,signed_at,expires_at,rejection_reason")
    .eq("document_id", doc.id)
    .order("position", { ascending: true, nullsFirst: true });

  const { data: audit } = await supabase
    .from("audit_events")
    .select("id,event_type,actor_email,created_at")
    .eq("document_id", doc.id)
    .order("created_at", { ascending: false })
    .limit(25);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/dashboard" className="text-sm text-zinc-600 hover:text-zinc-900">← Volver</Link>
          <h1 className="mt-2 text-2xl font-semibold">{doc.title}</h1>
          <div className="mt-2 text-sm text-zinc-600">
            Estado: <span className="font-medium text-zinc-900">{doc.status}</span>
            <span className="mx-2">·</span>
            Firma: <span className="font-medium text-zinc-900">{doc.signing_mode}</span>
            <span className="mx-2">·</span>
            {doc.signed_count}/{doc.total_signers} firmantes
          </div>
          <div className="mt-1 text-xs text-zinc-500">Creado: {formatDate(doc.created_at)}{doc.completed_at ? ` · Completado: ${formatDate(doc.completed_at)}` : ""}</div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/api/download?documentId=${doc.id}&kind=original`}
            className="rounded-md border border-zinc-200 px-3 py-2 text-sm"
          >
            Ver original
          </a>
          {doc.status === "signed" ? (
            <a
              href={`/api/download?documentId=${doc.id}&kind=final`}
              className="rounded-md bg-black px-3 py-2 text-sm font-medium text-white"
            >
              Descargar final
            </a>
          ) : null}
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-zinc-200">
            <div className="border-b border-zinc-200 px-4 py-3">
              <h2 className="text-sm font-medium">Firmantes</h2>
            </div>
            <div className="p-4">
              <InvitePanel documentId={doc.id} currentMode={doc.signing_mode} currentUserEmail={user.email || ""} />

              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-zinc-500">
                      <th className="py-2 pr-4">Email</th>
                      <th className="py-2 pr-4">Orden</th>
                      <th className="py-2 pr-4">Estado</th>
                      <th className="py-2 pr-4">Vence</th>
                      <th className="py-2 pr-4">Email</th>
                      <th className="py-2 pr-4">Abierto</th>
                      <th className="py-2 pr-4">Firmado</th>
                      <th className="py-2">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {(signers as SignerRow[] | null)?.map((s) => (
                      <tr key={s.id} className="text-zinc-700">
                        <td className="py-3 pr-4 font-medium text-zinc-900">{s.email}</td>
                        <td className="py-3 pr-4">{s.position ?? "—"}</td>
                        <td className="py-3 pr-4">
                          {s.status === "signed" ? (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">Firmado</span>
                          ) : s.status === "rejected" ? (
                            <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700" title={s.rejection_reason || ""}>Rechazado</span>
                          ) : s.status === "expired" ? (
                            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700">Vencido</span>
                          ) : (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">Pendiente</span>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-xs text-zinc-500">{s.expires_at ? formatDate(s.expires_at) : "—"}</td>
                        <td className="py-3 pr-4 text-xs text-zinc-500">{s.email_sent_at ? formatDate(s.email_sent_at) : "—"}</td>
                        <td className="py-3 pr-4 text-xs text-zinc-500">{s.opened_at ? formatDate(s.opened_at) : "—"}</td>
                        <td className="py-3 pr-4 text-xs text-zinc-500">{s.signed_at ? formatDate(s.signed_at) : "—"}</td>
                        <td className="py-3">
                          {s.status !== "signed" ? (
                            <form action="/api/resend-invite" method="post">
                              <input type="hidden" name="signingRequestId" value={s.id} />
                              <input type="hidden" name="expiresInDays" value="3" />
                              <button type="submit" className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs">Re-enviar</button>
                            </form>
                          ) : (
                            <span className="text-xs text-zinc-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {(!signers || (signers as any[]).length === 0) ? (
                      <tr><td className="py-6 text-sm text-zinc-600" colSpan={8}>Todavía no agregaste firmantes.</td></tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200">
            <div className="border-b border-zinc-200 px-4 py-3">
              <h2 className="text-sm font-medium">Auditoría (últimos 25)</h2>
            </div>
            <div className="divide-y divide-zinc-200">
              {(audit as AuditRow[] | null)?.map((e) => (
                <div key={e.id} className="px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium text-zinc-900">{e.event_type}</div>
                    <div className="text-xs text-zinc-500">{formatDate(e.created_at)}</div>
                  </div>
                  <div className="text-xs text-zinc-600">{e.actor_email || "—"}</div>
                </div>
              ))}
              {(!audit || (audit as any[]).length === 0) ? (
                <div className="px-4 py-6 text-sm text-zinc-600">Sin eventos aún.</div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-200 p-4">
            <h2 className="text-sm font-medium">Sugerencias</h2>
            <ul className="mt-3 space-y-2 text-sm text-zinc-600">
              <li>• Usá modo <b>secuencial</b> para contratos donde el orden importa.</li>
              <li>• Pedimos datos del firmante (DNI/CUIL/domicilio) para reforzar evidencia.</li>
              <li>• El PDF final incluye hash SHA-256, timestamps, IP y auditoría.</li>
            </ul>
          </div>

          <div className="rounded-xl border border-zinc-200 p-4">
            <h2 className="text-sm font-medium">Legal</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Esta plataforma implementa <b>firma electrónica</b> (Ley 25.506, art. 5) con evidencia técnica. No es firma digital certificada (Ley 25.506, art. 2).
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/terms" className="text-sm text-zinc-700 hover:text-zinc-900">Términos</Link>
              <Link href="/privacy" className="text-sm text-zinc-700 hover:text-zinc-900">Privacidad</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import InvitePanel from "./invite-panel";
