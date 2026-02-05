import { redirect } from "next/navigation";
import { headers } from "next/headers";

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
  // Nuevo comportamiento: post-firma / post-rechazo siempre envía al panel.
  // Si no hay sesión, middleware redirige a /login preservando el parámetro next.
  if (!token) redirect("/dashboard?from=signed");

  // Best-effort: si el token es válido, propagamos status/email para mejorar el UX post-login.
  const preview = await loadPreview(token);
  const qs = new URLSearchParams({ from: "signed", token });
  if (preview?.status) qs.set("status", preview.status);
  if (preview?.email) qs.set("email", preview.email);

  redirect(`/dashboard?${qs.toString()}`);
}
