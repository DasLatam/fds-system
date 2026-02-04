import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import OnboardingForm from "./OnboardingForm";

export const dynamic = "force-dynamic";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams?: { next?: string };
}) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name, dni, cuil, address, phone, plan, default_account_id, onboarding_completed_at")
    .eq("user_id", user.id)
    .maybeSingle();

  const next = searchParams?.next || "/dashboard";

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Completar registro</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Elegí el tipo de cuenta y completá tus datos para poder firmar y enviar documentos.
      </p>

      <div className="mt-6 rounded-xl border border-zinc-200 p-5">
        <OnboardingForm
          next={next}
          initial={{
            email: profile?.email || user.email || "",
            fullName: profile?.full_name || "",
            dni: profile?.dni || "",
            cuil: profile?.cuil || "",
            address: profile?.address || "",
            phone: profile?.phone || "",
            planHint: (profile?.plan || "free") as string,
          }}
        />
      </div>
    </div>
  );
}

