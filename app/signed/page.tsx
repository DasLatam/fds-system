import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Preview = {
  documentId: string;
  title: string;
  email: string;
  status: "pending" | "signed" | "rejected" | "expired";
  signingMode: "parallel" | "sequential";
  position: number | null;
  expiresAt: string | null;
  pdfUrl: string;
};

async function getBaseUrl() {
  // ✅ Next 16: headers() es async
  const h = await headers();

  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  if (!host) return null;

  return `${proto}://${host}`;
}

async function loadPreview(token: string): Promise<Preview | null> {
  try {
    const base = await getBaseUrl();
    if (!base) return null;

    const res = await fetch(`${base}/api/signing-request/${token}`, { cache: "no-store" });
    if (!res.ok) return null;

    const data = (await res.json().catch(() => null)) as Preview | null;
    return data;
  } catch {
    return null;
  }
}

export default async function SignedPage({ searchParams }: { searchParams: { token?: string } }) {
  const token = String(searchParams?.token || "");
  if (!token) redirect("/");

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const preview = await loadPreview(token);

  if (!preview) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-2xl border border-zinc-200 p-6">
          <div className="text-sm text-zinc-600">Firma Electrónica Simple</div>
          <h1 className="mt-1 text-2xl font-semibold">No se pudo abrir el enlace</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Este enlace puede haber vencido o haber sido reemplazado por un reenvío.
          </p>
          <div className="mt-6 flex gap-2">
            <Link href="/" className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900">
              Ir al inicio
            </Link>
            <Link href="/login" className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white">
              Ingresar
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const title = preview.title || "Documento";
  const email = preview.email || "—";
  const st = preview.status || "signed";
  const isSigned = st === "signed";

  // ✅ Si el firmante ya tiene cuenta/sesión, lo mandamos directo al panel.
  // (El panel es el mejor lugar para ver su historial de documentos firmados/rechazados.)
  if (user) {
    const qs = new URLSearchParams({ from: "signed", token, status: st });
    redirect(`/dashboard?${qs.toString()}`);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-2xl border border-zinc-200 p-6">
        <div className="text-sm text-zinc-600">Firma Electrónica Simple</div>
        <h1 className="mt-1 text-2xl font-semibold">{isSigned ? "Firma registrada" : "Estado de la firma"}</h1>

        <div className="mt-4 rounded-xl border border-zinc-200 p-4">
          <div className="text-sm font-medium text-zinc-900">{title}</div>
          <div className="mt-1 text-xs text-zinc-600">Email del firmante: {email}</div>
          <div className="mt-1 text-xs text-zinc-600">
            Estado:{" "}
            <span className="font-medium">
              {st === "signed"
                ? "Firmado"
                : st === "pending"
                ? "Pendiente"
                : st === "rejected"
                ? "Rechazado"
                : "Vencido"}
            </span>
          </div>

          {preview?.pdfUrl ? (
            <div className="mt-3">
              <a className="text-sm underline text-zinc-700" href={preview.pdfUrl} target="_blank" rel="noreferrer">
                Abrir PDF
              </a>
            </div>
          ) : null}
        </div>

        <div className="mt-6 rounded-xl border border-zinc-200 p-4">
          <div className="text-sm font-semibold">Guardá tu historial</div>
          <p className="mt-1 text-sm text-zinc-600">
            Si te registrás (gratis), vas a poder ver tu historial de documentos firmados/rechazados y precargar tus datos para futuras
            firmas o solicitudes.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/login?next=${encodeURIComponent(`/dashboard?from=signed&token=${encodeURIComponent(token)}&status=${encodeURIComponent(st)}`)}&email=${encodeURIComponent(email)}`}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
            >
              Crear cuenta gratis (Magic Link)
            </Link>

            <Link href="/" className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900">
              Ir al inicio
            </Link>
          </div>

          <p className="mt-3 text-xs text-zinc-500">
            Nota: al iniciar sesión, el sistema vincula automáticamente tus firmas anteriores a tu cuenta (por email).
          </p>
        </div>
      </div>
    </div>
  );
}
