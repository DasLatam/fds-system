import Link from "next/link";
import { redirect } from "next/navigation";
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

async function loadPreview(token: string): Promise<Preview | null> {
  try {
    const res = await fetch(`/api/signing-request/${token}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json().catch(() => null)) as Preview | null;
    return data;
  } catch {
    return null;
  }
}

export default async function SignedPage({
  searchParams,
}: {
  searchParams: { token?: string; status?: string };
}) {
  const token = String(searchParams?.token || "");
  if (!token) redirect("/");

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const preview = await loadPreview(token);

  const title = preview?.title || "Documento";
  const email = preview?.email || "—";
  const st = preview?.status || "signed";

  const isSigned = st === "signed";

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
              {st === "signed" ? "Firmado" : st === "pending" ? "Pendiente" : st === "rejected" ? "Rechazado" : "Vencido"}
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
            Si te registrás (gratis), vas a poder ver todos tus documentos firmados históricos y precargar tus datos para futuras
            firmas o solicitudes.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {user ? (
              <Link href="/dashboard" className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white">
                Ir a mi Dashboard
              </Link>
            ) : (
              <Link href="/login?next=/dashboard" className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white">
                Crear cuenta / Ingresar
              </Link>
            )}

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
