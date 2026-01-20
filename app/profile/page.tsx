import { Suspense } from "react";
import ProfileClient from "./profile-client";

export const dynamic = "force-dynamic";

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Tu identidad</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Completá tus datos para poder crear, enviar y firmar documentos.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
            Cargando…
          </div>
        }
      >
        <ProfileClient />
      </Suspense>
    </div>
  );
}