import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import OnboardingForm from "./OnboardingForm";

export const dynamic = "force-dynamic";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: { next?: string; plan?: string };
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const next = String(searchParams?.next || "/dashboard");
  const planHint = String(searchParams?.plan || "free");

  const { data: profile } = await supabase
    .from("profiles")
    .select("email,full_name,dni,cuil,address,phone,plan")
    .eq("user_id", user.id)
    .maybeSingle();

  // Si ya está completo, mandamos al next
  const isComplete = Boolean(profile?.full_name && profile?.dni && profile?.cuil && profile?.address && profile?.phone);
  if (isComplete) redirect(next);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="text-sm text-zinc-600">Firma Electrónica Simple</div>
        <h1 className="mt-1 text-2xl font-semibold">Completá tu perfil</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Elegí tu tipo de cuenta y completá tus datos. Esto permite autocompletar formularios y generar evidencia más clara en las
          auditorías.
        </p>

        <div className="mt-6">
          <OnboardingForm
            next={next}
            initial={{
              email: profile?.email || user.email || "",
              fullName: profile?.full_name || "",
              dni: profile?.dni || "",
              cuil: profile?.cuil || "",
              address: profile?.address || "",
              phone: profile?.phone || "",
              planHint: profile?.plan || planHint,
            }}
          />
        </div>
      </div>
    </div>
  );
}
