import { redirect } from "next/navigation";
import ProfileClient from "./profile-client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: { next?: string };
};

function safeNext(input: unknown): string {
  const n = typeof input === "string" ? input.trim() : "";
  if (!n) return "/dashboard";

  // Evitar open-redirect: solo paths relativos del sitio.
  if (!n.startsWith("/")) return "/dashboard";
  if (n.startsWith("//")) return "/dashboard";

  return n;
}

export default async function ProfilePage({ searchParams }: PageProps) {
  const next = safeNext(searchParams?.next);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Mantener next del flujo actual.
    const back = `/profile?next=${encodeURIComponent(next)}`;
    redirect(`/login?next=${encodeURIComponent(back)}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name, dni, cuil, address, phone, is_paused, plan")
    .eq("user_id", user.id)
    .maybeSingle();

  const initial = {
    email: (profile?.email || user.email || "").toString(),
    fullName: (profile?.full_name || "").toString(),
    dni: (profile?.dni || "").toString(),
    cuil: (profile?.cuil || "").toString(),
    address: (profile?.address || "").toString(),
    phone: (profile?.phone || "").toString(),
    paused: Boolean(profile?.is_paused),
    planHint: (profile?.plan || "").toString(),
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Tu identidad</h1>
        <p className="mt-2 text-sm text-zinc-600">Completá tus datos para poder crear, enviar y firmar documentos.</p>
      </div>

      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <div className="font-semibold">Importante: usá datos reales y verificables</div>
        <p className="mt-2 leading-relaxed">
          Los datos que cargás (nombre, DNI, CUIT/CUIL, domicilio y teléfono) pueden quedar asentados en el proceso de firma y en el registro de auditoría del documento.
          Si la información no es real, podés tener problemas para acreditar identidad, validez probatoria o resolver conflictos.
        </p>
      </div>

      <ProfileClient next={next} initial={initial} />
    </div>
  );
}
